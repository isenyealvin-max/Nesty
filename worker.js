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
const MODELS = { neptune: "NEPTUNE 5.5", nova: "Nova 5.5", nuvida: "Nuvida 5.5", hiaru: "Hiaru 5.1", smart: "Omni smart", tyra: "Tyra", manuva: "Manuva", lexy: "Lexy", fenny: "Fenny", vilda: "Vilda" };
const PLANS = {
  free: { name: "Free", msg: 40, file: 30, img: 6, tts: 12, models: ["neptune", "nova", "manuva", "lexy"], deep: false, data: false, mvCap: 3, mvDaily: true },
  diamond: { name: "Diamond", addon: true, msg: 30, file: 20, img: 4, tts: 10, models: ["manuva"], deep: false, data: false, mvCap: 20 },
  go: { name: "Go", msg: 60, file: 50, img: 10, tts: 40, models: ["nuvida"], deep: false, data: false },
  premium: { name: "Premium", msg: 55, file: 45, img: 7, tts: 35, models: ["tyra"], deep: true, data: false },
  pro: { name: "Pro", msg: 75, file: 65, img: 15, tts: 40, models: ["hiaru"], deep: false, data: true },
  learnover: { name: "Smart", msg: 85, file: 75, img: 20, tts: 80, models: ["smart"], deep: false, data: false },
  ultra: { name: "Ultra", msg: 90, file: 90, img: 30, tts: 70, models: ["hiaru", "smart", "tyra"], deep: true, data: true, dpCap: 8 },
  // win = minutes in one usage window (default 60). Shorter window = limits come back sooner.
  gold: { name: "Gold", msg: 110, file: 100, img: 35, tts: 80, models: ["nuvida", "tyra", "lexy", "vilda"], deep: true, data: false, dpCap: 10, win: 40 },
  platinum: { name: "Platinum", msg: 140, file: 130, img: 45, tts: 100, models: ["nuvida", "tyra", "smart", "fenny", "vilda"], deep: true, data: true, dpCap: 14, win: 25 },
  max: { name: "Max", msg: 200, file: 180, img: 60, tts: 150, models: ["neptune", "nova", "nuvida", "hiaru", "smart", "tyra", "manuva", "lexy", "fenny", "vilda"], deep: true, data: true, mvCap: 40, dpCap: 20, win: 15 },
};
function winOf(lim) { return ((lim && lim.win) || 60) * 60 * 1000; }
const TTS_LIMITS = {}; // natural voice clips per hour, taken from the plans above
Object.keys(PLANS).forEach(function (k) { TTS_LIMITS[k] = PLANS[k].tts; });
const RANK = { free: 0, diamond: 0.5, premium: 1, go: 2, pro: 3, learnover: 4, ultra: 5, gold: 6, platinum: 7, max: 8 }; // by price (only used to name the top plan)
const PRICES = {
  diamond: { monthly: 30, yearly: 360 },
  premium: { monthly: 50, yearly: 600 },
  go: { monthly: 70, yearly: 840 },
  pro: { monthly: 120, yearly: 1440 },
  learnover: { monthly: 150, yearly: 1800 },
  ultra: { monthly: 599, yearly: 7188 },
  gold: { monthly: 799, yearly: 9588 },
  platinum: { monthly: 999, yearly: 11988 },
  max: { monthly: 1599, yearly: 19188 },
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

  /* ----- a user's plans: several plans can be active at the same time (they stack) ----- */
  async readPlans() {
    let m = await this.ctx.storage.get("plans");
    if (!m) {
      m = {};
      const old = await this.ctx.storage.get("plan");
      if (old && old.plan) m[old.plan] = { period: old.period, expiresAt: old.expiresAt, activatedAt: old.activatedAt };
    }
    return m;
  }

  async getPlan() {
    const m = await this.readPlans();
    const now = Date.now();
    const act = [];
    let lastExp = null;
    Object.keys(m).forEach(function (k) {
      if (!PLANS[k] || k === "free") return;
      if (m[k].expiresAt > now) act.push({ plan: k, period: m[k].period, expiresAt: m[k].expiresAt, activatedAt: m[k].activatedAt });
      else if (!lastExp || m[k].expiresAt > lastExp.expiresAt) lastExp = { plan: k, expiresAt: m[k].expiresAt };
    });
    if (!act.length) {
      const o = { plan: "free", expiresAt: 0, active: [], lim: PLANS.free };
      if (lastExp) { o.expiredPlan = lastExp.plan; o.expiredAt = lastExp.expiresAt; }
      return o;
    }
    act.sort(function (a, b) { return RANK[b.plan] - RANK[a.plan]; });
    const base = act.filter(function (a) { return !PLANS[a.plan].addon; });
    const lim = { name: "", msg: 0, file: 0, img: 0, tts: 0, models: [], deep: false, data: false, mvCap: 0, dpCap: 0, win: 60 };
    const src = (base.length ? base : [{ plan: "free" }]).concat(act.filter(function (a) { return PLANS[a.plan].addon; }));
    const names = [];
    src.forEach(function (a) {
      const p = PLANS[a.plan];
      lim.msg = Math.max(lim.msg, p.msg); lim.file = Math.max(lim.file, p.file); lim.img = Math.max(lim.img, p.img); lim.tts = Math.max(lim.tts, p.tts);
      p.models.forEach(function (x) { if (lim.models.indexOf(x) < 0) lim.models.push(x); });
      lim.win = Math.min(lim.win, p.win || 60);
      if (p.deep) lim.deep = true;
      if (p.data) lim.data = true;
      lim.mvCap = Math.max(lim.mvCap, p.mvCap || 0);
      if (p.dpCap) lim.dpCap = lim.dpCap ? Math.max(lim.dpCap, p.dpCap) : p.dpCap;
    });
    act.forEach(function (a) { names.push(PLANS[a.plan].name); });
    lim.mvDaily = lim.mvCap > 0 && lim.mvCap <= 3;
    lim.name = names.join(" + ");
    const top = act[0];
    return { plan: top.plan, period: top.period, expiresAt: top.expiresAt, activatedAt: top.activatedAt, active: act, lim: lim };
  }

  async canActivate(plan) {
    return { ok: true };
  }

  async activate(plan, period) {
    const m = await this.readPlans();
    const now = Date.now();
    const cur = m[plan];
    const base = cur && cur.expiresAt > now ? cur.expiresAt : now;
    const rec = { period: period, expiresAt: addPeriod(base, period), activatedAt: now };
    m[plan] = rec;
    await this.ctx.storage.put("plans", m);
    return Object.assign({ ok: true, plan: plan }, rec);
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
        seats: e.seats || 1,
        count: 0,
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
    const seats = c.seats || 1;
    if (seats > 1) {
      // School or family code: several different people can each use it once, up to the number of seats.
      const list = c.usedByList || [];
      if (list.indexOf(userId) > -1) return { ok: false };
      list.push(userId);
      c.usedByList = list;
      c.count = list.length;
      if (c.count >= seats) { c.used = true; c.usedAt = Date.now(); }
    } else {
      c.used = true;
      c.usedAt = Date.now();
      c.usedBy = userId;
      c.count = 1;
    }
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
        seats: v.seats || 1,
        count: v.count || (v.used ? 1 : 0),
      });
    });
    out.sort(function (a, b) { return b.createdAt - a.createdAt; });
    return out.slice(0, 200);
  }

  /* ----- reward days (invites): free users get Go for a while, paid users get their plan extended ----- */
  async grantDays(days) {
    const cur = await this.getPlan();
    const m = await this.readPlans();
    const now = Date.now();
    if (cur.plan === "free") m.go = { period: "reward", expiresAt: now + days * 86400000, activatedAt: now };
    else m[cur.plan] = { period: cur.period, expiresAt: cur.expiresAt + days * 86400000, activatedAt: cur.activatedAt || now };
    await this.ctx.storage.put("plans", m);
    return true;
  }

  /* ----- M-Pesa payments: one record per STK push, finished exactly once ----- */
  async mpPut(id, rec) { await this.ctx.storage.put("mp:" + id, rec); return true; }
  async mpGet(id) { return (await this.ctx.storage.get("mp:" + id)) || null; }
  async mpList(n) {
    const m = await this.ctx.storage.list({ prefix: "mp:" });
    const out = [];
    m.forEach(function (v, k) { out.push(Object.assign({ id: k.slice(3) }, v)); });
    out.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    return out.slice(0, n || 50);
  }
  async mpFinish(id, status, extra) {
    const r = await this.ctx.storage.get("mp:" + id);
    if (!r) return { ok: false };
    if (r.status !== "pending") return { ok: false, rec: r };
    r.status = status; r.doneAt = Date.now();
    if (extra) Object.assign(r, extra);
    await this.ctx.storage.put("mp:" + id, r);
    return { ok: true, rec: r };
  }

  /* ----- small key-value store, counters and unique sets (stats, announcement, invites, backups, shares) ----- */
  async kvGet(k) { const v = await this.ctx.storage.get("k:" + k); return v === undefined ? null : v; }
  async kvSet(k, v) { await this.ctx.storage.put("k:" + k, v); return true; }
  async kvDel(k) { await this.ctx.storage.delete("k:" + k); return true; }
  async incr(k, n) {
    const key = "n:" + k;
    const v = ((await this.ctx.storage.get(key)) || 0) + (n || 1);
    await this.ctx.storage.put(key, v);
    return v;
  }
  async counters(prefix) {
    const m = await this.ctx.storage.list({ prefix: "n:" + (prefix || "") });
    const o = {};
    m.forEach(function (v, k) { o[k.slice(2)] = v; });
    return o;
  }
  async seen(day, id) {
    const k = "s:" + day + ":" + id;
    if (await this.ctx.storage.get(k)) return false;
    await this.ctx.storage.put(k, 1);
    await this.incr("d:" + day + ":users", 1);
    return true;
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

/* Counts what is used (never what people write) so the owner can see growth and cost on the admin page. */
function dayKey(t) { return new Date(t || Date.now()).toISOString().slice(0, 10); }
function track(env, ctx, keys, uid) {
  if (!env.LIMITER) return;
  const s = stub(env, "stats");
  const day = dayKey();
  const job = (async function () {
    try {
      for (const k of keys) await s.incr(k.replace("{d}", day));
      if (uid) await s.seen(day, uid);
    } catch (e) {}
  })();
  if (ctx && ctx.waitUntil) ctx.waitUntil(job);
}

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
    const user = { $id: u.$id, verified: u.emailVerification === true, pwSet: pwSet, created: Date.parse(u.$createdAt) || 0 };
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
    lim = plan.lim || PLANS.free;
    mstub = stub(env, user.$id);
    r = await mstub.hit(lim.msg, winOf(lim));
    if (!r.ok) {
      return json({ reply: "limit", limited: true, kind: "msg", resetAt: r.resetAt, plan: plan.plan }, 429);
    }
    if (hasAttachment(body.messages)) {
      fstub = stub(env, "file|" + user.$id);
      const fr = await fstub.hit(lim.file, winOf(lim));
      if (!fr.ok) {
        await mstub.refund();
        return json({ reply: "limit", limited: true, kind: "file", resetAt: fr.resetAt, plan: plan.plan }, 429);
      }
    }
    const wantM = String(body.model || "");
    const chosen = lim.models.indexOf(wantM) > -1 ? wantM : lim.models[0];
    if (chosen === "manuva" && lim.mvCap) {
      const mv = await stub(env, "mv|" + user.$id).hit(lim.mvCap, (lim.mvDaily || (plan.lim === undefined)) ? 24 * 3600 * 1000 : WINDOW_MS);
      if (!mv.ok) {
        await mstub.refund();
        if (fstub) await fstub.refund();
        return json({ reply: "limit", limited: true, kind: "manuva", resetAt: mv.resetAt, plan: plan.plan }, 429);
      }
    }
    if (body.deep === true && lim.dpCap) {
      const dp = await stub(env, "dp|" + user.$id).hit(lim.dpCap, WINDOW_MS);
      if (!dp.ok) {
        await mstub.refund();
        if (fstub) await fstub.refund();
        return json({ reply: "limit", limited: true, kind: "deep", resetAt: dp.resetAt, plan: plan.plan }, 429);
      }
    }
    if (wantSc && chosen === "smart") body.sc = true; // Study Center tasks only run on Omni smart
    body.planInfo = {
      plan: plan.plan,
      model: chosen,
      modelName: MODELS[chosen],
      deep: !!lim.deep,
      data: !!lim.data,
      name: lim.name || (PLANS[plan.plan] || PLANS.free).name,
      period: plan.period || "",
      expiresAt: plan.expiresAt || 0,
      msgUsed: r.used,
      msgLimit: lim.msg,
      msgResetAt: r.resetAt,
      openai: await openaiMode(env),
    };
    body.usageInfo = { left: Math.max(0, lim.msg - r.used), used: r.used, resetAt: r.resetAt, plan: plan.plan };
    track(env, ctx, ["d:{d}:msg", "d:{d}:msg:plan:" + plan.plan, "d:{d}:model:" + chosen].concat(body.sc ? ["d:{d}:sc"] : []).concat(body.deep ? ["d:{d}:deep"] : []), user.$id);
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
  if ((res.headers.get("Content-Type") || "").indexOf("text/event-stream") === 0) {
    const sv = res.headers.get("X-Nesty-Via");
    if (sv) track(env, ctx, ["d:{d}:via:" + sv]);
    return res;
  }
  try {
    const d = await res.clone().json();
    if (!d.via) {
      await mstub.refund();
      if (fstub) await fstub.refund();
      return json(d);
    }
    track(env, ctx, ["d:{d}:via:" + String(d.via).slice(0, 60)]);
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
  const lim = plan.lim || PLANS.free;
  const u = await Promise.all([
    stub(env, id).peek(winOf(lim)),
    stub(env, "file|" + id).peek(winOf(lim)),
    stub(env, "img|" + id).peek(winOf(lim)),
  ]);
  let announcement = null;
  try {
    const a = await stub(env, "stats").kvGet("announce");
    if (a && a.until > Date.now()) announcement = { id: a.id, text: a.text, link: a.link || "" };
  } catch (e) {}
  return json({
    announcement: announcement,
    limiter: true,
    models: lim.models,
    win: lim.win || 60,
    deep: !!lim.deep,
    data: !!lim.data,
    plan: plan.plan,
    period: plan.period || "",
    expiresAt: plan.expiresAt || 0,
    expiredPlan: plan.expiredPlan || "",
    expiredAt: plan.expiredAt || 0,
    mpesa: mpReady(env) && (await mpOn(env)),
    active: (plan.active || []).map(function (a) { return { plan: a.plan, expiresAt: a.expiresAt }; }),
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
    const claim = await codes.claimCode(h, id);
  if (!claim.ok) return json({ ok: false, error: "That code has already been used." });

  const act = await pstub.activate(claim.plan, claim.period);
  await attempts.refund();
  if (!act.ok) return json({ ok: false, error: act.error });
  track(env, null, ["d:{d}:act:" + act.plan]);
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
  if (action === "stats") {
    const s = stub(env, "stats");
    return json({ counters: await s.counters("d:"), announce: await s.kvGet("announce"), now: Date.now() });
  }
  if (action === "announce") {
    let b3;
    try { b3 = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
    const text = String(b3.text || "").trim().slice(0, 200);
    let link = String(b3.link || "").trim().slice(0, 300);
    if (!text) return json({ error: "Type the message first." }, 400);
    if (link && !/^https?:\/\//i.test(link)) link = "";
    const days = Math.max(1, Math.min(30, parseInt(b3.days, 10) || 3));
    const a = { id: Date.now().toString(36), text: text, link: link, until: Date.now() + days * 86400000 };
    await stub(env, "stats").kvSet("announce", a);
    return json({ ok: true, announce: a });
  }
  if (action === "providers") {
    async function ping(name, key, url, init) {
      const out = { name: name, keyFound: !!key, ok: false, status: 0, ms: 0, note: "" };
      if (!key) { out.note = "Key not found in Cloudflare"; return out; }
      const t0 = Date.now();
      try {
        const ctrl = new AbortController();
        const tm = setTimeout(function () { ctrl.abort(); }, 9000);
        const res = await fetch(url, Object.assign({ signal: ctrl.signal }, init));
        clearTimeout(tm);
        out.status = res.status; out.ok = res.ok; out.ms = Date.now() - t0;
        if (!res.ok) out.note = res.status === 429 ? "Busy or out of free quota (429)" : res.status === 401 || res.status === 403 ? "Key rejected (" + res.status + ")" : "Error " + res.status;
        else out.note = "Working";
      } catch (e) { out.ms = Date.now() - t0; out.note = "No answer (timeout or network)"; }
      return out;
    }
    const chatBody = function (model, extra) { return JSON.stringify(Object.assign({ model: model, messages: [{ role: "user", content: "Say OK" }], max_tokens: 8 }, extra || {})); };
    const hdr = function (k) { return { "Content-Type": "application/json", Authorization: "Bearer " + k }; };
    const list = await Promise.all([
      ping("Groq", env.GROQ_API_KEY, "https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: hdr(env.GROQ_API_KEY), body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "user", content: "Say OK" }], max_completion_tokens: 32, reasoning_effort: "low" }) }),
      ping("Gemini", env.GEMINI_API_KEY, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY || "" }, body: chatBody("gemini-2.5-flash-lite") }),
      ping("OpenAI", env.OPENAI_API_KEY, "https://api.openai.com/v1/chat/completions", { method: "POST", headers: hdr(env.OPENAI_API_KEY), body: JSON.stringify({ model: String(env.OPENAI_MODELS || "gpt-4.1-mini").split(",")[0].trim(), messages: [{ role: "user", content: "Say OK" }], max_completion_tokens: 16 }) }),
      ping("OpenRouter", env.OPENROUTER_API_KEY, "https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: hdr(env.OPENROUTER_API_KEY), body: chatBody("openrouter/free") }),
      ping("Tavily (web search)", env.TAVILY_API_KEY, "https://api.tavily.com/search", { method: "POST", headers: hdr(env.TAVILY_API_KEY), body: JSON.stringify({ query: "test", max_results: 1 }) }),
    ]);
    list.push({ name: "Workers AI (pictures fallback)", keyFound: !!env.AI, ok: !!env.AI, status: 0, ms: 0, note: env.AI ? "Connected (not test-called to save quota)" : "Not connected" });
    list.push({ name: "Football data", keyFound: !!env.FOOTBALL_DATA_KEY, ok: !!env.FOOTBALL_DATA_KEY, status: 0, ms: 0, note: env.FOOTBALL_DATA_KEY ? "Key found (not test-called)" : "Key not found" });
    list.push({ name: "M-Pesa (Daraja)", keyFound: mpReady(env), ok: mpReady(env), status: 0, ms: 0, note: mpReady(env) ? "Keys found (" + (String(env.MPESA_ENV || "").toLowerCase() === "sandbox" ? "sandbox" : "live") + ")" : "Keys not found" });
    return json({ providers: list, checkedAt: Date.now() });
  }
  if (action === "openai_get") {
    return json({ mode: await openaiMode(env), keyFound: !!env.OPENAI_API_KEY, models: env.OPENAI_MODELS || "gpt-4.1-mini,gpt-4o-mini" });
  }
  if (action === "openai_set") {
    let b6;
    try { b6 = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
    const mv6 = ["off", "backup", "first"].indexOf(b6.mode) > -1 ? b6.mode : "backup";
    await stub(env, "stats").kvSet("openaiMode", mv6);
    oaCache = { v: mv6, t: Date.now() };
    return json({ ok: true, mode: mv6 });
  }
  if (action === "mpesa_get") {
    return json({ on: await mpOn(env), ready: mpReady(env), mode: String(env.MPESA_ENV || "").toLowerCase() === "sandbox" ? "sandbox" : "live" });
  }
  if (action === "mpesa_set") {
    let b4;
    try { b4 = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
    await stub(env, "stats").kvSet("mpesaOn", b4.on === true);
    return json({ ok: true, on: b4.on === true, ready: mpReady(env) });
  }
  if (action === "payments") {
    return json({ payments: await stub(env, "mpesa").mpList(60) });
  }
  if (action === "grant") {
    let b5;
    try { b5 = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400); }
    const gp = String(b5.plan || ""), gper = String(b5.period || ""), gu = String(b5.uid || "").trim().slice(0, 64);
    if (!gu || !PLANS[gp] || gp === "free" || !PRICES[gp] || !PRICES[gp][gper]) return json({ error: "Type the user ID and choose a plan and period." }, 400);
    const r = await stub(env, "plan|" + gu).activate(gp, gper);
    track(env, null, ["d:{d}:act:" + gp]);
    return json({ ok: true, expiresAt: r.expiresAt });
  }
  if (action === "announce_clear") {
    await stub(env, "stats").kvDel("announce");
    return json({ ok: true });
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
  const seats = Math.max(1, Math.min(50, parseInt(body.seats, 10) || 1));
  const made = [];
  const entries = [];
  for (let i = 0; i < count; i++) {
    const c = genCode();
    made.push(fmtCode(c));
    entries.push({ h: await sha256hex(c), plan: plan, period: period, label: label, seats: seats });
  }
  await codes.addCodes(entries);
  return json({ codes: made, plan: plan, period: period, price: PRICES[plan][period], seats: seats });
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
    const r = await stb.hit((plan.lim || PLANS.free).tts, winOf(plan.lim));
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
const HELP_LIMIT = 20;
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
    const r = await hs.hit(HELP_LIMIT, 60 * 60 * 1000);
    if (!r.ok) return json({ limited: true, resetAt: r.resetAt, left: 0 });
    used = r.used;
    track(env, ctx, ["d:{d}:help"]);
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

/* ---------- Invites: both people get 3 days of Go (the owner can change REF_DAYS) ---------- */
const REF_DAYS = 3;
const REF_CAP = 15;
async function handleReferral(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false, error: "Not set up yet." });
  const user = auth.user;
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const reg = stub(env, "refreg");
  const mine = (await sha256hex("nestyref|" + user.$id)).slice(0, 8).toUpperCase();
  if (b.action === "claim") {
    const rate = await stub(env, "refclaim|" + user.$id).hit(10, 24 * 60 * 60 * 1000);
    if (!rate.ok) return json({ ok: false, error: "Too many tries." }, 429);
    const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (code.length !== 8) return json({ ok: false, error: "That invite link is not valid." });
    if (code === mine) return json({ ok: false, error: "You cannot use your own invite." });
    if (!user.created || Date.now() - user.created > 7 * 86400000) return json({ ok: false, error: "Invites only work for new accounts, in their first 7 days." });
    if (await reg.kvGet("cl:" + user.$id)) return json({ ok: false, error: "You already used an invite." });
    const ref = await reg.kvGet("c:" + code);
    if (!ref) return json({ ok: false, error: "That invite link is not valid." });
    await reg.kvSet("cl:" + user.$id, ref);
    await stub(env, "plan|" + user.$id).grantDays(REF_DAYS);
    const cnt = (await reg.kvGet("n:" + ref)) || 0;
    if (cnt < REF_CAP) {
      await stub(env, "plan|" + ref).grantDays(REF_DAYS);
      await reg.kvSet("n:" + ref, cnt + 1);
    }
    track(env, null, ["d:{d}:invite"]);
    return json({ ok: true, days: REF_DAYS });
  }
  await reg.kvSet("c:" + mine, user.$id);
  const n = (await reg.kvGet("n:" + user.$id)) || 0;
  return json({ ok: true, code: mine, invited: n, cap: REF_CAP, days: REF_DAYS });
}

/* ---------- Backup of the person's own Study Center and tools (saved in pieces) ---------- */
async function handleBackup(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false, error: "Backup is not set up yet." });
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const id = auth.user.$id;
  const rate = await stub(env, "bkrate|" + id).hit(30, 60 * 60 * 1000);
  if (!rate.ok) return json({ ok: false, error: "Too many tries. Please wait a little." }, 429);
  const s = stub(env, "bk|" + id);
  const meta = await s.kvGet("meta");
  if (b.action === "get") {
    if (!meta) return json({ ok: true, empty: true });
    let data = "";
    for (let i = 0; i < meta.n; i++) data += (await s.kvGet("p" + i)) || "";
    return json({ ok: true, data: data, at: meta.at });
  }
  if (b.action === "del") {
    if (meta) { for (let i = 0; i < meta.n; i++) await s.kvDel("p" + i); await s.kvDel("meta"); }
    return json({ ok: true });
  }
  if (b.action === "put") {
    const data = typeof b.data === "string" ? b.data : "";
    if (!data) return json({ ok: false, error: "Nothing to back up." }, 400);
    if (data.length > 600000) return json({ ok: false, error: "Your data is too big to back up. Delete some old notes or exams and try again." }, 413);
    const n = Math.ceil(data.length / 100000);
    for (let i = 0; i < n; i++) await s.kvSet("p" + i, data.slice(i * 100000, (i + 1) * 100000));
    if (meta) for (let i = n; i < meta.n; i++) await s.kvDel("p" + i);
    await s.kvSet("meta", { n: n, at: Date.now() });
    return json({ ok: true, at: Date.now(), size: data.length });
  }
  return json({ ok: false, error: "Bad request." }, 400);
}

/* ---------- Share an answer as a link (the person chooses to share; links last 30 days) ---------- */
function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
async function handleShare(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false, error: "Sharing is not set up yet." });
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const a = String(b.a || "").slice(0, 8000).trim();
  const q = String(b.q || "").slice(0, 600).trim();
  if (a.length < 2) return json({ ok: false, error: "Nothing to share." }, 400);
  const rate = await stub(env, "sharerate|" + auth.user.$id).hit(20, 60 * 60 * 1000);
  if (!rate.ok) return json({ ok: false, error: "Too many shares. Please try again later." }, 429);
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes).map(function (x) { return (x % 36).toString(36); }).join("") + Date.now().toString(36).slice(-3);
  await stub(env, "shares").kvSet("sh:" + id, { q: q, a: a, t: Date.now() });
  return json({ ok: true, url: new URL(request.url).origin + "/s/" + id });
}
async function sharePage(request, env, id) {
  let rec = null;
  if (env.LIMITER && /^[a-z0-9]{8,14}$/.test(id)) rec = await stub(env, "shares").kvGet("sh:" + id);
  const ok = rec && Date.now() - rec.t < 30 * 86400000;
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Shared from Nesty AI</title><meta property="og:title" content="An answer from Nesty AI"><meta property="og:description" content="Someone shared this with you. Open it, and try Nesty AI free."><meta property="og:image" content="/icon-512-1.png"><meta property="og:type" content="website">' +
    '<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fff8e1;color:#2a2200}main{max-width:680px;margin:0 auto;padding:18px 16px 50px}h1{font-size:19px;margin:0 0 12px}.q{background:#ffe9a8;border-radius:14px;padding:11px 14px;font-weight:600;margin-bottom:12px}.a{background:#fff;border:1.5px solid #ffd566;border-radius:14px;padding:14px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word}small{display:block;color:#6b5a1a;margin-top:12px}a.b{display:inline-block;margin-top:16px;background:#ffc933;color:#2a2200;padding:11px 16px;border-radius:12px;font-weight:700;text-decoration:none}</style></head><body><main><h1>✨ Shared from Nesty AI</h1>' +
    (ok ? (rec.q ? '<div class="q">' + escHtml(rec.q) + '</div>' : '') + '<div class="a">' + escHtml(rec.a) + '</div><small>A person shared this answer. Nesty is an AI and can make mistakes.</small>' : '<div class="a">This link has expired or does not exist.</div>') +
    '<a class="b" href="/">Try Nesty AI</a></main></body></html>';
  return new Response(html, { status: ok ? 200 : 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}

/* ---------- Where the user is (only after they press the button and allow it) ---------- */
function joinPlace(list) {
  const seen = {};
  const out = [];
  list.forEach(function (x) {
    x = String(x || "").trim();
    const k = x.toLowerCase().replace(/\s+(sub[\s-]?county|county|constituency|ward)$/i, "");
    if (x && !seen[k]) { seen[k] = 1; out.push(x); }
  });
  return out.slice(0, 7).join(", ");
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
  const coords = " (" + Number(lat).toFixed(4) + ", " + Number(lon).toFixed(4) + ")";
  // Most detailed first: village, ward, sub-county, county, region, country (OpenStreetMap), then fill gaps from BigDataCloud.
  const b = await fetchJson("https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=" + lat + "&lon=" + lon,
    { "User-Agent": "NestyAI/1.0 (https://github.com/isenyealvin-max/Nesty)", "Accept": "application/json" });
  const a = await fetchJson("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en");
  const x = (b && b.address) || {};
  const parts = [
    x.hamlet || x.village || x.neighbourhood || x.quarter || x.isolated_dwelling,
    x.suburb || x.city_district,
    x.town || x.city || x.municipality || (a && (a.locality || a.city)),
    x.state_district || x.county,
    x.state || (a && a.principalSubdivision),
    x.country || (a && a.countryName),
  ];
  if (a && a.localityInfo && Array.isArray(a.localityInfo.administrative)) {
    // fill the middle with the sub-county or ward when OpenStreetMap had none
    const adm = a.localityInfo.administrative.filter(function (z) { return z && z.name && z.adminLevel >= 5; });
    adm.sort(function (p, q) { return q.adminLevel - p.adminLevel; });
    adm.slice(0, 2).forEach(function (z) { parts.splice(2, 0, z.name); });
  }
  const t = joinPlace(parts);
  return t ? t + coords : "";
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

/* ---------- M-Pesa (Safaricom Daraja STK push). Secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY.
   Optional: MPESA_ENV ("sandbox" for testing, anything else = live), MPESA_TYPE ("till" for a Buy Goods till, otherwise Paybill), MPESA_TILL (till number if different from the shortcode). ---------- */
let mpToken = { v: "", exp: 0 };
function mpBase(env) { return String(env.MPESA_ENV || "").toLowerCase() === "sandbox" ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke"; }
async function mpOn(env) {
  try { return (await stub(env, "stats").kvGet("mpesaOn")) === true; } catch (e) { return false; }
}
let oaCache = { v: "backup", t: 0 };
async function openaiMode(env) {
  if (Date.now() - oaCache.t < 60000) return oaCache.v;
  try {
    const v = await stub(env, "stats").kvGet("openaiMode");
    oaCache = { v: ["off", "backup", "first"].indexOf(v) > -1 ? v : "backup", t: Date.now() };
  } catch (e) {}
  return oaCache.v;
}
function mpReady(env) { return !!(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_SHORTCODE && env.MPESA_PASSKEY); }
function nairobiStamp() {
  const d = new Date(Date.now() + 3 * 3600 * 1000);
  const p = function (n) { return String(n).padStart(2, "0"); };
  return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds());
}
async function mpAuth(env) {
  if (mpToken.v && mpToken.exp > Date.now() + 30000) return mpToken.v;
  const res = await fetch(mpBase(env) + "/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: "Basic " + btoa(env.MPESA_CONSUMER_KEY + ":" + env.MPESA_CONSUMER_SECRET) },
  });
  if (!res.ok) throw new Error("auth " + res.status);
  const d = await res.json();
  if (!d.access_token) throw new Error("no token");
  mpToken = { v: d.access_token, exp: Date.now() + (parseInt(d.expires_in, 10) || 3000) * 1000 };
  return mpToken.v;
}
function normPhone(s) {
  s = String(s || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (/^0[17]\d{8}$/.test(s)) s = "254" + s.slice(1);
  else if (/^[17]\d{8}$/.test(s)) s = "254" + s;
  return /^254[17]\d{8}$/.test(s) ? s : "";
}
function periodPrice(plan, period) { return PRICES[plan] && PRICES[plan][period] ? PRICES[plan][period] : 0; }

async function handleMpesaPay(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ ok: false, error: "Payments are not set up yet." });
  if (!(await mpOn(env))) return json({ ok: false, disabled: true, error: "STK push is disabled right now, please use the codes or contact us through our email." });
  if (!mpReady(env)) return json({ ok: false, error: "M-Pesa payments are not switched on yet. Please use an activation code for now." });
  let b;
  try { b = await request.json(); } catch (e) { return json({ ok: false, error: "Bad request." }, 400); }
  const plan = String(b.plan || ""), period = String(b.period || "");
  const amount = periodPrice(plan, period);
  if (!amount) return json({ ok: false, error: "Choose a plan and period." }, 400);
  const phone = normPhone(b.phone);
  if (!phone) return json({ ok: false, error: "Type a Safaricom number like 0712345678." });
  const uid = auth.user.$id;
  const rate = await stub(env, "mprate|" + uid).hit(6, 60 * 60 * 1000);
  if (!rate.ok) return json({ ok: false, error: "Too many payment tries. Please wait a while and try again." }, 429);
  const origin = new URL(request.url).origin;
  const stamp = nairobiStamp();
  const till = String(env.MPESA_TYPE || "").toLowerCase() === "till";
  const short = String(env.MPESA_SHORTCODE);
  try {
    const tok = await mpAuth(env);
    const res = await fetch(mpBase(env) + "/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: short,
        Password: btoa(short + env.MPESA_PASSKEY + stamp),
        Timestamp: stamp,
        TransactionType: till ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: till ? String(env.MPESA_TILL || short) : short,
        PhoneNumber: phone,
        CallBackURL: origin + "/api/mpesa/callback",
        AccountReference: "Nesty",
        TransactionDesc: (PLANS[plan] ? PLANS[plan].name : plan) + " " + period,
      }),
    });
    const d = await res.json().catch(function () { return {}; });
    if (!res.ok || String(d.ResponseCode) !== "0" || !d.CheckoutRequestID) {
      await stub(env, "mprate|" + uid).refund();
      return json({ ok: false, error: d.errorMessage || d.ResponseDescription || "M-Pesa could not start the payment. Please try again." });
    }
    await stub(env, "mpesa").mpPut(d.CheckoutRequestID, { uid: uid, plan: plan, period: period, amount: amount, phone: phone.slice(0, 6) + "***" + phone.slice(-2), status: "pending", at: Date.now() });
    return json({ ok: true, id: d.CheckoutRequestID, message: d.CustomerMessage || "Check your phone and enter your M-Pesa PIN." });
  } catch (e) {
    await stub(env, "mprate|" + uid).refund();
    return json({ ok: false, error: "Could not reach M-Pesa. Please try again in a moment." });
  }
}

