// Models that failed recently are skipped for a while, so answers stay fast.
const cooldown = {};
const cooldownMsg = {};

// Nesty can add a hidden line like [[remember: The user's name is Amina]]. It is removed here
// and sent back as "remember" so the app can save it to the user's memory.
function reply(text, via, sources) {
  var facts = [];
  var forgets = [];
  var clean = String(text || "")
    .replace(/\[\[\s*forget\s*:\s*([^\]]{3,200}?)\s*\]\]/gi, function (m, f) {
      forgets.push(f.trim());
      return "";
    })
    .replace(/\[\[\s*remember\s*:\s*([^\]]{3,200}?)\s*\]\]/gi, function (m, f) {
      facts.push(f.trim());
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean && (facts.length || forgets.length)) clean = "Got it.";
  return new Response(
    JSON.stringify({
      reply: clean || String(text || ""),
      via: via || "",
      sources: sources || [],
      remember: facts.slice(0, 3),
      forget: forgets.slice(0, 3),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// Streams the model's answer to the app as it is written (server-sent events).
function streamReply(provRes, model, sources, usage, prefix, suffix) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const ts = new TransformStream();
  const w = ts.writable.getWriter();
  const send = function (o) { return w.write(enc.encode("data: " + JSON.stringify(o) + "\n\n")); };
  (async function () {
    let full = "";
    try {
      if (prefix) { full += prefix; await send({ t: prefix }); }
      const reader = provRes.body.getReader();
      let buf = "";
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        buf += dec.decode(part.value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) > -1) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (line.indexOf("data:") !== 0) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (t) { full += t; await send({ t: t }); }
          } catch (e) {}
        }
      }
      if (suffix && full) { full += suffix; await send({ t: suffix }); }
    } catch (e) {}
    try {
      const r = await reply(full || "Nesty is very busy right now. Please try again in a few minutes.", full ? model : "", sources).json();
      await send(Object.assign({ done: true }, r, usage || {}));
    } catch (e) {}
    try { await w.close(); } catch (e) {}
  })();
  return new Response(ts.readable, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

function toGeminiContents(messages) {
  return messages.map(function (m) {
    const role = m.role === "assistant" ? "model" : "user";
    const parts = [];
    if (Array.isArray(m.content)) {
      m.content.forEach(function (p) {
        if (p.type === "text") {
          parts.push({ text: String(p.text || "") });
        } else if (p.type === "image_url" && p.image_url && p.image_url.url) {
          const mt = /^data:([^;]+);base64,(.*)$/.exec(p.image_url.url);
          if (mt) parts.push({ inlineData: { mimeType: mt[1], data: mt[2] } });
        }
      });
    } else {
      parts.push({ text: String(m.content || "") });
    }
    if (!parts.length) parts.push({ text: " " });
    return { role: role, parts: parts };
  });
}

async function searchWithGemini(env, system, userMessages, errs) {
  const models = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash"];
  const started = Date.now();
  for (const model of models) {
    if (Date.now() - started > 40000) break;
    const key = "search|" + model;
    if (cooldown[key] && cooldown[key] > Date.now()) {
      errs.push(model + " (recent) " + (cooldownMsg[key] || ""));
      continue;
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 25000);
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: toGeminiContents(userMessages),
            tools: [{ google_search: {} }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
          }),
          signal: ctrl.signal,
        }
      );
      clearTimeout(timer);
      if (!res.ok) {
        let wait = 30000;
        if (res.status === 429) wait = 120000;
        if (res.status === 400 || res.status === 403 || res.status === 404) wait = 600000;
        cooldown[key] = Date.now() + wait;
        let msg = "";
        try { msg = (await res.text()).replace(/\s+/g, " ").slice(0, 160); } catch (e2) {}
        cooldownMsg[key] = res.status + " " + msg;
        errs.push(model + " " + res.status + " " + msg);
        continue;
      }
      const data = await res.json();
      const cand = data && data.candidates && data.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      const text = parts
        ? parts.map(function (p) { return p.text || ""; }).join("")
        : "";
      if (!text.trim()) { errs.push(model + " empty answer"); continue; }
      const chunks =
        (cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || [];
      const seen = {};
      const sources = [];
      chunks.forEach(function (c) {
        if (c.web && c.web.uri && sources.length < 5) {
          const t = c.web.title || c.web.uri;
          if (!seen[t]) {
            seen[t] = true;
            sources.push({ title: t, uri: c.web.uri });
          }
        }
      });
      return { text: text, model: model, sources: sources };
    } catch (e) {
      errs.push(model + " " + ((e && e.name) || "error"));
    }
  }
  return null;
}

// Backup web search (Tavily). Needs a free TAVILY_API_KEY.
async function tavilySearch(env, query) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 12000);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.TAVILY_API_KEY,
      },
      body: JSON.stringify({ query: query, search_depth: "basic", max_results: 6 }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data && data.results) || [];
    if (!results.length) return null;
    return results.slice(0, 6).map(function (r) {
      return { title: r.title || r.url, uri: r.url, text: String(r.content || "").slice(0, 1200) };
    });
  } catch (e) {
    return null;
  }
}

// ---------- Live football: ESPN public scoreboard (no key) + football-data.org (optional key) ----------
const FB_LEAGUES = [
  ["eng.1", /premier league|english premier|\bepl\b/i, "PL"],
  ["esp.1", /la ?liga|spanish league/i, "PD"],
  ["ita.1", /serie a/i, "SA"],
  ["ger.1", /bundesliga/i, "BL1"],
  ["fra.1", /ligue ?1/i, "FL1"],
  ["uefa.champions", /champions league|\bucl\b/i, "CL"],
  ["eng.2", /\bchampionship\b/i, "ELC"],
];
const FB_CLUBS = [
  ["eng.1", "PL", /\b(arsenal|liverpool|chelsea|man(?:chester)? ?(?:city|united|utd)|tottenham|spurs|newcastle|aston villa|brighton|everton|fulham|brentford|bournemouth|leeds|sunderland|nottingham forest|crystal palace|west ham|wolves|burnley|ipswich|hull city|coventry)\b/gi],
  ["esp.1", "PD", /\b(barcelona|barca|real madrid|atletico|sevilla|valencia|villarreal|real sociedad|athletic bilbao)\b/gi],
  ["ita.1", "SA", /\b(juventus|juve|inter milan|ac milan|napoli|roma|lazio|atalanta|fiorentina)\b/gi],
  ["ger.1", "BL1", /\b(bayern|dortmund|leverkusen|leipzig|frankfurt)\b/gi],
  ["fra.1", "FL1", /\b(psg|paris saint|marseille|lyon|monaco)\b/gi],
];
const FB_INTENT = /\b(score|scores|live|update|updates|playing|game|games|match|matches|result|results|fixture|fixtures|kick ?off|line ?ups?|table|standings?|top scorers?|golden boot|who won|winning|leading)\b/i;
const FB_ALIAS = { "man city": "manchester city", "man utd": "manchester united", "man united": "manchester united", "manchester utd": "manchester united", "spurs": "tottenham", "barca": "barcelona", "juve": "juventus", "psg": "paris saint" };

