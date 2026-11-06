import { DurableObject } from "cloudflare:workers";
import { onRequestPost } from "./functions/api/chat.js";
import { handleImage } from "./functions/api/image.js";

const APPWRITE = "https://sgp.cloud.appwrite.io/v1";
const PROJECT = "6adc585d003ae0c1be08";

const ICONS = {
  "/icon-192.png": "/icon-192-1.png",
  "/icon-512.png": "/icon-512-1.png",
};

/* ---------- Plans (the server is the only place these limits are enforced) ---------- */
const WINDOW_MS = 1 * 60 * 60 * 1000; // every usage window is 1 hour
const MODELS = { neptune: "NEPTUNE 5.5", nova: "Nova 5.5", nuvida: "Nuvida 5.5", hiaru: "Hiaru 5.1", smart: "Omni smart", tyra: "Tyra" };
const PLANS = {
  free: { name: "Free", msg: 40, file: 30, img: 6, tts: 12, models: ["neptune", "nova"], deep: false, data: false },
  go: { name: "Go", msg: 60, file: 50, img: 10, tts: 40, models: ["nuvida"], deep: false, data: false },
  premium: { name: "Premium", msg: 55, file: 45, img: 7, tts: 35, models: ["tyra"], deep: true, data: false },
  pro: { name: "Pro", msg: 75, file: 65, img: 15, tts: 40, models: ["hiaru"], deep: false, data: true },
  learnover: { name: "Learnover", msg: 85, file: 75, img: 20, tts: 80, models: ["smart"], deep: false, data: false },
  ultra: { name: "Ultra", msg: 100, file: 100, img: 50, tts: 120, models: ["neptune", "nova", "nuvida", "hiaru", "smart", "tyra"], deep: true, data: true },
};
const TTS_LIMITS = {}; // natural voice clips per hour, taken from the plans above
Object.keys(PLANS).forEach(function (k) { TTS_LIMITS[k] = PLANS[k].tts; });
const RANK = { free: 0, premium: 1, go: 2, pro: 3, learnover: 4, ultra: 5 }; // by price
const PRICES = {
  premium: { monthly: 50, yearly: 600 },
  go: { monthly: 70, yearly: 840 },
  pro: { monthly: 120, yearly: 1440 },
  learnover: { monthly: 150, yearly: 1800 },
  ultra: { monthly: 599, yearly: 7188 },
};

/* Adds one calendar month or one year, keeping the day of the month when possible. */
function addPeriod(fromMs, period) {
  const d = new Date(fromMs);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  if (period === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  const dim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, dim));
  return d.getTime();
}

/* One small object per name. Used for message, file and picture counters, plans and codes. */
export class Limiter extends DurableObject {
  /* ----- usage windows: a window starts at the first use and ends exactly windowMs later ----- */
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

  async peek(windowMs) {
    const st = await this.ctx.storage.get("w");
    if (!st || Date.now() - st.start >= windowMs) return { count: 0, resetAt: 0 };
    return { count: st.count, resetAt: st.start + windowMs };
  }

  /* ----- a user's plan ----- */
  async getPlan() {
    const p = await this.ctx.storage.get("plan");
    if (!p) return { plan: "free", expiresAt: 0 };
    if (p.expiresAt > Date.now()) return p;
    return { plan: "free", expiresAt: 0, expiredPlan: p.plan, expiredAt: p.expiresAt };
  }

  async canActivate(plan) {
    const cur = await this.getPlan();
    if (RANK[cur.plan] > RANK[plan]) {
      return {
        ok: false,
        error: "You already have an active " + PLANS[cur.plan].name + " plan. Use this code after it ends.",
      };
    }
    return { ok: true };
  }

  async activate(plan, period) {
    const cur = await this.getPlan();
    if (RANK[cur.plan] > RANK[plan]) {
      return { ok: false, error: "You already have an active " + PLANS[cur.plan].name + " plan." };
    }
    const now = Date.now();
    const base = cur.plan === plan && cur.expiresAt > now ? cur.expiresAt : now;
    const rec = { plan: plan, period: period, expiresAt: addPeriod(base, period), activatedAt: now };
    await this.ctx.storage.put("plan", rec);
    return Object.assign({ ok: true }, rec);
  }

