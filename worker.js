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
const PLANS = {
  free: { name: "Free", msg: 40, file: 30, img: 6 },
  premium: { name: "Premium", msg: 60, file: 50, img: 6 },
  ultra: { name: "Ultra", msg: 80, file: 70, img: 20 },
};
const RANK = { free: 0, premium: 1, ultra: 2 };
const PRICES = {
  premium: { monthly: 50, yearly: 600 },
  ultra: { monthly: 100, yearly: 36000 },
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
    const user = { $id: u.$id, verified: u.emailVerification === true, pwSet: !!(u.prefs && u.prefs.pwSet === true) };
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
    body.planInfo = {
      plan: plan.plan,
      name: lim.name,
      period: plan.period || "",
      expiresAt: plan.expiresAt || 0,
      msgUsed: r.used,
      msgLimit: lim.msg,
      msgResetAt: r.resetAt,
    };
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
  const guard = stub(env, "adminfail");
  const key = request.headers.get("X-Admin-Key") || "";
  if (!safeEq(key, env.ADMIN_KEY)) {
    const g = await guard.hit(10, 15 * 60 * 1000);
    return json({ error: g.ok ? "Wrong admin key." : "Too many wrong attempts. Try again later." }, g.ok ? 401 : 429);
  }
  const codes = stub(env, "codes");
  if (action === "list") {
    return json({ codes: await codes.listCodes() });
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
      "/api/redeem": function () { return handleRedeem(request, env); },
      "/api/admin/generate": function () { return handleAdmin(request, env, "generate"); },
      "/api/admin/list": function () { return handleAdmin(request, env, "list"); },
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
