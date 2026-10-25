import { DurableObject } from "cloudflare:workers";
import { onRequestPost } from "./functions/api/chat.js";

const APPWRITE = "https://sgp.cloud.appwrite.io/v1";
const PROJECT = "6adc585d003ae0c1be08";

const ICONS = {
  "/icon-192.png": "/icon-192-1.png",
  "/icon-512.png": "/icon-512-1.png",
};

/* Counts messages per user. One small object per user. */
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
    const user = { $id: u.$id };
    if (tokenCache.size > 500) tokenCache.clear();
    tokenCache.set(token, { user: user, exp: Date.now() + 5 * 60 * 1000 });
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

async function handleChat(request, env, ctx) {
  const origin = new URL(request.url).origin;
  const user = await verify(request.headers.get("X-Nesty-Token"), origin);
  if (!user) {
    return json({ reply: "Please sign in again.", needLogin: true }, 401);
  }

  if (!env.LIMITER) {
    return onRequestPost({ request: request, env: env, ctx: ctx });
  }

  const limit = parseInt(env.MSG_LIMIT, 10) || 40;
  const hours = parseFloat(env.WINDOW_HOURS) || 2;
  const stub = env.LIMITER.get(env.LIMITER.idFromName(user.$id));
  const r = await stub.hit(limit, hours * 3600 * 1000);

  if (!r.ok) {
    return json({ reply: "limit", limited: true, resetAt: r.resetAt }, 429);
  }

  const res = await onRequestPost({ request: request, env: env, ctx: ctx });
  try {
    const d = await res.clone().json();
    if (!d.via) {
      await stub.refund();
      return json(d);
    }
    d.left = Math.max(0, limit - r.used);
    d.resetAt = r.resetAt;
    return json(d);
  } catch (e) {
    return res;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/chat" || path === "/.netlify/functions/chat") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleChat(request, env, ctx);
    }

    if (ICONS[path]) {
      url.pathname = ICONS[path];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