  /* ----- activation codes (only a hash of each code is stored) ----- */
  async addCodes(entries) {
    for (const e of entries) {
      await this.ctx.storage.put("c:" + e.h, {
        plan: e.plan,
        period: e.period,
        label: e.label,
        createdAt: Date.now(),
        used: false,
      });
    }
    return true;
  }

  async peekCode(h) {
    return (await this.ctx.storage.get("c:" + h)) || null;
  }

  async claimCode(h, userId) {
    const c = await this.ctx.storage.get("c:" + h);
    if (!c || c.used) return { ok: false };
    c.used = true;
    c.usedAt = Date.now();
    c.usedBy = userId;
    await this.ctx.storage.put("c:" + h, c);
    return { ok: true, plan: c.plan, period: c.period };
  }

  async listCodes() {
    const m = await this.ctx.storage.list({ prefix: "c:" });
    const out = [];
    m.forEach(function (v, k) {
      out.push({
        id: k.slice(2, 10),
        plan: v.plan,
        period: v.period,
        label: v.label,
        createdAt: v.createdAt,
        used: !!v.used,
        usedAt: v.usedAt || 0,
      });
    });
    out.sort(function (a, b) { return b.createdAt - a.createdAt; });
    return out.slice(0, 200);
  }

  /* ----- answer feedback (thumbs and reasons), read on the admin page ----- */
  async addFeedback(e) {
    const id = String(Date.now()).padStart(15, "0") + Math.random().toString(36).slice(2, 7);
    e.id = id;
    await this.ctx.storage.put("f:" + id, e);
    return true;
  }

  async listFeedback(limit) {
    const m = await this.ctx.storage.list({ prefix: "f:", reverse: true, limit: limit || 200 });
    const out = [];
    m.forEach(function (v) { out.push(v); });
    return out;
  }

  async deleteFeedback(id) {
    await this.ctx.storage.delete("f:" + id);
    return true;
  }
}

function stub(env, name) {
  return env.LIMITER.get(env.LIMITER.idFromName(name));
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
    // The password flag comes from Appwrite itself (passwordUpdate), not from profile data the user can edit.
    const pwSet = typeof u.passwordUpdate === "string" ? u.passwordUpdate !== "" : !!(u.prefs && u.prefs.pwSet === true);
    const user = { $id: u.$id, verified: u.emailVerification === true, pwSet: pwSet };
    if (tokenCache.size > 500) tokenCache.clear();
    tokenCache.set(token, { user: user, exp: Date.now() + (user.verified && user.pwSet ? 5 * 60 * 1000 : 15 * 1000) });
    return user;
  } catch (e) {
    return null;
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

/* Returns {user} or {res}. A signed-in user must also have a verified email. */
async function needUser(request) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) {
    return { res: json({ reply: "Please sign in again.", error: "Please sign in again.", needLogin: true }, 401) };
  }
  if (!user.verified) {
    return {
      res: json({ reply: "Please verify your email first.", error: "Please verify your email first.", needVerify: true }, 403),
    };
  }
  if (!user.pwSet) {
    return {
      res: json({ reply: "Please create your password first.", error: "Please create your password first.", needPassword: true }, 403),
    };
  }
  return { user: user };
}

/* ---------- Reading privacy.html and terms.html so Nesty can explain them ---------- */
const POLICY_RE = /(privacy|terms|policy|policies|conditions|data protection|personal (data|information)|cookies|children|minors|liability|acceptable use|delete my (data|account)|refund|legal|faragha|masharti|confidentialit|conditions d'utilisation|privacidad|términos|termos|الخصوصية|الشروط|गोपनीयता)/i;
let policyCache = { at: 0, privacy: "", terms: "" };

function htmlToText(h) {
  return String(h)
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|li|h1|h2|h3|div|ul)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&middot;/g, "·")
    .replace(/&larr;/g, "")
    .replace(/&times;/g, "×")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, 9000);
}

async function readAsset(env, origin, path) {
  try {
    let url = origin + path;
    for (let i = 0; i < 3; i++) {
      const res = await env.ASSETS.fetch(new Request(url));
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("Location");
        if (!loc) return "";
        url = new URL(loc, url).toString();
        continue;
      }
      if (!res.ok) return "";
      return htmlToText(await res.text());
    }
  } catch (e) {}
  return "";
}