function footballIntent(text) {
  if (!FB_INTENT.test(text)) return null;
  let espn = "", fd = "";
  for (const l of FB_LEAGUES) {
    if (l[1].test(text)) { espn = l[0]; fd = l[2]; break; }
  }
  const clubs = [];
  for (const cl of FB_CLUBS) {
    const re = new RegExp(cl[2].source, "gi");
    let m;
    while ((m = re.exec(text))) {
      const k = m[0].toLowerCase().replace(/\s+/g, " ");
      clubs.push(FB_ALIAS[k] || k);
      if (!espn) { espn = cl[0]; fd = cl[1]; }
    }
  }
  if (!espn) return null;
  return { espn: espn, fd: fd, clubs: clubs };
}

async function jget(url, headers, dbg) {
  const host = url.split("/")[2];
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 7000);
    const res = await fetch(url, {
      headers: Object.assign({ "User-Agent": "Mozilla/5.0 (compatible; NestyAI/1.0)", Accept: "application/json" }, headers || {}),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) { if (dbg) dbg.push(host + " " + res.status); return null; }
    return await res.json();
  } catch (e) {
    if (dbg) dbg.push(host + " " + ((e && e.name) || "error"));
    return null;
  }
}
function ymd(offset) {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
}

async function espnScores(league, clubs, dbg) {
  const base = "https://site.api.espn.com/apis/site/v2/sports/soccer/" + league + "/scoreboard";
  let d = await jget(base + "?limit=100&dates=" + ymd(-2) + "-" + ymd(7), null, dbg);
  let evs = d && d.events;
  if (!evs || !evs.length) {
    d = await jget(base, null, dbg);
    evs = d && d.events;
  }
  if (dbg) dbg.push("events " + (evs ? evs.length : 0));
  if (!evs || !evs.length) return "";
  const lines = [];
  evs.forEach(function (ev) {
    try {
      const comp = ev.competitions && ev.competitions[0];
      if (!comp) return;
      const cs = comp.competitors || [];
      const home = cs.filter(function (x) { return x.homeAway === "home"; })[0];
      const away = cs.filter(function (x) { return x.homeAway === "away"; })[0];
      if (!home || !away) return;
      const hn = home.team.displayName, an = away.team.displayName;
      if (clubs.length) {
        const both = (hn + " " + an).toLowerCase();
        if (!clubs.some(function (k) { return both.indexOf(k) > -1; })) return;
      }
      const st = ev.status || comp.status || {};
      const ty = st.type || {};
      const state = ty.state;
      const when = String(ev.date || comp.date || "").slice(0, 16).replace("T", " ") + " UTC";
      let line = when + " | " + hn + (state === "pre" ? " vs " : " " + home.score + "-" + away.score + " ") + an + " | " +
        (state === "in" ? "LIVE " + (st.displayClock || ty.shortDetail || "") : state === "post" ? "FINAL (" + (ty.shortDetail || ty.detail || "FT") + ")" : "NOT STARTED");
      const names = {};
      cs.forEach(function (x) { names[x.team && x.team.id] = x.team && x.team.displayName; });
      const goals = (comp.details || []).filter(function (g) { return g.scoringPlay; }).map(function (g) {
        const who = g.athletesInvolved && g.athletesInvolved[0] && g.athletesInvolved[0].displayName;
        return ((g.clock && g.clock.displayValue) || "") + " " + (names[g.team && g.team.id] || "") + " " + (who || "") + (g.penaltyKick ? " (pen)" : "") + (g.ownGoal ? " (own goal)" : "");
      });
      if (goals.length) line += "\n   Goals: " + goals.join("; ");
      lines.push(line);
    } catch (e) {}
  });
  if (dbg) dbg.push("matched " + lines.length);
  return lines.slice(0, 12).join("\n");
}

async function espnTable(league) {
  const d = await jget("https://site.api.espn.com/apis/v2/sports/soccer/" + league + "/standings");
  const entries = d && d.children && d.children[0] && d.children[0].standings && d.children[0].standings.entries;
  if (!entries || !entries.length) return "";
  const rows = entries.map(function (e) {
    const s = {};
    (e.stats || []).forEach(function (x) { s[x.name] = x.value; });
    return { name: e.team && e.team.displayName, rank: s.rank, p: s.gamesPlayed, w: s.wins, d: s.ties, l: s.losses, gd: s.pointDifferential, pts: s.points };
  });
  rows.sort(function (a, b) {
    if (a.rank && b.rank) return a.rank - b.rank;
    return (b.pts - a.pts) || (b.gd - a.gd);
  });
  return rows.map(function (r, i) {
    return (i + 1) + ". " + r.name + " | P" + r.p + " W" + r.w + " D" + r.d + " L" + r.l + " | GD " + r.gd + " | " + r.pts + " pts";
  }).join("\n");
}

async function fdStandings(env, code) {
  if (!env.FOOTBALL_DATA_KEY) return "";
  const st = await jget("https://api.football-data.org/v4/competitions/" + code + "/standings", { "X-Auth-Token": env.FOOTBALL_DATA_KEY });
  const tb = st && st.standings && (st.standings.find(function (s) { return s.type === "TOTAL"; }) || st.standings[0]);
  if (!tb || !tb.table || !tb.table.length) return "";
  return tb.table.map(function (r) {
    return r.position + ". " + r.team.name + " | P" + r.playedGames + " W" + r.won + " D" + r.draw + " L" + r.lost + " | GD " + r.goalDifference + " | " + r.points + " pts";
  }).join("\n");
}