/* Gives the plan once, whichever of the callback or the status check sees the payment first. */
async function mpComplete(env, id, ok, receipt, desc, paid) {
  const ms = stub(env, "mpesa");
  const cur = await ms.mpGet(id);
  if (!cur || cur.status !== "pending") return cur;
  if (ok && paid && paid < cur.amount) ok = false, desc = "Amount paid was too low.";
  const f = await ms.mpFinish(id, ok ? "paid" : "failed", { receipt: receipt || "", desc: String(desc || "").slice(0, 120) });
  if (f.ok && ok) {
    await stub(env, "plan|" + cur.uid).activate(cur.plan, cur.period);
    track(env, null, ["d:{d}:act:" + cur.plan, "d:{d}:mpesa"]);
  }
  return (f.rec || cur);
}

async function handleMpesaCallback(request, env) {
  const accepted = json({ ResultCode: 0, ResultDesc: "Accepted" });
  try {
    const b = await request.json();
    const cb = b && b.Body && b.Body.stkCallback;
    if (!cb || !cb.CheckoutRequestID || !env.LIMITER) return accepted;
    let receipt = "", paid = 0;
    const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [];
    items.forEach(function (it) {
      if (it.Name === "MpesaReceiptNumber") receipt = String(it.Value || "");
      if (it.Name === "Amount") paid = Number(it.Value) || 0;
    });
    await mpComplete(env, cb.CheckoutRequestID, Number(cb.ResultCode) === 0, receipt, cb.ResultDesc, paid);
  } catch (e) {}
  return accepted;
}

