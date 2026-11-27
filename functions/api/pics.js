// Finds real pictures on the web (Tavily image search, then Wikimedia Commons as a free backup).
const HDR = { "User-Agent": "NestyAI/1.0 (https://nestyai.nestyapp.workers.dev)" };

function clean(q) {
  return String(q || "")
    .replace(/\b(please|pls|can you|could you|show me|show|find me|find|search for|search|get me|get|display|bring me|bring|let me see|i want to see|see|some|a few|the|an?|pictures?|images?|photos?|pics?|picha( za| ya)?|of|for|on the web|online|from the web|current|latest|real|actual|official)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function host(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
}

async function tavilyImages(env, q) {
  if (!env.TAVILY_API_KEY) return [];
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 12000);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.TAVILY_API_KEY },
      body: JSON.stringify({ query: q, search_depth: "basic", max_results: 3, include_images: true, include_image_descriptions: true }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const d = await res.json();
    return ((d && d.images) || []).map(function (im) {
      return typeof im === "string" ? { url: im, title: "" } : { url: im.url, title: im.description || "" };
    });
  } catch (e) { return []; }
}

async function commonsImages(q) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 8000);
    const res = await fetch("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=" + encodeURIComponent(q) + "&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=700&format=json", { signal: ctrl.signal, headers: HDR });
    clearTimeout(timer);
    if (!res.ok) return [];
    const d = await res.json();
    const pages = (d && d.query && d.query.pages) ? Object.values(d.query.pages) : [];
    return pages.map(function (p) {
      const ii = p.imageinfo && p.imageinfo[0];
      if (!ii || !/^image\/(jpeg|png|webp|svg)/.test(ii.mime || "")) return null;
      return { url: ii.thumburl || ii.url, title: String(p.title || "").replace(/^File:/, "").replace(/\.\w+$/, "").replace(/_/g, " ") };
    }).filter(Boolean);
  } catch (e) { return []; }
}

export async function handlePics(request, env, d) {
  const json = d.json;
  const auth = await d.needUser(request);
  if (auth.res) return auth.res;
  let body;
  try { body = await request.json(); } catch (e) { return json({ images: [] }, 400); }
  const q = clean(body.q);
  if (q.length < 2) return json({ images: [] });
  if (/\b(nude|naked|nsfw|porn\w*|sexual|sexy|erotic|explicit|topless|gore|rape|loli\w*)\b/i.test(q)) return json({ images: [] });
  if (env.LIMITER) {
    const r = await d.stub(env, "pics|" + auth.user.$id).hit(30, 3600000);
    if (!r.ok) return json({ images: [], limited: true });
  }
  let list = await tavilyImages(env, q);
  if (list.length < 4) list = list.concat(await commonsImages(q));
  const seen = {};
  const out = [];
  list.forEach(function (im) {
    if (!im || !im.url || !/^https:\/\//i.test(im.url) || seen[im.url] || out.length >= 6) return;
    seen[im.url] = 1;
    out.push({ url: im.url, title: String(im.title || "").slice(0, 120), host: host(im.url) });
  });
  return json({ images: out, q: q });
}
