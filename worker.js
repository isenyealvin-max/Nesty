import { DurableObject } from "cloudflare:workers";
import { onRequestPost } from "./functions/api/chat.js";

const APPWRITE = "https://sgp.cloud.appwrite.io/v1";
const PROJECT = "6adc585d003ae0c1be08";

const ICONS = {
  "/icon-192.png": "/icon-192-1.png",
  "/icon-512.png": "/icon-512-1.png",
};

/* Counts usage per user. One object per user+type. */
export class Limiter extends DurableObject {
  async hit(limit, windowMs) {
    const now = Date.now();
    let st = (await this.ctx.storage.get("w")) || { start: now, count: 0 };
    if (now - st.start >= windowMs) st = { start: now, count: 0 };
    if (st.count >= limit) {
      return { ok: false, resetAt: st.start + windowMs, used: st.count };
    }
    st.count += 1;
    await this.ctx.storage.put("w", st);
    return { ok: true, resetAt: st.start + windowMs, used: st.count };
  }

  async refund() {
    const st = await this.ctx.storage.get("w");
    if (st && st.count > 0) {
      st.count -= 1;
      await this.ctx.storage.put("w", st);
    }
  }
}

const tokenCache = new Map();

async function verify(token, origin) {
  if (!token) return null;
  const hit = tokenCache.get(token);
  if (hit && hit.exp > Date.now()) return hit.user;
  try {
    const res = await fetch(APPWRITE + "/account", {
      headers: {
        "X-Appwrite-Project": PROJECT,
        "X-Appwrite-JWT": token,
        Origin: origin,
      },
    });
    if (!res.ok) return null;
    const u = await res.json();
    if (!u || !u.$id) return null;
    const user = { $id: u.$id, prefs: u.prefs || {} };
    if (tokenCache.size > 500) tokenCache.clear();
    tokenCache.set(token, { user: user, exp: Date.now() + 5 * 60 * 1000 });
    return user;
  } catch (e) {
    return null;
  }
}

function getLimits(user) {
  const now = Date.now();
  const plan = (user.prefs && user.prefs.plan) || "free";
  const expiry = (user.prefs && user.prefs.planExpiry) || 0;
  const active = expiry > now;

  if (plan === "ultra" && active) {
    return { msg: 80, file: 70, img: 20 };
  }
  if (plan === "premium" && active) {
    return { msg: 60, file: 50, img: 6 };
  }
  return { msg: 40, file: 30, img: 6 }; // free
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleChat(request, env, ctx) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) {
    return json({ reply: "Please sign in again.", needLogin: true }, 401);
  }

  if (!env.LIMITER) {
    return onRequestPost({ request: request, env: env, ctx: ctx });
  }

  const limits = getLimits(user);
  const hours = parseFloat(env.WINDOW_HOURS) || 2;
  const stub = env.LIMITER.get(env.LIMITER.idFromName("msg|" + user.$id));
  const r = await stub.hit(limits.msg, hours * 3600 * 1000);

  if (!r.ok) {
    return json({ reply: "limit", limited: true, resetAt: r.resetAt, type: "message" }, 429);
  }

  const res = await onRequestPost({ request: request, env: env, ctx: ctx });
  try {
    const d = await res.clone().json();
    if (!d.via) {
      await stub.refund();
      return json(d);
    }
    d.left = Math.max(0, limits.msg - r.used);
    d.resetAt = r.resetAt;
    return json(d);
  } catch (e) {
    return res;
  }
}

async function handleFile(request, env) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) return json({ ok: false, needLogin: true }, 401);

  const limits = getLimits(user);
  const hours = parseFloat(env.WINDOW_HOURS) || 2;
  const stub = env.LIMITER.get(env.LIMITER.idFromName("file|" + user.$id));
  const r = await stub.hit(limits.file, hours * 3600 * 1000);

  if (!r.ok) {
    return json({ ok: false, limited: true, resetAt: r.resetAt, type: "file" }, 429);
  }
  return json({ ok: true, left: Math.max(0, limits.file - r.used) });
}

/* ---------- Picture maker + editor (Cloudflare Workers AI, FLUX) ---------- */
const BLOCK = /\b(nude|naked|nsfw|porn\w*|sexual|sexy|erotic|explicit|topless|gore|beheading|rape|loli\w*|child\s*abuse)\b/i;

async function improvePrompt(env, prompt) {
  if (!env.GROQ_API_KEY) return prompt;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 8000);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You write prompts for an AI image generator. Turn the user's request, in any language, into ONE vivid English image prompt of at most 60 words. Describe the subject, style, lighting and mood. Do not include real people's names, written text or logos. Output only the prompt.",
          },
          { role: "user", content: prompt },
        ],
        reasoning_effort: "low",
        max_completion_tokens: 300,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return prompt;
    const d = await res.json();
    const txt = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    return txt && String(txt).trim() ? String(txt).trim().slice(0, 500) : prompt;
  } catch (e) {
    return prompt;
  }
}

async function toBase64(out) {
  if (out && typeof out.image === "string") return out.image;
  let buf = null;
  if (out instanceof ReadableStream) buf = new Uint8Array(await new Response(out).arrayBuffer());
  else if (out instanceof ArrayBuffer) buf = new Uint8Array(out);
  else if (out instanceof Uint8Array) buf = out;
  if (!buf) return "";
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    s += String.fromCharCode.apply(null, buf.subarray(i, i + chunk));
  }
  return btoa(s);
}