async function handleMpesaStatus(request, env) {
  const auth = await needUser(request);
  if (auth.res) return auth.res;
  if (!env.LIMITER) return json({ status: "failed" });
  let b = {};
  try { b = await request.json(); } catch (e) {}
  const id = String(b.id || "").slice(0, 80);
  const ms = stub(env, "mpesa");
  let rec = await ms.mpGet(id);
  if (!rec || rec.uid !== auth.user.$id) return json({ status: "unknown" });
  if (rec.status === "pending" && Date.now() - rec.at > 15000 && mpReady(env)) {
    // The callback may be late or lost: ask Safaricom directly.
    try {
      const stamp = nairobiStamp(), short = String(env.MPESA_SHORTCODE);
      const tok = await mpAuth(env);
      const res = await fetch(mpBase(env) + "/mpesa/stkpushquery/v1/query", {
        method: "POST",
        headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
        body: JSON.stringify({ BusinessShortCode: short, Password: btoa(short + env.MPESA_PASSKEY + stamp), Timestamp: stamp, CheckoutRequestID: id }),
      });
      const d = await res.json().catch(function () { return {}; });
      if (d && d.ResultCode !== undefined && d.ResultCode !== null && String(d.ResultCode) !== "") {
        rec = await mpComplete(env, id, String(d.ResultCode) === "0", "", d.ResultDesc, rec.amount);
      }
    } catch (e) {}
  }
  if (rec && rec.status === "pending" && Date.now() - rec.at > 180000) rec = await mpComplete(env, id, false, "", "Timed out", 0);
  const out = { status: rec ? rec.status : "unknown", desc: rec && rec.desc ? rec.desc : "", receipt: rec && rec.receipt ? rec.receipt : "" };
  if (rec && rec.status === "paid") {
    const p = await stub(env, "plan|" + auth.user.$id).getPlan();
    out.plan = rec.plan; out.expiresAt = ((p.active || []).filter(function (a) { return a.plan === rec.plan; })[0] || {}).expiresAt || 0;
  }
  return json(out);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const postOnly = {
      "/api/chat": function () { return handleChat(request, env, ctx); },
      "/.netlify/functions/chat": function () { return handleChat(request, env, ctx); },
      "/api/image": async function () {
        const res = await handleImage(request, env, { needUser: needUser, stub: stub, json: json, PLANS: PLANS, WINDOW_MS: WINDOW_MS });
        if (res.ok) track(env, ctx, ["d:{d}:img"]);
        return res;
      },
      "/api/me": function () { return handleMe(request, env); },
      "/api/place": function () { return handlePlace(request, env); },
      "/api/help": function () { return handleHelp(request, env, ctx); },
      "/api/referral": function () { return handleReferral(request, env); },
      "/api/backup": function () { return handleBackup(request, env); },
      "/api/share": function () { return handleShare(request, env); },
      "/api/admin/stats": function () { return handleAdmin(request, env, "stats"); },
      "/api/admin/announce": function () { return handleAdmin(request, env, "announce"); },
      "/api/admin/announce-clear": function () { return handleAdmin(request, env, "announce_clear"); },
      "/api/admin/openai-get": function () { return handleAdmin(request, env, "openai_get"); },
      "/api/admin/openai-set": function () { return handleAdmin(request, env, "openai_set"); },
      "/api/admin/providers": function () { return handleAdmin(request, env, "providers"); },
      "/api/admin/mpesa-get": function () { return handleAdmin(request, env, "mpesa_get"); },
      "/api/admin/mpesa-set": function () { return handleAdmin(request, env, "mpesa_set"); },
      "/api/admin/payments": function () { return handleAdmin(request, env, "payments"); },
      "/api/admin/grant": function () { return handleAdmin(request, env, "grant"); },
      "/api/tts": async function () {
        const res = await handleTts(request, env);
        if (res.ok) track(env, ctx, ["d:{d}:tts"]);
        return res;
      },
      "/api/redeem": function () { return handleRedeem(request, env); },
      "/api/mpesa/pay": function () { return handleMpesaPay(request, env); },
      "/api/mpesa/status": function () { return handleMpesaStatus(request, env); },
      "/api/mpesa/callback": function () { return handleMpesaCallback(request, env); },
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

    if (request.method === "GET" && path.indexOf("/s/") === 0) {
      return sharePage(request, env, path.slice(3));
    }

    if (ICONS[path]) {
      url.pathname = ICONS[path];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
