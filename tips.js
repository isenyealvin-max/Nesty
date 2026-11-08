/* Nesty tips and greetings.
   Tips only show features the person has NOT used yet. When every tip has been shown they start again, but only for things still not tried.
   Greetings change with the time of day. */
(function () {
  "use strict";
  if (window.nestyTipsLoaded) return;
  window.nestyTipsLoaded = true;

  function used(k) { try { return localStorage.getItem("nestyUsed_" + k) === "1"; } catch (e) { return false; } }
  function mark(k) { try { markUsed(k); } catch (e) {} }

  /* ---------- notice when a feature is really used (wrap the functions people tap) ---------- */
  var WATCH = [
    ["openStudyCenter", "sc"], ["goStudy", "sc"], ["openHelp", "help"], ["startVoiceMode", "voice"], ["toggleSpeak", "speak"],
    ["shareMsg", "share"], ["reportWrong", "report"], ["goBiz", "biz"], ["openFeedback", "feedback"], ["pickModel", "model"], ["openPlans", "plans"],
    ["toggleDeep", "deep"], ["cycleWeb", "web"], ["openSettings", "settings"], ["newChat", "newchat"], ["goStudyTab", "sc"]
  ];
  function wrap(name, key) {
    var f = window[name];
    if (typeof f !== "function" || f.__tw) return;
    var g = function () { mark(key); return f.apply(this, arguments); };
    g.__tw = 1;
    if (f.__stub) g.__stub = true;
    try { window[name] = g; } catch (e) {}
  }
  WATCH.forEach(function (w) { wrap(w[0], w[1]); });
  window.addEventListener("load", function () { setTimeout(function () { WATCH.forEach(function (w) { wrap(w[0], w[1]); }); }, 1500); });
  var _hub = window.openHub;
  function wrapHub() {
    if (typeof window.openHub !== "function" || window.openHub.__tw) return;
    var f = window.openHub;
    var g = function (v) { mark("hub"); mark("hub_" + (v || "menu")); return f.apply(this, arguments); };
    g.__tw = 1; window.openHub = g;
  }
  wrapHub();
  window.addEventListener("load", function () { setTimeout(wrapHub, 1500); });

  /* ---------- the tips ---------- */
  var PROMPT = function (t) { return function () { prefill(t); }; };
  var HUB = function (v) { return function () { if (window.openHub) openHub(v); }; };
  var T = [
    { id: "img", used: "img", cta: "Make an image", txt: "🎨 {name}, have you tried image creation? Ask Nesty to draw anything and watch it appear!", go: PROMPT("Draw a ") },
    { id: "voice", used: "voice", cta: "Try voice mode", txt: "🎙️ Try voice mode, {name}: just talk and Nesty answers out loud, like a phone call.", go: function () { startVoiceMode(); } },
    { id: "speak", used: "speak", cta: "Hear answers", txt: "🔊 Turn on the speaker at the top and Nesty reads every answer to you.", go: function () { toggleSpeak(); } },
    { id: "file", used: "file", cta: "Attach a file", txt: "📎 Did you know you can attach a PDF, Word file or photo and ask questions about it?", go: PROMPT("Summarise the file I attach in 5 points") },
    { id: "help", used: "help", cta: "Open Help", txt: "💬 Stuck? The Help button above the message box has quick answers and a Help assistant.", go: function () { openHelp(); } },
    { id: "hub", used: "hub", cta: "Open More", txt: "✨ The More button hides handy tools: templates, to-do list, daily briefing, backup and more.", go: HUB("menu") },
    { id: "tpl", used: "hub_templates", cta: "See templates", txt: "📝 Tired of typing? Use ready templates for a CV, cover letter, business plan, essay and more.", go: HUB("templates") },
    { id: "todo", used: "hub_todo", cta: "Add a task", txt: "✅ Add a task with a reminder in More. Nesty will ring while the app is open.", go: HUB("todo") },
    { id: "brief", used: "brief", cta: "Get my briefing", txt: "☀️ Good day {name}! Get your daily briefing: date, weather for your area, news and a tip.", go: function () { markUsed("brief"); prefill("Give me my daily briefing: today's date, the weather for my area, 3 top news headlines (Kenya and the world), one useful tip and one short encouraging line. Keep it short.", true); } },
    { id: "invite", used: "hub_invite", cta: "Invite friends", txt: "🎁 Invite a friend: when they join, you both get a free day of the Go plan!", go: HUB("invite") },
    { id: "backup", used: "hub_backup", cta: "Back up", txt: "☁️ Save a backup of your notes and tools so you never lose them on a new phone.", go: HUB("backup") },
    { id: "display", used: "hub_display", cta: "Display", txt: "🌗 You can change the text size, switch dark mode and save data in More, then Display.", go: HUB("display") },
    { id: "share", used: "share", cta: "How to share", txt: "⤴ Love an answer? Tap Share under it to send it as a link, a picture or text.", go: PROMPT("Tell me one interesting fact about Kenya") },
    { id: "report", used: "report", cta: "Got it", txt: "⚠ Found a wrong answer? Tap the warning sign under it so we can fix Nesty.", go: function () {} },
    { id: "model", used: "model", multi: true, cta: "Change model", txt: "⇄ You can switch models! Tap the model name at the top to choose the one that fits your task.", go: function () { openModelMenu(); } },
    { id: "plans", used: "plans", plan: ["free"], cta: "See plans", txt: "⭐ Want more messages, pictures and models? Open Plans. You can even pay by M-Pesa right in the app.", go: function () { openPlans(); } },
    { id: "diamond", used: "diamond", plan: ["free", "go", "premium", "pro", "learnover"], cta: "See Diamond", txt: "💎 Hard maths or a tough coding problem? Diamond unlocks Manuva for just KSh 30 a month.", go: function () { markUsed("diamond"); openPlans("diamond"); } },
    { id: "deep", used: "deep", only: ["premium", "ultra"], cta: "Try Deep search", txt: "🔎 Big research question? Switch on Deep search and Nesty reads many sources for one cited report.", go: PROMPT("Do deep research on: ") },
    { id: "sc", used: "sc", only: ["learnover", "ultra"], cta: "Open Study Center", txt: "🎓 Studying, {name}? Open Study Center: exams that mark themselves, notes, flashcards and a timetable.", go: function () { goStudy(); } },
    { id: "exam", used: "sc_exam", only: ["learnover", "ultra"], cta: "Make an exam", txt: "📝 Ready for a test? Make a practice exam, get marked at once and see where to improve.", go: function () { goStudy(); } },
    { id: "kcse", used: "sc_past", only: ["learnover", "ultra"], cta: "Past-paper style", txt: "📜 Practise KCPE, KPSEA and KCSE style questions in Study Center.", go: function () { goStudy(); } },
    { id: "srs", used: "sc_srs", only: ["learnover", "ultra"], cta: "Flashcards", txt: "🧠 Flashcards that come back at the right time help you remember for good.", go: function () { goStudy(); } },
    { id: "stories", used: "sc_story", only: ["learnover", "ultra"], cta: "Read a story", txt: "📖 Story time! Ask Study Center for a story, novella or novel that fits your age, with new words to learn.", go: function () { goStudy(); } },
    { id: "scan", used: "sc_scan", only: ["learnover", "ultra"], cta: "Scan homework", txt: "📷 Stuck on homework? Take a photo in Study Center and get the answer explained step by step.", go: function () { goStudy(); } },
    { id: "swahili", used: "sc_swa", only: ["learnover", "ultra"], cta: "Kiswahili", txt: "🇰🇪 Study Center can make exams and notes in Kiswahili too.", go: function () { goStudy(); } },
    { id: "timetable", used: "sc_tt", only: ["learnover", "ultra"], cta: "Build a timetable", txt: "🗓️ Let Nesty build your study timetable from how you perform in exams.", go: function () { goStudy(); } },
    { id: "student", used: "plans2", plan: ["free", "go", "premium", "pro"], cta: "See Smart", txt: "🎓 Are you a student? The Smart plan has the Study Center with exams, notes and flashcards.", go: function () { markUsed("plans2"); openPlans("learnover"); } },
    { id: "biz", used: "biz", only: ["pro", "ultra"], cta: "Business tools", txt: "💼 Make invoices, receipts, a cash book and a budget in Business tools. Free of messages!", go: function () { goBiz(); } },
    { id: "ppt", used: "ppt", only: ["pro", "ultra"], cta: "Make slides", txt: "📊 Ask for a PowerPoint with charts, and download it ready to present.", go: PROMPT("Make a 6-slide PowerPoint on ... with a chart, theme gold.") },
    { id: "xlsx", used: "xlsx", only: ["pro", "ultra"], cta: "Excel table", txt: "📗 Ask for an Excel table with borders and your favourite Microsoft font, with totals worked out.", go: PROMPT("Make an Excel table for ... with borders, in Calibri, with totals.") },
    { id: "manuva", used: "manuva", only: ["diamond", "ultra"], cta: "Ask Manuva", txt: "💎 Manuva loves hard problems. Give it your toughest maths, logic or code question.", go: PROMPT("Solve step by step: ") },
    { id: "loc", used: "loc", cta: "Allow location", txt: "📍 Allow your location in Settings and Nesty can tell the weather and places for your exact area.", go: function () { openSettings(); } },
    { id: "web", used: "web", cta: "Ask the news", txt: "🌍 Nesty looks up live information by itself. Try: what is the weather like where I am?", go: PROMPT("What is the weather like where I am today?") },
    { id: "memory", used: "memory", cta: "Settings", txt: "🧩 Tell Nesty about you in Settings (custom instructions) and it answers the way you like.", go: function () { openSettings(); } }
  ];
  function planIds() {
    var a = (typeof me !== "undefined" && me && me.active) ? me.active.map(function (x) { return x.plan; }) : [];
    var base = a.filter(function (x) { return x !== "diamond"; });
    var ids = a.slice(); if (!base.length) ids.push("free");
    if (ids.indexOf("gold") > -1 || ids.indexOf("platinum") > -1 || ids.indexOf("max") > -1) ids.push("ultra");
    return ids;
  }
  function ok(t) {
    if (t.used && used(t.used)) return false;
    var ids = planIds();
    if (t.only && !t.only.some(function (x) { return ids.indexOf(x) > -1; })) return false;
    if (t.plan && !t.plan.some(function (x) { return ids.indexOf(x) > -1; })) return false;
    if (t.multi) { try { if (allowedModels().length < 2) return false; } catch (e) { return false; } }
    return true;
  }
  /* other signs a feature was used */
  function extraUsed() {
    WATCH.forEach(function (w) { wrap(w[0], w[1]); });
    try {
      if (localStorage.getItem("nestyModelSeen") === "1") mark("model");
      var uid = (user && user.$id) || "guest";
      var sc = localStorage.getItem("nestySC_" + uid);
      if (sc) { var s = JSON.parse(sc); if (s.exams && s.exams.length) mark("sc_exam"); if (s.stories && s.stories.length) mark("sc_story"); if (s.tt && s.tt.rows) mark("sc_tt"); if (s.decks && s.decks.length) mark("sc_srs"); }
      if ((localStorage.getItem("nestyPlace") || "") || (me && me.hasPlace)) mark("loc");
      if (user && user.prefs && (user.prefs.custom || user.prefs.instructions || (user.prefs.memory && user.prefs.memory.length))) mark("memory");
    } catch (e) {}
  }
  /* one pop-up at a time: no tip while a banner or a full-screen panel is showing */
  var _tb = tipBusy;
  window.tipBusy = tipBusy = function () {
    if (_tb()) return true;
    var ids = ["xBar", "xOff", "hc", "xh", "bz", "sc", "xs"];
    for (var i = 0; i < ids.length; i++) { var d = document.getElementById(ids[i]); if (d && d.style.display && d.style.display !== "none") return true; }
    return false;
  };
  window.tipNext = tipNext = function () {
    extraUsed();
    var seen = {};
    try { seen = JSON.parse(lsGet("nestyTipSeen2", "{}")); } catch (e) {}
    var list = T.filter(ok);
    if (!list.length) return null;
    // least shown first; ties keep the order above. Tips restart on their own when all were shown.
    var best = null;
    list.forEach(function (t) { var n = seen[t.id] || 0; if (!best || n < best.n) best = { t: t, n: n }; });
    seen[best.t.id] = best.n + 1;
    lsSet("nestyTipSeen2", JSON.stringify(seen));
    return best.t;
  };
  window.tipTick = tipTick = function () {
    if (tipCur || tipBusy()) return;
    var now = Date.now();
    if (now - tipOpenedAt < 60000) return;                                   // about one minute after opening
    if (now < (parseInt(lsGet("nestyTipSnooze", "0"), 10) || 0)) return;
    if (now - (parseInt(lsGet("nestyTipAt", "0"), 10) || 0) < 3 * 60 * 1000) return;
    if (tipSession >= 12) return;
    var t = tipNext();
    if (!t) return;
    tipCur = t; tipSession++;
    lsSet("nestyTipAt", now);
    $("tipTxt").textContent = t.txt.replace("{name}", firstName() || "friend");
    $("tipGo").textContent = t.cta;
    $("tip").classList.add("show");
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { tipClose(false); }, 30000);
  };
  window.tipClose = tipClose = function (byUser) {
    $("tip").classList.remove("show");
    clearTimeout(tipTimer);
    tipCur = null;
    if (byUser) {
      var d = (parseInt(lsGet("nestyTipDis", "0"), 10) || 0) + 1;
      if (d >= 4) { lsSet("nestyTipSnooze", Date.now() + 86400000); d = 0; }
      lsSet("nestyTipDis", d);
    }
  };
  function $(i) { return document.getElementById(i); }

  /* ---------- greetings that follow the time of day ---------- */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var G = {
    morning: [["Good morning, {n}! ☀️", "How can I help you today?"], ["Nice morning, right? 🌤️", "What's on your mind, {n}?"], ["Rise and shine, {n}!", "What shall we get done this morning?"], ["Hello {n}, hope you slept well.", "What can I help with?"], ["Morning, {n}! ☕", "Ready when you are. What do you need?"], ["A fresh new day, {n}!", "What would you like to start with?"], ["Good morning {n}, let's make today count.", "Ask me anything."], ["Jambo {n}, habari ya asubuhi? 🌅", "How can I help?"]],
    afternoon: [["Good afternoon, {n}! 🌞", "How can I help you?"], ["Hello {n}, how is your day going?", "What can I do for you?"], ["Hi {n}! Hope the day is treating you well.", "What are we working on?"], ["Good afternoon {n}.", "What's on your mind?"], ["Afternoon, {n}! ☕", "Need a hand with something?"], ["Hey {n}, halfway through the day!", "What can I help with?"], ["Habari ya mchana, {n}? 🌤️", "Ask me anything."]],
    evening: [["Good evening, {n}! 🌆", "How can I help you tonight?"], ["Hello {n}, how was your day?", "What can I help with?"], ["Evening, {n}! 🌇", "What's on your mind?"], ["Hi {n}, winding down?", "Tell me what you need."], ["Good evening {n}.", "Homework, work, or just chatting?"], ["Habari za jioni, {n}? 🌙", "How can I help?"]],
    night: [["Good night, {n}! 🌙", "Still up? How can I help?"], ["Hello {n}, burning the midnight oil?", "What can I help with?"], ["Late night, {n}? ✨", "Tell me what's on your mind."], ["Hi {n}, the stars are out.", "What do you need?"], ["Hello {n} 🌌", "Whatever it is, I'm here. Ask me anything."]],
    dawn: [["Up early, {n}? 🌄", "How can I help?"], ["Good early morning, {n}!", "What are we starting with?"], ["Early bird {n}! 🐦", "What's on your mind?"]]
  };
  var GN = { morning: ["Good morning!", "Nice morning, right? What's on your mind?", "Rise and shine! How can I help?", "Hello! Ready when you are."], afternoon: ["Good afternoon! How can I help?", "Hello! What are we working on?"], evening: ["Good evening! How can I help?", "Hello! What's on your mind tonight?"], night: ["Still up? How can I help?", "Late night? Tell me what's on your mind."], dawn: ["Up early? How can I help?", "Early bird! What's on your mind?"] };
  var SUG = {
    all: ["Help me write an email", "Explain something simply", "Make me a study plan", "Tell me a fun fact", "Tell me a joke", "Give me a motivational quote", "Help me write a CV", "Teach me something new", "Give me a quick recipe idea", "Help me plan my week", "Quiz me on general knowledge", "Suggest a business idea", "Translate something into Kiswahili", "Help me make a budget", "Write a short story", "Help me prepare for an interview"],
    morning: ["Plan my day", "Give me a motivational quote", "Give me my daily briefing", "Help me write an email", "Make me a study plan", "Tell me a fun fact"],
    afternoon: ["Help me finish my homework", "Explain something simply", "Help me write a report", "Tell me a fun fact", "Quiz me on general knowledge"],
    evening: ["Help me plan tomorrow", "Tell me a short story", "Help me relax", "Tell me a joke", "Teach me something new"],
    night: ["Tell me a bedtime story", "Tell me a fun fact", "Help me relax", "Tell me a joke"],
    dawn: ["Plan my day", "Give me a motivational quote", "Make me a study plan"]
  };
  function period() {
    var h = new Date().getHours();
    return h < 4 ? "night" : h < 6 ? "dawn" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  }
  var cache = null;
  window.nestyGreeting = function (name) {
    var bd = false; try { bd = !!(user && user.prefs && isBirthday(user.prefs.dob)); } catch (e) {}
    if (bd && name) return { title: "Happy birthday, " + esc(name) + "! 🎂🎉", sub: "Wishing you a wonderful day. How can I help?", sugs: ["Write a birthday message", "Plan a birthday party", "Give me a fun fact about my birthday", "Tell me a joke"] };
    var p = period();
    if (!cache || cache.p !== p || Date.now() - cache.t > 600000) {
      var pool = (SUG[p] || []).concat(SUG.all), picked = [];
      while (picked.length < 4 && pool.length) { var s = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; if (picked.indexOf(s) < 0) picked.push(s); }
      var g = name ? pick(G[p]) : null, gn = pick(GN[p]);
      cache = { p: p, t: Date.now(), g: g, gn: gn, sugs: picked };
    }
    if (name) return { title: cache.g[0].split("{n}").join(esc(name)), sub: cache.g[1].split("{n}").join(esc(name)), sugs: cache.sugs };
    return { title: cache.gn, sub: "Ask me anything.", sugs: cache.sugs };
  };
  function refresh() { try { if (document.getElementById("welcome") && typeof renderAll === "function") renderAll(); } catch (e) {} }
  refresh(); setTimeout(refresh, 400); window.addEventListener("load", function () { setTimeout(refresh, 300); });
  var _nc = window.newChat;
  if (typeof _nc === "function") window.newChat = newChat = function () { cache = null; return _nc.apply(this, arguments); };
})();