async function handleImage(request, env) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) {
    return json({ reply: "Please sign in again.", needLogin: true }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ reply: "Bad request. Please try again." }, 400);
  }
  const prompt = String(body.prompt || "").trim().slice(0, 600);
  if (!prompt) return json({ reply: "Tell me what picture to make." }, 400);
  if (!env.AI) return json({ reply: "The picture maker is not set up yet." });
  if (BLOCK.test(prompt)) {
    return json({ reply: "I can't make that kind of picture. Please try something else." });
  }

  const limits = getLimits(user);
  let stub = null;
  let used = 0;
  if (env.LIMITER) {
    const hours = parseFloat(env.WINDOW_HOURS) || 2;
    stub = env.LIMITER.get(env.LIMITER.idFromName("img|" + user.$id));
    const r = await stub.hit(limits.img, hours * 3600 * 1000);
    if (!r.ok) {
      return json({ reply: "limit", limited: true, resetAt: r.resetAt, type: "image" }, 429);
    }
    used = r.used;
  }

  const english = await improvePrompt(env, prompt);
  if (BLOCK.test(english)) {
    if (stub) await stub.refund();
    return json({ reply: "I can't make that kind of picture. Please try something else." });
  }

  try {
    const out = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: english,
      steps: 4,
    });
    const b64 = await toBase64(out);
    if (!b64) throw new Error("empty");
    return json({
      image: "data:image/jpeg;base64," + b64,
      left: stub ? Math.max(0, limits.img - used) : undefined,
    });
  } catch (e) {
    if (stub) await stub.refund();
    return json({
      reply: "The picture maker is busy or has reached its limit. Please try again later.",
    });
  }
}

async function handleEditImage(request, env) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) {
    return json({ reply: "Please sign in again.", needLogin: true }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ reply: "Bad request. Please try again." }, 400);
  }
  const prompt = String(body.prompt || "").trim().slice(0, 600);
  const image = body.image || "";
  if (!prompt || !image) return json({ reply: "Please attach an image and describe the change." }, 400);
  if (BLOCK.test(prompt)) {
    return json({ reply: "I can't make that kind of picture. Please try something else." });
  }

  // Use Gemini to refine the edit prompt based on the image (simple practical approach)
  let refined = prompt;
  if (env.GEMINI_API_KEY && image.startsWith("data:")) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Describe this image in detail, then create a new image prompt that applies the user's edit request. Output ONLY the final image prompt." },
                { inline_data: { mime_type: image.split(";")[0].split(":")[1] || "image/jpeg", data: image.split(",")[1] } },
                { text: "User edit request: " + prompt }
              ]
            }]
          })
        }
      );
      if (res.ok) {
        const d = await res.json();
        const t = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
        if (t && t[0] && t[0].text) refined = t[0].text.slice(0, 500);
      }
    } catch (e) {}
  }

  // Re-use image generation with the refined prompt
  return handleImage(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ prompt: refined }),
    }),
    env
  );
}

/* ---------- M-Pesa Daraja ---------- */
async function getMpesaToken(env) {
  const auth = btoa(env.MPESA_CONSUMER_KEY + ":" + env.MPESA_CONSUMER_SECRET);
  const res = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + auth },
  });
  if (!res.ok) throw new Error("token failed");
  const d = await res.json();
  return d.access_token;
}

async function handleStk(request, env) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) return json({ ok: false, needLogin: true }, 401);

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false }, 400); }
  const phone = String(body.phone || "").replace(/\D/g, "").replace(/^0/, "254");
  const plan = body.plan === "ultra" ? "ultra" : "premium";
  const yearly = !!body.yearly;
  if (!phone || phone.length < 12) return json({ ok: false, error: "Invalid phone" }, 400);

  const amount = plan === "ultra" ? (yearly ? 36000 : 100) : (yearly ? 600 : 50); // adjust yearly premium if needed
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const password = btoa(env.MPESA_SHORTCODE + env.MPESA_PASSKEY + timestamp);

  try {
    const token = await getMpesaToken(env);
    const res = await fetch("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: env.MPESA_CALLBACK_URL,
        AccountReference: user.$id.slice(0, 12),
        TransactionDesc: plan + (yearly ? " yearly" : " monthly"),
      }),
    });
    const d = await res.json();
    return json({ ok: true, checkout: d.CheckoutRequestID });
  } catch (e) {
    return json({ ok: false, error: "Payment start failed" }, 500);
  }
}

async function handleCallback(request, env) {
  // Safaricom sends the result here. On success, update the user's plan in Appwrite.
  // For production you should verify the signature / use a secure method to map AccountReference back to the user.
  try {
    const body = await request.json();
    const result = body.Body && body.Body.stkCallback;
    if (result && result.ResultCode === 0) {
      // Extract metadata and set plan + expiry
      // Example: look up user by AccountReference and set prefs.plan + prefs.planExpiry
      // You will need an Appwrite server-side API key for this update.
    }
    return new Response("OK");
  } catch (e) {
    return new Response("OK");
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/chat" || path === "/.netlify/functions/chat") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleChat(request, env, ctx);
    }

    if (path === "/api/file-check") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleFile(request, env);
    }

    if (path === "/api/image") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleImage(request, env);
    }

    if (path === "/api/edit-image") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleEditImage(request, env);
    }

    if (path === "/api/mpesa/stk") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
      return handleStk(request, env);
    }

    if (path === "/api/mpesa/callback") {
      return handleCallback(request, env);
    }

    if (ICONS[path]) {
      url.pathname = ICONS[path];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
