/* Nesty extras: More menu (templates, to-do and reminders, briefing, voice call, invites, backup, display),
   pinned chats and folders, sharing, announcement and plan reminders, offline help. */
(function () {
  "use strict";
  /* learner-safe mode: on for under-18 accounts, or when a parent turns it on in Study Center */
  window.nestySafe = function () {
    try { var a = user && user.prefs && (calcAge(user.prefs.dob) || parseInt(user.prefs.age, 10)); return (a > 0 && a < 18) || localStorage.getItem("nestySafe") === "1"; } catch (e) { return false; }
  };
  if (window.openHub) return;

  function $(i) { return document.getElementById(i); }
  function E(s) { return esc(String(s == null ? "" : s)); }
  function uid() { try { return (user && user.$id) || "guest"; } catch (e) { return "guest"; } }
  function lj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function sj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast("Your phone storage is full."); return false; } }
  function nid() { return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  /* ---------- look ---------- */
  var CSS = "" +
    "#xh{display:none;position:fixed;inset:0;z-index:88;flex-direction:column;background:#fff8e1;color:#2a2200}#xh *{box-sizing:border-box}" +
    "#xh .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#ffc933;box-shadow:0 2px 10px rgba(120,80,0,.18)}#xh .top b{flex:1;font-size:18px}" +
    "#xh .ib{background:#fff;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#2a2200;box-shadow:0 1px 4px rgba(0,0,0,.2)}" +
    "#xhBody{flex:1;overflow-y:auto;padding:14px 14px 60px;max-width:700px;width:100%;margin:0 auto}" +
    "#xh h3{margin:14px 0 6px;font-size:16px}#xh .m{color:#6b5a1a;font-size:13.5px;line-height:1.45}" +
    "#xh .card{background:#fff;border:1.5px solid #ffd566;border-radius:16px;padding:13px;margin:10px 0}" +
    "#xh input,#xh textarea,#xh select{width:100%;font:inherit;font-size:15px;padding:10px 11px;border:1.5px solid #9fd4f1;border-radius:11px;background:#fff;color:#2a2200;margin-top:6px}" +
    "#xh input:focus,#xh textarea:focus{outline:0;border-color:#ffb800;box-shadow:0 0 0 3px #ffe9a3}" +
    "#xh .b{display:inline-block;background:#ffc933;color:#2a2200;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit}" +
    "#xh .b.s{padding:6px 11px;font-size:13px;margin:6px 6px 0 0}#xh .b.blue{background:#4fb3ea;color:#06304f}#xh .b.ghost{background:#fff;border:1.5px solid #4fb3ea;color:#0b6aa8}" +
    "#xh .menu{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    "#xh .tile{background:#ffe9a8;border:1.5px solid #ffd566;border-radius:16px;padding:14px 8px;text-align:center;font-weight:700;color:#2a2200;font-family:inherit;font-size:14px}#xh .tile i{display:block;font-style:normal;font-size:27px;margin-bottom:3px}#xh .tile:nth-child(4n+2),#xh .tile:nth-child(4n+3){background:#d6efff;border-color:#9fd4f1}" +
    "#xh .li{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #fdecb5}#xh .li:last-child{border:0}#xh .li .t{flex:1;min-width:0;line-height:1.35}" +
    "#xh .chip{display:inline-block;background:#ffe9a8;border:1.5px solid #ffd566;border-radius:20px;padding:6px 11px;margin:5px 6px 0 0;font-size:13px;font-family:inherit;font-weight:600;color:#2a2200}" +
    "#xBar{display:none;position:fixed;top:0;left:0;right:0;z-index:89;background:#ffc933;color:#2a2200;padding:9px 12px;font-size:14px;align-items:center;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,.25)}#xBar span{flex:1;line-height:1.35}" +
    "#xBar button{background:#fff;border:0;border-radius:9px;padding:7px 11px;font-weight:700;font-family:inherit;color:#2a2200}#xBar .x{background:none;font-size:20px;padding:0 6px}" +
    "#xOff{display:none;position:fixed;bottom:0;left:0;right:0;z-index:87;background:#2a2200;color:#ffe9a8;text-align:center;font-size:13px;padding:6px}" +
    "#xShare{display:none;position:fixed;inset:0;z-index:92;background:rgba(0,0,0,.45);align-items:flex-end;justify-content:center}#xShare .box{background:#fff8e1;color:#2a2200;width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:16px;border-top:4px solid #ffc933}" +
    "#xFilt{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#xFilt button{background:var(--soft);border:1px solid var(--border);border-radius:16px;padding:4px 10px;font-size:12.5px;color:var(--text);font-family:inherit}#xFilt button.on{background:#ffc933;color:#2a2200;border-color:#ffc933;font-weight:700}" +
    "#modeRow .xb{background:#fff3c4!important;color:#2a2200!important;border:1px solid #ffd566!important;font-weight:700}" +
    "#bzBtn{background:#ffc933!important;color:#2a2200!important;border:0!important;font-weight:800}" +
    "#ofBtn{background:#0f4c81!important;color:#fff!important;border:0!important;font-weight:800}#rcBtn{background:#7a1f4d!important;color:#fff!important;border:0!important;font-weight:800}";
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  var tsStyle = document.createElement("style"); tsStyle.textContent = ".msg{font-size:calc(15.5px*var(--ts,1))!important}#box{font-size:calc(16px*var(--ts,1))}"; document.head.appendChild(tsStyle);
  function applyTs() { var v = parseFloat(localStorage.getItem("nestyTs") || "1") || 1; document.documentElement.style.setProperty("--ts", String(v)); }
  try { applyTs(); } catch (e) {}

  /* ---------- the More menu ---------- */
  var root = null, view = "menu";
  function build() {
    if (root) return;
    root = document.createElement("div"); root.id = "xh";
    root.innerHTML = '<div class="top"><button class="ib" id="xhBack" style="display:none">←</button><b id="xhTitle">More</b><button class="ib" id="xhX" title="Close">✕</button></div><div id="xhBody"></div>';
    document.body.appendChild(root);
    $("xhX").onclick = closeHub;
    $("xhBack").onclick = function () { openHub("menu"); };
    var s2 = document.createElement("div"); s2.id = "xShare"; s2.onclick = function (e) { if (e.target === s2) s2.style.display = "none"; }; document.body.appendChild(s2);
  }
  window.closeHub = function () { if (root) root.style.display = "none"; };
  function allowed(id) { try { return allowedModels().indexOf(id) > -1; } catch (e) { return false; } }
  var VIEWS = {};
  window.openHub = function (v) {
    build(); view = v || "menu";
    $("xhTitle").textContent = { menu: "More", templates: "Prompt templates", todo: "To-do and reminders", invite: "Invite friends", backup: "Backup and restore", display: "Display and data" }[view] || "More";
    $("xhBack").style.display = view === "menu" ? "none" : "";
    $("xhBody").innerHTML = VIEWS[view]();
    root.style.display = "flex";
    if (VIEWS[view + "Init"]) VIEWS[view + "Init"]();
  };
  VIEWS.menu = function () {
    var t = [["templates", "📝", "Templates and saved prompts"], ["todo", "✅", "To-do and reminders"], ["brief", "☀️", "Daily briefing"], ["call", "📞", "Call Nesty (voice)"], ["invite", "🎁", "Invite friends"], ["backup", "☁️", "Backup and restore"], ["display", "🔤", "Display and data saver"], ["help", "❓", "Help Center"]];
    if (allowed("smart")) t.unshift(["study", "🎓", "Study Center"]);
    if (allowed("hiaru")) t.unshift(["biz", "💼", "Business tools"]);
    return '<div class="m">Handy tools around Nesty. Tap one.</div><div class="menu" style="margin-top:10px">' + t.map(function (x) { return '<button class="tile" data-go="' + x[0] + '"><i>' + x[1] + '</i>' + x[2] + '</button>'; }).join("") + '</div>';
  };
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("#xh [data-go]") : null;
    if (!t) return;
    var g = t.getAttribute("data-go");
    if (g === "brief") { closeHub(); prefill("Give me my daily briefing: today's date, the weather for my area, 3 top news headlines (Kenya and the world), one useful tip for studying or working, and one short encouraging line. Keep it short and friendly.", true); }
    else if (g === "call") { closeHub(); if (window.startVoiceMode) startVoiceMode(); }
    else if (g === "help") { closeHub(); if (window.openHelp) openHelp(); }
    else if (g === "study") { closeHub(); if (window.goStudy) goStudy(); }
    else if (g === "biz") { closeHub(); if (window.goBiz) goBiz(); }
    else openHub(g);
  });

  /* templates and saved prompts */
  var TPL = [
    ["CV / résumé", "Write a professional one-page CV for me as a Word file. My details: name: ..., phone: ..., email: ..., education: ..., work experience: ..., skills: ..."],
    ["Cover letter", "Write a short, strong cover letter for the job of ... at ... My background: ..."],
    ["Business plan", "Write a simple business plan for my business idea: ... Include the problem, customers, prices, costs, marketing and a 6-month plan, in Kenya."],
    ["Essay", "Write an essay of about ... words on the topic: ... for ... level, with an introduction, 3 clear points and a conclusion."],
    ["Email", "Write a polite, clear email to ... about ... Keep it short."],
    ["Lesson plan", "Make a 40-minute lesson plan for ... (subject) for ... (class) on the topic ..., with objectives, activities and a quick quiz."],
    ["Social media post", "Write 3 catchy social media posts for my ... business about ..., with emojis and hashtags."],
    ["Speech", "Write a 2-minute speech for ... (occasion) in a warm, confident tone."],
    ["Report", "Help me write a report on ... with headings, key findings and recommendations."],
    ["Summarise", "Summarise this text in 5 bullet points and tell me what matters most: ..."],
    ["Explain simply", "Explain ... in very simple words with one everyday example."],
    ["Excel table", "Make an Excel table for ... with borders, in Times New Roman, with totals."],
    ["PowerPoint", "Make a 6-slide PowerPoint on ... with a chart, in Calibri, theme gold."],
    ["Translate", "Translate this into Kiswahili and keep it natural: ..."]
  ];
  VIEWS.templates = function () {
    var mine = lj("nestyPrompts_" + uid(), []);
    var h = '<div class="m">Tap a template to put it in the message box, then fill the dots.</div><div>' + TPL.map(function (t, i) { return '<button class="chip" data-tp="' + i + '">' + E(t[0]) + '</button>'; }).join("") + '</div>' +
      '<h3>My saved prompts</h3><div class="card">' + (mine.length ? mine.map(function (p) { return '<div class="li"><div class="t"><b>' + E(p.t) + '</b><div class="m">' + E(p.p.slice(0, 80)) + '</div></div><button class="b s" data-up="' + p.id + '">Use</button><button class="b s ghost" data-dp="' + p.id + '">✕</button></div>'; }).join("") : '<div class="m">Nothing saved yet.</div>') +
      '</div><div class="card"><b>Save a new prompt</b><input id="npT" maxlength="40" placeholder="Name, e.g. Weekly report"><textarea id="npP" rows="3" maxlength="1500" placeholder="The prompt you use often"></textarea><button class="b" data-sp="1">Save prompt</button></div>';
    return h;
  };
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("#xh [data-tp],#xh [data-up],#xh [data-dp],#xh [data-sp]") : null;
    if (!t) return;
    var mine = lj("nestyPrompts_" + uid(), []);
    if (t.hasAttribute("data-tp")) { closeHub(); prefill(TPL[parseInt(t.getAttribute("data-tp"), 10)][1]); }
    else if (t.hasAttribute("data-up")) { var p = mine.filter(function (x) { return x.id === t.getAttribute("data-up"); })[0]; if (p) { closeHub(); prefill(p.p); } }
    else if (t.hasAttribute("data-dp")) { sj("nestyPrompts_" + uid(), mine.filter(function (x) { return x.id !== t.getAttribute("data-dp"); })); openHub("templates"); }
    else if (t.hasAttribute("data-sp")) {
      var tt = $("npT").value.trim(), pp = $("npP").value.trim();
      if (!tt || pp.length < 3) { toast("Add a name and the prompt."); return; }
      mine.push({ id: nid(), t: tt, p: pp }); sj("nestyPrompts_" + uid(), mine.slice(-40)); openHub("templates");
    }
  });

  /* to-do and reminders */
  function todos() { return lj("nestyTodos_" + uid(), []); }
  function fmtDue(ms) { try { return new Date(ms).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  VIEWS.todo = function () {
    var l = todos().sort(function (a, b) { return (a.done - b.done) || ((a.due || 9e15) - (b.due || 9e15)); });
    var canN = "Notification" in window;
    return '<div class="card"><b>Add a task</b><input id="tdT" maxlength="120" placeholder="What do you need to do?"><label class="m" style="display:block;margin-top:8px">Remind me at (optional)</label><input id="tdD" type="datetime-local"><button class="b" data-td="add">Add</button>' +
      (canN && Notification.permission === "default" ? '<button class="b blue" data-td="perm">Allow notifications</button>' : '') + '</div>' +
      '<div class="m">Reminders ring while Nesty is open or running in the background on your phone. If your phone closes the app, you will see missed reminders the next time you open it.</div>' +
      '<div class="card">' + (l.length ? l.map(function (x) { return '<div class="li"><input type="checkbox" style="width:22px;margin:0" data-tc="' + x.id + '"' + (x.done ? " checked" : "") + '><div class="t" style="' + (x.done ? "text-decoration:line-through;opacity:.6" : "") + '">' + E(x.t) + (x.due ? '<div class="m">⏰ ' + E(fmtDue(x.due)) + (x.due < Date.now() && !x.done ? " (due)" : "") + '</div>' : "") + '</div><button class="b s ghost" data-td="del" data-id="' + x.id + '">✕</button></div>'; }).join("") : '<div class="m">No tasks yet.</div>') + '</div>';
  };
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("#xh [data-td]") : null;
    if (!t) return;
    var a = t.getAttribute("data-td"), l = todos();
    if (a === "add") {
      var tx = $("tdT").value.trim(); if (!tx) { toast("Type the task first."); return; }
      var d = $("tdD").value ? new Date($("tdD").value).getTime() : 0;
      l.push({ id: nid(), t: tx, due: d || 0, done: false, fired: false }); sj("nestyTodos_" + uid(), l.slice(-100)); openHub("todo");
      if (d && "Notification" in window && Notification.permission === "default") toast("Tip: allow notifications so reminders can pop up.");
    } else if (a === "del") { sj("nestyTodos_" + uid(), l.filter(function (x) { return x.id !== t.getAttribute("data-id"); })); openHub("todo"); }
    else if (a === "perm") { try { Notification.requestPermission().then(function () { openHub("todo"); }); } catch (x) {} }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute("data-tc")) {
      var l = todos(); l.forEach(function (x) { if (x.id === t.getAttribute("data-tc")) x.done = t.checked; }); sj("nestyTodos_" + uid(), l); openHub("todo");
    }
  });
  function ring(x) {
    toast("⏰ Reminder: " + x.t);
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function (r) { r.showNotification("Nesty reminder", { body: x.t, icon: "/icon-192.png" }); });
        else new Notification("Nesty reminder", { body: x.t });
      }
    } catch (e) {}
  }
  function checkDue() {
    if (typeof user === "undefined" || !user) return;
    var l = todos(), ch = false;
    l.forEach(function (x) { if (x.due && !x.done && !x.fired && x.due <= Date.now()) { x.fired = true; ch = true; ring(x); } });
    if (ch) sj("nestyTodos_" + uid(), l);
  }
  setInterval(checkDue, 20000);

  /* invites */
  VIEWS.invite = function () { return '<div class="card"><b>🎁 Invite a friend</b><p class="m" id="invTxt">Loading your invite link...</p></div><div class="m">When a new friend joins with your link and opens Nesty, you both get 3 days of the Go plan (or 3 extra days on your paid plan). Invites work for accounts in their first 7 days.</div>'; };
  VIEWS.inviteInit = async function () {
    try {
      var d = await api("/api/referral", { action: "info" });
      if (!d || !d.ok) { $("invTxt").textContent = (d && d.error) || "Could not load your invite link."; return; }
      var link = location.origin + "/?ref=" + d.code;
      $("invTxt").innerHTML = 'Your link:<br><b style="word-break:break-all">' + E(link) + '</b><br>Friends who joined: <b>' + d.invited + '</b> of ' + d.cap + ' rewards (' + (d.days || 3) + ' free days each).<br><button class="b" id="invShare">Share link</button><button class="b ghost" id="invCopy">Copy</button>';
      $("invShare").onclick = function () { var msg = "🎁 Join me on Nesty AI, a smart assistant made for us (homework, business, Kiswahili and more). Use my link and we both get 3 free days of the Go plan: " + link; if (navigator.share) navigator.share({ text: msg }).catch(function () {}); else window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank"); };
      $("invCopy").onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { toast("Copied"); }); };
    } catch (e) { $("invTxt").textContent = "Could not load your invite link."; }
  };

  /* backup and restore */
  function collect() {
    var u = uid(), b = { v: 1, at: Date.now(), by: u };
    ["nestySC_", "nestyBiz_", "nestyPrompts_", "nestyTodos_", "nestyPins_", "nestyFold_"].forEach(function (k) { var v = localStorage.getItem(k + u); if (v) b[k] = v; });
    return b;
  }
  function apply(b) {
    var u = uid();
    ["nestySC_", "nestyBiz_", "nestyPrompts_", "nestyTodos_", "nestyPins_", "nestyFold_"].forEach(function (k) { if (typeof b[k] === "string") { try { localStorage.setItem(k + u, b[k]); } catch (e) {} } });
  }
  window.nestyBackupNow = async function () {
    try {
      var d = await api("/api/backup", { action: "put", data: JSON.stringify(collect()) });
      if (d && d.ok) { toast("Backed up ☁️"); return true; }
      toast((d && d.error) || "Backup failed.");
    } catch (e) { toast("Backup failed. Check your internet."); }
    return false;
  };
  window.nestyRestoreNow = async function () {
    try {
      var d = await api("/api/backup", { action: "get" });
      if (!d || !d.ok) { toast((d && d.error) || "Restore failed."); return; }
      if (d.empty) { toast("You have no backup yet."); return; }
      if (!confirm("Restore your backup from " + fmtDue(d.at) + "? This replaces the Study Center, tools, prompts and to-dos on this phone.")) return;
      apply(JSON.parse(d.data)); toast("Restored. Reloading..."); setTimeout(function () { location.reload(); }, 900);
    } catch (e) { toast("Restore failed."); }
  };
  VIEWS.backup = function () {
    return '<div class="card"><b>☁️ Your own backup</b><p class="m">Your Study Center (exams, notes, flashcards, timetable, stories, progress), Business tools, saved prompts, to-dos, pinned chats and folders are saved on this phone. Back them up to your Nesty account so you can restore them on a new phone. Chats are already saved in your account.</p>' +
      '<button class="b" id="bkNow">Back up now</button><button class="b blue" id="bkRes">Restore backup</button></div>' +
      '<div class="card"><b>💾 Save a file</b><p class="m">Download everything as one file, or load a file you saved before.</p><button class="b ghost" id="bkDl">Download my data</button><button class="b ghost" id="bkUp">Load a file</button><input type="file" id="bkFile" accept=".json,application/json" style="display:none"></div>';
  };
  VIEWS.backupInit = function () {
    $("bkNow").onclick = function () { nestyBackupNow(); };
    $("bkRes").onclick = function () { nestyRestoreNow(); };
    $("bkDl").onclick = function () { saveBlob(new Blob([JSON.stringify(collect())], { type: "application/json" }), "nesty-backup.json"); };
    $("bkUp").onclick = function () { $("bkFile").click(); };
    $("bkFile").onchange = function () {
      var f = this.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { try { var b = JSON.parse(String(r.result)); if (!b || b.v !== 1) throw 0; if (!confirm("Load this file? It replaces your tools data on this phone.")) return; apply(b); toast("Loaded. Reloading..."); setTimeout(function () { location.reload(); }, 900); } catch (e) { toast("That is not a Nesty backup file."); } };
      r.readAsText(f);
    };
  };

  /* display and data */
  VIEWS.display = function () {
    var ts = localStorage.getItem("nestyTs") || "1", ds = localStorage.getItem("nestyDataSaver") === "1";
    return '<div class="card"><b>Text size</b><div>' + [["0.9", "Small"], ["1", "Normal"], ["1.15", "Large"], ["1.3", "Extra large"]].map(function (o) { return '<button class="b s ' + (ts === o[0] ? "" : "ghost") + '" data-ts="' + o[0] + '">' + o[1] + '</button>'; }).join("") + '</div></div>' +
      '<div class="card"><b>Light or dark</b><div><button class="b s ghost" data-th="#ffffff">☀️ Light</button><button class="b s ghost" data-th="#121212">🌙 Dark</button></div><p class="m">More colours are in Settings.</p></div>' +
      '<div class="card"><b>Data saver</b><p class="m">Uses less internet: pictures you attach are made smaller before they are sent, and exam pictures are skipped.</p><button class="b s ' + (ds ? "" : "ghost") + '" data-ds="1">' + (ds ? "Data saver is ON" : "Turn on data saver") + '</button>' + (ds ? '<button class="b s ghost" data-ds="0">Turn off</button>' : '') + '</div>';
  };
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("#xh [data-ts],#xh [data-th],#xh [data-ds]") : null;
    if (!t) return;
    if (t.hasAttribute("data-ts")) { try { localStorage.setItem("nestyTs", t.getAttribute("data-ts")); } catch (x) {} applyTs(); openHub("display"); }
    else if (t.hasAttribute("data-th")) { if (window.pickBg) pickBg(t.getAttribute("data-th")); }
    else if (t.hasAttribute("data-ds")) { try { localStorage.setItem("nestyDataSaver", t.getAttribute("data-ds")); } catch (x) {} openHub("display"); }
  });
  if (typeof fitImage === "function") {
    var _fit = fitImage;
    fitImage = function (file, max, square, q) {
      if (localStorage.getItem("nestyDataSaver") === "1") { max = Math.min(max, 800); q = Math.min(q || 0.9, 0.7); }
      return _fit(file, max, square, q);
    };
  }

  /* ---------- buttons above the message box ---------- */
  function addButtons() {
    var row = $("modeRow");
    if (!row) { setTimeout(addButtons, 600); return; }
    if (!$("xMore")) {
      var p = document.createElement("button"); p.className = "cpbtn xb"; p.id = "xPrompts"; p.textContent = "📝 Prompts"; p.onclick = function () { openHub("templates"); };
      var m = document.createElement("button"); m.className = "cpbtn xb"; m.id = "xMore"; m.textContent = "✨ More"; m.onclick = function () { openHub("menu"); };
      var hb = document.createElement("button"); hb.className = "cpbtn xb"; hb.id = "xHelp"; hb.textContent = "💬 Help"; hb.onclick = function () { if (window.openHelp) openHelp(); };
      row.appendChild(hb); row.appendChild(m);
    }
    row.style.display = "";
    if (typeof syncModes === "function") syncModes();
  }
  window.addEventListener("load", function () { setTimeout(addButtons, 300); });

  /* ---------- pinned chats, folders and search inside chats ---------- */
  var fsel = "all";
  function pins() { return lj("nestyPins_" + uid(), {}); }
  function folds() { return lj("nestyFold_" + uid(), {}); }
  window.renderList = function () {
    var list = $("list");
    if (!list) return;
    list.innerHTML = "";
    var qv = ($("q").value || "").trim().toLowerCase(), P = pins(), F = folds();
    var names = {};
    Object.keys(F).forEach(function (k) { if (F[k]) names[F[k]] = 1; });
    var fb = $("xFilt");
    if (!fb) { fb = document.createElement("div"); fb.id = "xFilt"; list.parentNode.insertBefore(fb, list); }
    var chips = [["all", "All"], ["pin", "📌 Pinned"]].concat(Object.keys(names).map(function (n) { return ["f:" + n, "📁 " + n]; }));
    if (!names[fsel.slice(2)] && fsel.indexOf("f:") === 0) fsel = "all";
    fb.innerHTML = "";
    chips.forEach(function (c) { var b = document.createElement("button"); b.textContent = c[1]; b.className = c[0] === fsel ? "on" : ""; b.onclick = function () { fsel = c[0]; renderList(); }; fb.appendChild(b); });
    var shown = chats.filter(function (c) {
      if (fsel === "pin" && !P[c.$id]) return false;
      if (fsel.indexOf("f:") === 0 && F[c.$id] !== fsel.slice(2)) return false;
      return !qv || (c.Title || "").toLowerCase().indexOf(qv) > -1 || String(c.messages || "").toLowerCase().indexOf(qv) > -1;
    }).sort(function (a, b) { return (P[b.$id] ? 1 : 0) - (P[a.$id] ? 1 : 0); });
    if (!shown.length) {
      var em = document.createElement("div"); em.id = "empty"; em.textContent = chats.length ? L("nomatch") : L("none"); list.appendChild(em); return;
    }
    shown.forEach(function (c) {
      var it = document.createElement("div"); it.className = "item" + (c.$id === chatId ? " cur" : "");
      var b = document.createElement("button"); b.className = "t"; b.dir = "auto"; b.textContent = (P[c.$id] ? "📌 " : "") + (c.Title || "Chat"); b.onclick = function () { openChat(c.$id); };
      it.appendChild(b);
      function mk(txt, title, fn) { var x = document.createElement("button"); x.className = "x"; x.textContent = txt; x.title = title; x.onclick = function (e) { e.stopPropagation(); fn(); }; it.appendChild(x); }
      mk(P[c.$id] ? "📍" : "📌", P[c.$id] ? "Unpin" : "Pin to top", function () { var p2 = pins(); if (p2[c.$id]) delete p2[c.$id]; else p2[c.$id] = 1; sj("nestyPins_" + uid(), p2); renderList(); });
      mk("📁", "Put in a folder", function () {
        var f2 = folds(), have = Object.keys(names).join(", ");
        var n = prompt("Folder name" + (have ? " (yours: " + have + ")" : "") + ". Leave empty to remove from a folder:", f2[c.$id] || "");
        if (n === null) return;
        n = n.trim().slice(0, 20); if (n) f2[c.$id] = n; else delete f2[c.$id];
        sj("nestyFold_" + uid(), f2); renderList();
      });
      mk("✎", "Rename", async function () {
        var name = prompt("New title:", c.Title || ""); if (!name || !name.trim()) return;
        try { await db.updateDocument(DB, TABLE, c.$id, { Title: name.trim().slice(0, 80) }); loadList(); } catch (err) { toast("Could not rename."); }
      });
      mk("↓", "Export", function () {
        var msgs = []; try { msgs = JSON.parse(c.messages || "[]"); } catch (err) {}
        var txt = msgs.map(function (m) { return (m.role === "user" ? "You: " + (m.text || "") : "Nesty: " + (m.content || "")); }).join("\n\n");
        saveBlob(new Blob([txt], { type: "text/plain;charset=utf-8" }), ((c.Title || "chat").replace(/[^\w\- ]+/g, "").trim() || "chat") + ".txt");
      });
      mk("×", "Delete", function () { removeChat(c.$id); });
      list.appendChild(it);
    });
  };

  /* ---------- offline: keep the chat list, tell the person ---------- */
  var off = document.createElement("div"); off.id = "xOff"; off.textContent = "You are offline. You can read your saved chats, notes and Study Center. Sending needs internet."; document.body.appendChild(off);
  function netState() { off.style.display = navigator.onLine === false ? "block" : "none"; }
  window.addEventListener("online", netState); window.addEventListener("offline", netState); netState();
  if (typeof loadList === "function") {
    var _ll = loadList;
    loadList = async function () {
      await _ll();
      try {
        if (chats && chats.length) localStorage.setItem("nestyChatCache_" + uid(), JSON.stringify(chats.slice(0, 20).map(function (c) { return { $id: c.$id, Title: c.Title, messages: String(c.messages || "").slice(0, 60000), $updatedAt: c.$updatedAt }; })));
        else if (navigator.onLine === false) { var c2 = lj("nestyChatCache_" + uid(), []); if (c2.length) { chats = c2; renderList(); } }
      } catch (e) {}
    };
  }
  if (typeof send === "function") {
    var _send = send;
    send = function () {
      if (navigator.onLine === false) { toast("You are offline. Connect to the internet to send."); return; }
      return _send.apply(this, arguments);
    };
  }

  /* ---------- sharing an answer, and reporting a wrong one ---------- */
  function questionFor(m) {
    var i = messages.indexOf(m), q = "";
    for (var j = i - 1; j >= 0; j--) { if (messages[j].role === "user") { q = messages[j].text || ""; break; } }
    return q;
  }
  function plain(s) { return String(s || "").replace(/```[a-z]*\n?/gi, "").replace(/[*_#`>]/g, "").replace(/\n{3,}/g, "\n\n").trim(); }
  window.reportWrong = function (m) {
    openFeedback(m, "down");
    $("fbTitle").textContent = "Report a wrong answer";
    $("fbText").value = "[Wrong answer] ";
    $("fbText").focus();
  };
  window.shareMsg = function (m) {
    build();
    var s = $("xShare"), q = questionFor(m), a = plain(m.content);
    s.innerHTML = '<div class="box"><b style="font-size:17px">Share this answer</b><p class="m" style="color:#6b5a1a;font-size:13.5px">Pick how you want to share it.</p><button class="b" id="shL" style="display:block;width:100%;background:#ffc933;border:0;border-radius:12px;padding:12px;font-weight:800;margin-top:8px;font-family:inherit">🔗 Share as a link</button><button id="shP" style="display:block;width:100%;background:#4fb3ea;color:#06304f;border:0;border-radius:12px;padding:12px;font-weight:800;margin-top:8px;font-family:inherit">🖼️ Share as a picture</button><button id="shT" style="display:block;width:100%;background:#fff;border:1.5px solid #4fb3ea;color:#0b6aa8;border-radius:12px;padding:12px;font-weight:800;margin-top:8px;font-family:inherit">📋 Copy the text</button><p style="font-size:12px;color:#6b5a1a">A link makes this question and answer readable by anyone who has it, for 30 days.</p></div>';
    s.style.display = "flex";
    $("shT").onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(a).then(function () { toast("Copied"); s.style.display = "none"; }); };
    $("shL").onclick = async function () {
      try {
        var d = await api("/api/share", { q: q, a: a });
        if (!d || !d.ok) { toast((d && d.error) || "Could not make a link."); return; }
        s.style.display = "none";
        if (navigator.share) navigator.share({ title: "Nesty AI", url: d.url }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(d.url).then(function () { toast("Link copied"); });
      } catch (e) { toast("Could not make a link."); }
    };
    $("shP").onclick = function () { s.style.display = "none"; sharePicture(q, a); };
  };
  function wrap(g, text, maxW) {
    var out = [];
    String(text).split("\n").forEach(function (para) {
      if (!para.trim()) { out.push(""); return; }
      var line = "";
      para.split(/\s+/).forEach(function (w) {
        var t = line ? line + " " + w : w;
        if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      });
      out.push(line);
    });
    return out;
  }
  async function sharePicture(q, a) {
    try {
      var W = 1080, pad = 64, c = document.createElement("canvas"), g = c.getContext("2d");
      g.font = "34px sans-serif";
      var qL = q ? wrap(g, q.slice(0, 200), W - pad * 2 - 40).slice(0, 4) : [];
      g.font = "32px sans-serif";
      var aL = wrap(g, a.slice(0, 1600), W - pad * 2).slice(0, 34);
      if (a.length > 1600 || aL.length >= 34) aL.push("...");
      var H = 150 + (qL.length ? qL.length * 46 + 60 : 0) + aL.length * 44 + 150;
      c.width = W; c.height = H; g = c.getContext("2d");
      g.fillStyle = "#fff8e1"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#ffc933"; g.fillRect(0, 0, W, 16);
      var y = 70;
      try { var im = await loadPic("/nesty-mark.png"); g.drawImage(im, pad, y - 30, 64, 64); } catch (e) {}
      g.fillStyle = "#2a2200"; g.font = "bold 38px sans-serif"; g.fillText("Nesty AI", pad + 80, y + 14); y += 70;
      if (qL.length) {
        g.fillStyle = "#ffe9a8"; g.fillRect(pad, y, W - pad * 2, qL.length * 46 + 30);
        g.fillStyle = "#2a2200"; g.font = "bold 34px sans-serif";
        qL.forEach(function (l, i) { g.fillText(l, pad + 20, y + 52 + i * 46); });
        y += qL.length * 46 + 60;
      }
      g.fillStyle = "#2a2200"; g.font = "32px sans-serif";
      aL.forEach(function (l, i) { g.fillText(l, pad, y + 36 + i * 44); });
      y += aL.length * 44 + 70;
      g.fillStyle = "#6b5a1a"; g.font = "26px sans-serif"; g.fillText("Made with Nesty AI. Nesty is an AI and can make mistakes.", pad, y);
      c.toBlob(function (b) {
        var f = new File([b], "nesty-answer.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f] }).catch(function () {});
        else saveBlob(b, "nesty-answer.png");
      }, "image/png");
    } catch (e) { toast("Could not make the picture."); }
  }

  /* ---------- banner: announcements and plan reminders ---------- */
  function bar(html, key, onGo) {
    var b = $("xBar");
    if (!b) { b = document.createElement("div"); b.id = "xBar"; document.body.appendChild(b); }
    b.innerHTML = '<span>' + html + '</span><button id="xGo">Open</button><button class="x" id="xCl">×</button>';
    b.style.display = "flex";
    $("xCl").onclick = function () { b.style.display = "none"; try { localStorage.setItem(key, "1"); } catch (e) {} };
    clearTimeout(bar._t); bar._t = setTimeout(function () { b.style.display = "none"; }, 30000);
    $("xGo").style.display = onGo ? "" : "none";
    if (onGo) $("xGo").onclick = function () { b.style.display = "none"; try { localStorage.setItem(key, "1"); } catch (e) {} onGo(); };
  }
  function afterMe() {
    if (!me) return;
    try {
      var a = me.announcement;
      if (a && a.id && !localStorage.getItem("nestyAnn_" + a.id)) {
        bar("📣 " + E(a.text), "nestyAnn_" + a.id, a.link ? function () { window.open(a.link, "_blank"); } : null);
        return;
      }
      var now = Date.now(), PN = (window.PLAN_DATA && PLAN_DATA[me.plan] && PLAN_DATA[me.plan].n) || me.plan;
      if (me.plan !== "free" && me.expiresAt) {
        var days = Math.ceil((me.expiresAt - now) / 864e5), k = "nestyExp_" + me.expiresAt + "_" + new Date().toISOString().slice(0, 10);
        if (days <= 3 && days >= 0) bar("⏳ Your " + E(PN) + " plan ends " + (days <= 0 ? "today" : "in " + days + " day" + (days === 1 ? "" : "s")) + ". Renew so you keep your limits.", "nestyExpNever", function () { openPlans(me.plan); });
      } else if (me.expiredPlan && me.expiredAt && now - me.expiredAt < 7 * 864e5) {
        var k2 = "nestyExpd_" + me.expiredAt;
        if (!localStorage.getItem(k2)) bar("Your " + E((window.PLAN_DATA && PLAN_DATA[me.expiredPlan] && PLAN_DATA[me.expiredPlan].n) || me.expiredPlan) + " plan has ended. Renew to get your limits back.", k2, function () { openPlans(me.expiredPlan); });
      }
    } catch (e) {}
    claimRef(); checkDue(); sharedQuiz();
  }
  if (typeof loadMe === "function") {
    var _lm = loadMe;
    loadMe = async function () { await _lm(); afterMe(); };
  }

  /* ---------- invite link and shared quiz links ---------- */
  (function grab() {
    try {
      var u = new URL(location.href), ch = false;
      if (u.searchParams.get("ref")) { localStorage.setItem("nestyRef", u.searchParams.get("ref")); localStorage.setItem("nestyRefAt", String(Date.now())); u.searchParams.delete("ref"); ch = true; }
      if (u.searchParams.get("quiz")) { localStorage.setItem("nestyQuiz", u.searchParams.get("quiz")); u.searchParams.delete("quiz"); ch = true; }
      if (ch) history.replaceState(null, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : "") + u.hash);
    } catch (e) {}
  })();
  async function claimRef() {
    var r = localStorage.getItem("nestyRef"), at = +localStorage.getItem("nestyRefAt") || 0;
    if (!r) return;
    try { localStorage.removeItem("nestyRef"); localStorage.removeItem("nestyRefAt"); } catch (e) {}
    if (!at || Date.now() - at > 3 * 3600000) return;
    try {
      var d = await api("/api/referral", { action: "claim", code: r });
      if (d && d.ok) { toast("🎁 Welcome! You and your friend each got " + d.days + " days of Go."); loadMe(); }
      else if (d && d.error) toast(d.error);
    } catch (e) {}
  }
  function sharedQuiz() {
    var q = localStorage.getItem("nestyQuiz");
    if (!q) return;
    try { localStorage.removeItem("nestyQuiz"); } catch (e) {}
    setTimeout(function () { if (window.openSharedQuiz) openSharedQuiz(q); }, 800);
  }
})();
