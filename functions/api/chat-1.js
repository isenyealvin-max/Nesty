// Models that failed recently are skipped for a while, so answers stay fast.
const cooldown = {};

function reply(text, via, sources) {
  return new Response(
    JSON.stringify({ reply: text, via: via || "", sources: sources || [] }),
    { headers: { "Content-Type": "application/json" } }
  );
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

async function searchWithGemini(env, system, userMessages) {
  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];
  const started = Date.now();
  for (const model of models) {
    if (Date.now() - started > 40000) break;
    const key = "search|" + model;
    if (cooldown[key] && cooldown[key] > Date.now()) continue;
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
            generationConfig: { maxOutputTokens: 4096 },
          }),
          signal: ctrl.signal,
        }
      );
      clearTimeout(timer);
      if (!res.ok) {
        let wait = 30000;
        if (res.status === 429) wait = 120000;
        if (res.status === 400 || res.status === 404) wait = 600000;
        cooldown[key] = Date.now() + wait;
        continue;
      }
      const data = await res.json();
      const cand = data && data.candidates && data.candidates[0];
      const parts = cand && cand.content && cand.content.parts;
      const text = parts
        ? parts.map(function (p) { return p.text || ""; }).join("")
        : "";
      if (!text.trim()) continue;
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
      // try the next model
    }
  }
  return null;
}

export async function onRequestPost(context) {
  const env = context.env;

  let body;
  try {
    body = await context.request.json();
  } catch (e) {
    return reply("Bad request. Please try again.");
  }

  const userMessages = (body.messages || []).slice(-20);
  const name = String(body.userName || "").slice(0, 40);
  const today = String(body.today || "").slice(0, 80);
  const wantSearch = !!body.search;

  const hasImage = userMessages.some(function (m) {
    return (
      Array.isArray(m.content) &&
      m.content.some(function (p) { return p.type === "image_url"; })
    );
  });

  let system =
    "You are Nesty AI, a warm, friendly, smart and capable general-purpose AI assistant, similar to ChatGPT. Help with anything the user asks: questions, explanations, writing, coding, maths, studying, planning, advice, translation, brainstorming, and analysing files and pictures they attach. Talk naturally, like a kind and clever friend. Give clear, accurate and honest answers; be thorough when the task needs it and short when it does not. Think step by step for maths and logic. If you are not sure, say so instead of guessing. Always reply in the same language the user writes in. Format answers with Markdown: use a Markdown table whenever you compare items or list data with several columns, bullet or numbered lists for steps and groups, **bold** for key words, and headings only for long answers. Whenever the user asks you to write something they may want to copy, such as an email, letter, essay, message, poem, or any code, put that text inside a code block using triple backticks so it gets a Copy button. You cannot generate or edit images, run code, or remember things between separate chats; say so politely if asked, and offer a useful alternative such as describing the image in words.";

  if (today) {
    system += " Today's date is " + today + ".";
  }
  if (wantSearch && !hasImage) {
    system +=
      " You have live Google Search for this answer. Use it to give current, accurate information and mention dates when they matter.";
  } else {
    system +=
      " You cannot browse the internet in this answer, so your knowledge may be out of date; when a question needs current facts (news, prices, recent events, who currently holds a job), say that clearly and suggest the user turn on Web search.";
  }
  if (name) {
    system += " The user's first name is " + name + ". Use it naturally and sparingly, not in every message.";
  }

  let searchFailed = false;

  // 1) Live web search (Gemini with Google Search)
  if (wantSearch && !hasImage && env.GEMINI_API_KEY) {
    const found = await searchWithGemini(env, system, userMessages);
    if (found) {
      return reply(found.text, found.model + " +web", found.sources);
    }
    searchFailed = true;
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

  if (!hasImage) {
    add(env.GROQ_API_KEY, GROQ_URL, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"], {
      reasoning_effort: "low",
      max_completion_tokens: 4096,
    });
  }
  add(env.GEMINI_API_KEY, GEMINI_URL, [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3-flash-preview",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ]);
  if (!hasImage) {
    add(env.OPENROUTER_API_KEY, OR_URL, ["openai/gpt-oss-120b:free", "openrouter/free"]);
  }

  if (!chain.length) {
    return reply(
      hasImage
        ? "Reading pictures needs the Gemini key, which is not set up."
        : "Nesty is not set up yet: no AI keys were found."
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
        body: JSON.stringify(Object.assign({ model: p.model, messages: messages }, p.extra)),
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
      const data = await res.json();
      const text =
        data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (text && String(text).trim()) {
        let out = String(text);
        if (searchFailed) {
          out =
            "_I could not search the web just now, so this answer may be out of date._\n\n" + out;
        }
        return reply(out, p.model);
      }
    } catch (e) {
      // this model failed, try the next one
    }
  }

  return reply("Nesty is very busy right now. Please try again in a few minutes.");
}
