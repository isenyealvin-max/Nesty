// Models that failed recently are skipped for a while, so answers stay fast.
const cooldown = {};

function reply(text, via) {
  return new Response(JSON.stringify({ reply: text, via: via || "" }), {
    headers: { "Content-Type": "application/json" },
  });
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

  let system =
    "You are Nesty AI, a warm, friendly and helpful general-purpose AI assistant. Talk naturally, like a kind and smart friend. Give clear, accurate and honest answers. Keep answers short unless the user wants detail. If you are not sure about something, say so. You cannot browse the internet, so your knowledge may be out of date; say this when a question needs current information. Always reply in the same language the user writes in. Format answers with Markdown: use a Markdown table whenever you compare items or list data with several columns, use bullet or numbered lists for steps and groups, use **bold** for key words, and use headings only for long answers. Whenever the user asks you to write something they may want to copy, such as an email, letter, essay, message, poem, or any code, put that text inside a code block using triple backticks so it gets a Copy button. You cannot generate images. If the user asks for a picture, say politely that you cannot make images yet and offer to describe one in words instead.";

  if (name) {
    system += " The user's first name is " + name + ". Use it naturally and sparingly, not in every message.";
  }

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

  add(env.GROQ_API_KEY, GROQ_URL, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"], {
    reasoning_effort: "low",
    max_completion_tokens: 4096,
  });
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
  add(env.OPENROUTER_API_KEY, OR_URL, ["openai/gpt-oss-120b:free", "openrouter/free"]);

  if (!chain.length) {
    return reply("Nesty is not set up yet: no AI keys were found.");
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
        return reply(String(text), p.model);
      }
    } catch (e) {
      // this model failed, try the next one
    }
  }

  return reply("Nesty is very busy right now. Please try again in a few minutes.");
}
