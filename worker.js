import { onRequestPost } from "./functions/api/chat.js";

const APPWRITE = "https://sgp.cloud.appwrite.io/v1";
const PROJECT = "6adc585d003ae0c1be08";

const ICONS = {
  "/icon-192.png": "/icon-192-1.png",
  "/icon-512.png": "/icon-512-1.png",
};

/* ---------- Plans (the server is the only place these limits are enforced) ---------- */
const WINDOW_MS = 5 * 60 * 60 * 1000; // every usage window is 1 hour
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

/*
 * In-memory fallback for the original Durable Object limiter.
 * This keeps the app deployable on Workers without a Durable Object binding.
 */
const MEMORY_STORE = new Map();

function getMemoryState(key) {
  if (!MEMORY_STORE.has(key)) MEMORY_STORE.set(key, {});
  return MEMORY_STORE.get(key);
}

function stub(env, name) {
  if (env && env.LIMITER) {
    return env.LIMITER.get(env.LIMITER.idFromName(name));
  }

  const state = getMemoryState(name);

  return {
    async hit(limit, windowMs) {
      const now = Date.now();
      let st = state.w || { start: now, count: 0 };
      if (now - st.start >= windowMs) st = { start: now, count: 0 };
      if (st.count >= limit) {
        return { ok: false, resetAt: st.start + windowMs, used: st.count };
      }
      st.count += 1;
      state.w = st;
      return { ok: true, resetAt: st.start + windowMs, used: st.count };
    },

    async refund() {
      const st = state.w;
      if (st && st.count > 0) {
        st.count -= 1;
        state.w = st;
      }
    },

    async peek(windowMs) {
      const st = state.w;
      if (!st || Date.now() - st.start >= windowMs) return { count: 0, resetAt: 0 };
      return { count: st.count, resetAt: st.start + windowMs };
    },

    async getPlan() {
      const p = state.plan;
      if (!p) return { plan: "free", expiresAt: 0 };
      if (p.expiresAt > Date.now()) return p;
      return { plan: "free", expiresAt: 0, expiredPlan: p.plan, expiredAt: p.expiresAt };
    },

    async canActivate(plan) {
      const cur = await this.getPlan();
      if (RANK[cur.plan] > RANK[plan]) {
        return {
          ok: false,
          error: "You already have an active " + PLANS[cur.plan].name + " plan. Use this code after it ends.",
        };
      }
      return { ok: true };
    },

    async activate(plan, period) {
      const cur = await this.getPlan();
      if (RANK[cur.plan] > RANK[plan]) {
        return { ok: false, error: "You already have an active " + PLANS[cur.plan].name + " plan." };
      }
      const now = Date.now();
      const base = cur.plan === plan && cur.expiresAt > now ? cur.expiresAt : now;
      const rec = { plan: plan, period: period, expiresAt: addPeriod(base, period), activatedAt: now };
      state.plan = rec;
      return Object.assign({ ok: true }, rec);
    },

    async addCodes(entries) {
      if (!state.codes) state.codes = new Map();
      for (const e of entries) {
        state.codes.set("c:" + e.h, {
          plan: e.plan,
          period: e.period,
          label: e.label,
          createdAt: Date.now(),
          used: false,
        });
      }
      return true;
    },

    async peekCode(h) {
      if (!state.codes) return null;
      return state.codes.get("c:" + h) || null;
    },

    async claimCode(h, userId) {
      if (!state.codes) return { ok: false };
      const c = state.codes.get("c:" + h);
      if (!c || c.used) return { ok: false };
      c.used = true;
      c.usedAt = Date.now();
      c.usedBy = userId;
      state.codes.set("c:" + h, c);
      return { ok: true, plan: c.plan, period: c.period };
    },

    async listCodes() {
      if (!state.codes) return [];
      const out = [];
      for (const [k, v] of state.codes.entries()) {
        out.push({
          id: k.slice(2, 10),
          plan: v.plan,
          period: v.period,
          label: v.label,
          createdAt: v.createdAt,
          used: !!v.used,
          usedAt: v.usedAt || 0,
        });
      }
      out.sort(function (a, b) { return b.createdAt - a.createdAt; });
      return out.slice(0, 200);
    },
  };
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
const POLICY_RE = /(privacy|terms|policy|policies|conditions|data protection|personal (data|information)|cookies|children|minors|liability|acceptable use|delete my (data|account)|refund|legal|far[...