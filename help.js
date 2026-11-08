/* Nesty Help Center: quick answers + a limited Help assistant. Gold, white and sky blue. */
(function () {
  "use strict";
  if (window.openHelp && !window.openHelp.__stub) return;
  var MAIL = "isenyealvin@gmail.com";
  var CSS = "" +
    "#hc{display:none;position:fixed;inset:0;z-index:91;flex-direction:column;background:#fffdf3;color:#2b2600}" +
    "#hc *{box-sizing:border-box}" +
    "#hc .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#ffc933;box-shadow:0 2px 10px rgba(120,80,0,.18);border-bottom:4px solid #38b6f2}" +
    "#hc .top b{font-size:18px;flex:1;color:#3a2a00}#hc .ib{background:#fff;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#3a2a00;box-shadow:0 1px 4px rgba(0,0,0,.2)}" +
    "#hcMain{flex:1;overflow-y:auto;padding:14px 14px 60px;max-width:700px;width:100%;margin:0 auto}" +
    "#hc input,#hc textarea{width:100%;font:inherit;font-size:15px;padding:11px 12px;border:2px solid #9ed8f5;border-radius:12px;background:#fff;color:#2b2600}" +
    "#hc input:focus,#hc textarea:focus{outline:0;border-color:#38b6f2;box-shadow:0 0 0 3px #cdeefc}" +
    "#hc .card{background:#fff;border:2px solid #cfe9f7;border-radius:16px;padding:13px;margin:10px 0}" +
    "#hc .card.gold{border-color:#ffd566;background:#fff3c4}" +
    "#hc h3{margin:16px 0 6px;font-size:16px;color:#3a2a00}.hm{color:#6b5a1e;font-size:13.5px}" +
    "#hc .q{width:100%;text-align:left;background:#fff;border:2px solid #cfe9f7;border-radius:13px;padding:12px;margin-top:8px;font:inherit;font-weight:700;color:#2b2600;display:flex;gap:8px}" +
    "#hc .q span{flex:1}#hc .q b{color:#1c8fd0}#hc .q.open{background:#e8f6fd;border-color:#38b6f2}" +
    "#hc .a{display:none;background:#f4fbff;border-radius:0 0 13px 13px;padding:10px 13px;margin-top:-4px;line-height:1.55;font-size:14.5px;border:2px solid #cfe9f7;border-top:0}" +
    "#hc .hb{display:inline-block;background:#38b6f2;color:#06283d;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit;text-decoration:none}" +
    "#hc .hb.blue{background:#ffc933;color:#3a2a00}#hc .hb:disabled{opacity:.55}" +
    "#hc .msg{padding:10px 12px;border-radius:14px;margin:8px 0;line-height:1.5;font-size:14.5px;white-space:pre-wrap}" +
    "#hc .me{background:#dff3fd;margin-left:28px}#hc .ai{background:#fff;border:2px solid #ffe08a;margin-right:28px}" +
    "#hc .chip{display:inline-block;background:#fff;border:2px solid #38b6f2;border-radius:20px;padding:6px 11px;margin:5px 6px 0 0;font-size:13px;color:#0b5f8f;font-family:inherit;font-weight:700}";

  var FAQ = [
    ["How do I pay for a plan?", "Open Plans, choose a plan and tap Monthly or Yearly, then tap Pay with M-Pesa. Type your Safaricom number and tap Send M-Pesa request. Enter your M-Pesa PIN when your phone asks. Your plan starts by itself in a few seconds. If money was taken but the plan did not start, tap Email us and send the M-Pesa message."],
    ["What are the plans and prices?", "Free is KSh 0. Diamond is KSh 30 a month or KSh 360 a year and unlocks the Manuva model. Premium is KSh 50 or KSh 600 a year. Go is KSh 70 or KSh 840 a year. Pro is KSh 120 or KSh 1,440 a year. Smart is KSh 150 or KSh 1,800 a year. Ultra is KSh 599 or KSh 7,188 a year. Open Plans to compare them."],
    ["Can I have more than one plan?", "Yes. Plans add together. For example you can have Diamond and Go at the same time, and you get the models from both. Each plan keeps its own end date."],
    ["What is Diamond and Manuva?", "Diamond is a cheap add-on plan that unlocks Manuva, the model for tough challenges like hard maths, logic, science and coding. You get up to 20 Manuva messages per hour."],
    ["How do I change the AI model?", "Tap the model name at the top of the chat (it has a small arrow). Free users choose NEPTUNE 5.5 or Nova 5.5. If you have several plans, you can choose between the models they give you. Max can use all ten models. New models: Lexy for sports, Fenny for fitness and body care, Vilda for career and family life."],
    ["What do the hourly limits mean?", "Each plan has a number of messages, file attachments, pictures and natural-voice clips per hour. The hour starts when you first use that item and resets exactly one hour later. The app tells you the exact time when you reach a limit."],
    ["What is the Study Center?", "Choose the Omni smart model (Smart or Ultra plan) and a Study Center button appears above the message box. Inside you can make exams that Nesty marks (including KCPE, KPSEA and KCSE style), notes, flashcards that come back at the right time, a timetable, stories, novellas and novels, reports for parents, and Scan and solve for homework photos. Content can be in English or Kiswahili."],
    ["What are Business tools?", "With the Hiaru 5.1 model (Pro or Ultra) a Business tools button appears above the message box. Make invoices, receipts and quotations, keep a cash book, plan a budget and make a price list. You can download, print or send them on WhatsApp. They do not use your messages."],
    ["Can Nesty make Excel, Word, PDF and PowerPoint files?", "Yes. Hiaru 5.1 (Pro and Ultra) is made for office work. Ask for a Word, PDF, Excel or PowerPoint file and say which font you want, for example Times New Roman or Calibri. Excel can have borders and formulas. PowerPoint can have charts."],
    ["What is Deep search?", "Deep search reads many sources and writes one report with sources. It comes with the Tyra model on the Premium plan, and on Ultra when you choose Tyra."],
    ["What is in the More menu?", "Tap More above the message box. You will find prompt templates and saved prompts, a to-do list with reminders (they ring while Nesty is open), a daily briefing, voice calls with Nesty, invite friends, backup and restore, and display settings like text size, dark mode and data saver."],
    ["How do invites work?", "Open More, then Invite friends, and share your link. When a new friend joins with it, you both get one free day of the Go plan. Each person can earn up to 10 invite rewards."],
    ["How do I back up my notes and tools?", "Open More, then Backup and restore. Tap Back up now to save your Study Center, Business tools and saved prompts. On a new phone sign in and tap Restore. You can also download a backup file."],
    ["How do I pin chats, make folders or share an answer?", "Open the side menu: tap the pin on a chat to keep it at the top, or the folder to put it in a folder. Under every answer tap Share to send it as a link, a picture or text."],
    ["Does Nesty work offline?", "You can read your recent chats without internet. To send a message you need internet. Data saver in More, then Display makes pictures smaller to save your bundles."],
    ["How do I turn on my location?", "Open Settings and tap Use my location, then allow it when your phone asks. Nesty then knows your area, ward and village for local weather and places. If it was blocked, open your browser menu, go to Site settings, set Location to Allow for Nesty, and try again."],
    ["How do I make pictures or use voices?", "Just ask in plain words, for example: draw a lion at sunset. You can attach a photo and ask Nesty to edit it. For voices, tap the speaker under an answer or use voice mode. Both have hourly limits by plan."],
    ["How do I change or reset my password?", "Open Settings and tap Email me a reset link, or tap Forgot password on the sign-in screen. A password must have at least 8 characters with upper and lower case letters, a number and a symbol, and must not contain your name, email or phone number."],
    ["I did not get my email code", "Check your spam or junk folder and wait one minute before asking for a new code. Make sure you typed the email correctly. If it still does not arrive, contact us below."],
    ["How do I delete my account or my data?", "Open Settings and use the delete account button, which removes your chats and closes your account. To have every trace removed, contact us using the email below."],
    ["Is my information safe?", "Nesty does not sell your information. Your chats are stored for your account, and your messages are sent to the services that help Nesty answer. Nesty never sees your M-Pesa PIN. Read the Privacy page for the full details."],
    ["Why is an answer wrong?", "Nesty is an AI and can make mistakes. Check important facts, especially medical, legal, money and school facts, with a trusted source. Tap the warning sign under an answer to report a wrong answer."]
  ];
  var root = null, left = null, hist = [];
  function $(i) { return document.getElementById(i); }
  function E(s) { return esc(String(s == null ? "" : s)); }

  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "hc";
    root.innerHTML = '<div class="top"><b>💬 Help Center</b><button class="ib" id="hcX" title="Close">✕</button></div><div id="hcMain"></div>';
    document.body.appendChild(root);
    $("hcX").onclick = closeHelp;
    var h = '<h3 style="margin-top:2px">How can we help?</h3><input id="hcSearch" placeholder="Search questions, e.g. password, payment, model" autocomplete="off"><div id="hcList"></div>' +
      '<div class="card"><b>📍 App guide</b><div class="hm">New here? See where every button and feature is, and what it does.</div><button class="hb blue" id="hcGuide">Open the guide</button></div>' +
      '<div class="card gold"><b>🤖 Ask the Help assistant</b><div class="hm">Type your own question about Nesty. You can ask up to 20 Help questions each hour.</div>' +
      '<div id="hcChat"></div><textarea id="hcQ" rows="2" maxlength="400" placeholder="Type your question here" style="margin-top:8px"></textarea><button class="hb" id="hcSend">Ask</button><span class="hm" id="hcLeft"></span></div>' +
      '<div class="card"><b>📩 Still stuck?</b><div class="hm">If you could not get the right answer, contact the Nesty team. Tell us what you tried.</div><a class="hb blue" id="hcMail" href="mailto:' + MAIL + '">Email us</a></div>';
    $("hcMain").innerHTML = h;
    $("hcSearch").oninput = drawList;
    $("hcGuide").onclick = openGuide;
    $("hcSend").onclick = askHelp;
    $("hcQ").onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askHelp(); } };
    $("hcMail").href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Nesty help");
    drawList();
  }
  function drawList() {
    var q = ($("hcSearch").value || "").toLowerCase().trim(), h = "", n = 0;
    FAQ.forEach(function (f, i) {
      if (q && (f[0] + " " + f[1]).toLowerCase().indexOf(q) < 0) return;
      n++;
      h += '<button class="q" data-i="' + i + '"><span>' + E(f[0]) + '</span><b>+</b></button><div class="a" id="hca' + i + '">' + E(f[1]) + '</div>';
    });
    if (!n) h = '<div class="hm" style="margin-top:10px">No match. Try the Help assistant below.</div>';
    $("hcList").innerHTML = h;
    Array.prototype.forEach.call($("hcList").querySelectorAll(".q"), function (b) {
      b.onclick = function () { var a = $("hca" + b.getAttribute("data-i")), o = a.style.display === "block"; a.style.display = o ? "none" : "block"; b.classList.toggle("open", !o); b.lastChild.textContent = o ? "+" : "−"; };
    });
  }
  function drawChat() {
    var h = hist.map(function (m) { return '<div class="msg ' + (m.role === "user" ? "me" : "ai") + '">' + E(m.content) + '</div>'; }).join("");
    if (!hist.length) h = '<div style="margin-top:6px">' + ["How do I pay?", "What does Smart include?", "Can I have two plans?", "How do I switch model?"].map(function (t) { return '<button class="chip">' + E(t) + '</button>'; }).join("") + '</div>';
    $("hcChat").innerHTML = h;
    Array.prototype.forEach.call($("hcChat").querySelectorAll(".chip"), function (c) { c.onclick = function () { $("hcQ").value = c.textContent; askHelp(); }; });
    $("hcLeft").textContent = left === null ? "" : left + " Help question" + (left === 1 ? "" : "s") + " left this hour";
  }
  async function askHelp() {
    var q = ($("hcQ").value || "").trim();
    if (q.length < 3) return;
    $("hcQ").value = ""; hist.push({ role: "user", content: q }); drawChat();
    var b = $("hcSend"); b.disabled = true;
    try {
      var d = await api("/api/help", { messages: hist.slice(-6).map(function (m) { return { role: m.role, content: String(m.content).slice(0, 500) }; }) });
      if (d && d.limited) {
        left = 0;
        hist.push({ role: "assistant", content: "You have used your 20 Help questions for this hour. Please try again later. Please read the quick answers above, or contact the Nesty team by email and we will help you." });
      } else if (d && d.reply) {
        if (typeof d.left === "number") left = d.left;
        hist.push({ role: "assistant", content: d.reply + "\n\nDid this answer your question? If not, tap Email us below." });
      } else hist.push({ role: "assistant", content: (d && d.error) || "Sorry, I could not answer right now. Please try again, or email us below." });
    } catch (e) { hist.push({ role: "assistant", content: "Network problem. Please try again." }); }
    b.disabled = false; drawChat();
    var m = $("hcMain"); m.scrollTop = m.scrollHeight;
  }

  var GUIDE = [
    ["Top of the screen", [
      ["☰ Menu (top left)", "Opens your chat list, search, Plans, Settings, Install and Log out.", "#app header .hbtn"],
      ["Plan button (next to ☰)", "Shows your plan. Tap it to see plans, pay and see how much you have used.", "#planBtn"],
      ["Model name (top middle)", "Shows which Nesty model is answering. Tap it to switch model.", "#mtag"],
      ["Speaker (top right)", "Turns reading answers aloud on or off.", "#spk"],
      ["New chat (top right)", "Starts a fresh chat.", "#app header .hbtn:last-child"]]],
    ["Above the message box", [
      ["Study", "Study Center: notes, quizzes, past papers, flashcards, Scan and solve and more.", "#studyBtn"],
      ["Deep search", "Searches the web and writes a longer answer with sources (Premium and above).", "#deepBtn"],
      ["Business", "Invoices, receipts, quotations, cash book, budget and price list.", "#bzBtn"],
      ["💬 Help", "This Help Center.", "#xHelp"],
      ["✨ More", "Templates, to-do and reminders, daily briefing, invite friends, backup and display options.", "#xMore"]]],
    ["The message box", [
      ["+ (left)", "Attach a photo, PDF or document.", "#bar .ibtn"],
      ["Type here", "Write your question. Press the arrow to send.", "#box"],
      ["Microphone", "Speak instead of typing.", "#mic"],
      ["Voice mode", "Talk with Nesty out loud, like a phone call.", "#vm"],
      ["Arrow (right)", "Sends your message.", "#send"]]],
    ["Inside ☰ Menu", [
      ["Your chats", "Tap a chat to open it. Press and hold a chat to rename, pin, put in a folder or delete.", "#list"],
      ["Search", "Find any old chat.", "#q"],
      ["Plans", "Upgrade, pay by M-Pesa, or enter a code.", "#side .foot button"],
      ["Settings", "Name, birthday, language, voice, theme, parent controls and your data.", "#side .prof"],
      ["Log out", "Leaves your account on this phone.", "#side .foot button:last-child"]]],
    ["On every answer", [
      ["Press and hold your message", "Edit it, copy it or delete it.", "#chat"],
      ["Under an answer", "Copy, listen, share, report a bad answer, or make a PowerPoint when the answer is slides.", "#chat"]]]
  ];
  function openGuide() {
    var o = $("hcGuide2");
    if (o) o.remove();
    o = document.createElement("div"); o.id = "hcGuide2";
    o.style.cssText = "position:fixed;inset:0;z-index:100001;background:#fffdf5;overflow:auto;padding:14px 14px 40px;color:#222;font-family:inherit";
    var h = '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">📍 App guide</b><button id="hgX" style="border:0;background:#eee;border-radius:50%;width:36px;height:36px;font-size:18px">✕</button></div><div style="color:#666;margin:6px 0 10px;font-size:14px">Tap <b>Show me</b> to see where something is on your screen.</div>';
    GUIDE.forEach(function (g, gi) {
      h += '<h3 style="margin:14px 0 6px;color:#8a6d00">' + E(g[0]) + '</h3>';
      g[1].forEach(function (it, ii) {
        h += '<div style="background:#fff;border:1px solid #eadfb8;border-radius:12px;padding:10px;margin-bottom:8px"><b>' + E(it[0]) + '</b><div style="font-size:14px;margin:3px 0 6px;color:#444">' + E(it[1]) + '</div><button class="hb blue" data-g="' + gi + "-" + ii + '" style="padding:6px 12px">Show me</button></div>';
      });
    });
    o.innerHTML = h; document.body.appendChild(o);
    $("hgX").onclick = function () { o.remove(); };
    Array.prototype.forEach.call(o.querySelectorAll("[data-g]"), function (b) {
      b.onclick = function () {
        var k = b.getAttribute("data-g").split("-"), it = GUIDE[k[0]][1][k[1]], el = document.querySelector(it[2]);
        o.style.display = "none"; if (root) root.style.display = "none";
        var side = document.getElementById("side");
        if (k[0] === "3") { if (window.openSide) openSide(); } else if (window.closeSide) closeSide();
        setTimeout(function () { pulse(el, it[0], function () { if (root) root.style.display = "flex"; o.style.display = "block"; if (window.closeSide) closeSide(); }); }, 350);
      };
    });
  }
  function pulse(el, label, done) {
    var d = document.createElement("div");
    d.style.cssText = "position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.45)";
    var r = el ? el.getBoundingClientRect() : null;
    var ring = '';
    if (r && r.width) ring = '<div style="position:fixed;left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px;border:3px solid #ffd54f;border-radius:14px;box-shadow:0 0 0 9999px rgba(0,0,0,.45),0 0 18px #ffd54f;pointer-events:none"></div>';
    var ty = r && r.top > 200 ? Math.max(10, r.top - 90) : (r ? r.bottom + 20 : 120);
    d.innerHTML = ring + '<div style="position:fixed;left:12px;right:12px;top:' + ty + 'px;background:#fff;color:#222;border-radius:12px;padding:12px;text-align:center"><b>' + E(label) + '</b>' + (r && r.width ? '' : '<div style="font-size:13px;color:#666">Open a chat first to see this.</div>') + '<div><button id="hgOk" style="margin-top:8px;border:0;background:#1e88e5;color:#fff;border-radius:10px;padding:8px 18px">Got it</button></div></div>';
    d.style.background = "transparent";
    document.body.appendChild(d);
    d.querySelector("#hgOk").onclick = function () { d.remove(); done(); };
  }
  window.openHelp = function () { build(); drawChat(); root.style.display = "flex"; };
  window.closeHelp = function () { if (root) root.style.display = "none"; };
})();