// Returns {intent, facts, sources}. intent=true with empty facts means the feed failed.
async function footballFacts(env, text) {
  const it = footballIntent(text);
  if (!it) return { intent: false, facts: "", sources: [], diag: "" };
  const out = [];
  const sources = [];
  const dbg = [];
  const scores = await espnScores(it.espn, it.clubs, dbg);
  if (scores) {
    out.push("MATCHES (UTC times; 'LIVE' means in play now, 'FINAL' means finished):\n" + scores);
    sources.push({ title: "ESPN soccer scoreboard", uri: "https://www.espn.com/soccer/scoreboard" });
  }
  if (/table|standings?|position|leading|top of|relegation|title race|log\b/i.test(text)) {
    let tbl = await fdStandings(env, it.fd);
    if (tbl) sources.push({ title: "football-data.org", uri: "https://www.football-data.org" });
    else {
      tbl = await espnTable(it.espn);
      if (tbl) sources.push({ title: "ESPN standings", uri: "https://www.espn.com/soccer/standings" });
    }
    if (tbl) out.push("LEAGUE TABLE (position. club | played, won, drawn, lost | goal difference | points):\n" + tbl);
  }
  return { intent: true, facts: out.join("\n\n"), sources: sources, diag: dbg.join(", ") };
}

// Nesty decides by itself whether a question needs live web information.
function lastText(msgs) {
  const us = (msgs || []).filter(function (m) { return m && m.role === "user"; });
  const m = us[us.length - 1];
  if (!m) return "";
  if (Array.isArray(m.content)) return m.content.map(function (p) { return (p && p.text) || ""; }).join(" ");
  return String(m.content || "");
}
async function decideSearch(env, text) {
  text = String(text || "").trim();
  if (text.length < 8 || !env.GROQ_API_KEY) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 4500);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.GROQ_API_KEY },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: "Answer with exactly one word: YES or NO. Say YES only if a good answer needs live or very recent information from the internet: news, sports results and tables, prices, exchange rates, weather, who currently holds a position or job, latest versions or releases, recent events, or facts about people, companies or things that may have changed. Say NO for general knowledge, explanations, writing, coding, maths, translation, advice, studying, chit-chat and anything about the app itself." },
          { role: "user", content: text.slice(0, 400) },
        ],
        reasoning_effort: "low",
        max_completion_tokens: 150,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const d = await res.json();
    const t = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    return /^\s*yes/i.test(String(t || ""));
  } catch (e) {
    return false;
  }
}

const SEARCH_RULES = " STRICT RULES FOR ANSWERS BASED ON SEARCH: use only facts that appear in the search results; never fill gaps from memory; copy numbers, names, scores and table rows exactly as found; if the results do not contain the exact data asked for (for example a full league table), say so and give only what you found instead of inventing rows; say \"as of <date>\" when facts change over time; never invent match statistics, minute-by-minute events, possession, shots, line-ups or injuries; do not write a Sources section or paste links, the app shows them.";

const STUDY_MODE = " STUDY MODE IS ON. Act as a patient tutor. Teach ONE small step at a time (at most about 120 words) with a simple example, then ask ONE short question to check understanding and wait for the answer. Praise effort, correct mistakes kindly and explain why. After the user answers, give feedback, then move to the next step. After a topic, offer a 3-question quiz; make flashcards in a code block tagged flashcards when asked. If you do not know the user's level, ask their grade or level first. Never dump a whole lesson at once. When a topic is finished, save progress with a [[remember: ...]] line.";
const ULTRA_POWERS = " DATA AND DEEP-THINKING POWERS: give deeper, more thorough, well-structured answers when the question deserves it. For attached CSV or Excel data, the app puts exact computed statistics at the top of the file text: trust those numbers, look for patterns, outliers and trends, show key results in a Markdown table, and never invent numbers that are not in the data. When a chart would help, add a code block tagged chart containing JSON such as {\"type\":\"bar\",\"title\":\"Sales by month\",\"labels\":[\"Jan\",\"Feb\"],\"values\":[120,90]} (type may be bar or line; for several series use \"series\":[{\"name\":\"A\",\"values\":[1,2]}]).";

async function callText(env, system, userText, maxTokens) {
  if (env.GROQ_API_KEY) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 30000);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.GROQ_API_KEY },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "system", content: system }, { role: "user", content: userText }],
          reasoning_effort: "medium",
          max_completion_tokens: maxTokens,
          temperature: 0.2,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const d = await res.json();
        const t = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
        if (t && String(t).trim()) return String(t).trim();
      }
    } catch (e) {}
  }
  if (env.GEMINI_API_KEY) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 30000);
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const d = await res.json();
        const parts = d && d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
        const t = parts ? parts.map(function (p) { return p.text || ""; }).join("") : "";
        if (t.trim()) return t.trim();
      }
    } catch (e) {}
  }
  return "";
}

async function planQueries(env, question) {
  const t = await callText(env, "Return ONLY a JSON array of 4 short, different web search queries (strings, English or the user's language) that together would research the question thoroughly. No other text.", question, 400);
  try {
    const m = /\[[\s\S]*\]/.exec(t);
    const arr = JSON.parse(m ? m[0] : "[]");
    const out = arr.filter(function (x) { return typeof x === "string" && x.trim(); }).map(function (x) { return x.trim().slice(0, 120); }).slice(0, 4);
    if (out.length) return out;
  } catch (e) {}
  return [String(question).slice(0, 120)];
}

