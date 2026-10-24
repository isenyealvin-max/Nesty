import { onRequestPost } from "./functions/api/chat.js";

const ICONS = {
  "/icon-192.png": "/icon-192-1.png",
  "/icon-512.png": "/icon-512-1.png",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/chat" || path === "/.netlify/functions/chat") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return onRequestPost({ request: request, env: env, ctx: ctx });
    }

    if (ICONS[path]) {
      url.pathname = ICONS[path];
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
