// Models that failed recently are skipped for a while, so answers stay fast.
const cooldown = {};
const cooldownMsg = {};

// Nesty can add a hidden line like [[remember: The user's name is Amina]]. It is removed here
// and sent back as "remember" so the app can save it to the user's memory.
function reply(text, via, sources) {
  var facts = [];
  var clean = String(text || "")
    .replace(/\[\[\s*remember\s*:\s*([^\]]{3,200}?)\s*\]\]/gi, function (m, f) {
      facts.push(f.trim());
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean && facts.length) clean = "Got it.";
  return new Response(
    JSON.stringify({
      reply: clean || String(text || ""),
      via: via || "",
      sources: sources || [],
      remember: facts.slice(0, 3),
    }),
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
            generationConfig: { maxOutputTokens: 4096 },
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
      body: JSON.stringify({ query: query, search_depth: "basic", max_results: 5 }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data && data.results) || [];
    if (!results.length) return null;
    return results.slice(0, 5).map(function (r) {
      return { title: r.title || r.url, uri: r.url, text: String(r.content || "").slice(0, 600) };
    });
  } catch (e) {
    return null;
  }
}

// Everything Nesty may say about itself. The numbers here must match worker.js.
const NESTY_FACTS =
  " FACTS ABOUT NESTY AI (use only these facts about Nesty; never invent plans, prices, limits, policies, payment statuses or features)." +
  " Nesty AI was made by Red element." +
  " Nesty's logo is a blue and gold interlocking knot shaped like an X on a cream background. When a user asks you to show or generate your logo, the app displays the real logo itself, so never describe or invent a different design." +
  " Features: chat in many languages, Markdown answers, file attachments (pictures, PDF, Word .docx and text files), picture creation (type a request starting with \"draw\" or \"create an image of\", or tap the \"Make an image\" button), optional live web search, voice input and spoken answers, custom instructions and memory (Settings), 7 app languages (English, Kiswahili, French, Spanish, Portuguese, Arabic, Hindi), background colours, saved chat history. Accounts: to create one the user enters first name, second name, age (13 or older) and email, verifies the email with a code sent to it, then sets a password (at least 8 characters with an uppercase letter, a lowercase letter, a number and a special character). Users who continue with Google must also set a password. Sign-in is with email and password (or Continue with Google). Codes are not used to sign in. A forgotten password is reset with the Forgot password link, which sends a reset email." +
  " PLANS. Every limit is per user. Each limit has its own 5-hour window. A window starts at the user's first use of that limit and the limit resets exactly 5 hours after the window began; the app shows the exact reset time when a limit is reached." +
  " FREE: 40 messages, 30 file attachments and 6 image creations per 5-hour window." +
  " PREMIUM: KSh 50 per month or KSh 600 per year; 60 messages, 50 file attachments and 6 image creations per 5-hour window." +
  " ULTRA: KSh 100 per month or KSh 36,000 per year; 80 messages, 70 file attachments and 20 image creations per 5-hour window." +
  " HOW TO UPGRADE: pay the plan price directly to the phone number 0701244268; send the payment confirmation and your Nesty email to the administrator (the Plans screen has a button that opens an email); the administrator checks the payment by hand and sends a unique activation code; enter the code in Plans under Activation code; the server checks the code and activates the plan automatically. There is no automatic card or M-Pesa checkout in the app." +
  " Each code is single-use and is for one plan and one period (monthly or yearly). A monthly plan lasts one calendar month and a yearly plan one year from activation. Activating the same plan again adds time after the current expiry. Activating a higher plan replaces the current plan. A lower-plan code cannot be used while a higher plan is active. When a plan expires the account goes back to Free." +
  " You cannot see payments, issue or check codes, activate or extend plans, or change limits. Never say that a payment was received or a plan was activated. For the user's own plan or usage, use only the details given below in this prompt, or tell the user to open Plans in the app. If you do not know something about Nesty, say so.";

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
    "You are Nesty AI(version 11 model: REV11 which means red element version 11, we can change you to REV12 when we update the app next), a warm, friendly, smart and capable general-purpose AI assistant, similar to ChatGPT, Claude or Gemini. You were created by Red element. Help with anything the user asks: questions, explanations, writing, coding, maths, studying, planning, advice, translation, brainstorming, and analysing files and pictures they attach. Talk naturally, like a kind and clever friend. Give clear, accurate and honest answers; be thorough when the task needs it and short when it does not. Think step by step for maths and logic. If you are not sure, say so instead of guessing. Always reply in the same language the user writes in. Format answers with Markdown: use a Markdown table whenever you compare items or list data with several columns, bullet or numbered lists for steps and groups, **bold** for key words, and headings only for long answers. Whenever the user asks you to write something they may want to copy, such as an email, letter, essay, message, poem, or any code, put that text inside a code block using triple backticks so it gets a Copy button. You can edit existing pictures: when the user uploads a photo and gives an instruction (for example "make it night time", "add sunglasses", "turn this into a cartoon"), the app will edit it automatically — you do not need to tell them to start with "draw" or "create". You cannot run code, or remember things between separate chats except through the memory feature; say so politely if asked. Nesty has a built-in picture maker for NEW pictures: when the user wants a brand new picture (not editing an existing one), tell them to type a request that starts with "draw" or "create an image of", or to tap the "Make an image" button.";

  system += NESTY_FACTS;

  if (today) {
    system += " Today's date is " + today + ".";
  }
  if (wantSearch && !hasImage) {
    system +=
      " You have live Google Search for this answer. Use it to give current, accurate information and mention dates when they matter.";
  } else {
    system +=
      " You cannot browse the internet in this answer, so your knowledge may be out of date; when a question needs current facts (news, prices, recent events, who currently holds a job), say that clearly and suggest the user turn on Web search." +
      " You have NO internet access in this answer. Never say or imply that you checked, double-checked or looked up any website, sports page or source. Never present league tables, scores, fixtures, results, standings, prices, exchange rates, weather, news or who currently holds a job as current facts from memory. For such questions say plainly that you cannot check live data in this answer, tell the user to set Web search to On, and give only general background you are sure of, clearly marked as possibly outdated.";
  }
  if (name) {
    system += " The user's first name is " + name + ". Use it naturally and sparingly, not in every message.";
  }

  // Trusted plan details added by the server (the browser cannot set these).
  const pi = body.planInfo;
  if (pi && pi.plan) {
    system += " THIS USER'S ACCOUNT (from the server): plan " + String(pi.name || pi.plan) + ".";
    if (pi.plan !== "free" && pi.expiresAt) {
      system += " Billing period: " + String(pi.period || "unknown") + ". The plan expires at " + fmtUtc(pi.expiresAt) + " (the app shows it in the user's local time).";
    }
    system += " Messages used in the current 5-hour window: " + Number(pi.msgUsed || 0) + " of " + Number(pi.msgLimit || 0) + (pi.msgResetAt ? ", window ends at " + fmtUtc(pi.msgResetAt) : "") + ". File and image usage is visible in the Plans screen.";
  }

  // Exact text of the legal pages, added by the server only when the user asks about them.
  const pol = body.policyText;
  if (pol && (pol.privacy || pol.terms)) {
    system += " The user is asking about Nesty's legal pages. Below is the exact current text of privacy.html and terms.html. Explain only what they say, do not add policies that are not written there, and if something is not covered say it is not covered and suggest contacting Red element." +
      "\n\n=== privacy.html ===\n" + String(pol.privacy || "").slice(0, 9000) +
      "\n\n=== terms.html ===\n" + String(pol.terms || "").slice(0, 9000) + "\n=== end of legal pages ===";
  }

  const instr = String(body.instructions || "").slice(0, 600).trim();
  const mem = Array.isArray(body.memory)
    ? body.memory.slice(0, 30).map(function (x) { return String(x).slice(0, 200); })
    : [];
  if (instr) {
    system += " The user set these custom instructions for how you answer. Follow them in every reply unless they conflict with safety: " + instr;
  }
  if (mem.length) {
    system += " Facts the user asked you to remember about them (use them when relevant, do not repeat them unprompted): " + mem.join("; ") + ".";
  }
  system += " When the user tells you a lasting fact about themselves that will help in future chats (their name, age, school grade, job, country, language, favourite things, goals), or says 'remember that ...', add one last line at the very end of your reply in exactly this form: [[remember: short fact, for example The user's name is Amina]]. Never do this for temporary things, passwords, ID numbers or bank details. Never repeat a fact that is already in the remembered list. Never mention this line or explain it.";

  let searchFailed = false;
  let searchNote = "";
  let webSources = [];

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
      if (q.length < 25 && users.length > 1) {
        q = (textOf(users[users.length - 2]).slice(0, 150) + " " + q).trim();
      }
      tav = await tavilySearch(env, q);
      if (!tav) errs.push("tavily failed");
    }
    if (tav) {
      system +=
        " Here are fresh web search results" + (today ? " (retrieved " + today + ")" : "") +
        ". Use them to answer the user's question with current facts, and mention the source names. If they do not answer the question, say so.\n\n" +
        tav.map(function (r, i) {
          return (i + 1) + ". " + r.title + " (" + r.uri + ")\n" + r.text;
        }).join("\n\n");
      webSources = tav.map(function (r) { return { title: r.title, uri: r.uri }; });
    } else {
      searchFailed = true;
      system += " IMPORTANT: the live web search FAILED for this answer, so you have NO search results and NO internet access. Ignore the earlier statement that you have live Google Search." +
        " You have NO internet access in this answer. Never say or imply that you checked, double-checked or looked up any website, sports page or source. Never present league tables, scores, fixtures, results, standings, prices, exchange rates, weather, news or who currently holds a job as current facts from memory. For such questions say plainly that you cannot check live data in this answer, tell the user to set Web search to On, and give only general background you are sure of, clearly marked as possibly outdated.";
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
            "*I could not search the web just now, so this answer may be out of date.*" +
            (searchNote ? "\n\n`" + searchNote + "`" : "") +
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