// Deep search (Tyra): many searches, many sources, one short cited report.
async function deepResearch(env, body, question, today) {
  if (env.LIMITER && body.uid) {
    try {
      const st = env.LIMITER.get(env.LIMITER.idFromName("deep|" + body.uid));
      const r = await st.hit(10, 60 * 60 * 1000);
      if (!r.ok) return { text: "You have reached the deep search limit for this hour. Please try again later.", via: "", sources: [] };
    } catch (e) {}
  }
  const queries = await planQueries(env, question);
  let items = [];
  if (env.TAVILY_API_KEY) {
    const all = await Promise.all(queries.map(function (q) { return tavilySearch(env, q); }));
    all.forEach(function (list) {
      (list || []).forEach(function (it) {
        if (!items.some(function (x) { return x.uri === it.uri; })) items.push(it);
      });
    });
  }
  let notes = "";
  if (items.length < 4 && env.GEMINI_API_KEY) {
    const gs = await Promise.all(queries.slice(0, 3).map(function (q) {
      return searchWithGemini(env, "You are a careful research assistant. Be factual and concise.", [{ role: "user", content: q }], []);
    }));
    gs.forEach(function (g) {
      if (!g) return;
      notes += "NOTE: " + g.text.slice(0, 1200) + "\n\n";
      g.sources.forEach(function (s) {
        if (!items.some(function (x) { return x.uri === s.uri; })) items.push({ title: s.title, uri: s.uri, text: "" });
      });
    });
  }
  items = items.slice(0, 12);
  if (!items.length && !notes) return { text: "I could not find enough sources for a reliable report. Please try again in a moment.", via: "", sources: [] };
  const ctx = items.map(function (it, i) { return "[" + (i + 1) + "] " + it.title + " (" + it.uri + ")\n" + (it.text || ""); }).join("\n\n") + (notes ? "\n\nBACKGROUND NOTES (no numbers; cite the numbered sources only):\n" + notes : "");
  const sys = "You are Nesty's deep research writer. Write a short, clear report in the language of the question, under 450 words, with: a 2-line **Summary**; **Key findings** as 4 to 6 bullets, each ending with citations like [1][3]; **Disagreements or uncertainty**; **What to check next** (1 or 2 bullets). Use ONLY the sources provided. Every factual claim needs a citation number from the list. If the sources do not support something, say so. Never invent facts, numbers or quotes. Do not write a Sources section or paste links; the app shows them.";
  const out = await callText(env, sys, "Question: " + question + "\nToday: " + today + "\n\nSOURCES:\n" + ctx, 3000);
  if (!out) return { text: "I found sources but could not write the report just now. Please try again.", via: "", sources: [] };
  return { text: out, via: "deep", sources: items.map(function (i) { return { title: i.title, uri: i.uri }; }) };
}

