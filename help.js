/* Nesty Help Center: quick answers + a limited Help assistant. Golden yellow, sky blue and white. */
(function () {
  "use strict";
  if (window.openHelp) return;
  var MAIL = "isenyealvin@gmail.com";
  var CSS = "" +
    "#hc{display:none;position:fixed;inset:0;z-index:91;flex-direction:column;background:linear-gradient(180deg,#fff6d6 0,#fff 200px,#eaf7ff 100%);color:#16324f}" +
    "#hc *{box-sizing:border-box}" +
    "#hc .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:linear-gradient(135deg,#ffc933,#ffe08a 55%,#8fd3f7);box-shadow:0 2px 10px rgba(22,50,79,.18)}" +
    "#hc .top b{font-size:18px;flex:1}#hc .ib{background:#fff;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#16324f;box-shadow:0 1px 4px rgba(0,0,0,.2)}" +
    "#hcMain{flex:1;overflow-y:auto;padding:14px 14px 60px;max-width:700px;width:100%;margin:0 auto}" +
    "#hc input,#hc textarea{width:100%;font:inherit;font-size:15px;padding:11px 12px;border:1.5px solid #9fd4f1;border-radius:12px;background:#fff;color:#16324f}" +
    "#hc input:focus,#hc textarea:focus{outline:0;border-color:#ffb800;box-shadow:0 0 0 3px #ffe9a3}" +
    "#hc .card{background:#fff;border:1.5px solid #bfe3f8;border-radius:16px;padding:13px;margin:10px 0;box-shadow:0 2px 8px rgba(30,110,170,.08)}" +
    "#hc .card.gold{border-color:#ffd566;background:linear-gradient(135deg,#fffbe8,#fff)}" +
    "#hc h3{margin:16px 0 6px;font-size:16px}.hm{color:#4b6781;font-size:13.5px}" +
    "#hc .q{width:100%;text-align:left;background:#fff;border:1.5px solid #bfe3f8;border-radius:13px;padding:12px;margin-top:8px;font:inherit;font-weight:700;color:#16324f;display:flex;gap:8px}" +
    "#hc .q span{flex:1}#hc .q.open{background:#fff8dc;border-color:#ffd566}" +
    "#hc .a{display:none;background:#f3faff;border-radius:0 0 13px 13px;padding:10px 13px;margin-top:-4px;line-height:1.55;font-size:14.5px}" +
    "#hc .hb{display:inline-block;background:linear-gradient(135deg,#ffc933,#ffb300);color:#3a2a00;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit;text-decoration:none}" +
    "#hc .hb.blue{background:linear-gradient(135deg,#6ec6f5,#3aa7e6);color:#06304f}#hc .hb:disabled{opacity:.55}" +
    "#hc .msg{padding:10px 12px;border-radius:14px;margin:8px 0;line-height:1.5;font-size:14.5px;white-space:pre-wrap}" +
    "#hc .me{background:#fff0b8;margin-left:28px}#hc .ai{background:#e6f6ff;margin-right:28px}" +
    "#hc .chip{display:inline-block;background:#e6f6ff;border:1.5px solid #9fd4f1;border-radius:20px;padding:6px 11px;margin:5px 6px 0 0;font-size:13px;color:#0d6fb8;font-family:inherit;font-weight:600}";

  var FAQ = [
    ["How do I change the AI model?", "Tap the model name at the top of the chat (it has a small arrow). Free users can choose NEPTUNE 5.5 or Nova 5.5, and Ultra users can use all six models. Other plans have one model that comes with the plan. You can also find it in Settings under AI model."],
    ["What are the plans and prices?", "Free is KSh 0. Premium is KSh 50 a month or KSh 600 a year. Go is KSh 70 a month or KSh 840 a year. Pro is KSh 120 a month or KSh 1,440 a year. Learnover is KSh 150 a month or KSh 1,800 a year. Ultra is KSh 599 a month or KSh 7,188 a year. Open Plans in the app to compare them."],
    ["How do I pay and get my plan?", "Pay by M-Pesa to 0701244268 and email your payment confirmation to the contact address on the Terms page. After the owner checks the payment you receive a one-time activation code. Open Plans, type the code, and your plan starts straight away."],
    ["What do the hourly limits mean?", "Each plan has a number of messages, file attachments, pictures and natural-voice clips per hour. The hour starts when you first use that item and resets exactly one hour later. The app tells you the exact time when you reach a limit."],
    ["What is the Study Center?", "Switch to the Omni smart model (Learnover or Ultra plan) and a Study Center button appears above the message box. Inside you can make exams that Nesty marks, notes, flashcards, a timetable, stories, novellas and novels, and see your progress."],
    ["What is Deep search?", "Deep search reads many sources and writes one report with sources. It comes with the Tyra model on the Premium plan, and on Ultra when you choose Tyra."],
    ["Can Nesty work with Excel, Word and PDF files?", "Yes. The Hiaru 5.1 model (Pro and Ultra) is made for office work. Ask for a Word, PDF or Excel file and say which font you want, for example Times New Roman or Calibri. For Excel you can ask for rows, columns, formulas and border lines."],
    ["How do I make pictures?", "Just ask in plain words, for example: draw a lion at sunset. You can also attach a photo and ask Nesty to edit it. Pictures use your hourly picture limit. Pictures of real people are made as illustrations, not photographs."],
    ["How do natural voices work?", "Tap the speaker under an answer or use voice mode. Natural voices have an hourly limit by plan. When it is used up Nesty switches to your phone's own voice."],
    ["How do I turn on my location?", "Open Settings and tap Use my location, then allow it when your phone asks. Phones only ask once. If you blocked it, open your browser menu, go to Site settings, set Location to Allow for Nesty, and try again."],
    ["How do I change or reset my password?", "Open Settings and tap Email me a reset link, or tap Forgot password on the sign-in screen. Open the link in your email and choose a new password. A password must have at least 8 characters with upper and lower case letters, a number and a symbol, and must not contain your name, email or phone number."],
    ["I did not get my email code", "Check your spam or junk folder and wait one minute before asking for a new code. Make sure you typed the email correctly. If it still does not arrive, contact us below."],
    ["How do I delete my account or my data?", "Open Settings and use the delete account button, which removes your chats and closes your account. To have every trace removed, contact us using the email below."],
    ["Is my information safe?", "Nesty does not sell your information. Your chats are stored for your account, and your messages are sent to the services that help Nesty answer. Read the Privacy page for the full details."],
    ["Why is an answer wrong?", "Nesty is an AI and can make mistakes. Check important facts, especially medical, legal, money and school facts, with a trusted source. Tap the thumbs-down under an answer to tell us what went wrong."]
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
      '<div class="card gold"><b>🤖 Ask the Help assistant</b><div class="hm">Type your own question about Nesty. You get a limited number of Help questions each day.</div>' +
      '<div id="hcChat"></div><textarea id="hcQ" rows="2" maxlength="400" placeholder="Type your question here" style="margin-top:8px"></textarea><button class="hb" id="hcSend">Ask</button><span class="hm" id="hcLeft"></span></div>' +
      '<div class="card"><b>📩 Still stuck?</b><div class="hm">If you could not get the right answer, contact the Nesty team. Tell us what you tried.</div><a class="hb blue" id="hcMail" href="mailto:' + MAIL + '">Email us</a></div>';
    $("hcMain").innerHTML = h;
    $("hcSearch").oninput = drawList;
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
    if (!hist.length) h = '<div style="margin-top:6px">' + ["How do I pay?", "What does Learnover include?", "Why can't I use Deep search?", "How do I switch model?"].map(function (t) { return '<button class="chip">' + E(t) + '</button>'; }).join("") + '</div>';
    $("hcChat").innerHTML = h;
    Array.prototype.forEach.call($("hcChat").querySelectorAll(".chip"), function (c) { c.onclick = function () { $("hcQ").value = c.textContent; askHelp(); }; });
    $("hcLeft").textContent = left === null ? "" : left + " Help question" + (left === 1 ? "" : "s") + " left today";
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
        hist.push({ role: "assistant", content: "You have used all your Help questions for today. Please read the quick answers above, or contact the Nesty team by email and we will help you." });
      } else if (d && d.reply) {
        if (typeof d.left === "number") left = d.left;
        hist.push({ role: "assistant", content: d.reply + "\n\nDid this answer your question? If not, tap Email us below." });
      } else hist.push({ role: "assistant", content: (d && d.error) || "Sorry, I could not answer right now. Please try again, or email us below." });
    } catch (e) { hist.push({ role: "assistant", content: "Network problem. Please try again." }); }
    b.disabled = false; drawChat();
    var m = $("hcMain"); m.scrollTop = m.scrollHeight;
  }
  window.openHelp = function () { build(); drawChat(); root.style.display = "flex"; };
  window.closeHelp = function () { if (root) root.style.display = "none"; };
})();
