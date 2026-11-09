/* Nesty Office Center (Hiaru 5.1 / Pro plan) and Research Center (Tyra / Premium plan).
   Each tool is a small form. Nesty writes the paper, you edit it on screen, then copy, print or save it as a Word file. */
(function () {
  "use strict";
  if (window.goOffice && !window.goOffice.__stub) return;

  function $(i) { return document.getElementById(i); }
  function E(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function uid() { try { return (user && user.$id) || "guest"; } catch (e) { return "guest"; } }
  function lj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function today() { try { return typeof todayText === "function" ? todayText() : new Date().toDateString(); } catch (e) { return ""; } }
  var T = function (k, l, ph, o) { o = o || {}; return { k: k, l: l, ph: ph || "", t: o.t || "text", opts: o.opts, max: o.max }; };
  var A = function (k, l, ph, max) { return { k: k, l: l, ph: ph || "", t: "area", max: max || 1500 }; };
  var S = function (k, l, opts) { return { k: k, l: l, t: "sel", opts: opts }; };
  var STYLE = "Write ONLY the finished document in clean Markdown (no greeting to me, no explanations before or after). Use British spelling and Kenyan context (shillings, Kenyan places and norms) where it fits. Do not invent facts, names, numbers or dates the user did not give: leave a blank line like ______ for missing details. ";

  var CENTERS = {
    office: {
      title: "Office Center", sub: "Letters, minutes, CVs, reports and more, ready to print.", ic: "🏢", color: "#0f4c81", acc: "#ffc933", model: "hiaru", need: "pro", needTxt: "Office Center comes with Hiaru 5.1 (Pro plan).",
      tools: [
        { id: "letter", ic: "✉️", n: "Formal letter", d: "Official letters with a proper layout.", lh: 1, f: [T("to", "To (name, title, address)", "The Manager, ABC Ltd, Nairobi"), T("from", "From (your name)", ""), T("subj", "Subject", "Request for ..."), A("pts", "What do you want to say?", "Main points in your own words"), S("tone", "Tone", ["Formal", "Polite but firm", "Friendly formal"])], p: function (v) { return "Write a formal business letter dated " + today() + ". To: " + v.to + ". From: " + v.from + ". Subject: " + v.subj + ". Points to cover: " + v.pts + ". Tone: " + v.tone + ". Use a correct letter layout (date, addressee, salutation, bold subject line, body, closing, sign-off)."; } },
        { id: "apply", ic: "💼", n: "Job application letter", d: "A strong cover letter for a job.", f: [T("job", "Job title", "Sales Officer"), T("co", "Company", ""), T("me", "Your name", ""), A("bg", "Your background and strengths", "School, work, skills"), T("src", "Where you saw the job", "")], p: function (v) { return "Write a persuasive one-page job application letter dated " + today() + " from " + v.me + " for the post of " + v.job + " at " + v.co + (v.src ? " (advertised on " + v.src + ")" : "") + ". Background: " + v.bg + ". Keep it honest and confident, with a clear closing asking for an interview."; } },
        { id: "cv", ic: "📄", n: "CV / résumé", d: "A clean, modern CV.", f: [T("name", "Full name", ""), T("contact", "Phone, email, town", ""), A("prof", "About you (optional)", "", 600), A("edu", "Education", "School, years, grades", 800), A("exp", "Work experience", "Job, place, years, what you did", 1200), A("skills", "Skills and languages", "", 500), A("ref", "Referees (optional)", "", 500)], p: function (v) { return "Make a professional CV for " + v.name + ". Contact: " + v.contact + ". About: " + v.prof + ". Education: " + v.edu + ". Experience: " + v.exp + ". Skills: " + v.skills + ". Referees: " + (v.ref || "Available on request") + ". Write a short strong profile if none was given, use action verbs, sections with headings, newest first."; } },
        { id: "minutes", ic: "📝", n: "Meeting minutes", d: "Turn rough notes into neat minutes.", lh: 1, f: [T("title", "Meeting title", ""), T("date", "Date, time, place", ""), T("att", "Present (names)", ""), A("notes", "Your notes", "Type what was said and agreed, in any order", 2500)], p: function (v) { return "Turn these rough notes into professional meeting minutes. Meeting: " + v.title + ". " + v.date + ". Present: " + v.att + ". Notes: " + v.notes + ". Include: attendance, apologies (if any), agenda items, discussion summary, resolutions, action points in a table (Action, Owner, Deadline), and next meeting. Add a signature block for Chairperson and Secretary."; } },
        { id: "agenda", ic: "📋", n: "Meeting agenda", d: "A timed agenda to send before the meeting.", lh: 1, f: [T("title", "Meeting title", ""), T("when", "Date, time, venue", ""), A("topics", "Topics to discuss", "One per line", 800), T("len", "How long (minutes)", "60")], p: function (v) { return "Write a clear timed meeting agenda for: " + v.title + ". " + v.when + ". Topics: " + v.topics + ". Total length " + v.len + " minutes, give each item a time and a person-in-charge blank. Start with prayer/opening and welcome, end with AOB and closing."; } },
        { id: "memo", ic: "📌", n: "Memo or notice", d: "Short notices for staff, tenants or members.", lh: 1, f: [S("kind", "Type", ["Memo", "Notice", "Circular"]), T("to", "To", "All staff"), T("from", "From", ""), T("subj", "Subject", ""), A("msg", "Message points", "", 1000)], p: function (v) { return "Write a " + v.kind + " dated " + today() + ". To: " + v.to + ". From: " + v.from + ". Subject: " + v.subj + ". Message: " + v.msg + ". Keep it short and clear with the proper heading layout."; } },
        { id: "report", ic: "📊", n: "Report writer", d: "A full report from your findings.", lh: 1, f: [T("title", "Report title", ""), T("aud", "Who will read it", "Directors, donors, committee"), A("find", "What happened / findings / figures", "", 2500), S("len", "Length", ["Short (1 page)", "Medium (2 to 3 pages)", "Detailed (4+ pages)"])], p: function (v) { return "Write a " + v.len + " professional report titled \"" + v.title + "\" for " + v.aud + ". Material: " + v.find + ". Structure: executive summary, background, findings, analysis, conclusions, recommendations. Use headings and bullet points; use tables where figures are given."; } },
        { id: "email", ic: "📧", n: "Email writer", d: "Clear, polite emails.", f: [T("to", "To whom", "Supplier, boss, customer"), T("goal", "What is it about?", ""), A("pts", "Points to include", "", 800), S("tone", "Tone", ["Professional", "Friendly", "Firm", "Apologetic"])], p: function (v) { return "Write an email to " + v.to + " about: " + v.goal + ". Points: " + v.pts + ". Tone: " + v.tone + ". Give a subject line first, then the body, short and clear."; } },
        { id: "agree", ic: "🤝", n: "Simple agreement", d: "Draft rent, sale, service or loan agreements.", lh: 1, f: [S("kind", "Type", ["Rent (tenancy)", "Sale", "Service", "Loan", "Employment"]), A("who", "Who is involved", "Names, ID numbers, addresses", 600), A("terms", "Terms and amounts", "Money, dates, rules, duration", 1500)], p: function (v) { return "Draft a simple " + v.kind + " agreement under Kenyan practice. Parties: " + v.who + ". Terms: " + v.terms + ". Use numbered clauses, plain words, witness and signature blocks. End with this note in italics: This is a draft to help you. Have a lawyer check it before signing."; } },
        { id: "advert", ic: "📢", n: "Job advert", d: "Advert and job description.", lh: 1, f: [T("role", "Job title", ""), A("duties", "Main duties", "", 800), A("req", "Requirements", "", 800), T("how", "How to apply and deadline", "")], p: function (v) { return "Write a job advert and short job description for: " + v.role + ". Duties: " + v.duties + ". Requirements: " + v.req + ". How to apply: " + v.how + ". Include a line that qualified candidates of all genders are encouraged to apply."; } },
        { id: "rfq", ic: "🧾", n: "Quotation request / LPO", d: "Ask suppliers for prices or order goods.", lh: 1, f: [S("kind", "Type", ["Request for quotation", "Local purchase order"]), T("sup", "Supplier", ""), A("items", "Items and quantities", "One per line", 800), T("del", "Delivery date and place", "")], p: function (v) { return "Write a " + v.kind + " dated " + today() + " to " + v.sup + ". Items: " + v.items + ". Delivery: " + v.del + ". Put the items in a table (No, Description, Quantity, Unit price, Total) with blank price columns, and add payment terms and approval signatures."; } },
        { id: "speech", ic: "🎤", n: "Speech or announcement", d: "For events, meetings and ceremonies.", f: [T("occ", "Occasion", "Staff party, funeral, opening, wedding"), T("aud", "Audience", ""), A("pts", "Points to include", "", 800), S("len", "Length", ["1 minute", "3 minutes", "5 minutes"])], p: function (v) { return "Write a " + v.len + " speech for: " + v.occ + ". Audience: " + v.aud + ". Points: " + v.pts + ". Warm, natural and easy to read aloud."; } },
        { id: "plan", ic: "✅", n: "Task planner", d: "A project plan with owners and dates.", lh: 1, f: [T("proj", "Project", ""), T("dead", "Deadline", ""), A("tasks", "Tasks or goals", "One per line", 1000), T("team", "People involved", "")], p: function (v) { return "Make a project plan for: " + v.proj + ", deadline " + v.dead + ". Tasks: " + v.tasks + ". People: " + v.team + ". Give a table (Task, Owner, Start, Due, Status, Notes) with sensible dates working back from the deadline, plus 3 risks and how to handle them."; } },
        { id: "fix", ic: "🔍", n: "Proofread and improve", d: "Fix spelling and make it sound professional.", f: [A("txt", "Paste your text", "", 3000), S("goal", "Make it", ["Clearer", "More formal", "Shorter", "More persuasive"])], p: function (v) { return "Proofread and improve this text, making it " + v.goal + ". Keep the meaning. Give the improved text first, then a short list titled 'What I changed'.\n\n" + v.txt; } }
      ],
      extra: '<div class="card"><b>Need a spreadsheet or slides?</b><div class="m">Ask Hiaru in the chat. Try: "Make an Excel table of my staff salaries with borders" or "Make a PowerPoint about our year with charts".</div><button class="b ghost" data-chat="Make an Excel table with borders for: ">Open chat: Excel</button><button class="b ghost" data-chat="Make a PowerPoint with charts about: ">Open chat: PowerPoint</button></div>'
    },
    research: {
      title: "Research Center", sub: "Proposals, literature, questionnaires, citations and notes.", ic: "🔬", color: "#7a1f4d", acc: "#f4c542", model: "tyra", need: "premium", needTxt: "Research Center comes with Tyra (Premium plan).",
      tools: [
        { id: "over", ic: "🌍", n: "Topic overview with sources", d: "Searches the web and gives a cited overview.", deep: 1, f: [T("topic", "Topic", "e.g. Mobile money and small businesses in Kenya"), S("lvl", "Level", ["Secondary school", "College or diploma", "University degree", "Masters or PhD"]), A("focus", "Focus (optional)", "", 400)], p: function (v) { return "Research this topic and write a well organised overview for a " + v.lvl + " student: " + v.topic + ". " + (v.focus ? "Focus: " + v.focus + ". " : "") + "Include key ideas, recent facts and figures, debates, gaps, and end with a list of sources with links. Say clearly when something is uncertain."; } },
        { id: "prop", ic: "📑", n: "Research proposal", d: "Full proposal outline you can build on.", lh: 0, f: [T("title", "Working title", ""), S("lvl", "Level", ["Diploma", "Degree", "Masters", "PhD"]), T("area", "Area or county of study", ""), A("prob", "The problem you want to study", "", 800)], p: function (v) { return "Write a " + v.lvl + " research proposal for: " + v.title + ". Study area: " + v.area + ". Problem: " + v.prob + ". Chapters: introduction (background, problem statement, objectives, research questions, significance, scope), literature review plan, methodology, work plan table, budget outline, references to look for. Write real draft paragraphs, not only headings."; } },
        { id: "qs", ic: "❓", n: "Research questions and objectives", d: "Clear questions that can be answered.", f: [T("topic", "Topic", ""), S("lvl", "Level", ["Diploma", "Degree", "Masters", "PhD"]), A("ctx", "What do you already know?", "", 500)], p: function (v) { return "For a " + v.lvl + " study on \"" + v.topic + "\" (" + v.ctx + "), write: one general objective, 4 specific objectives (SMART verbs), matching research questions, 2 testable hypotheses, and 5 possible titles."; } },
        { id: "lit", ic: "📚", n: "Literature review helper", d: "Organise what others have written.", f: [T("topic", "Topic", ""), A("notes", "Paste notes or abstracts you have", "Authors, years, findings", 3000)], p: function (v) { return "Write a literature review section on \"" + v.topic + "\" from this material: " + v.notes + ". Group the studies by theme, compare findings, point out gaps, and end with a conceptual framework idea. Cite only authors and years that appear in my material; do not invent references."; } },
        { id: "quest", ic: "🗳️", n: "Questionnaire builder", d: "Survey or interview questions.", f: [T("topic", "What are you studying?", ""), T("who", "Who will answer?", "e.g. 100 shop owners in Kisumu"), S("kind", "Type", ["Questionnaire (closed and open questions)", "Interview guide", "Focus group guide"]), T("n", "Number of questions", "15")], p: function (v) { return "Build a " + v.kind + " about \"" + v.topic + "\" for " + v.who + " with about " + v.n + " questions. Add a short consent statement, section A with background questions, then the main sections, with answer options where useful. Keep the language simple."; } },
        { id: "method", ic: "🧪", n: "Methodology planner", d: "Design, sampling and analysis.", f: [T("topic", "Topic", ""), A("obj", "Your objectives", "", 600), T("pop", "Target population", "")], p: function (v) { return "Recommend and explain a methodology for a study on \"" + v.topic + "\" with objectives: " + v.obj + ". Population: " + v.pop + ". Cover research design, sampling technique and a sample size calculation, data collection tools, validity and reliability, data analysis methods, ethics and limitations."; } },
        { id: "sum", ic: "🧾", n: "Summarise and critique", d: "Key points and weaknesses of an article.", f: [A("txt", "Paste the article or abstract", "", 4000)], p: function (v) { return "Summarise this research text: (1) one paragraph summary, (2) key findings as bullets, (3) methods used, (4) strengths, (5) weaknesses and limitations, (6) how it could be used in my own work.\n\n" + v.txt; } },
        { id: "abs", ic: "🎯", n: "Abstract and thesis statement", d: "Write the short, important parts well.", f: [T("title", "Title", ""), A("what", "What you did and found", "", 1200)], p: function (v) { return "Write an abstract of about 200 words (background, objective, method, results, conclusion) and 3 strong thesis statements for: " + v.title + ". Material: " + v.what; } },
        { id: "data", ic: "📈", n: "Data analysis plan", d: "Which test to use and how to read results.", f: [A("obj", "Your questions or hypotheses", "", 600), A("data", "Your data (type, variables, numbers)", "", 1500)], p: function (v) { return "Advise how to analyse this data. Questions: " + v.obj + ". Data: " + v.data + ". Suggest the right statistical tests and why, how to do them in Excel or SPSS step by step, how to present tables and charts, and how to interpret typical results in plain words."; } },
        { id: "check", ic: "🛡️", n: "Source checker", d: "Is this source reliable?", f: [A("src", "Source details or text", "Title, author, website, what it claims", 2000)], p: function (v) { return "Judge how reliable this source is: " + v.src + ". Use a checklist (author, publisher, date, evidence, bias, peer review, cross-checking) and give a verdict (Strong, Fair or Weak) with reasons and what to check next."; } },
        { id: "cite", ic: "🔖", n: "Citation maker", d: "APA, MLA or Harvard references, instantly.", local: "cite" },
        { id: "notes", ic: "🗒️", n: "Research notebook", d: "Keep quotes, ideas and sources in one place.", local: "notes" }
      ],
      extra: ''
    }
  };

  var root = null, C = null, tool = null, out = "", busy = false;
  var CSS = "#cx{display:none;position:fixed;inset:0;z-index:96;flex-direction:column;background:#f7f8fb;color:#1b2430}#cx *{box-sizing:border-box}" +
    "#cx .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:var(--c);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.25)}#cx .top b{flex:1;font-size:18px}#cx .ib{background:var(--a);border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#1b2430}" +
    "#cxBody{flex:1;overflow-y:auto;padding:14px 14px 70px;max-width:760px;width:100%;margin:0 auto}#cx .m{color:#566274;font-size:13.5px;line-height:1.45}#cx h3{margin:12px 0 4px;font-size:16px}" +
    "#cx .card{background:#fff;border:1.5px solid #dbe2ee;border-radius:16px;padding:13px;margin:10px 0}#cx label{display:block;font-size:12.5px;font-weight:700;color:#3a465a;margin:9px 0 2px}" +
    "#cx input,#cx select,#cx textarea{width:100%;font:inherit;font-size:15px;padding:9px 10px;border:1.5px solid #c5cedd;border-radius:10px;background:#fff;color:#1b2430}#cx textarea{min-height:92px;resize:vertical}#cx input:focus,#cx textarea:focus,#cx select:focus{outline:0;border-color:var(--c);box-shadow:0 0 0 3px #dfe8f6}" +
    "#cx .b{display:inline-block;background:var(--c);color:#fff;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit}#cx .b.ghost{background:#fff;border:1.5px solid var(--c);color:var(--c)}#cx .b.gold{background:var(--a);color:#1b2430}" +
    "#cx .tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}#cx .tile{background:#fff;border:1.5px solid #dbe2ee;border-radius:16px;padding:13px 8px;text-align:center;font-weight:700;color:#1b2430;font-family:inherit;font-size:14px}#cx .tile i{display:block;font-style:normal;font-size:26px;margin-bottom:3px}#cx .tile small{display:block;font-weight:400;color:#566274;font-size:11.5px;margin-top:2px}" +
    "#cx .paper{background:#fff;border:1px solid #ccd3e0;border-radius:6px;padding:18px 16px;margin:10px 0;font-family:'Times New Roman',Georgia,serif;font-size:15.5px;line-height:1.55;color:#111;min-height:120px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow-x:auto}#cx .paper:focus{outline:2px solid var(--c)}#cx .paper table{border-collapse:collapse;width:100%}#cx .paper td,#cx .paper th{border:1px solid #666;padding:5px;font-size:14px}#cx .paper th{background:#eef1f7}" +
    "#cx .li{display:flex;gap:8px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #e8ecf3}#cx .li .t{flex:1;min-width:0;font-size:14px}#cx .x{background:#fde8e6;color:#b3261e;border:0;border-radius:8px;padding:5px 9px}";
  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "cx";
    root.innerHTML = '<div class="top"><button class="ib" id="cxBack">←</button><b id="cxTitle"></b><button class="ib" id="cxX">✕</button></div><div id="cxBody"></div>';
    document.body.appendChild(root);
    $("cxX").onclick = function () { root.style.display = "none"; };
    $("cxBack").onclick = function () { if (tool) { tool = null; menu(); } else root.style.display = "none"; };
    root.addEventListener("click", click);
  }
  function profile() { var b = lj("nestyBiz_" + uid(), {}) || {}; return b.profile || {}; }
  function letterhead() {
    var p = profile(); if (!p.name) return "";
    return '<div style="text-align:center;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:12px">' + (p.logo ? '<img src="' + p.logo + '" style="max-height:54px"><br>' : '') + '<b style="font-size:18px">' + E(p.name) + '</b><br><span style="font-size:13px">' + E([p.addr, p.phone, p.email].filter(Boolean).join("  |  ")) + '</span></div>';
  }
  function menu() {
    $("cxTitle").textContent = C.ic + " " + C.title; $("cxBack").style.display = "none";
    $("cxBody").innerHTML = '<div class="m">' + E(C.sub) + ' Each paper uses 1 message. You can edit it before printing.</div><div class="tiles" style="margin-top:10px">' + C.tools.map(function (t) { return '<button class="tile" data-t="' + t.id + '"><i>' + t.ic + '</i>' + E(t.n) + '<small>' + E(t.d) + '</small></button>'; }).join("") + '</div>' + (C.extra || "");
    root.style.display = "flex";
  }
  function fieldHtml(f) {
    var v = (lj("nestyCx_" + C.title + "_" + tool.id, {}) || {})[f.k] || "";
    if (f.t === "sel") return '<label>' + E(f.l) + '</label><select data-f="' + f.k + '">' + f.opts.map(function (o) { return '<option' + (o === v ? " selected" : "") + '>' + E(o) + '</option>'; }).join("") + '</select>';
    if (f.t === "area") return '<label>' + E(f.l) + '</label><textarea data-f="' + f.k + '" maxlength="' + f.max + '" placeholder="' + E(f.ph) + '">' + E(v) + '</textarea>';
    return '<label>' + E(f.l) + '</label><input data-f="' + f.k + '" value="' + E(v) + '" maxlength="' + (f.max || 120) + '" placeholder="' + E(f.ph) + '">';
  }
  function openTool(id) {
    tool = C.tools.filter(function (t) { return t.id === id; })[0]; out = "";
    $("cxTitle").textContent = tool.ic + " " + tool.n; $("cxBack").style.display = "";
    var b = $("cxBody"); b.scrollTop = 0;
    if (tool.local === "cite") { b.innerHTML = citeUi(); citeDraw(); return; }
    if (tool.local === "notes") { b.innerHTML = notesUi(); return; }
    b.innerHTML = '<div class="m">' + E(tool.d) + (tool.deep ? " Uses Deep search when your plan has it." : "") + '</div><div class="card">' + tool.f.map(fieldHtml).join("") + '<button class="b" data-go="1">✨ Write it (1 message)</button></div><div id="cxRes"></div>';
  }
  function vals() { var o = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-f]"), function (e) { o[e.getAttribute("data-f")] = e.value.trim(); }); try { localStorage.setItem("nestyCx_" + C.title + "_" + tool.id, JSON.stringify(o)); } catch (e) {} return o; }
  async function ask(prompt, deep) {
    var jwt = await getJwt();
    var body = { model: C.model, stream: false, userName: (typeof firstName === "function" ? firstName() : ""), today: today(), messages: [{ role: "user", content: prompt }] };
    if (deep && typeof me !== "undefined" && me && me.deep) body.deep = true;
    var res = await fetch("/.netlify/functions/chat", { method: "POST", headers: { "Content-Type": "application/json", "X-Nesty-Token": jwt }, body: JSON.stringify(body) });
    var d; try { d = await res.json(); } catch (e) { throw "Network problem. Please try again."; }
    if (d.limited) throw "You have used all your messages for now. Try again later.";
    if (d.needLogin) throw "Please sign in again.";
    try { noteUsage(d); } catch (e) {}
    return String(d.reply || "");
  }
  async function go() {
    if (busy) return; var v = vals();
    var miss = tool.f.filter(function (f) { return f.t !== "sel" && !v[f.k] && /^(title|topic|to|job|name|who|obj|txt|src|notes|find|pts|msg|tasks|terms|items|proj|what|goal)$/.test(f.k); });
    if (miss.length === tool.f.filter(function (f) { return f.t !== "sel"; }).length) { toast("Fill in the details first."); return; }
    busy = true; $("cxRes").innerHTML = '<div class="m" style="padding:14px 0">✍️ Nesty is writing... ' + (tool.deep ? "searching the web too, this can take a minute." : "") + '</div>';
    try {
      out = await ask(STYLE + tool.p(v), tool.deep);
      show();
    } catch (e) { $("cxRes").innerHTML = '<div class="card m">' + E(typeof e === "string" ? e : "Something went wrong. Please try again.") + '</div>'; }
    busy = false;
  }
  function show() {
    var html = (typeof mdToHtml === "function") ? mdToHtml(out) : "<p>" + E(out).replace(/\n/g, "<br>") + "</p>";
    $("cxRes").innerHTML = '<div class="m">You can tap the paper and edit it.</div><div class="paper" id="cxPaper" contenteditable="true">' + (tool.lh ? letterhead() : "") + html + '</div>' +
      '<button class="b" data-a="print">🖨️ Print</button><button class="b ghost" data-a="doc">⬇️ Word file</button><button class="b ghost" data-a="copy">📋 Copy</button><button class="b gold" data-go="1">🔄 Write again</button>';
  }
  function paperHtml(title, body) { return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + E(title) + '</title><style>@page{size:A4;margin:20mm}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5}table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:5px}th{background:#eee}h1{font-size:18pt}h2{font-size:14pt}</style></head><body>' + body + '</body></html>'; }
  function printIt(title, body) {
    var f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; document.body.appendChild(f);
    f.onload = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast("Could not open the print window."); } setTimeout(function () { if (f.parentNode) f.remove(); }, 180000); };
    f.srcdoc = paperHtml(title, body);
  }
  function fname(t) { return String(t).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "paper"; }

  /* ----- citation maker ----- */
  function cv() { var o = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-c]"), function (e) { o[e.getAttribute("data-c")] = e.value.trim(); }); return o; }
  function citeUi() {
    var s = lj("nestyCite_" + uid(), {}) || {};
    var f = function (k, l, ph) { return '<label>' + l + '</label><input data-c="' + k + '" placeholder="' + E(ph || "") + '" value="' + E(s[k] || "") + '">'; };
    return '<div class="card"><div class="g2"><label>Style</label><select data-c="style"><option>APA 7</option><option>MLA 9</option><option>Harvard</option></select><label>Source type</label><select data-c="type"><option>Book</option><option>Website</option><option>Journal article</option></select></div>' +
      f("au", "Author(s)", "Njoroge, J. K. & Achieng, M.") + f("yr", "Year", "2023") + f("ti", "Title", "") + f("pub", "Publisher, website or journal name", "") + f("vol", "Volume(issue), pages (journals)", "12(3), 45-60") + f("url", "Link (websites, online articles)", "https://") + f("acc", "Date you read it (websites)", "9 November 2026") +
      '</div><div class="card"><b>Your reference</b><div class="paper" id="citeOut" style="min-height:60px"></div><button class="b" data-a="citeAdd">➕ Add to my list</button><button class="b ghost" data-a="citeCopy">📋 Copy</button></div><div id="citeList"></div>';
  }
  function cite(c) {
    var au = c.au || "Author", yr = c.yr || "n.d.", ti = c.ti || "Title", pub = c.pub || "", it = function (x) { return "<i>" + E(x) + "</i>"; }, e = E, st = c.style || "APA 7", ty = c.type || "Book", u = c.url ? " " + e(c.url) : "";
    if (st === "APA 7") return ty === "Book" ? e(au) + " (" + e(yr) + "). " + it(ti) + ". " + e(pub) + "." : ty === "Website" ? e(au) + " (" + e(yr) + "). " + it(ti) + ". " + e(pub) + "." + u : e(au) + " (" + e(yr) + "). " + e(ti) + ". " + it(pub) + ", " + e(c.vol || "") + "." + u;
    if (st === "MLA 9") return ty === "Book" ? e(au) + ". " + it(ti) + ". " + e(pub) + ", " + e(yr) + "." : ty === "Website" ? e(au) + ". \"" + e(ti) + ".\" " + it(pub) + ", " + e(yr) + "," + u + (c.acc ? ". Accessed " + e(c.acc) : "") + "." : e(au) + ". \"" + e(ti) + ".\" " + it(pub) + ", " + e(c.vol || "") + ", " + e(yr) + "." + u;
    return ty === "Book" ? e(au) + " (" + e(yr) + ") " + it(ti) + ". " + e(pub) + "." : ty === "Website" ? e(au) + " (" + e(yr) + ") " + it(ti) + ". Available at:" + u + (c.acc ? " (Accessed: " + e(c.acc) + ")" : "") + "." : e(au) + " (" + e(yr) + ") '" + e(ti) + "', " + it(pub) + ", " + e(c.vol || "") + "." + (c.url ? " Available at:" + u + "." : "");
  }
  function citeDraw() { var c = cv(); try { localStorage.setItem("nestyCite_" + uid(), JSON.stringify(c)); } catch (e) {} $("citeOut").innerHTML = cite(c); var L = lj("nestyRefs_" + uid(), []); $("citeList").innerHTML = L.length ? '<div class="card"><b>My reference list (' + L.length + ')</b><div class="paper" id="refPaper" style="min-height:40px">' + L.slice().sort(function (a, b) { return a.replace(/<[^>]+>/g, "").localeCompare(b.replace(/<[^>]+>/g, "")); }).map(function (r) { return '<p style="padding-left:28px;text-indent:-28px">' + r + '</p>'; }).join("") + '</div><button class="b" data-a="refPrint">🖨️ Print</button><button class="b ghost" data-a="refDoc">⬇️ Word file</button><button class="b ghost" data-a="refClear">Clear list</button></div>' : ""; }

  /* ----- notebook ----- */
  function notesUi() {
    var N = lj("nestyRsNotes_" + uid(), []);
    return '<div class="card"><label>Title or topic</label><input id="nT" maxlength="60"><label>Source (author, year, page)</label><input id="nS" maxlength="100"><label>Quote or idea</label><textarea id="nX" maxlength="1500"></textarea><button class="b" data-a="nAdd">Save note</button></div>' +
      (N.length ? '<div class="card"><b>My notes (' + N.length + ')</b>' + N.map(function (n, i) { return '<div class="li"><div class="t"><b>' + E(n.t) + '</b><br>' + E(n.x) + '<br><span class="m">' + E(n.s) + '</span></div><button class="x" data-nd="' + i + '">✕</button></div>'; }).join("") + '<button class="b ghost" data-a="nPrint">🖨️ Print notes</button></div>' : '<div class="m">No notes yet. Saved only on this phone.</div>');
  }

  function click(e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
    var g = function (k) { return t.getAttribute(k); };
    if (g("data-t")) { openTool(g("data-t")); return; }
    if (g("data-chat")) { root.style.display = "none"; var bx = $("box"); if (bx) { bx.value = g("data-chat"); bx.focus(); } return; }
    if (g("data-go")) { go(); return; }
    if (g("data-nd") !== null) { var N0 = lj("nestyRsNotes_" + uid(), []); N0.splice(parseInt(g("data-nd"), 10), 1); localStorage.setItem("nestyRsNotes_" + uid(), JSON.stringify(N0)); $("cxBody").innerHTML = notesUi(); return; }
    var a = g("data-a"); if (!a) return;
    var p = $("cxPaper"), title = tool ? tool.n : "paper";
    if (a === "print") printIt(title, p.innerHTML);
    else if (a === "doc") saveBlob(new Blob(["﻿" + paperHtml(title, p.innerHTML)], { type: "application/msword" }), fname(title) + ".doc");
    else if (a === "copy") { var txt = p.innerText; try { navigator.clipboard.writeText(txt); toast("Copied."); } catch (e2) { toast("Could not copy."); } }
    else if (a === "citeAdd") { var L = lj("nestyRefs_" + uid(), []); L.push(cite(cv())); localStorage.setItem("nestyRefs_" + uid(), JSON.stringify(L.slice(-200))); citeDraw(); toast("Added."); }
    else if (a === "citeCopy") { try { navigator.clipboard.writeText($("citeOut").innerText); toast("Copied."); } catch (e3) { toast("Could not copy."); } }
    else if (a === "refPrint") printIt("References", "<h2>References</h2>" + $("refPaper").innerHTML);
    else if (a === "refDoc") saveBlob(new Blob(["﻿" + paperHtml("References", "<h2>References</h2>" + $("refPaper").innerHTML)], { type: "application/msword" }), "references.doc");
    else if (a === "refClear") { localStorage.removeItem("nestyRefs_" + uid()); citeDraw(); }
    else if (a === "nAdd") { var tt = $("nT").value.trim(), xx = $("nX").value.trim(); if (!xx) { toast("Type the quote or idea."); return; } var N = lj("nestyRsNotes_" + uid(), []); N.unshift({ t: tt || "Note", s: $("nS").value.trim(), x: xx }); localStorage.setItem("nestyRsNotes_" + uid(), JSON.stringify(N.slice(0, 300))); $("cxBody").innerHTML = notesUi(); }
    else if (a === "nPrint") { var N2 = lj("nestyRsNotes_" + uid(), []); printIt("Research notes", "<h2>Research notes</h2>" + N2.map(function (n) { return "<p><b>" + E(n.t) + "</b><br>" + E(n.x) + "<br><i>" + E(n.s) + "</i></p>"; }).join("")); }
  }
  document.addEventListener("input", function (e) { if (root && e.target && e.target.getAttribute && e.target.getAttribute("data-c") !== null && root.contains(e.target)) citeDraw(); });
  document.addEventListener("change", function (e) { if (root && e.target && e.target.getAttribute && e.target.getAttribute("data-c") !== null && root.contains(e.target)) citeDraw(); });

  function enter(key) {
    C = CENTERS[key]; tool = null; build();
    var ok = true;
    try { ok = (typeof allowedModels === "function") && allowedModels().indexOf(C.model) > -1; } catch (e) {}
    if (!ok) { toast(C.needTxt); try { openPlans(C.need); } catch (e) {} return; }
    root.style.setProperty("--c", C.color); root.style.setProperty("--a", C.acc);
    menu();
  }
  window.goOffice = function () { enter("office"); };
  window.goResearch = function () { enter("research"); };
})();