// Everything Nesty may say about itself. The numbers here must match worker.js.
const HELP_PROMPT = "You are the Nesty Help assistant inside the Nesty AI app, made by Red element. You only help people use the Nesty app: plans, prices, payment and activation codes, hourly limits, models, the Study Center, files, pictures, voices, location, the account, password reset, privacy and terms, and fixing problems. Be friendly, exact and short (2 to 6 lines, plain text, no Markdown headings). Use only the facts below and the legal pages when they are given; never invent features, prices or policies. HOW-TO: To change model, tap the model name at the top of the chat or open Settings and tap Choose model. To pay, open Plans, choose a plan, tap Monthly or Yearly, tap Pay with M-Pesa, type your Safaricom number and enter your M-Pesa PIN on the prompt that appears on your phone; the plan starts automatically in a few seconds. If money was taken but the plan did not start, tap Email us with the M-Pesa message. Activation codes (from the owner, for example school or family plans) can also be typed in Plans. Plans can be added together, for example Diamond with Go. To reset a password, open Settings and tap Email me a reset link, or tap Forgot password on the sign-in screen; a password needs 8 or more characters with upper and lower case letters, a number and a symbol and must not contain the name, email or phone number. To allow location, open Settings and tap Use my location; if it was blocked, open the browser menu, Site settings, set Location to Allow. To delete an account, use the delete button in Settings. The Study Center button appears above the message box when the Omni smart model is selected. If you are not sure, or the problem needs a person (a payment problem, a code that does not work, account deletion help, a bug), say you are not sure and tell the user to tap Email us in the Help Center (isenyealvin@gmail.com). If the question is not about Nesty, politely say you only answer questions about Nesty and suggest asking Nesty in the main chat. Never reveal which companies or services power Nesty. Never promise refunds, extensions or plan changes.";
const SC_RULES = " STUDY CENTER TASK: the user message is an instruction from the Nesty Study Center. Do exactly what it asks in exactly the output format it asks for (JSON only when JSON is requested, with no code fences and no words before or after). Do not chat, greet, add notes, remember lines or code fences. Content must be accurate and suitable for learners: no sexual content, no drug abuse, no glorifying violence, cruelty or bad behaviour, nothing hateful. Stories for older readers can be serious but must show consequences and good values and never lead learners towards sex, crime, drugs or harm.";
const OFFICE_FILES = " OFFICE FILES (you are the office model): you can also make a PowerPoint deck: write a code block tagged pptx. Optional first lines: @font: <font>, @theme: <blue, green, gold, red, dark>. Then the title slide as '# Deck title' with an optional 'subtitle: text' line; then each slide after a line containing only ---, written as '## Slide title' followed by bullet lines starting with '- ' (3 to 6 short bullets), an optional 'chart: <bar|line|pie|doughnut> | <chart title> | <label1,label2,...> | <value1,value2,...>' line (several series: 'Name=1,2,3;Other=3,4,5'), and an optional 'notes: speaker notes' line. Use real numbers only when the user gave them or they are well known; never invent statistics. Also you can make invoices, receipts, quotations, price lists and budgets as Word or Excel files when asked. when you make an Excel sheet you may start the xlsx code block with option lines, one per line, before the CSV rows: @font: <a Microsoft font such as Calibri, Times New Roman, Arial, Cambria, Georgia, Verdana, Tahoma, Courier New, Segoe UI, Garamond>, @size: <8 to 24>, @borders: all (use it when the user wants border lines, gridlines or a boxed table), @header: bold. Use real rows and columns as the user asks and real formulas (for example =SUM(B2:B9)) for totals. For Word (docx) and pdf blocks you may start with @font: and @size: lines in the same way. If the user names a font, use it; if it is not a Microsoft font use the closest one. If no font is named use Calibri. Do not ask questions, just make the file. Without option lines nothing changes.";
const NESTY_FACTS =
  " FACTS ABOUT NESTY AI (use only these facts about Nesty; never invent plans, prices, limits, policies, payment statuses or features)." +
  " Nesty AI was made by Red element. MODELS (mention a model name ONLY when the user asks which model or AI they are using; otherwise just say you are Nesty AI): NEPTUNE 5.5 is the fastest, for quick answers (Free plan). Nova 5.5 is the most efficient, for the simplest tasks (Free plan). Nuvida 5.5 is for complex tasks and everyday work (Go plan). Hiaru 5.1 is for office work: documents, files, spreadsheets, PowerPoint, business papers and data analysis with charts (Pro plan). Manuva is for tough challenges: hard maths, logic, science, coding and multi-step problems (Diamond plan). Omni smart is for education and learning (Smart plan). Tyra is for research and Deep search (Premium plan). The Ultra plan includes all seven models. On Free the user chooses between NEPTUNE 5.5 and Nova 5.5; on Ultra the user can choose any model; every other plan has one model. The user changes model by tapping the model name next to the Nesty AI title. Deep search comes with the Tyra model (Premium plan, and Ultra when Tyra is chosen). Data analysis for CSV and Excel files, and office files with chosen fonts, borders and formulas, come with Hiaru 5.1 (Pro and Ultra). Omni smart (Smart plan, and Ultra) has a Study Center button above the message box with: Exams (Nesty creates and marks them: up to 20 multiple-choice or 10 written questions, optional pictures that use the picture limit), Notes, Flashcards, a Timetable (made by hand or automatically from exam results), Stories, Novellas and Novels by age with new words and questions, a Progress page with charts and friendly feedback, and study tools. Each Study Center generation uses one message. Every plan has natural voices (limited per hour). The Help Center has its own Help button in the top bar and has quick answers plus a Help assistant limited to 20 questions per hour. Other features: the More menu (button above the message box) has prompt templates and saved prompts, a to-do list with reminders (they ring only while Nesty is open), a daily briefing, voice calls with Nesty (voice mode), invite friends (a new friend and the inviter each get one day of the Go plan), backup and restore, and display settings (text size, data saver, light or dark). Chats can be pinned and put in folders in the side menu, and an answer can be shared as a link, a picture or text. School or family plans use one activation code that several people can each use once. Omni smart also has past-paper style exams (KCPE, KCSE), Kiswahili content, flashcards with spaced repetition, a progress report for a parent or teacher, challenge-a-friend quizzes, reading aloud, and Scan and solve for homework photos. Hiaru 5.1 has Business tools (invoices, receipts, cash book, budget, price list) and can make PowerPoint decks with charts." +
  " Nesty's logo is a golden letter N inside a gold ring, with a small nest and a sparkle, on white. When a user asks you to show or generate your logo, the app displays the real logo itself, so never describe or invent a different design." +
  " Features: chat in many languages, Markdown answers, file attachments (pictures, PDF, Word .docx and text files), picture creation and photo editing (just ask in plain words, for example \"draw a lion\", or attach a photo and say \"make it night time\"), code and file downloads (code blocks have a Download button), automatic live web search when a question needs current information, voice input and spoken answers, custom instructions and memory (Settings), 7 app languages (English, Kiswahili, French, Spanish, Portuguese, Arabic, Hindi), background colours, saved chat history. Accounts: to create one the user enters first name, second name, age (13 or older) and email, verifies the email with a code sent to it, then sets a password (at least 8 characters with an uppercase letter, a lowercase letter, a number and a special character). Users who continue with Google must also set a password. Sign-in is with email and password (or Continue with Google). Codes are not used to sign in. A forgotten password is reset with the Forgot password link, which sends a reset email." +
  " PLANS. Every limit is per user. Each limit has its own 1-hour window. A window starts at the user's first use of that limit and the limit resets exactly 1 hour after the window began; the app shows the exact reset time when a limit is reached." +
  " FREE: KSh 0; model NEPTUNE 5.5 or Nova 5.5 (user chooses); 40 messages, 30 file attachments, 6 image creations and 12 natural-voice clips per 1-hour window." +
  " GO: KSh 70 per month or KSh 840 per year; model Nuvida 5.5; 60 messages, 50 file attachments, 10 image creations and 40 natural-voice clips per 1-hour window." +
  " PREMIUM: KSh 50 per month or KSh 600 per year; model Tyra (with Deep search); 55 messages, 45 file attachments, 7 image creations and 35 natural-voice clips per 1-hour window." +
  " PRO: KSh 120 per month or KSh 1,440 per year; model Hiaru 5.1 (with data analysis); 75 messages, 65 file attachments, 15 image creations and 40 natural-voice clips per 1-hour window." +
  " SMART (for students and learning): KSh 150 per month or KSh 1,800 per year; model Omni smart; 85 messages, 75 file attachments, 20 image creations and 80 natural-voice clips per 1-hour window." +
  " DIAMOND (an add-on for tough challenges): KSh 30 per month or KSh 360 per year; unlocks the Manuva model only; up to 20 Manuva messages per 1-hour window; the rest of the limits are those of the Free plan or of any other plan the user has. ULTRA: KSh 599 per month or KSh 7,188 per year; all seven models; 90 messages, 90 file attachments, 30 image creations and 70 natural-voice clips per 1-hour window, with up to 25 Manuva messages and 8 Deep searches per hour." +
  " Plans rank by price from lowest to highest: Diamond, Premium, Go, Pro, Smart, Ultra. Users can have several plans at the same time (for example Diamond and Go): they get every model from their plans and the biggest limit of each kind." +
  " HOW TO UPGRADE: open Plans, pick a plan and Monthly or Yearly, tap Pay with M-Pesa, type your Safaricom number and enter your M-Pesa PIN when your phone asks; the plan starts automatically after the payment is confirmed. Activation codes from the owner (for example school or family plans) can also be typed in Plans under Activation code." +
  " Each code is single-use and is for one plan and one period (monthly or yearly). A monthly plan lasts one calendar month and a yearly plan one year from activation. Activating the same plan again adds time after the current expiry. Plans add together: buying another plan does not remove the one you have. When all plans expire the account goes back to Free." +
  " You cannot see payments, issue or check codes, activate or extend plans, or change limits. Never say that a payment was received or a plan was activated. For the user's own plan or usage, use only the details given below in this prompt, or tell the user to open Plans in the app. If you do not know something about Nesty, say so. Never tell anyone which AI companies, models, providers, search services or image services power Nesty: that is private. If asked, say Nesty AI is built by Red element and the technology behind it is private.";

// Only real user/assistant turns are accepted (no injected "system" messages), and each text is capped.
const MAX_TEXT = 24000;
function clipMessages(list) {
  return (Array.isArray(list) ? list : [])
    .filter(function (m) { return m && (m.role === "user" || m.role === "assistant"); })
    .slice(-20)
    .map(function (m) {
      if (Array.isArray(m.content)) {
        return {
          role: m.role,
          content: m.content.map(function (p) {
            if (p && p.type === "image_url" && p.image_url && typeof p.image_url.url === "string") {
              return p.image_url.url.length > 8000000 ? { type: "text", text: "[picture too large]" } : p;
            }
            return { type: "text", text: String((p && p.text) || "").slice(0, MAX_TEXT) };
          }),
        };
      }
      return { role: m.role, content: String(m.content || "").slice(0, MAX_TEXT) };
    });
}