async function getPolicyText(env, origin) {
  if (policyCache.at > Date.now() - 10 * 60 * 1000 && policyCache.privacy) return policyCache;
  const p = await readAsset(env, origin, "/privacy.html");
  const t = await readAsset(env, origin, "/terms.html");
  if (p || t) policyCache = { at: Date.now(), privacy: p, terms: t };
  return policyCache;
}

function lastUserText(messages) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i] && list[i].role === "user") {
      const c = list[i].content;
      if (Array.isArray(c)) return c.map(function (p) { return (p && p.text) || ""; }).join(" ");
      return String(c || "");
    }
  }
  return "";
}

/* A message counts as having an attachment when it carries a picture or the file marker. */
function hasAttachment(messages) {
  const list = Array.isArray(messages) ? messages : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    if (m && m.role === "user") {
      if (Array.isArray(m.content) && m.content.some(function (p) { return p && p.type === "image_url"; })) return true;
      return /^\s*\[Attached file:/.test(lastUserText([m]));
    }
  }
  return false;
}

/* ---------- Chat ---------- */
async function handleChat(request, env, ctx) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  const user = auth.user;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ reply: "Bad request. Please try again." }, 400);
  }
  const origin = new URL(request.url).origin;
  delete body.planInfo;
  delete body.policyText;
  delete body.usageInfo;
  delete body.help;
  const wantSc = body.sc === true;
  delete body.sc;
  body.uid = user.$id;

  let plan = { plan: "free", expiresAt: 0 };
  let lim = PLANS.free;
  let r = null;
  let mstub = null;
  let fstub = null;

  if (env.LIMITER) {
    plan = await stub(env, "plan|" + user.$id).getPlan();
    lim = PLANS[plan.plan] || PLANS.free;
    mstub = stub(env, user.$id);
    r = await mstub.hit(lim.msg, WINDOW_MS);
    if (!r.ok) {
      return json({ reply: "limit", limited: true, kind: "msg", resetAt: r.resetAt, plan: plan.plan }, 429);
    }
    if (hasAttachment(body.messages)) {
      fstub = stub(env, "file|" + user.$id);
      const fr = await fstub.hit(lim.file, WINDOW_MS);
      if (!fr.ok) {
        await mstub.refund();
        return json({ reply: "limit", limited: true, kind: "file", resetAt: fr.resetAt, plan: plan.plan }, 429);
      }
    }
    const wantM = String(body.model || "");
    const chosen = lim.models.indexOf(wantM) > -1 ? wantM : lim.models[0];
    if (wantSc && chosen === "smart") body.sc = true; // Study Center tasks only run on Omni smart
    body.planInfo = {
      plan: plan.plan,
      model: chosen,
      modelName: MODELS[chosen],
      deep: !!lim.deep,
      data: !!lim.data,
      name: lim.name,
      period: plan.period || "",
      expiresAt: plan.expiresAt || 0,
      msgUsed: r.used,
      msgLimit: lim.msg,
      msgResetAt: r.resetAt,
    };
    body.usageInfo = { left: Math.max(0, lim.msg - r.used), used: r.used, resetAt: r.resetAt, plan: plan.plan };
  }

  if (POLICY_RE.test(lastUserText(body.messages))) {
    const pt = await getPolicyText(env, origin);
    if (pt.privacy || pt.terms) body.policyText = { privacy: pt.privacy, terms: pt.terms };
  }

  const req2 = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await onRequestPost({ request: req2, env: env, ctx: ctx });
  if (!mstub) return res;
  if ((res.headers.get("Content-Type") || "").indexOf("text/event-stream") === 0) return res;
  try {
    const d = await res.clone().json();
    if (!d.via) {
      await mstub.refund();
      if (fstub) await fstub.refund();
      return json(d);
    }
    d.left = Math.max(0, lim.msg - r.used);
    d.used = r.used;
    d.resetAt = r.resetAt;
    d.plan = plan.plan;
    return json(d);
  } catch (e) {
    return res;
  }
}

