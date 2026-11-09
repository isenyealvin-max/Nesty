/* Nesty Business tools (shown for the Hiaru 5.1 office model): invoices, receipts, quotations, cash book, budget, price list.
   Everything here works on the phone with no AI messages used. Deep green and gold. */
(function () {
  "use strict";
  if (window.goBiz && !window.goBiz.__stub) return;

  function $(i) { return document.getElementById(i); }
  function E(s) { return esc(String(s == null ? "" : s)); }
  function uid() { try { return (user && user.$id) || "guest"; } catch (e) { return "guest"; } }
  function lj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var KEY = function () { return "nestyBiz_" + uid(); };
  var B = null;
  function load() {
    if (B) return B;
    B = lj(KEY(), {}) || {};
    B.profile = B.profile || { name: "", phone: "", email: "", addr: "", pin: "", pay: "", cur: "KSh", logo: "" };
    B.cash = B.cash || []; B.budget = B.budget || []; B.prices = B.prices || []; B.n = B.n || 0;
    B.draft = B.draft || null;
    return B;
  }
  function save() { try { localStorage.setItem(KEY(), JSON.stringify(B)); } catch (e) { toast("Your phone storage is full."); } }
  function nid() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function num(v) { v = parseFloat(String(v).replace(/,/g, "")); return isNaN(v) ? 0 : v; }
  function money(v) { return (load().profile.cur || "KSh") + " " + (Math.round(v * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function today() { return new Date().toISOString().slice(0, 10); }

  var CSS = "" +
    "#bz{display:none;position:fixed;inset:0;z-index:90;flex-direction:column;background:#fffdf3;color:#12301f}#bz *{box-sizing:border-box}" +
    "#bz .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#1f8a5b;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.2)}#bz .top b{flex:1;font-size:18px}" +
    "#bz .ib{background:#ffc933;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#12301f}" +
    "#bzBody{flex:1;overflow-y:auto;padding:14px 14px 70px;max-width:760px;width:100%;margin:0 auto}" +
    "#bz h3{margin:14px 0 6px;font-size:16px}#bz .m{color:#4b6355;font-size:13.5px;line-height:1.45}" +
    "#bz .card{background:#fff;border:1.5px solid #bfe3cf;border-radius:16px;padding:13px;margin:10px 0}#bz .card.gold{background:#fff3c4;border-color:#ffd566}" +
    "#bz label{display:block;font-size:12.5px;font-weight:700;color:#2d5240;margin:9px 0 2px}" +
    "#bz input,#bz select,#bz textarea{width:100%;font:inherit;font-size:15px;padding:9px 10px;border:1.5px solid #9fd1b6;border-radius:10px;background:#fff;color:#12301f}" +
    "#bz input:focus,#bz textarea:focus,#bz select:focus{outline:0;border-color:#ffb800;box-shadow:0 0 0 3px #ffe9a3}" +
    "#bz .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    "#bz .b{display:inline-block;background:#ffc933;color:#12301f;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit}" +
    "#bz .b.s{padding:6px 11px;font-size:13px;margin:6px 6px 0 0}#bz .b.green{background:#1f8a5b;color:#fff}#bz .b.ghost{background:#fff;border:1.5px solid #1f8a5b;color:#176b47}" +
    "#bz .tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}#bz .tile{background:#e3f5ea;border:1.5px solid #bfe3cf;border-radius:16px;padding:14px 8px;text-align:center;font-weight:700;color:#12301f;font-family:inherit;font-size:14px}#bz .tile i{display:block;font-style:normal;font-size:27px;margin-bottom:3px}#bz .tile:nth-child(4n+2),#bz .tile:nth-child(4n+3){background:#fff3c4;border-color:#ffd566}" +
    "#bz table{width:100%;border-collapse:collapse;font-size:13.5px}#bz th{background:#e3f5ea;text-align:left;padding:6px}#bz td{padding:4px 3px;border-bottom:1px solid #e3f2e8}#bz td input{padding:7px}" +
    "#bz .tot{display:flex;justify-content:space-between;padding:4px 0}#bz .tot.big{font-weight:900;font-size:18px;border-top:2px solid #1f8a5b;margin-top:4px;padding-top:8px}" +
    "#bz .li{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #e3f2e8}#bz .li .t{flex:1;min-width:0}" +
    "#bz .pos{color:#176b47;font-weight:800}#bz .neg{color:#b3261e;font-weight:800}";
  var root = null, view = "menu", inv = null;
  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "bz";
    root.innerHTML = '<div class="top"><button class="ib" id="bzBack" style="display:none">←</button><b id="bzTitle">Business tools</b><button class="ib" id="bzX">✕</button></div><div id="bzBody"></div>';
    document.body.appendChild(root);
    $("bzX").onclick = function () { root.style.display = "none"; };
    $("bzBack").onclick = function () { open("menu"); };
    root.addEventListener("click", click);
    root.addEventListener("input", input);
    root.addEventListener("change", function (e) { if (e.target.id === "bzLogo") logo(e.target); });
  }
  var TITLES = { menu: "Business tools", profile: "My business", invoice: "Invoice / receipt", cash: "Cash book", budget: "Budget planner", prices: "Price list" };
  function open(v) {
    build(); view = v; load();
    $("bzTitle").textContent = TITLES[v]; $("bzBack").style.display = v === "menu" ? "none" : "";
    $("bzBody").innerHTML = V[v]();
    root.style.display = "flex";
    if (v === "invoice") calcInv();
  }
  window.goBiz = function () { B = null; open("menu"); };

  var V = {};
  V.menu = function () {
    var p = load().profile;
    return '<div class="m">Make professional papers for your business. Nothing here uses your Nesty messages.</div>' +
      (!p.name ? '<div class="card gold"><b>Start here</b><div class="m">Add your business name, phone and logo once. They appear on every invoice.</div><button class="b green" data-o="profile">Set up my business</button></div>' : '') +
      '<div class="card gold"><b>🎨 Brand Studio</b><div class="m">Design your logo, ads, shop banner, payment sign and cards, then print them or save them as pictures.</div><div class="tiles" style="margin-top:8px"><button class="tile" data-x="logo"><i>🎨</i>Logo maker</button><button class="tile" data-x="ad"><i>📣</i>Ad poster</button><button class="tile" data-x="banner"><i>🪧</i>Shop banner</button><button class="tile" data-x="pay"><i>💳</i>Payment sign</button><button class="tile" data-x="card"><i>📇</i>Business card</button><button class="tile" data-x="loyal"><i>🎟️</i>Loyalty card</button></div><button class="b green" data-x="brand">🏪 My brand details</button></div>' +
      '<div class="tiles" style="margin-top:10px"><button class="tile" data-o="invoice"><i>🧾</i>Invoice, receipt or quotation</button><button class="tile" data-o="cash"><i>📒</i>Cash book</button><button class="tile" data-o="budget"><i>🧮</i>Budget planner</button><button class="tile" data-o="prices"><i>🏷️</i>Price list</button><button class="tile" data-o="profile"><i>🏢</i>My business</button></div>' +
      '<div class="card"><b>Need words or a spreadsheet?</b><div class="m">Ask Hiaru in the chat: a business plan, an Excel table with borders, or a PowerPoint with charts.</div></div>';
  };
  V.profile = function () {
    var p = load().profile;
    return '<div class="card"><label>Business name</label><input data-p="name" value="' + E(p.name) + '" maxlength="60"><div class="g2"><div><label>Phone</label><input data-p="phone" value="' + E(p.phone) + '" maxlength="30"></div><div><label>Email</label><input data-p="email" value="' + E(p.email) + '" maxlength="60"></div></div><label>Address</label><input data-p="addr" value="' + E(p.addr) + '" maxlength="100"><div class="g2"><div><label>KRA PIN (optional)</label><input data-p="pin" value="' + E(p.pin) + '" maxlength="20"></div><div><label>Currency</label><input data-p="cur" value="' + E(p.cur || "KSh") + '" maxlength="6"></div></div><label>How customers pay (shown on invoices)</label><input data-p="pay" value="' + E(p.pay) + '" maxlength="120" placeholder="e.g. M-Pesa Till 123456 (Amina Traders)">' +
      '<label>Logo (optional)</label>' + (p.logo ? '<img src="' + p.logo + '" alt="Logo" style="max-height:70px;display:block;margin:4px 0">' : '') + '<input type="file" id="bzLogo" accept="image/*"><div class="m">Saved on this phone. Tap Done when finished.</div><button class="b green" data-o="menu">Done</button></div>';
  };
  function logo(inp) {
    var f = inp.files[0]; if (!f) return;
    fitImage(f, 240, false, 0.85).then(function (d) { load().profile.logo = d; save(); open("profile"); }).catch(function () { toast("Could not open that picture."); });
  }
  function newInv() { return { type: "Invoice", no: "", client: "", cphone: "", date: today(), items: [{ d: "", q: "1", p: "" }], tax: "0", disc: "0", notes: "" }; }
  V.invoice = function () {
    load(); inv = B.draft || newInv(); if (!inv.no) inv.no = String(B.n + 1).padStart(4, "0");
    return '<div class="card"><div class="g2"><div><label>Type</label><select data-i="type">' + ["Invoice", "Receipt", "Quotation"].map(function (t) { return '<option' + (inv.type === t ? " selected" : "") + '>' + t + '</option>'; }).join("") + '</select></div><div><label>Number</label><input data-i="no" value="' + E(inv.no) + '" maxlength="12"></div></div>' +
      '<div class="g2"><div><label>Customer name</label><input data-i="client" value="' + E(inv.client) + '" maxlength="60"></div><div><label>Customer phone</label><input data-i="cphone" value="' + E(inv.cphone) + '" maxlength="30"></div></div><label>Date</label><input type="date" data-i="date" value="' + E(inv.date) + '">' +
      '<h3>Items</h3><div style="overflow-x:auto"><table><tr><th>Item</th><th style="width:60px">Qty</th><th style="width:90px">Price</th><th></th></tr>' + inv.items.map(function (it, i) { return '<tr><td><input data-it="' + i + '" data-k="d" value="' + E(it.d) + '" maxlength="80" placeholder="Description"></td><td><input data-it="' + i + '" data-k="q" value="' + E(it.q) + '" inputmode="decimal"></td><td><input data-it="' + i + '" data-k="p" value="' + E(it.p) + '" inputmode="decimal"></td><td><button class="b s ghost" data-rm="' + i + '">✕</button></td></tr>'; }).join("") + '</table></div><button class="b s green" data-add="1">+ Add item</button>' +
      '<div class="g2"><div><label>Discount (amount)</label><input data-i="disc" value="' + E(inv.disc) + '" inputmode="decimal"></div><div><label>Tax / VAT (%)</label><input data-i="tax" value="' + E(inv.tax) + '" inputmode="decimal"></div></div><label>Notes</label><input data-i="notes" value="' + E(inv.notes) + '" maxlength="160" placeholder="e.g. Thank you for your business">' +
      '<div id="invTot" style="margin-top:10px"></div></div><button class="b green" data-a="invDl">Download (Word)</button><button class="b" data-a="invPrint">Print or save as PDF</button><button class="b ghost" data-a="invWa">Send on WhatsApp</button><button class="b s ghost" data-a="invNew">New blank</button>';
  };
  function totals() {
    var sub = 0; inv.items.forEach(function (it) { sub += num(it.q) * num(it.p); });
    var disc = Math.min(sub, num(inv.disc)), taxable = sub - disc, tax = taxable * num(inv.tax) / 100;
    return { sub: sub, disc: disc, tax: tax, total: taxable + tax };
  }
  function calcInv() {
    var t = totals(), box = $("invTot"); if (!box) return;
    box.innerHTML = '<div class="tot"><span>Subtotal</span><span>' + money(t.sub) + '</span></div>' + (t.disc ? '<div class="tot"><span>Discount</span><span>- ' + money(t.disc) + '</span></div>' : '') + (t.tax ? '<div class="tot"><span>Tax (' + E(inv.tax) + '%)</span><span>' + money(t.tax) + '</span></div>' : '') + '<div class="tot big"><span>Total</span><span>' + money(t.total) + '</span></div>';
    B.draft = inv; save();
  }
  function head() {
    var p = load().profile;
    return '<table style="border:0"><tr><td style="border:0">' + (p.logo ? '<img src="' + p.logo + '" style="max-height:60px"><br>' : '') + '<b style="font-size:16pt">' + E(p.name || "My business") + '</b><br>' + [p.addr, p.phone, p.email, p.pin ? "PIN " + p.pin : ""].filter(Boolean).map(E).join("<br>") + '</td></tr></table>';
  }
  function invHtml() {
    var t = totals(), p = load().profile;
    return head() + '<h1 style="text-align:right;margin:6px 0">' + E(inv.type.toUpperCase()) + '</h1><p style="text-align:right">No. ' + E(inv.no) + '<br>Date: ' + E(inv.date) + '</p><p><b>For:</b> ' + E(inv.client || "-") + (inv.cphone ? "<br>" + E(inv.cphone) : "") + '</p>' +
      '<table><tr><th>#</th><th>Description</th><th>Qty</th><th>Price</th><th>Amount</th></tr>' + inv.items.filter(function (it) { return it.d || num(it.p); }).map(function (it, i) { return '<tr><td>' + (i + 1) + '</td><td>' + E(it.d) + '</td><td>' + E(it.q) + '</td><td>' + money(num(it.p)) + '</td><td>' + money(num(it.q) * num(it.p)) + '</td></tr>'; }).join("") + '</table>' +
      '<p style="text-align:right">Subtotal: ' + money(t.sub) + (t.disc ? '<br>Discount: - ' + money(t.disc) : '') + (t.tax ? '<br>Tax (' + E(inv.tax) + '%): ' + money(t.tax) : '') + '<br><b style="font-size:14pt">Total: ' + money(t.total) + '</b></p>' +
      (inv.type === "Receipt" ? '<p><b>PAID. Thank you!</b></p>' : '') + (inv.type !== "Receipt" && p.pay ? '<p><b>How to pay:</b> ' + E(p.pay) + '</p>' : '') + (inv.notes ? '<p>' + E(inv.notes) + '</p>' : '');
  }
  function paper(title, body) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + E(title) + '</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}table{border-collapse:collapse;width:100%}th,td{border:1px solid #444;padding:6px;text-align:left;vertical-align:top}th{background:#e3f5ea}</style></head><body>' + body + '</body></html>';
  }
  function dl(title, body) { saveBlob(new Blob(["﻿" + paper(title, body)], { type: "application/msword" }), String(title).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) + ".doc"); }
  function printIt(title, body) {
    var f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; document.body.appendChild(f);
    f.onload = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast("Could not open the print window."); } setTimeout(function () { if (f.parentNode) f.remove(); }, 120000); };
    f.srcdoc = paper(title, body);
  }
  function csv(rows) { return "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n"); }

  V.cash = function () {
    load();
    var months = {}; B.cash.forEach(function (c) { months[c.d.slice(0, 7)] = 1; });
    var sel = cashMonth, list = B.cash.filter(function (c) { return !sel || c.d.slice(0, 7) === sel; }).sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    var inn = 0, out = 0; list.forEach(function (c) { if (c.t === "in") inn += c.a; else out += c.a; });
    return '<div class="card"><div class="g2"><div><label>Type</label><select id="cT"><option value="in">Money in (sale)</option><option value="out">Money out (expense)</option></select></div><div><label>Amount</label><input id="cA" inputmode="decimal" placeholder="0"></div></div><div class="g2"><div><label>What for</label><input id="cD" maxlength="60" placeholder="e.g. Sold 5 packets"></div><div><label>Date</label><input id="cDt" type="date" value="' + today() + '"></div></div><button class="b green" data-a="cashAdd">Add entry</button></div>' +
      '<div class="card gold"><div class="g2"><div><label>Month</label><select id="cM"><option value="">All time</option>' + Object.keys(months).sort().reverse().map(function (m) { return '<option' + (m === sel ? " selected" : "") + '>' + m + '</option>'; }).join("") + '</select></div><div></div></div>' +
      '<div class="tot"><span>Money in</span><span class="pos">' + money(inn) + '</span></div><div class="tot"><span>Money out</span><span class="neg">' + money(out) + '</span></div><div class="tot big"><span>Balance</span><span class="' + (inn - out >= 0 ? "pos" : "neg") + '">' + money(inn - out) + '</span></div></div>' +
      '<div class="card">' + (list.length ? list.map(function (c) { return '<div class="li"><div class="t"><b>' + E(c.n || (c.t === "in" ? "Money in" : "Money out")) + '</b><div class="m">' + E(c.d) + '</div></div><span class="' + (c.t === "in" ? "pos" : "neg") + '">' + (c.t === "in" ? "+" : "-") + money(c.a) + '</span><button class="b s ghost" data-cd="' + c.id + '">✕</button></div>'; }).join("") : '<div class="m">No entries yet. Add your first sale or expense above.</div>') + '</div>' +
      '<button class="b green" data-a="cashDl">Download (Word)</button><button class="b ghost" data-a="cashCsv">Download for Excel (CSV)</button><button class="b ghost" data-a="cashPrint">Print</button>';
  };
  var cashMonth = "";
  V.budget = function () {
    load();
    var pl = 0, ac = 0; B.budget.forEach(function (r) { pl += r.p; ac += r.a; });
    return '<div class="m">List what you plan to spend, then type what you actually spent.</div><div class="card" style="overflow-x:auto"><table><tr><th>Item</th><th style="width:85px">Planned</th><th style="width:85px">Actual</th><th></th></tr>' +
      B.budget.map(function (r, i) { return '<tr><td><input data-bg="' + i + '" data-k="c" value="' + E(r.c) + '" maxlength="40"></td><td><input data-bg="' + i + '" data-k="p" value="' + (r.p || "") + '" inputmode="decimal"></td><td><input data-bg="' + i + '" data-k="a" value="' + (r.a || "") + '" inputmode="decimal"></td><td><button class="b s ghost" data-bd="' + i + '">✕</button></td></tr>'; }).join("") +
      '</table><button class="b s green" data-a="bgAdd">+ Add item</button></div><div class="card gold" id="bgTot"></div><button class="b green" data-a="bgDl">Download (Word)</button><button class="b ghost" data-a="bgCsv">Download for Excel (CSV)</button><button class="b ghost" data-a="bgPrint">Print</button>';
  };
  function bgTot() {
    var pl = 0, ac = 0; B.budget.forEach(function (r) { pl += r.p; ac += r.a; });
    var e = $("bgTot"); if (e) e.innerHTML = '<div class="tot"><span>Planned</span><span>' + money(pl) + '</span></div><div class="tot"><span>Actual</span><span>' + money(ac) + '</span></div><div class="tot big"><span>' + (pl - ac >= 0 ? "Left over" : "Overspent") + '</span><span class="' + (pl - ac >= 0 ? "pos" : "neg") + '">' + money(Math.abs(pl - ac)) + '</span></div>';
  }
  V.prices = function () {
    load();
    return '<div class="m">Make a clean price list for your customers.</div><div class="card" style="overflow-x:auto"><table><tr><th>Item</th><th style="width:100px">Price</th><th></th></tr>' + B.prices.map(function (r, i) { return '<tr><td><input data-pr="' + i + '" data-k="n" value="' + E(r.n) + '" maxlength="60"></td><td><input data-pr="' + i + '" data-k="p" value="' + (r.p || "") + '" inputmode="decimal"></td><td><button class="b s ghost" data-pd="' + i + '">✕</button></td></tr>'; }).join("") + '</table><button class="b s green" data-a="prAdd">+ Add item</button></div><button class="b green" data-a="prDl">Download (Word)</button><button class="b" data-a="prPrint">Print or save as PDF</button>';
  };
  function tableHtml(head, rows) { return '<table><tr>' + head.map(function (h) { return '<th>' + E(h) + '</th>'; }).join("") + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + E(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</table>'; }
  function cashDoc() { var list = load().cash.filter(function (c) { return !cashMonth || c.d.slice(0, 7) === cashMonth; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; }), bal = 0; return { head: ["Date", "Details", "Money in", "Money out", "Balance"], rows: list.map(function (c) { bal += c.t === "in" ? c.a : -c.a; return [c.d, c.n, c.t === "in" ? money(c.a) : "", c.t === "out" ? money(c.a) : "", money(bal)]; }) }; }
  function bgDoc() { return { head: ["Item", "Planned", "Actual", "Difference"], rows: load().budget.map(function (r) { return [r.c, money(r.p), money(r.a), money(r.p - r.a)]; }) }; }
  function prDoc() { return { head: ["Item", "Price"], rows: load().prices.map(function (r) { return [r.n, money(r.p)]; }) }; }

  function click(e) {
    var t = e.target.closest ? e.target.closest("button") : null;
    if (!t) return;
    load();
    var g = function (k) { return t.getAttribute(k); };
    if (g("data-x")) { if (window.goBrand) goBrand(g("data-x")); return; }
    if (g("data-o")) { open(g("data-o")); return; }
    if (g("data-rm") !== null) { inv.items.splice(parseInt(g("data-rm"), 10), 1); if (!inv.items.length) inv.items.push({ d: "", q: "1", p: "" }); B.draft = inv; save(); open("invoice"); return; }
    if (g("data-add")) { inv.items.push({ d: "", q: "1", p: "" }); B.draft = inv; save(); open("invoice"); return; }
    if (g("data-cd")) { B.cash = B.cash.filter(function (c) { return c.id !== g("data-cd"); }); save(); open("cash"); return; }
    if (g("data-bd") !== null) { B.budget.splice(parseInt(g("data-bd"), 10), 1); save(); open("budget"); return; }
    if (g("data-pd") !== null) { B.prices.splice(parseInt(g("data-pd"), 10), 1); save(); open("prices"); return; }
    var a = g("data-a");
    if (a === "invDl") dl(inv.type + " " + inv.no, invHtml());
    else if (a === "invPrint") printIt(inv.type + " " + inv.no, invHtml());
    else if (a === "invWa") { var tt = totals(); window.open("https://wa.me/?text=" + encodeURIComponent(inv.type + " no. " + inv.no + " from " + (B.profile.name || "my business") + "\n" + inv.items.filter(function (it) { return it.d; }).map(function (it) { return it.q + " x " + it.d + " = " + money(num(it.q) * num(it.p)); }).join("\n") + "\nTotal: " + money(tt.total) + (B.profile.pay ? "\nPay: " + B.profile.pay : "")), "_blank"); }
    else if (a === "invNew") { B.n += 1; B.draft = null; save(); open("invoice"); }
    else if (a === "cashAdd") {
      var amt = num($("cA").value); if (amt <= 0) { toast("Type an amount."); return; }
      B.cash.push({ id: nid(), t: $("cT").value, a: amt, n: $("cD").value.trim().slice(0, 60), d: $("cDt").value || today() }); save(); open("cash");
    }
    else if (a === "cashDl") { var c1 = cashDoc(); dl("Cash book", head() + "<h2>Cash book" + (cashMonth ? " - " + cashMonth : "") + "</h2>" + tableHtml(c1.head, c1.rows)); }
    else if (a === "cashPrint") { var c2 = cashDoc(); printIt("Cash book", head() + "<h2>Cash book" + (cashMonth ? " - " + cashMonth : "") + "</h2>" + tableHtml(c2.head, c2.rows)); }
    else if (a === "cashCsv") { var c3 = cashDoc(); saveBlob(new Blob([csv([c3.head].concat(c3.rows))], { type: "text/csv" }), "cash-book.csv"); }
    else if (a === "bgAdd") { B.budget.push({ c: "", p: 0, a: 0 }); save(); open("budget"); }
    else if (a === "bgDl") { var b1 = bgDoc(); dl("Budget", head() + "<h2>Budget</h2>" + tableHtml(b1.head, b1.rows)); }
    else if (a === "bgPrint") { var b2 = bgDoc(); printIt("Budget", head() + "<h2>Budget</h2>" + tableHtml(b2.head, b2.rows)); }
    else if (a === "bgCsv") { var b3 = bgDoc(); saveBlob(new Blob([csv([b3.head].concat(b3.rows))], { type: "text/csv" }), "budget.csv"); }
    else if (a === "prAdd") { B.prices.push({ n: "", p: 0 }); save(); open("prices"); }
    else if (a === "prDl") { var p1 = prDoc(); dl("Price list", head() + "<h2>Price list</h2>" + tableHtml(p1.head, p1.rows)); }
    else if (a === "prPrint") { var p2 = prDoc(); printIt("Price list", head() + "<h2>Price list</h2>" + tableHtml(p2.head, p2.rows)); }
  }
  function input(e) {
    var t = e.target; load();
    if (t.hasAttribute("data-p")) { B.profile[t.getAttribute("data-p")] = t.value; save(); return; }
    if (t.hasAttribute("data-i")) { inv[t.getAttribute("data-i")] = t.value; calcInv(); return; }
    if (t.hasAttribute("data-it")) { inv.items[parseInt(t.getAttribute("data-it"), 10)][t.getAttribute("data-k")] = t.value; calcInv(); return; }
    if (t.hasAttribute("data-bg")) { var r = B.budget[parseInt(t.getAttribute("data-bg"), 10)], k = t.getAttribute("data-k"); r[k] = k === "c" ? t.value : num(t.value); save(); bgTot(); return; }
    if (t.hasAttribute("data-pr")) { var q = B.prices[parseInt(t.getAttribute("data-pr"), 10)], k2 = t.getAttribute("data-k"); q[k2] = k2 === "n" ? t.value : num(t.value); save(); return; }
  }
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "cM" && root && root.contains(e.target)) { cashMonth = e.target.value; open("cash"); }
    if (e.target && e.target.getAttribute && e.target.getAttribute("data-i") === "type" && root && root.contains(e.target)) { inv.type = e.target.value; calcInv(); }
  });
  var _o = open;
  var _calc = calcInv;
})();
