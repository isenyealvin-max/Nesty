// Picture maker. Google "Nano Banana" (Gemini image) is tried first, Cloudflare FLUX is the backup.
// Nesty researches the subject on the web first (logos, brands, places, objects)
// and can edit a photo the user attached.

const BLOCK = /\b(nude|naked|nsfw|porn\w*|sexual|sexy|erotic|explicit|topless|gore|beheading|rape|loli\w*|child\s*abuse)\b/i;
let gemCool = 0;

function needsResearch(prompt) {
  return (
    /\b(logo|brand|flag|jersey|kit|landmark|stadium|building|car|phone|mascot|emblem|badge)\b/i.test(prompt) ||
    /[A-Z][A-Za-z]{2,}/.test(prompt.slice(1))
  );
}

async function researchSubject(env, prompt) {
  if (!env.GEMINI_API_KEY) return "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 9000);
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text:
                "You help an image generator. Search the web if needed, then in at most 60 words of English describe what must be shown to depict the request accurately: logo shapes and brand colours, clothing and kits, landmarks, objects, setting. For real people give only their clothing, kit and setting, never facial details. Output only the description.",
            }],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { maxOutputTokens: 300 },
        }),
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return "";
    const d = await res.json();
    const parts = d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    return parts ? parts.map(function (p) { return p.text || ""; }).join("").trim().slice(0, 500) : "";
  } catch (e) {
    return "";
  }
}

async function improvePrompt(env, prompt, notes) {
  if (!env.GROQ_API_KEY) return prompt;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 8000);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.GROQ_API_KEY },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You write prompts for an AI image generator. Turn the user's request, in any language, into ONE vivid English image prompt of at most 70 words. Follow the user's instructions exactly. Describe the subject, style, lighting and mood, and describe logos or brands by their shapes and colours. If real people are named, ask for a stylised illustration instead of a photograph and do not use their names. Output only the prompt.",
          },
          { role: "user", content: prompt + (notes ? "\n\nReference notes: " + notes : "") },
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
    return txt && String(txt).trim() ? String(txt).trim().slice(0, 600) : prompt;
  } catch (e) {
    return prompt;
  }
}

// Google Nano Banana (gemini-2.5-flash-image). Makes and edits pictures.
async function geminiImage(env, text, inputB64, mime) {
  if (!env.GEMINI_API_KEY || gemCool > Date.now()) return null;
  const parts = [{ text: text }];
  if (inputB64) parts.unshift({ inlineData: { mimeType: mime || "image/jpeg", data: inputB64 } });
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, 40000);
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
        signal: ctrl.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) {
      gemCool = Date.now() + (res.status === 429 ? 10 * 60 * 1000 : 30 * 60 * 1000);
      return null;
    }
    const d = await res.json();
    const ps = (d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
    for (let i = 0; i < ps.length; i++) {
      const inl = ps[i].inlineData || ps[i].inline_data;
      if (inl && inl.data) return { b64: inl.data, mime: inl.mimeType || inl.mime_type || "image/png" };
    }
    return null;
  } catch (e) {
    clearTimeout(timer);
    return null;
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

// d = { needUser, stub, json, PLANS, WINDOW_MS } handed over by worker.js
export async function handleImage(request, env, d) {
  const json = d.json;
  const auth = await d.needUser(request);
  if (auth.res) return auth.res;
  const user = auth.user;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ reply: "Bad request. Please try again." }, 400);
  }

  const prompt = String(body.prompt || "").trim().slice(0, 600);
  const inputImage = body.image || null;

  if (!prompt) return json({ reply: "Tell me what picture to make or how to edit it." }, 400);
  if (!env.AI && !env.GEMINI_API_KEY) return json({ reply: "The picture maker is not set up yet." });
  if (BLOCK.test(prompt)) {
    return json({ reply: "I can't make that kind of picture. Please try something else." });
  }

  let stb = null;
  let used = 0;
  let limit = d.PLANS.free.img;
  if (env.LIMITER) {
    const plan = await d.stub(env, "plan|" + user.$id).getPlan();
    limit = (d.PLANS[plan.plan] || d.PLANS.free).img;
    stb = d.stub(env, "img|" + user.$id);
    const r = await stb.hit(limit, d.WINDOW_MS);
    if (!r.ok) {
      return json({ reply: "limit", limited: true, kind: "img", resetAt: r.resetAt, plan: plan.plan }, 429);
    }
    used = r.used;
  }
  const left = stb ? Math.max(0, limit - used) : undefined;

  let b64In = "";
  let mimeIn = "image/jpeg";
  if (inputImage) {
    const mm = /^data:(image\/[\w.+-]+);base64,/.exec(inputImage);
    if (mm) mimeIn = mm[1];
    b64In = String(inputImage).replace(/^data:image\/[\w.+-]+;base64,/, "");
  }

  // 1) Look the subject up on the web so the picture is accurate (not for photo edits).
  const notes = !inputImage && needsResearch(prompt) ? await researchSubject(env, prompt) : "";

  // 2) Google Nano Banana first.
  const gemText = inputImage
    ? "Edit the attached picture exactly as asked and keep everything else the same. Request: " + prompt
    : prompt +
      (notes ? "\n\nVisual reference notes from web research: " + notes : "") +
      "\n\nFollow the request exactly. If real people are named, draw a stylised illustration, not a photorealistic likeness. Do not add watermarks or extra text unless asked.";
  const g = await geminiImage(env, gemText, b64In, mimeIn);
  if (g) {
    return json({ image: "data:" + g.mime + ";base64," + g.b64, left: left });
  }

  // 3) Backup: Cloudflare FLUX.
  if (!env.AI) {
    if (stb) await stb.refund();
    return json({ reply: "The picture maker is busy right now. Please try again in a few minutes." });
  }
  const english = await improvePrompt(env, prompt, notes);
  if (BLOCK.test(english)) {
    if (stb) await stb.refund();
    return json({ reply: "I can't make that kind of picture. Please try something else." });
  }
  try {
    let out;
    if (inputImage) {
      out = await env.AI.run("@cf/black-forest-labs/flux-2-dev", {
        prompt: english,
        input_image: b64In,
        steps: 20,
      });
    } else {
      out = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
        prompt: english,
        steps: 4,
      });
    }
    const b64 = await toBase64(out);
    if (!b64) throw new Error("empty");
    return json({ image: "data:image/jpeg;base64," + b64, left: left });
  } catch (e) {
    if (stb) await stb.refund();
    console.error("Image error:", e);
    return json({
      reply: "The picture maker is busy or could not edit the image. Please try again later.",
    });
  }
}