/* ---------- Plan status and usage ---------- */
async function handleMe(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  const id = auth.user.$id;
  if (!env.LIMITER) return json({ plan: "free", usage: {}, limiter: false });
  const plan = await stub(env, "plan|" + id).getPlan();
  const lim = PLANS[plan.plan] || PLANS.free;
  const u = await Promise.all([
    stub(env, id).peek(WINDOW_MS),
    stub(env, "file|" + id).peek(WINDOW_MS),
    stub(env, "img|" + id).peek(WINDOW_MS),
  ]);
  return json({
    limiter: true,
    models: lim.models,
    deep: !!lim.deep,
    data: !!lim.data,
    plan: plan.plan,
    period: plan.period || "",
    expiresAt: plan.expiresAt || 0,
    expiredPlan: plan.expiredPlan || "",
    expiredAt: plan.expiredAt || 0,
    usage: {
      msg: { used: u[0].count, limit: lim.msg, resetAt: u[0].resetAt },
      file: { used: u[1].count, limit: lim.file, resetAt: u[1].resetAt },
      img: { used: u[2].count, limit: lim.img, resetAt: u[2].resetAt },
    },
  });
}

/* ---------- Activation codes ---------- */
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let s = "";
  for (let i = 0; i < b.length; i++) s += ALPHA[b[i] % 32];
  return s;
}
function fmtCode(s) {
  return s.match(/.{4}/g).join("-");
}
function normCode(s) {
  return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
async function sha256hex(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
}

async function handleRedeem(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false, error: "Subscriptions are not set up yet." });
  const id = auth.user.$id;

  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "Bad request." }, 400); }

  const attempts = stub(env, "redeem|" + id);
  const a = await attempts.hit(10, 60 * 60 * 1000);
  if (!a.ok) {
    return json({ ok: false, error: "Too many attempts. Please try again later." }, 429);
  }

  const code = normCode(body.code);
  if (code.length !== 16) return json({ ok: false, error: "That code is not valid." });
  const h = await sha256hex(code);
  const codes = stub(env, "codes");
  const info = await codes.peekCode(h);
  if (!info) return json({ ok: false, error: "That code is not valid." });
  if (info.used) return json({ ok: false, error: "That code has already been used." });

  const pstub = stub(env, "plan|" + id);
  const can = await pstub.canActivate(info.plan);
  if (!can.ok) return json({ ok: false, error: can.error });

  const claim = await codes.claimCode(h, id);
  if (!claim.ok) return json({ ok: false, error: "That code has already been used." });

  const act = await pstub.activate(claim.plan, claim.period);
  await attempts.refund();
  if (!act.ok) return json({ ok: false, error: act.error });
  return json({ ok: true, plan: act.plan, period: act.period, expiresAt: act.expiresAt });
}