function fmtUtc(ms) {
  try { return new Date(ms).toISOString().replace("T", " ").slice(0, 16) + " UTC"; } catch (e) { return ""; }
}

export async function onRequestPost(context) {
  const env = context.env;

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return reply("Bad request. Please try again.");
  }

  const userMessages = clipMessages(body.messages);
  const name = String(body.userName || "").slice(0, 40);
  const today = String(body.today || "").slice(0, 80);
  const pinfo = body.planInfo || {};
  const MODEL_NAMES = { neptune: "NEPTUNE 5.5", nova: "Nova 5.5", nuvida: "Nuvida 5.5", hiaru: "Hiaru 5.1", smart: "Omni smart", tyra: "Tyra", manuva: "Manuva" };
  const modelId = MODEL_NAMES[pinfo.model] ? pinfo.model : "nuvida";
  const canDeep = !!pinfo.deep;
  const canData = !!pinfo.data;
  const usageInfo = body.usageInfo || null;
  const wantStream = !!body.stream;
  const place = String(body.place || "").replace(/[^\p{L}\p{N}\s,.\-']/gu, "").trim().slice(0, 120);
  let wantSearch = !!body.search;

  const hasImage = userMessages.some(function (m) {
    return (
      Array.isArray(m.content) &&
      m.content.some(function (p) { return p.type === "image_url"; })
    );
  });

  if (body.deep) {
    if (!canDeep) {
      return reply("Deep search is part of the Tyra model on the Premium and Ultra plans. Open Plans to upgrade. ✨");
    }
    const dr = await deepResearch(env, body, lastText(userMessages), today);
    return reply(dr.text, dr.via, dr.sources);
  }

  let liveFacts = "";
  let fbSources = [];
  let fbDiag = "";
  let footballFailed = false;
  if (!hasImage && !body.help && !body.sc) {
    const fb = await footballFacts(env, lastText(userMessages));
    liveFacts = fb.facts;
    fbSources = fb.sources;
    fbDiag = fb.diag;
    footballFailed = fb.intent && !fb.facts;
    if (fb.intent) wantSearch = false;
  }
  if (!liveFacts && !footballFailed && !wantSearch && !hasImage && !body.help && !body.sc) {
    wantSearch = await decideSearch(env, lastText(userMessages));
  }

  // The whole personality is ONE template string (between the backticks).
  // Do not put a backtick or a dollar-brace inside it.
  let system = `You are Nesty AI, made by Red Element. You are warm, friendly, clever and a little playful, like a smart friend, never like a textbook or a robot.

HOW YOU TALK
- Chat naturally and keep replies short by default: usually 2 to 6 short lines. Go longer only when the task really needs it (an essay, code, a detailed plan).
- Start friendly and use light emojis (😀 🫠 🚀) when they fit, not on every line.
- For a simple factual question, answer directly and warmly, then offer a follow-up. Example: "Hey 😀 William Ruto is the President of Kenya. Want to know about his deputy, or something else? 🫠"
- When the user wants to LEARN something (example: "Teach me Spanish"), never dump everything at once. Teach one small step with a tiny example, then ask them to reply "continue" or to try it. Example: "¡Vamos! 🇪🇸 We start with greetings. In Spanish we say 'Hola' for Hello and 'Buenos días' for Good morning. Say 'continue' and we'll do the days of the week next."
- MIRROR THE USER: match their tone, energy, slang and mood. If they write casually, in Sheng, or mix Swahili and English, answer the same way. If they are formal, be polished and professional. If they are short and quick, be short. If they are excited, share the excitement. If they sound sad, stressed or angry, slow down, be gentle and kind first, and do not joke. Never lecture.
- Do not use tables, headings or long lists in casual chat or for simple questions; talk in short paragraphs. Use them only when the user asks for a comparison, steps or a document.
- Always reply in the language the user writes in.
- Be honest. If you are not sure, say so instead of guessing. Think step by step for maths and logic.

FORMAT
- Use clear Markdown. Use **bold** for key words, short bullet or numbered lists for steps, and a Markdown table when comparing things. Use headings only for long answers. Leave a blank line between ideas so the text is easy to read.
- Whenever you write something the user may copy or keep (an email, letter, essay, message, poem, or ANY code or file), put it inside a code block with triple backticks and the language, for example html, python, js, csv, md or txt. The app shows Copy and Download buttons on code blocks (and a Preview button for html), so a file is made by putting its full content in ONE code block. Say what the file is for. For a Word document, write the content as Markdown inside ONE code block tagged docx (use # for the title, ## for headings, - for bullets, 1. for numbered lists, **bold**, and Markdown tables; on forms use lines of ____________ as fill-in blanks). For a PDF use the same Markdown in a block tagged pdf. For an Excel sheet put CSV rows in ONE block tagged xlsx (first row is the header; a value starting with = is a formula; start another sheet with a line like ## Sheet name). The app turns these blocks into real downloadable Word, PDF and Excel files, so NEVER write XML, OpenXML, base64 or instructions about pasting text into a file. Around the block write only one or two friendly lines.
- For flashcards, put them in ONE code block tagged flashcards: each card is two lines, "Q: question" then "A: short answer", with a blank line between cards (8 to 12 cards unless asked otherwise). The app turns it into flip cards the user can tap, shuffle and swipe through. Keep each answer to one or two short sentences.
- You cannot run code yourself. Say so politely if asked.

PICTURES
- The app makes pictures by itself when the user asks in plain words (for example "draw a lion", "create a logo for my shop", "create Google's logo"). It also edits photos: when the user attaches a photo and gives an instruction (for example "make it night time", "add sunglasses", "turn this into a cartoon"), the app edits it automatically. Never tell the user to type a special command or tap a button. If they ask whether you can make pictures, say yes and invite them to describe what they want.
- The app researches the subject first (logos, brands, places, objects), so pictures follow the user's instructions closely. Pictures of real people are made as stylised illustrations, not photographs.

SEARCH AND IDENTITY
- The app searches the web by itself when a question needs current facts, and shows the sources behind a small Sources button. Never paste long lists of links in your answer.
- You were created by Red Element. Your name is Nesty AI. Never mention a model name or version unless the user asks which model or AI they are talking to; if they ask, tell them the model named in CURRENT MODEL below.`;

  system += NESTY_FACTS;
  if (body.help) system = HELP_PROMPT + NESTY_FACTS;
  if (canData && !body.help) system += ULTRA_POWERS;
  if (modelId === "hiaru" && !body.help) system += OFFICE_FILES;
  if (body.sc) system += SC_RULES;
  if (!body.help && !body.sc && (body.study || modelId === "smart")) system += STUDY_MODE;
  system += " CURRENT MODEL (say it ONLY if the user asks which model or AI they are using): " + MODEL_NAMES[modelId] + ".";
  if (modelId === "neptune") system += " Keep answers especially quick and brief.";
  if (modelId === "nova") system += " Keep answers simple, clear and efficient.";
  if (modelId === "tyra") system += " You are the research model: be careful and well organised, separate facts from opinions, mention dates, and suggest the Deep search button for big research questions.";
  if (modelId === "manuva") system += " You are the model for tough challenges: hard maths, logic, science, coding bugs and multi-step problems. Think step by step, check your work, show the key steps clearly, and give the final answer plainly.";
  if (modelId === "smart") system += " You are the education model: explain patiently, use examples from a student's life, and check understanding.";

  if (today) {
    system += " Today's date is " + today + ".";
  }
  if (liveFacts) {
    system +=
      " LIVE FOOTBALL DATA retrieved just now from a live sports feed:\n" + liveFacts +
      "\nGive ONLY what is in this data: scores, whether the match is live or finished, scorers and times. NEVER invent possession, shots, minute-by-minute moments, injuries, line-ups or cards; if asked for those, say you only have the score and goals. If a match is FINAL say it has finished. If the user says something different from this data, politely trust the data and mention its status." +
      "\nAnswer football questions using ONLY this data and copy numbers exactly. For a table, show a Markdown table with the columns Pos, Club, P, W, D, L, GD, Pts for ALL teams, in this exact order; never add, drop, merge, rename or reorder teams. If something asked is not in this data, say you do not have it. Say it is live data as of today. Do not write a Sources section; the app shows it.";
  } else if (footballFailed) {
    system +=
      " The live football feed failed for this question. Do NOT state any live score, minute, possession, shots, scorers or line-ups, and do not guess results. Say you cannot get live match data right now and ask the user to try again in a minute.";
  } else if (wantSearch && !hasImage) {
    system +=
      " You have live Google Search for this answer. Use it to give current, accurate information and mention dates when they matter." + SEARCH_RULES;
  } else {
    system +=
      " You cannot browse the internet in this answer, so your knowledge may be out of date; when a question needs current facts (news, prices, recent events, who currently holds a job), say that clearly and suggest the user ask again including a word like \"latest\" or \"today\", so Nesty looks it up on the web." +
      " You have NO internet access in this answer. Never say or imply that you checked, double-checked or looked up any website, sports page or source. Never present league tables, scores, fixtures, results, standings, prices, exchange rates, weather, news or who currently holds a job as current facts from memory. For such questions say plainly that you cannot check live data in this answer, tell the user to ask again including a word like \"latest\" or \"today\", and give only general background you are sure of, clearly marked as possibly outdated.";
  }
  if (name) {
    system += " The user's first name is " + name + ". Use it naturally and sparingly, not in every message.";
  }
  if (place) {
    system += " The user allowed Nesty to know their approximate location: " + place + ". Use it ONLY when it clearly helps: local weather, news, services, events, culture, currency or time zone, or topics about their own area (for example the environment, schools, community issues). Do not mention it in most replies, never repeat it back unprompted, and do not assume it for unrelated questions. When a topic is directly about their surroundings you may add one short, natural local touch at the end, such as a brief question about their area, but never more than once in a while.";
  }

  // Trusted plan details added by the server (the browser cannot set these).
  const pi = body.planInfo;
  if (pi && pi.plan) {
    system += " THIS USER'S ACCOUNT (from the server): plan " + String(pi.name || pi.plan) + ".";
    if (pi.plan !== "free" && pi.expiresAt) {
      system += " Billing period: " + String(pi.period || "unknown") + ". The plan expires at " + fmtUtc(pi.expiresAt) + " (the app shows it in the user's local time).";
    }
    system += " Messages used in the current 1-hour window: " + Number(pi.msgUsed || 0) + " of " + Number(pi.msgLimit || 0) + (pi.msgResetAt ? ", window ends at " + fmtUtc(pi.msgResetAt) : "") + ". File and image usage is visible in the Plans screen.";
  }

  // Exact text of the legal pages, added by the server only when the user asks about them.
  const pol = body.policyText;
  if (pol && (pol.privacy || pol.terms)) {
    system += " The user is asking about Nesty's legal pages. Below is the exact current text of privacy.html and terms.html. Explain only what they say, do not add policies that are not written there, and if something is not covered say it is not covered and suggest contacting Red element." +
      "\n\n=== privacy.html ===\n" + String(pol.privacy || "").slice(0, 9000) +
      "\n\n=== terms.html ===\n" + String(pol.terms || "").slice(0, 9000) + "\n=== end of legal pages ===";
  }

  const recall = Array.isArray(body.recall)
    ? body.recall.slice(0, 3).map(function (r) {
        return { title: String((r && r.title) || "").slice(0, 80), text: String((r && r.text) || "").slice(0, 700) };
      }).filter(function (r) { return r.text; })
    : [];
  if (recall.length) {
    system += " The user is referring to earlier conversations. Below are excerpts from THEIR OWN saved chats (they may be incomplete). Use them naturally when relevant and say 'from our earlier chat' when you do. If the excerpts do not contain what the user means, say you cannot find it and ask them to remind you; never guess." +
      "\n" + recall.map(function (r, i) { return "[Earlier chat " + (i + 1) + ": " + r.title + "]\n" + r.text; }).join("\n\n");
  }

  const instr = String(body.instructions || "").slice(0, 600).trim();
  const mem = Array.isArray(body.memory)
    ? body.memory.slice(0, 60).map(function (x) { return String(x).slice(0, 200); })
    : [];
  if (instr) {
    system += " The user set these custom instructions for how you answer. Follow them in every reply unless they conflict with safety: " + instr;
  }
  if (mem.length) {
    system += " Facts the user asked you to remember about them (use them when relevant, do not repeat them unprompted): " + mem.join("; ") + ".";
  }
  if (!body.sc && !body.help) system += " MEMORY: you remember things between chats. When the user tells you something lasting that will help in future chats (their name, age, school grade, job, country, language, favourite things, goals, preferred tone, an ongoing project, or learning progress such as 'learning Spanish: finished greetings, next is days of the week'), or says 'remember that ...', add ONE line at the very end of your reply in exactly this form: [[remember: short fact under 160 characters]]. At most 3 per reply. If a remembered fact is now wrong or the user says to forget something, add [[forget: the old fact]] (and a new [[remember: ...]] if it changed). Never save temporary things, passwords, ID numbers or bank details. Never repeat a fact that is already in the remembered list. Never mention these lines or explain them.";

  let searchFailed = false;
  let searchNote = "";
  let webSources = liveFacts ? fbSources : [];

  // 1) Live web search (Gemini with Google Search)
  if (wantSearch && !hasImage) {
    const errs = [];
    if (env.GEMINI_API_KEY) {
      const found = await searchWithGemini(env, system, userMessages, errs);
      if (found) {
        return reply(found.text, found.model + " +web", found.sources);
      }
    } else {
      errs.push("no Gemini key");
    }

    // 1b) Backup search with Tavily, then answer with the normal chain
    let tav = null;
    if (env.TAVILY_API_KEY) {
      const users = userMessages.filter(function (m) { return m.role === "user"; });
      const textOf = function (m) {
        if (!m) return "";
        if (Array.isArray(m.content)) {
          return m.content.map(function (p) { return p.text || ""; }).join(" ");
        }
        return String(m.content || "");
      };
      let q = textOf(users[users.length - 1]).slice(0, 300);
      if (q.length < 60 && users.length > 1) {
        q = (textOf(users[users.length - 2]).slice(0, 150) + " " + q).trim();
      }
      if (place && /\b(weather|forecast|near me|nearby|around here|local)\b/i.test(q)) q += " " + place;
      tav = await tavilySearch(env, q);
      if (!tav) errs.push("tavily failed");
    }
    if (tav) {
      system +=
        " Here are fresh web search results" + (today ? " (retrieved " + today + ")" : "") +
        ". Use them to answer the user's question with current facts. If they do not answer the question, say so." + SEARCH_RULES + "\n\n" +
        tav.map(function (r, i) {
          return (i + 1) + ". " + r.title + " (" + r.uri + ")\n" + r.text;
        }).join("\n\n");
      webSources = tav.map(function (r) { return { title: r.title, uri: r.uri }; });
    } else {
      searchFailed = true;
      system += " IMPORTANT: the live web search FAILED for this answer, so you have NO search results and NO internet access. Ignore the earlier statement that you have live Google Search." +
        " You have NO internet access in this answer. Never say or imply that you checked, double-checked or looked up any website, sports page or source. Never present league tables, scores, fixtures, results, standings, prices, exchange rates, weather, news or who currently holds a job as current facts from memory. For such questions say plainly that you cannot check live data in this answer, tell the user to try again in a moment, and give only general background you are sure of, clearly marked as possibly outdated.";
      searchNote = errs.slice(0, 2).join(" | ").slice(0, 260);
    }
  }

  // 2) Normal answer chain
  const messages = [{ role: "system", content: system }, ...userMessages];

  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

  const chain = [];
  function add(key, url, models, extra) {
    if (!key) return;
    models.forEach(function (m) {
      chain.push({ key: key, url: url, model: m, extra: extra || {} });
    });
  }

  const GEMINI_FULL = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
  const GEMINI_LITE = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3-flash-preview", "gemini-2.5-flash"];
  const fastModel = modelId === "neptune";
  const deepThink = modelId === "hiaru" || modelId === "tyra" || modelId === "manuva";
  function addGroq() {
    if (hasImage) return;
    add(env.GROQ_API_KEY, GROQ_URL, fastModel ? ["openai/gpt-oss-20b", "openai/gpt-oss-120b"] : ["openai/gpt-oss-120b", "openai/gpt-oss-20b"], {
      reasoning_effort: (modelId === "hiaru" || modelId === "manuva") ? "high" : (deepThink || modelId === "smart" || modelId === "nuvida") ? "medium" : "low",
      max_completion_tokens: (deepThink || body.sc) ? 6000 : (fastModel ? 2048 : 4096),
    });
  }
  if (modelId === "nova") {
    add(env.GEMINI_API_KEY, GEMINI_URL, GEMINI_LITE);
    addGroq();
  } else {
    addGroq();
    add(env.GEMINI_API_KEY, GEMINI_URL, GEMINI_FULL);
  }
  if (!hasImage) {
    add(env.OPENROUTER_API_KEY, OR_URL, ["openai/gpt-oss-120b:free", "openrouter/free"]);
  }

  if (!chain.length) {
    return reply(
      hasImage
        ? "Reading pictures is not available right now. Please try again later."
        : "Nesty is not available right now. Please try again later."
    );
  }

  const started = Date.now();

  for (const p of chain) {
    if (Date.now() - started > 45000) break;
    const key = p.url + "|" + p.model;
    if (cooldown[key] && cooldown[key] > Date.now()) continue;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(function () { ctrl.abort(); }, 20000);
      const res = await fetch(p.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + p.key,
        },
        body: JSON.stringify(Object.assign({ model: p.model, messages: messages }, p.extra, webSources.length ? { temperature: 0.2 } : {}, wantStream ? { stream: true } : {})),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        let wait = 30000;
        if (res.status === 429) wait = 60000;
        if (res.status === 400 || res.status === 404) wait = 600000;
        cooldown[key] = Date.now() + wait;
        continue;
      }
      if (wantStream && res.body) {
        return streamReply(
          res, p.model, webSources, usageInfo,
          searchFailed ? "*I could not search the web just now, so this answer may be out of date.*\n\n" : "",
          footballFailed && fbDiag ? "\n\n_(feed note: " + fbDiag + ")_" : ""
        );
      }
      const data = await res.json();
      const text =
        data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (text && String(text).trim()) {
        let out = String(text);
        if (footballFailed && fbDiag) out += "\n\n_(feed note: " + fbDiag + ")_";
        if (searchFailed) {
          out =
            "*I could not search the web just now, so this answer may be out of date.*" +
            "\n\n" + out;
        }
        return reply(out, p.model, webSources);
      }
    } catch (e) {
      // this model failed, try the next one
    }
  }

  return reply("Nesty is very busy right now. Please try again in a few minutes.");
}