/* ---------- Administrator tools (need the ADMIN_KEY secret) ---------- */
function safeEq(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function handleAdmin(request, env, action) {
  if (!env.ADMIN_KEY || !env.LIMITER) return json({ error: "Admin is not set up." }, 503);
  const guard = stub(env, "adminfail|" + (request.headers.get("CF-Connecting-IP") || "unknown")); // per visitor, so strangers cannot lock the owner out
  const key = request.headers.get("X-Admin-Key") || "";
  if (!safeEq(key, env.ADMIN_KEY)) {
    const g = await guard.hit(10, 15 * 60 * 1000);
    return json({ error: g.ok ? "Wrong admin key." : "Too many wrong attempts. Try again later." }, g.ok ? 401 : 429);
  }
  const codes = stub(env, "codes");
  if (action === "list") {
    return json({ codes: await codes.listCodes() });
  }
  if (action === "feedback") {
    return json({ feedback: await stub(env, "feedback").listFeedback(300) });
  }
  if (action === "feedback_delete") {
    let b2;
    try { b2 = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
    await stub(env, "feedback").deleteFeedback(String(b2.id || ""));
    return json({ ok: true });
  }
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
  const plan = String(body.plan || "");
  const period = String(body.period || "");
  if (!PRICES[plan] || !PRICES[plan][period]) return json({ error: "Choose a plan and period." }, 400);
  const count = Math.max(1, Math.min(50, parseInt(body.count, 10) || 1));
  const label = String(body.label || "").slice(0, 60);
  const made = [];
  const entries = [];
  for (let i = 0; i < count; i++) {
    const c = genCode();
    made.push(fmtCode(c));
    entries.push({ h: await sha256hex(c), plan: plan, period: period, label: label });
  }
  await codes.addCodes(entries);
  return json({ codes: made, plan: plan, period: period, price: PRICES[plan][period] });
}

/* ---------- Natural voices (Google Gemini text-to-speech) ---------- */
const TTS_VOICES = ["Kore", "Puck", "Zephyr", "Charon", "Aoede", "Fenrir"];
function pcmToWav(pcm, rate) {
  const h = new DataView(new ArrayBuffer(44));
  const put = function (o, s) { for (let i = 0; i < s.length; i++) h.setUint8(o + i, s.charCodeAt(i)); };
  put(0, "RIFF"); h.setUint32(4, 36 + pcm.length, true); put(8, "WAVE"); put(12, "fmt ");
  h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true);
  h.setUint32(24, rate, true); h.setUint32(28, rate * 2, true); h.setUint16(32, 2, true); h.setUint16(34, 16, true);
  put(36, "data"); h.setUint32(40, pcm.length, true);
  const out = new Uint8Array(44 + pcm.length);
  out.set(new Uint8Array(h.buffer), 0);
  out.set(pcm, 44);
  return out;
}
async function handleTts(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.GEMINI_API_KEY) return json({ error: "Natural voices are not set up." }, 503);
  let b;
  try { b = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
  const text = String(b.text || "").trim().slice(0, 500);
  const voice = TTS_VOICES.indexOf(b.voice) > -1 ? b.voice : "Kore";
  if (!text) return json({ error: "No text." }, 400);
  let stb = null;
  if (env.LIMITER) {
    const plan = await stub(env, "plan|" + auth.user.$id).getPlan();
    stb = stub(env, "tts|" + auth.user.$id);
    const r = await stb.hit(TTS_LIMITS[plan.plan] || TTS_LIMITS.free, WINDOW_MS);
    if (!r.ok) return json({ error: "Voice limit reached for now." }, 429);
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 25000);
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("tts " + res.status);
    const d = await res.json();
    const parts = d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    const inl = parts && parts[0] && (parts[0].inlineData || parts[0].inline_data);
    if (!inl || !inl.data) throw new Error("no audio");
    const rm = /rate=(\d+)/.exec(inl.mimeType || inl.mime_type || "");
    const pcm = Uint8Array.from(atob(inl.data), function (ch) { return ch.charCodeAt(0); });
    return new Response(pcmToWav(pcm, rm ? parseInt(rm[1], 10) : 24000), { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch (e) {
    if (stb) await stb.refund();
    return json({ error: "Voice failed." }, 502);
  }
}

/* ---------- Feedback on answers (stored inside Nesty, shown on /admin.html) ---------- */
async function handleFeedback(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false });
  let b;
  try { b = await request.json(); } catch (e) { return json({ ok: false }, 400); }
  const kind = b.kind === "up" ? "up" : (b.kind === "down" ? "down" : "");
  if (!kind) return json({ ok: false }, 400);
  const rate = await stub(env, "fbrate|" + auth.user.$id).hit(30, 60 * 60 * 1000);
  if (!rate.ok) return json({ ok: false }, 429);
  const clip = function (s, n) { return String(s || "").slice(0, n); };
  await stub(env, "feedback").addFeedback({
    t: Date.now(),
    kind: kind,
    reason: clip(b.reason, 600),
    question: clip(b.question, 600),
    answer: clip(b.answer, 1500),
    uid: auth.user.$id,
  });
  return json({ ok: true });
}

/* ---------- Help center assistant (limited questions per day, separate from chat messages) ---------- */
const HELP_LIMIT = 10;
async function handleHelp(request, env, ctx) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  const user = auth.user;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-6).map(function (m) {
    return { role: m && m.role === "assistant" ? "assistant" : "user", content: String((m && m.content) || "").slice(0, 500) };
  }).filter(function (m) { return m.content; });
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "Please type a question." }, 400);
  let hs = null;
  let used = 0;
  if (env.LIMITER) {
    hs = stub(env, "help|" + user.$id);
    const r = await hs.hit(HELP_LIMIT, 24 * 60 * 60 * 1000);
    if (!r.ok) return json({ limited: true, resetAt: r.resetAt, left: 0 });
    used = r.used;
  }
  const body = { help: true, stream: false, uid: user.$id, messages: msgs, planInfo: { model: "nova" } };
  const pt = await getPolicyText(env, new URL(request.url).origin);
  if (pt.privacy || pt.terms) body.policyText = { privacy: pt.privacy, terms: pt.terms };
  try {
    const res = await onRequestPost({ request: new Request(request.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), env: env, ctx: ctx });
    const d = await res.clone().json();
    if (!d.via || !d.reply) {
      if (hs) await hs.refund();
      return json({ error: "The Help assistant is busy. Please try again, or email us." });
    }
    return json({ reply: d.reply, left: Math.max(0, HELP_LIMIT - used) });
  } catch (e) {
    if (hs) await hs.refund();
    return json({ error: "The Help assistant is busy. Please try again, or email us." });
  }
}

/* ---------- Where the user is (only after they press the button and allow it) ---------- */
function joinPlace(list) {
  const seen = {};
  const out = [];
  list.forEach(function (x) {
    x = String(x || "").replace(/\s+County$/i, "").trim();
    const k = x.toLowerCase();
    if (x && !seen[k]) { seen[k] = 1; out.push(x); }
  });
  return out.slice(0, 4).join(", ");
}
async function fetchJson(url, headers) {
  const ctrl = new AbortController();
  const t = setTimeout(function () { ctrl.abort(); }, 6000);
  try {
    const r = await fetch(url, { headers: headers || {}, signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}
async function geocode(lat, lon) {
  const a = await fetchJson("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en");
  if (a) {
    const t = joinPlace([a.locality, a.city, a.principalSubdivision, a.countryName]);
    if (t) return t;
  }
  const b = await fetchJson("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=" + lat + "&lon=" + lon,
    { "User-Agent": "NestyAI/1.0 (https://github.com/isenyealvin-max/Nesty)", "Accept": "application/json" });
  if (b) {
    const x = b.address || {};
    const t = joinPlace([x.suburb || x.neighbourhood || x.village || x.town, x.city || x.county, x.state, x.country]);
    if (t) return t;
  }
  return "";
}
function countryName(code) {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(String(code).toUpperCase()); } catch (e) { return String(code || ""); }
}
async function handlePlace(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  if (env.LIMITER) {
    const r = await stub(env, "place|" + auth.user.$id).hit(30, 60 * 60 * 1000);
    if (!r.ok) return json({ ok: false, error: "Too many tries. Please try again later." }, 429);
  }
  let place = "";
  let approx = false;
  if (typeof b.lat === "number" && typeof b.lon === "number" && Math.abs(b.lat) <= 90 && Math.abs(b.lon) <= 180) {
    place = await geocode(b.lat, b.lon);
  }
  if (!place && b.approx === true) {
    // The person pressed the button but the phone could not give a position: use the rough area of the connection.
    const cf = request.cf || {};
    if (cf.country) place = joinPlace([cf.city, cf.region, countryName(cf.country)]);
    approx = !!place;
  }
  if (!place) return json({ ok: false, error: "Could not find the place." });
  return json({ ok: true, place: place, approx: approx });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const postOnly = {
      "/api/chat": function () { return handleChat(request, env, ctx); },
      "/.netlify/functions/chat": function () { return handleChat(request, env, ctx); },
      "/api/image": function () {
        return handleImage(request, env, { needUser: needUser, stub: stub, json: json, PLANS: PLANS, WINDOW_MS: WINDOW_MS });
      },
      "/api/me": function () { return handleMe(request, env); },
      "/api/place": function () { return handlePlace(request, env); },
      "/api/help": function () { return handleHelp(request, env, ctx); },
      "/api/tts": function () { return handleTts(request, env); },
      "/api/redeem": function () { return handleRedeem(request, env); },
      "/api/admin/generate": function () { return handleAdmin(request, env, "generate"); },
      "/api/admin/list": function () { return handleAdmin(request, env, "list"); },
      "/api/feedback": function () { return handleFeedback(request, env); },
      "/api/admin/feedback": function () { return handleAdmin(request, env, "feedback"); },
      "/api/admin/feedback-delete": function () { return handleAdmin(request, env, "feedback_delete"); },
    };
    if (postOnly[path]) {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return postOnly[path]();
    }

    if (ICONS[path]) {
      url.pathname = ICONS[path];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
