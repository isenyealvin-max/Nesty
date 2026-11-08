/* Nesty Study Center (shown for the Omni smart model). Golden yellow + white, only inside this screen. */
(function () {
  "use strict";
  if (window.openStudyCenter && !window.openStudyCenter.__stub) return;

  var CSS = "" +
    "#sc{display:none;position:fixed;inset:0;z-index:90;flex-direction:column;background:#ffe9a8;color:#3a2a00;font-family:inherit}" +
    "#sc *{box-sizing:border-box}" +
    "#sc .top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#ffc933;box-shadow:0 2px 10px rgba(120,80,0,.18)}" +
    "#sc .top b{font-size:18px;color:#3a2a00}#sc .top small{display:block;font-size:11.5px;color:#6b4a00}" +
    "#sc .top .sp{flex:1}" +
    "#sc .ib{background:#fff;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#3a2a00;box-shadow:0 1px 4px rgba(0,0,0,.2)}" +
    "#scMain{flex:1;overflow-y:auto;padding:14px 14px 90px;max-width:760px;width:100%;margin:0 auto}" +
    "#scNav{display:flex;background:#fff;border-top:2px solid #ffc933;box-shadow:0 -2px 10px rgba(120,80,0,.1);overflow-x:auto}" +
    "#scNav button{flex:1;min-width:62px;background:none;border:0;padding:7px 2px 6px;font-size:10.5px;color:#7a5c14;font-weight:600;font-family:inherit}" +
    "#scNav button i{display:block;font-style:normal;font-size:19px;line-height:1.2}" +
    "#scNav button.on{color:#b36b00;background:#ffe9a8}" +
    "#sc h2{margin:2px 0 4px;font-size:21px;color:#3a2a00}#sc h3{margin:14px 0 6px;font-size:16px;color:#3a2a00}" +
    "#sc p{line-height:1.5}.scm{color:#7a5c14;font-size:13.5px}" +
    "#sc .card{background:#fff4c8;border:1.5px solid #ffe08a;border-radius:16px;padding:13px;margin:10px 0;box-shadow:0 2px 8px rgba(200,140,0,.12)}" +
    "#sc .card.gold{border-color:#ffd566;background:#ffe08a}" +
    "#sc label{display:block;font-size:12.5px;font-weight:700;color:#6b4a00;margin:10px 0 3px}" +
    "#sc input,#sc select,#sc textarea{width:100%;font:inherit;font-size:15px;padding:10px 11px;border:1.5px solid #f2c94c;border-radius:11px;background:#fff;color:#3a2a00}" +
    "#sc textarea{min-height:84px;resize:vertical}#sc input:focus,#sc select:focus,#sc textarea:focus{outline:0;border-color:#ffb800;box-shadow:0 0 0 3px #ffe9a3}" +
    "#sc .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    ".scb{display:inline-block;background:#ffc933;color:#3a2a00;border:0;border-radius:12px;padding:11px 16px;font-weight:800;font-size:14.5px;margin:10px 8px 0 0;font-family:inherit;box-shadow:0 2px 6px rgba(200,140,0,.35)}" +
    ".scb.blue{background:#ffe27a;color:#3a2a00;box-shadow:0 2px 6px rgba(200,140,0,.3)}" +
    ".scb.ghost{background:#fff;border:1.5px solid #f2c94c;color:#b36b00;box-shadow:none}" +
    ".scb.sm{padding:7px 11px;font-size:13px;margin:6px 6px 0 0}.scb:disabled{opacity:.55}" +
    "#sc .tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    "#sc .tile{background:#fff4c8;border:1.5px solid #ffe08a;border-radius:16px;padding:14px 10px;text-align:center;font-weight:700;color:#3a2a00;font-family:inherit}" +
    "#sc .tile i{display:block;font-style:normal;font-size:28px;margin-bottom:4px}#sc .tile small{display:block;font-weight:500;color:#8a6d1f;font-size:12px}" +
    "#sc .tile:nth-child(odd){background:#ffe08a}" +
    "#sc .bar{height:12px;background:#fff3c4;border-radius:8px;overflow:hidden}#sc .bar i{display:block;height:100%;background:#ffc933;border-radius:8px}" +
    "#sc .opt{display:block;width:100%;text-align:left;background:#fffbec;border:1.5px solid #ffe08a;border-radius:11px;padding:10px 12px;margin-top:7px;color:#3a2a00;font-family:inherit;font-size:14.5px}" +
    "#sc .opt.on{background:#fff0b8;border-color:#ffb800;font-weight:700}#sc .opt.ok{background:#dff6e4;border-color:#4caf6a}#sc .opt.bad{background:#fde3e3;border-color:#e57373}" +
    "#sc .pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:12px;font-weight:700;background:#fff3c4;color:#b36b00;margin-right:5px}" +
    "#sc .pill.y{background:#fff0b8;color:#7a5200}#sc .pill.g{background:#dff6e4;color:#256b3b}#sc .pill.r{background:#fde3e3;color:#a63a3a}" +
    "#sc table.tt{border-collapse:collapse;width:100%;font-size:13.5px;background:#fff}" +
    "#sc table.tt td,#sc table.tt th{border:1.5px solid #f2c94c;padding:7px 6px;min-width:76px;vertical-align:top;outline:0}" +
    "#sc table.tt th{background:#ffe08a;color:#3a2a00}#sc table.tt td:first-child{background:#fff8e1;font-weight:700}" +
    "#sc table.tt .sel{background:#fff6c9!important;box-shadow:inset 0 0 0 2px #ffb300}" +
    "#sc .ttw{overflow-x:auto;border-radius:12px}" +
    "#sc .note{background:#fff4c8;border:1.5px solid #ffd566;border-radius:14px;padding:12px 14px;line-height:1.55}" +
    "#sc .note h1,#sc .note h2,#sc .note h3{color:#b36b00;margin:12px 0 4px}#sc .note code{background:#fff3c4;padding:0 4px;border-radius:4px}" +
    "#sc .story p{font-size:16px;line-height:1.7;margin:0 0 12px}" +
    "#sc .flash{min-height:190px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:19px;font-weight:700;padding:20px;border-radius:20px;background:#ffe27a;border:2px solid #f5b700;color:#3a2a00;width:100%;font-family:inherit}" +
    "#sc .flash.back{background:#ffd24d;border-color:#f5b700}" +
    "#sc .row{display:flex;align-items:center;gap:8px}#sc .row .sp{flex:1}" +
    "#sc .li{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #fdecb5}#sc .li:last-child{border:0}" +
    "#sc .li .t{flex:1;min-width:0}#sc .li .t b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#sc img.qi{max-width:100%;border-radius:12px;margin:8px 0;border:1.5px solid #ffe08a}" +
    "#scBusy{display:none;position:absolute;inset:0;background:rgba(255,253,245,.9);z-index:5;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:30px;font-weight:700}" +
    "#scBusy .sp{width:46px;height:46px;border-radius:50%;border:5px solid #ffe08a;border-top-color:#f5b700;animation:scSpin 1s linear infinite;margin-bottom:12px}" +
    "@keyframes scSpin{to{transform:rotate(360deg)}}" +
    "#scSheet{display:none;position:absolute;inset:0;background:rgba(60,40,0,.45);z-index:6;align-items:flex-end;justify-content:center}" +
    "#scSheet .box{background:#fff;width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:18px;border-top:4px solid #ffc933}" +
    "#scBtn{background:#ffc933!important;color:#3a2a00!important;border:0!important;font-weight:800;animation:scPulse 2.2s ease-in-out infinite}" +
    "@keyframes scPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,190,0,.55)}50%{box-shadow:0 0 0 7px rgba(255,190,0,0)}}";

  var S = null, TAB = "home", root = null;
  var cur = { exam: null, ans: {}, t0: 0, res: null, note: null, deck: null, card: 0, flip: false, story: null, ch: 0, sel: { r: -1, c: -1 }, nsub: "notes", timer: null, tsec: 1500, tmode: "focus", trun: false };

  function $(i) { return document.getElementById(i); }
  function E(s) { return esc(String(s == null ? "" : s)); }
  function uidNow() { try { return (user && user.$id) || "guest"; } catch (e) { return "guest"; } }
  function load() {
    if (S) return S;
    var o = null;
    try { o = JSON.parse(localStorage.getItem("nestySC_" + uidNow())); } catch (e) {}
    S = o || {};
    S.exams = S.exams || []; S.notes = S.notes || []; S.decks = S.decks || []; S.stories = S.stories || [];
    S.tt = S.tt || null; S.goal = S.goal || { target: 30, log: {} }; S.streak = S.streak || { last: "", n: 0 };
    return S;
  }
  function save() { try { localStorage.setItem("nestySC_" + uidNow(), JSON.stringify(S)); } catch (e) { toast("Your phone storage is full. Delete some old items."); } }
  function dkey(d) { return (d || new Date()).toISOString().slice(0, 10); }
  function touch() {
    var s = load(), t = dkey();
    if (s.streak.last === t) return;
    var y = dkey(new Date(Date.now() - 864e5));
    s.streak.n = s.streak.last === y ? s.streak.n + 1 : 1; s.streak.last = t; save();
  }
  function streakN() { var s = load(), t = dkey(), y = dkey(new Date(Date.now() - 864e5)); return (s.streak.last === t || s.streak.last === y) ? s.streak.n : 0; }
  CSS += "#sc .top{border-bottom:4px solid #38b6f2}#sc .scb.blue{background:#38b6f2;color:#06283d}#sc .scb.ghost{border-color:#38b6f2;color:#0b5f8f}" +
    "#scNav{border-top-color:#38b6f2}#scNav button.on{color:#0b5f8f;background:#e3f4fd}#sc .tile:nth-child(even){background:#e1f3ff;border-color:#9ed8f5}" +
    "#sc .lgb{display:inline-block;margin:6px 6px 0 0;padding:7px 13px;border-radius:20px;border:2px solid #38b6f2;background:#fff;color:#0b5f8f;font-weight:700;font-family:inherit}#sc .lgb.on{background:#38b6f2;color:#06283d}";
  /* ---------- parent controls: PIN, quiet hours, safe mode, story age limit ---------- */
  var PCV = {}, PCA = {};
  var pcUnlock = 0, pcFails = 0, pcLockUntil = 0, pcOpen = false;
  function pcKey() { return "nestyParent_" + uidNow(); }
  function pcGet() { try { return JSON.parse(localStorage.getItem(pcKey())) || {}; } catch (e) { return {}; } }
  function pcSave(o) { try { localStorage.setItem(pcKey(), JSON.stringify(o)); localStorage.setItem("nestySafe", o.safe ? "1" : "0"); } catch (e) { toast("Phone storage is full."); } }
  async function pinHash(p) {
    var b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nestypin|" + uidNow() + "|" + p));
    return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("");
  }
  function mins(t) { var m = /^(\d\d):(\d\d)$/.exec(t || ""); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 0; }
  function quietNow() {
    var pc = pcGet(); if (!pc.pin || !pc.q) return false;
    var n = new Date(), m = n.getHours() * 60 + n.getMinutes(), a = mins(pc.from || "21:00"), b = mins(pc.to || "06:00");
    return a <= b ? (m >= a && m < b) : (m >= a || m < b);
  }
  function quietLocked() { return quietNow() && Date.now() > pcUnlock; }
  function pinCheck(p) {
    if (Date.now() < pcLockUntil) { toast("Too many wrong tries. Wait a few minutes."); return Promise.resolve(false); }
    return pinHash(p).then(function (h) {
      if (h === pcGet().pin) { pcFails = 0; return true; }
      if (++pcFails >= 5) { pcLockUntil = Date.now() + 300000; pcFails = 0; }
      toast("Wrong PIN."); return false;
    });
  }
  PCV.locked = function () {
    var pc = pcGet();
    return '<div class="card gold" style="text-align:center"><div style="font-size:44px">🌙</div><b>Quiet time</b><div class="scm">Study Center is resting until ' + E(pc.to || "06:00") + '. A parent can unlock it with the PIN.</div><input id="pcPinIn" type="password" inputmode="numeric" maxlength="4" placeholder="Parent PIN" style="max-width:180px;text-align:center;margin-top:8px"><div><button class="scb" data-a="pcUnlock">Unlock for 30 minutes</button><button class="scb ghost" data-a="close">Close</button></div></div>';
  };
  PCA.pcUnlock = async function () { if (await pinCheck(val("pcPinIn"))) { pcUnlock = Date.now() + 1800000; TAB = "home"; render(); } };
  function pcCard() {
    var pc = pcGet();
    if (!pc.pin) return '<div class="card"><b>👪 Parent controls</b><div class="scm">Set a 4-digit PIN to choose quiet hours, turn on safe mode and limit story ages.</div><input id="pcNew" type="password" inputmode="numeric" maxlength="4" placeholder="New 4-digit PIN" style="max-width:200px"><button class="scb sm" data-a="pcSetPin">Set PIN</button></div>';
    if (!pcOpen) return '<div class="card"><b>👪 Parent controls</b> <span class="scm">(PIN is set)</span><div class="scm">Type the PIN to change settings.</div><input id="pcPin" type="password" inputmode="numeric" maxlength="4" placeholder="Parent PIN" style="max-width:200px"><button class="scb sm" data-a="pcOpen">Open</button></div>';
    return '<div class="card gold"><b>👪 Parent controls</b>' +
      '<label><input type="checkbox" id="pcQ" ' + (pc.q ? "checked" : "") + '> Quiet hours (Study Center locks)</label><div class="g2"><div><label>From</label><input id="pcFrom" type="time" value="' + E(pc.from || "21:00") + '"></div><div><label>Until</label><input id="pcTo" type="time" value="' + E(pc.to || "06:00") + '"></div></div>' +
      '<label><input type="checkbox" id="pcSafe" ' + (pc.safe ? "checked" : "") + '> Safe mode in all Nesty chats (age-appropriate answers)</label>' +
      '<label>Highest story age allowed</label><select id="pcCap">' + [["0", "No limit"], ["8", "Up to age 8"], ["12", "Up to age 12"], ["15", "Up to age 15"]].map(function (o) { return '<option value="' + o[0] + '"' + (String(pc.cap || 0) === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>' +
      '<button class="scb sm" data-a="pcSave">Save</button><button class="scb sm ghost" data-a="pcLock">Lock</button><button class="scb sm ghost" data-a="pcRemove">Remove PIN</button></div>';
  }
  PCA.pcSetPin = async function () { var p = val("pcNew"); if (!/^\d{4}$/.test(p)) { toast("Type exactly 4 numbers."); return; } var pc = pcGet(); pc.pin = await pinHash(p); pcSave(pc); pcOpen = true; render(true); toast("PIN saved. Remember it."); };
  PCA.pcOpen = async function () { if (await pinCheck(val("pcPin"))) { pcOpen = true; render(true); } };
  PCA.pcSave = function () { var pc = pcGet(); pc.q = $("pcQ").checked; pc.from = val("pcFrom") || "21:00"; pc.to = val("pcTo") || "06:00"; pc.safe = $("pcSafe").checked; pc.cap = parseInt(val("pcCap"), 10) || 0; pcSave(pc); toast("Saved."); };
  PCA.pcLock = function () { pcOpen = false; render(true); };
  PCA.pcRemove = function () { if (!confirm("Remove the parent PIN and all parent settings?")) return; try { localStorage.removeItem(pcKey()); localStorage.setItem("nestySafe", "0"); } catch (e) {} pcOpen = false; render(true); };
  function U(k) { try { markUsed(k); } catch (e) {} }
  function lg() { return (S && S.lang === "sw") ? "\n\nWrite ALL learner-facing content (questions, options, notes, stories, words, feedback) in Kiswahili. Keep any JSON keys in English." : ""; }
  function nid() { return "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clamp(n, a, b) { n = parseInt(n, 10); if (isNaN(n)) n = a; return Math.max(a, Math.min(b, n)); }
  function val(id) { var e = $(id); return e ? String(e.value || "").trim() : ""; }
  function fmtDate(t) { try { return new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }); } catch (e) { return ""; } }

  /* ---------- talking to Nesty ---------- */
  async function ask(prompt, img) {
    var jwt = await getJwt();
    var res = await fetch("/.netlify/functions/chat", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Nesty-Token": jwt },
      body: JSON.stringify({ sc: true, model: "smart", stream: false, userName: firstName(), today: todayText(), messages: [{ role: "user", content: img ? [{ type: "text", text: prompt + lg() }, { type: "image_url", image_url: { url: img } }] : prompt + lg() }] })
    });
    var d;
    try { d = await res.json(); } catch (e) { throw { msg: "Network problem. Please try again." }; }
    if (d.limited) throw { limited: true, kind: d.kind, resetAt: d.resetAt };
    if (d.needLogin) throw { msg: "Please sign in again." };
    if (d.needVerify || d.needPassword) throw { msg: "Please finish your account setup first." };
    try { noteUsage(d); } catch (e) {}
    return String(d.reply || "");
  }
  function parseJson(t) {
    t = String(t || "").replace(/```(?:json)?/gi, "");
    var a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b < a) return null;
    t = t.slice(a, b + 1);
    try { return JSON.parse(t); } catch (e) {}
    try { return JSON.parse(t.replace(/,\s*([}\]])/g, "$1")); } catch (e2) {}
    return null;
  }
  function busy(msg) {
    var b = $("scBusy");
    if (!b) return;
    if (!msg) { b.style.display = "none"; return; }
    b.innerHTML = '<div class="sp"></div><div>' + E(msg) + '</div><div class="scm" style="font-weight:400;margin-top:6px">This can take up to a minute.</div>';
    b.style.display = "flex";
  }
  function sheet(html) {
    var s = $("scSheet");
    s.innerHTML = '<div class="box">' + html + '</div>'; s.style.display = "flex";
  }
  function fail(e) {
    busy("");
    if (e && e.limited) {
      var t = e.resetAt ? new Date(e.resetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "soon";
      sheet("<h3>You have used all your " + (e.kind === "file" ? "file attachments" : "messages") + " for now</h3><p>Your limit resets at <b>" + E(t) + "</b>. Want more? Smart gives 85 messages an hour and Ultra gives 100.</p><button class='scb' data-a='plans'>See plans</button><button class='scb ghost' data-a='sheetx'>OK</button>");
    } else toast((e && e.msg) || "Something went wrong. Please try again.");
  }

  /* ---------- files ---------- */
  function paperHtml(title, body) {
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + E(title) + '</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.45}h1{font-size:20pt;text-align:center}h2{font-size:14pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:6px;vertical-align:top}th{background:#ffe08a}.l{border-bottom:1px solid #444;height:22px}</style></head><body>' + body + '</body></html>';
  }
  function dl(title, body) { saveBlob(new Blob(["﻿" + paperHtml(title, body)], { type: "application/msword" }), String(title).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) + ".doc"); }
  function printIt(title, body) {
    var f = document.createElement("iframe");
    f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(f);
    f.onload = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast("Could not open the print window."); } setTimeout(function () { if (f.parentNode) f.remove(); }, 120000); };
    f.srcdoc = paperHtml(title, body);
  }
  function examPaper(ex, withKey) {
    var h = "<h1>" + E(ex.title) + "</h1><p><b>Name:</b> ____________________ &nbsp; <b>Date:</b> ____________ &nbsp; <b>Level:</b> " + E(ex.grade) + " &nbsp; <b>Marks:</b> ____ / " + totalMarks(ex) + "</p><hr>";
    ex.items.forEach(function (q, i) {
      h += "<p><b>" + (i + 1) + ". " + E(q.q) + "</b> (" + q.marks + " mark" + (q.marks > 1 ? "s" : "") + ")</p>";
      if (q.type === "mcq") (q.options || []).forEach(function (o, j) { h += "<p style='margin:0 0 3px 22px'>" + "ABCD".charAt(j) + ". " + E(o) + "</p>"; });
      else h += "<div class='l'></div><div class='l'></div><div class='l'></div>";
    });
    if (withKey) {
      h += "<br><h2>Answer key</h2>";
      ex.items.forEach(function (q, i) { h += "<p>" + (i + 1) + ". " + E(q.type === "mcq" ? "ABCD".charAt("ABCD".indexOf(q.answer)) + " - " + ((q.options || [])["ABCD".indexOf(q.answer)] || "") : q.answer) + (q.explain ? " <i>(" + E(q.explain) + ")</i>" : "") + "</p>"; });
    }
    return h;
  }
  function totalMarks(ex) { return ex.items.reduce(function (a, q) { return a + (q.marks || 1); }, 0); }

  /* ---------- helpers for views ---------- */
  var GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6 (KPSEA)", "Grade 7", "Grade 8", "Grade 9 (KJSEA)", "Grade 10", "Grade 11", "Grade 12", "Class 7", "Class 8 (KCPE)", "Form 1", "Form 2", "Form 3", "Form 4 (KCSE)", "College / University"];
  function gradeSel(id, def) { return '<select id="' + id + '">' + GRADES.map(function (g) { return '<option' + (g === (def || "Grade 8") ? " selected" : "") + '>' + g + '</option>'; }).join("") + '</select>'; }
  function letter(p) { return p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : "E"; }
  function lvl(p) { return p >= 75 ? ["Strong", "g"] : p >= 50 ? ["Getting there", "y"] : ["Needs love", "r"]; }
  function md(t) { try { return mdToHtml(String(t || "")); } catch (e) { return "<p>" + E(t) + "</p>"; } }
  function donut(parts) {
    var tot = parts.reduce(function (a, p) { return a + p.v; }, 0) || 1, C = 2 * Math.PI * 38, off = 0, s = '<svg viewBox="0 0 100 100" width="150" height="150"><circle cx="50" cy="50" r="38" fill="none" stroke="#fff3c4" stroke-width="16"/>';
    parts.forEach(function (p) { var len = C * p.v / tot; if (p.v > 0) s += '<circle cx="50" cy="50" r="38" fill="none" stroke="' + p.c + '" stroke-width="16" stroke-dasharray="' + len.toFixed(2) + " " + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 50 50)"/>'; off += len; });
    return s + '<text x="50" y="55" text-anchor="middle" font-size="16" font-weight="800" fill="#3a2a00">' + Math.round(100 * (parts[0] ? parts[0].v : 0) / tot) + '%</text></svg>';
  }
  function lineChart(vals) {
    var W = 300, H = 140, p = 18, n = vals.length, pts = vals.map(function (v, i) { return [p + (n < 2 ? (W - 2 * p) / 2 : i * (W - 2 * p) / (n - 1)), H - p - (H - 2 * p) * v / 100]; });
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%"><rect width="' + W + '" height="' + H + '" rx="12" fill="#fffbec"/>';
    [0, 50, 100].forEach(function (g) { var y = H - p - (H - 2 * p) * g / 100; s += '<line x1="' + p + '" x2="' + (W - p) + '" y1="' + y + '" y2="' + y + '" stroke="#f3e2a8" stroke-dasharray="3 3"/><text x="2" y="' + (y + 3) + '" font-size="8" fill="#8a6d1f">' + g + '</text>'; });
    s += '<polyline fill="none" stroke="#ffb300" stroke-width="3" stroke-linejoin="round" points="' + pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ") + '"/>';
    pts.forEach(function (q, i) { s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="4.5" fill="#b36b00" stroke="#fff" stroke-width="2"/><text x="' + q[0].toFixed(1) + '" y="' + (q[1] - 8).toFixed(1) + '" font-size="8" text-anchor="middle" fill="#3a2a00">' + Math.round(vals[i]) + '</text>'; });
    return s + "</svg>";
  }
  function stats() {
    var s = load(), by = {}, right = 0, part = 0, wrong = 0;
    s.exams.forEach(function (ex) {
      (ex.marks || []).forEach(function (m) {
        var k = (m.sub || ex.topic || "General").trim() || "General", f = m.max ? m.got / m.max : 0;
        by[k] = by[k] || { n: 0, sum: 0 }; by[k].n++; by[k].sum += f;
        if (f >= 0.99) right++; else if (f > 0) part++; else wrong++;
      });
    });
    var list = Object.keys(by).map(function (k) { return { sub: k, n: by[k].n, pct: Math.round(100 * by[k].sum / by[k].n) }; }).sort(function (a, b) { return a.pct - b.pct; });
    return { list: list, right: right, part: part, wrong: wrong, scores: s.exams.slice(-10).map(function (e) { return e.pct; }), avg: s.exams.length ? Math.round(s.exams.reduce(function (a, e) { return a + e.pct; }, 0) / s.exams.length) : 0, best: s.exams.reduce(function (a, e) { return Math.max(a, e.pct); }, 0) };
  }
  function weakText() { var st = stats(); return st.list.filter(function (x) { return x.pct < 70; }).slice(0, 6).map(function (x) { return x.sub + " (" + x.pct + "%)"; }).join(", "); }

  /* ---------- views ---------- */
  var V = {};
  Object.assign(V, PCV);
  var TIPS = ["Short, regular study beats one long night. Try 25 minutes, then a 5 minute break.", "Explain a topic out loud as if you were the teacher. If you get stuck, that is what to revise.", "Test yourself before you feel ready. It is the fastest way to remember.", "Sleep helps your brain save what you learned. Revise, then rest well.", "Mistakes are useful: every wrong answer shows exactly what to practise next."];
  V.home = function () {
    var s = load(), g = s.goal, done = g.log[dkey()] || 0, pct = Math.min(100, Math.round(100 * done / g.target)), st = stats(), last = s.exams[s.exams.length - 1];
    return '<h2>Hi ' + E(firstName() || "friend") + '! 👋</h2><div class="scm">Welcome to your Study Center. Pick something to learn today.</div>' +
      '<div class="card gold"><div class="row"><b>🔥 ' + streakN() + '-day streak</b><span class="sp"></span><span class="scm">Study today to keep it going</span></div>' +
      '<div class="scm" style="margin:8px 0 4px">Daily focus goal: ' + done + ' / ' + g.target + ' min</div><div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<button class="scb sm blue" data-a="tab" data-v="tools">Start a focus timer</button></div>' +
      '<div class="card"><b>🌍 Language of exams, notes and stories</b><div><button class="lgb ' + (s.lang === "sw" ? "" : "on") + '" data-a="lang" data-v="en">English</button><button class="lgb ' + (s.lang === "sw" ? "on" : "") + '" data-a="lang" data-v="sw">Kiswahili</button></div></div>' +
      '<div class="tiles">' +
      '<button class="tile" data-a="tab" data-v="exams"><i>📝</i>Exams<small>Practice and get marked</small></button>' +
      '<button class="tile" data-a="tab" data-v="notes"><i>📒</i>Notes &amp; Flashcards<small>Learn any topic</small></button>' +
      '<button class="tile" data-a="tab" data-v="plan"><i>🗓️</i>Timetable<small>Make or auto-build</small></button>' +
      '<button class="tile" data-a="tab" data-v="stories"><i>📖</i>Stories<small>Stories, novellas, novels</small></button>' +
      '<button class="tile" data-a="tab" data-v="progress"><i>📊</i>My progress<small>' + (s.exams.length ? "Average " + st.avg + "%" : "Take your first exam") + '</small></button>' +
      '<button class="tile" data-a="tab" data-v="tools"><i>🧰</i>Study tools<small>Timer, explain, summarise</small></button></div>' +
      (last ? '<div class="card"><b>Last exam:</b> ' + E(last.topic) + ' <span class="pill ' + lvl(last.pct)[1] + '">' + last.pct + '% (' + letter(last.pct) + ')</span>' + (st.list[0] && st.list[0].pct < 70 ? '<div class="scm" style="margin-top:6px">Next step: practise <b>' + E(st.list[0].sub) + '</b>.</div><button class="scb sm" data-a="practise" data-v="' + E(st.list[0].sub) + '">Practise it</button>' : '') + '</div>' : '') +
      '<div class="card"><b>💡 Study tip</b><div class="scm" style="margin-top:4px">' + E(TIPS[new Date().getDate() % TIPS.length]) + '</div></div>';
  };

  V.exams = function () {
    var s = load();
    var h = '<h2>📝 Exams</h2><div class="scm">Make a practice exam on any topic. Nesty marks it and updates your progress.</div><div class="card">' +
      '<label>Topic</label><input id="exTopic" placeholder="e.g. Fractions, Photosynthesis, The French Revolution" maxlength="80">' +
      '<div class="g2"><div><label>Grade / level</label>' + gradeSel("exGrade") + '</div><div><label>Questions (max 20)</label><input id="exN" type="number" min="1" max="20" value="10"></div></div>' +
      '<div class="g2"><div><label>Answer style</label><select id="exType"><option value="mcq">Choose A, B, C or D</option><option value="written">Write the answers</option><option value="mixed">Mixed</option></select></div><div><label>Difficulty</label><select id="exDiff"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div></div>' +
      '<label>Exam style</label><select id="exStyle"><option value="">Normal</option><option value="KCPE">Past-paper style: KCPE</option><option value="KPSEA">Past-paper style: KPSEA</option><option value="KJSEA">Past-paper style: KJSEA</option><option value="KCSE">Past-paper style: KCSE</option></select>' +
      '<label>Pictures in the exam (each picture uses 1 picture from your limit)</label><select id="exPics"><option value="0">No pictures</option><option value="1">1 picture</option><option value="2">2 pictures</option><option value="3">3 pictures</option></select>' +
      '<div class="scm" style="margin-top:8px">Making an exam uses 1 message. If you write answers, marking them uses 1 more. Written exams can have up to 10 questions.</div>' +
      '<button class="scb" data-a="makeExam">Create my exam</button></div>';
    if (s.exams.length) {
      h += '<h3>Past exams</h3><div class="card">';
      s.exams.slice().reverse().slice(0, 12).forEach(function (ex) {
        h += '<div class="li"><div class="t"><b>' + E(ex.topic) + '</b><span class="scm">' + E(ex.grade) + ' · ' + fmtDate(ex.at) + '</span></div><span class="pill ' + lvl(ex.pct)[1] + '">' + ex.pct + '%</span><button class="scb sm ghost" data-a="viewExam" data-v="' + ex.id + '">Open</button></div>';
      });
      h += '</div>';
    }
    return h;
  };
  V.take = function () {
    var ex = cur.exam;
    var h = '<div class="row"><h2 style="flex:1">' + E(ex.title) + '</h2><button class="scb sm ghost" data-a="tab" data-v="exams">Leave</button></div><div class="scm">' + E(ex.grade) + ' · ' + ex.items.length + ' questions · ' + totalMarks(ex) + ' marks</div>' +
      '<button class="scb sm ghost" data-a="dlPaper" data-v="0">Download paper</button><button class="scb sm ghost" data-a="dlPaper" data-v="1">Paper + answers</button>';
    ex.items.forEach(function (q, i) {
      h += '<div class="card"><b>' + (i + 1) + '. ' + E(q.q) + '</b> <span class="pill">' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') + '</span>' + (q.imgData ? '<img class="qi" src="' + q.imgData + '" alt="Exam picture">' : '');
      if (q.type === "mcq") (q.options || []).forEach(function (o, j) { h += '<button class="opt" data-a="pick" data-q="' + i + '" data-o="' + "ABCD".charAt(j) + '"><b>' + "ABCD".charAt(j) + '.</b> ' + E(o) + '</button>'; });
      else h += '<textarea data-w="' + i + '" placeholder="Write your answer here"></textarea>';
      h += '</div>';
    });
    return h + '<button class="scb" data-a="submitExam">Submit and mark</button>';
  };
  V.result = function () {
    var ex = cur.res, h = '<div class="card gold" style="text-align:center"><div class="scm">' + E(ex.topic) + ' · ' + E(ex.grade) + '</div><div style="font-size:46px;font-weight:900;color:#b36b00">' + ex.pct + '%</div><span class="pill y" style="font-size:15px">Grade ' + letter(ex.pct) + '</span><div class="scm" style="margin-top:6px">' + ex.got + ' / ' + ex.max + ' marks</div></div>' +
      '<div class="card"><b>💬 Nesty says</b><p>' + E(ex.comment) + '</p></div>';
    ex.items.forEach(function (q, i) {
      var m = ex.marks[i], ok = m.got >= m.max * 0.99, part = !ok && m.got > 0;
      h += '<div class="card"><b>' + (i + 1) + '. ' + E(q.q) + '</b> <span class="pill ' + (ok ? 'g' : part ? 'y' : 'r') + '">' + m.got + ' / ' + m.max + '</span>' + (q.imgData ? '<img class="qi" src="' + q.imgData + '" alt="">' : '');
      if (q.type === "mcq") (q.options || []).forEach(function (o, j) { var L2 = "ABCD".charAt(j); h += '<div class="opt ' + (L2 === q.answer ? 'ok' : (L2 === m.given ? 'bad' : '')) + '"><b>' + L2 + '.</b> ' + E(o) + (L2 === m.given ? ' ← your answer' : '') + '</div>'; });
      else h += '<p class="scm"><b>Your answer:</b> ' + E(m.given || "(blank)") + '</p><p><b>Model answer:</b> ' + E(q.answer) + '</p>' + (m.fb ? '<p class="scm">💡 ' + E(m.fb) + '</p>' : '');
      if (q.explain) h += '<p class="scm">' + E(q.explain) + '</p>';
      h += '</div>';
    });
    return h + '<button class="scb" data-a="resFlash">Flashcards for what I missed</button><button class="scb blue" data-a="tab" data-v="progress">See my progress</button><button class="scb ghost" data-a="dlPaper" data-v="1">Download exam + answers</button><button class="scb blue" data-a="challenge">🏆 Challenge a friend</button><button class="scb ghost" data-a="tab" data-v="exams">Back to exams</button>';
  };

  V.notes = function () {
    var s = load(), sub = cur.nsub;
    var h = '<h2>📒 Notes &amp; Flashcards</h2><div class="row"><button class="scb sm ' + (sub === "notes" ? "" : "ghost") + '" data-a="nsub" data-v="notes">Notes</button><button class="scb sm ' + (sub === "cards" ? "" : "ghost") + '" data-a="nsub" data-v="cards">Flashcards</button></div>';
    if (sub === "notes") {
      h += '<div class="card"><label>Topic</label><input id="ntTopic" placeholder="e.g. The water cycle" maxlength="80"><div class="g2"><div><label>Level</label>' + gradeSel("ntGrade") + '</div><div><label>Style</label><select id="ntStyle"><option>Study notes</option><option>Short summary</option><option>Bullet revision sheet</option><option>Exam-focused notes</option></select></div></div><div class="scm" style="margin-top:6px">Uses 1 message.</div><button class="scb" data-a="makeNote">Write my notes</button></div>';
      if (cur.note) { var n = s.notes.filter(function (x) { return x.id === cur.note; })[0]; if (n) h += '<div class="row"><h3 style="flex:1">' + E(n.topic) + '</h3></div><div class="note">' + md(n.text) + '</div><button class="scb sm blue" data-a="readNote" data-v="' + n.id + '">🔊 Read aloud</button><button class="scb sm ghost" data-a="readStop">Stop</button><button class="scb sm" data-a="noteCards" data-v="' + n.id + '">Make flashcards</button><button class="scb sm ghost" data-a="noteDl" data-v="' + n.id + '">Download</button><button class="scb sm ghost" data-a="noteCopy" data-v="' + n.id + '">Copy</button><button class="scb sm ghost" data-a="noteDel" data-v="' + n.id + '">Delete</button>'; }
      if (s.notes.length) { h += '<h3>My notes</h3><div class="card">'; s.notes.slice().reverse().forEach(function (n) { h += '<div class="li"><div class="t"><b>' + E(n.topic) + '</b><span class="scm">' + E(n.grade) + ' · ' + fmtDate(n.at) + '</span></div><button class="scb sm ghost" data-a="noteOpen" data-v="' + n.id + '">Open</button></div>'; }); h += '</div>'; }
    } else if (cur.deck) {
      var d = s.decks.filter(function (x) { return x.id === cur.deck; })[0];
      if (!d) { cur.deck = null; return V.notes(); }
      var arr = cur.due ? dueCards(d) : d.cards; if (!arr.length) { cur.due = false; arr = d.cards; toast("All caught up! 🎉"); } var c = arr[cur.card % arr.length];
      h += '<div class="row"><h3 style="flex:1">' + E(d.topic) + '</h3><span class="scm">' + (cur.card % arr.length + 1) + ' / ' + arr.length + (cur.due ? ' due' : '') + '</span></div><button class="flash ' + (cur.flip ? "back" : "") + '" data-a="flip">' + E(cur.flip ? c.a : c.q) + '</button><div class="scm" style="text-align:center;margin-top:6px">Tap the card to flip it</div>' +
        '<div class="row" style="justify-content:center"><button class="scb sm ghost" data-a="cardGo" data-v="-1">← Back</button><button class="scb sm" data-a="cardGo" data-v="1">Next →</button><button class="scb sm blue" data-a="shuffle">Shuffle</button></div>' +
        (cur.flip ? '<div class="row" style="justify-content:center"><button class="scb sm ghost" data-a="srs" data-v="0">Again</button><button class="scb sm" data-a="srs" data-v="1">Got it ✓</button></div>' : '<div class="scm" style="text-align:center">Flip the card, then tell Nesty if you knew it.</div>') +
        '<button class="scb sm blue" data-a="dueToggle">' + (cur.due ? 'Study all cards' : 'Review due cards (' + dueCards(d).length + ')') + '</button><button class="scb sm ghost" data-a="deckClose">Close deck</button>';
    } else {
      h += '<div class="card"><label>Make flashcards on a topic</label><input id="fcTopic" placeholder="e.g. Cell parts" maxlength="80"><div class="g2"><div><label>Level</label>' + gradeSel("fcGrade") + '</div><div><label>Cards (6 to 20)</label><input id="fcN" type="number" min="6" max="20" value="12"></div></div><div class="scm" style="margin-top:6px">Uses 1 message.</div><button class="scb" data-a="makeDeck">Make flashcards</button></div>';
      if (s.decks.length) { h += '<h3>My decks</h3><div class="card">'; s.decks.slice().reverse().forEach(function (d) { h += '<div class="li"><div class="t"><b>' + E(d.topic) + '</b><span class="scm">' + d.cards.length + ' cards · ' + fmtDate(d.at) + '</span></div><button class="scb sm" data-a="deckOpen" data-v="' + d.id + '">Study</button><button class="scb sm ghost" data-a="deckDel" data-v="' + d.id + '">✕</button></div>'; }); h += '</div>'; }
    }
    return h;
  };

  function defaultTT() { return { cols: ["Time", "Mon", "Tue", "Wed", "Thu", "Fri"], rows: ["16:00", "17:00", "18:00", "19:00"].map(function (t) { return [t, "", "", "", "", ""]; }) }; }
  function ttTable() {
    var t = load().tt || (S.tt = defaultTT()), h = '<div class="ttw"><table class="tt" id="ttTab"><tr>';
    t.cols.forEach(function (c, ci) { h += '<th contenteditable="true" data-r="-1" data-c="' + ci + '">' + E(c) + '</th>'; });
    h += '</tr>';
    t.rows.forEach(function (r, ri) { h += '<tr>'; r.forEach(function (c, ci) { h += '<td contenteditable="true" data-r="' + ri + '" data-c="' + ci + '">' + E(c) + '</td>'; }); h += '</tr>'; });
    return h + '</table></div>';
  }
  V.plan = function () {
    var weak = weakText();
    return '<h2>🗓️ Timetable</h2><div class="scm">Tap any box to type. Add or delete rows and columns, change times, days and text.</div>' +
      '<div class="card"><div id="ttBox">' + ttTable() + '</div><div class="row" style="flex-wrap:wrap"><button class="scb sm blue" data-a="ttRow">+ Row</button><button class="scb sm blue" data-a="ttCol">+ Column</button><button class="scb sm ghost" data-a="ttDelRow">− Row</button><button class="scb sm ghost" data-a="ttDelCol">− Column</button><button class="scb sm ghost" data-a="ttReset">Clear</button></div>' +
      '<div class="scm" style="margin-top:6px">Tip: tap a box first, then use + / − to add or remove the row or column it is in.</div>' +
      '<button class="scb sm" data-a="ttDl">Download</button><button class="scb sm ghost" data-a="ttPrint">Print</button></div>' +
      '<div class="card gold"><b>✨ Let Nesty make it for me</b><div class="scm">Nesty builds a timetable from how you did in your exams' + (weak ? ' (focus: ' + E(weak) + ')' : '') + '.</div>' +
      '<label>Subjects (separate with commas)</label><input id="atSubj" value="' + E(weak ? weak.replace(/ \(\d+%\)/g, "") : "") + '" placeholder="Maths, English, Science, Kiswahili">' +
      '<div class="g2"><div><label>Days</label><select id="atDays"><option>Mon-Fri</option><option>Mon-Sat</option><option>Every day</option></select></div><div><label>Study hours a day</label><input id="atHrs" type="number" min="1" max="6" value="2"></div></div>' +
      '<div class="g2"><div><label>Start time</label><input id="atStart" value="16:00"></div><div><label>Extras</label><select id="atBreak"><option>With short breaks</option><option>No breaks</option></select></div></div>' +
      '<div class="scm" style="margin-top:6px">Uses 1 message. This replaces the table above, and you can still edit it.</div><button class="scb" data-a="ttAuto">Build my timetable</button></div>';
  };

  var AGE = function (a) { return a <= 5 ? ["Little story", "a very simple picture-book story for a small child"] : a <= 9 ? ["Young reader story", "an early-reader story"] : a <= 12 ? ["Story", "a story for a growing reader"] : a <= 15 ? ["Novella", "a novella told in short chapters"] : ["Novel", "a serious novel told in chapters"]; };
  V.stories = function () {
    var s = load(), h = '<h2>📖 Stories, Novellas &amp; Novels</h2><div class="scm">Tell Nesty the reader\'s age and it writes the right kind of book: little stories for 5 and under, stories for 6 to 12, novellas for 13 to 15, novels for 16 and up. Every part comes with new words and questions.</div><div class="card">' +
      '<div class="g2"><div><label>Reader age</label><input id="stAge" type="number" min="3" max="99" value="10"></div><div><label>Genre</label><select id="stGenre"><option>Adventure</option><option>Mystery</option><option>Fantasy</option><option>Friendship</option><option>Science &amp; discovery</option><option>Everyday life</option><option>History</option><option>Fable with a lesson</option></select></div></div>' +
      '<label>Your idea (or leave empty and let Nesty surprise you)</label><textarea id="stIdea" placeholder="e.g. A girl who finds a talking turtle at the river" maxlength="300"></textarea>' +
      '<div class="scm" style="margin-top:6px">Each part uses 1 message. Novellas and novels continue chapter by chapter.</div><button class="scb" data-a="makeStory">Write it for me</button></div>';
    if (cur.story) {
      var b = s.stories.filter(function (x) { return x.id === cur.story; })[0];
      if (b) {
        var c = b.chs[cur.ch] || b.chs[0];
        h += '<div class="row"><h3 style="flex:1">' + E(b.title) + '</h3><span class="pill y">' + E(b.kind) + '</span></div><div class="scm">Age ' + b.age + ' · ' + E(b.genre) + (b.total > 1 ? ' · Chapter ' + (cur.ch + 1) + ' of ' + b.total : '') + '</div>' +
          '<div class="row"><button class="scb sm blue" data-a="readStory">🔊 Read aloud</button><button class="scb sm ghost" data-a="readStop">Stop</button></div><div class="card story">' + c.text.split(/\n{2,}|\n/).filter(function (p) { return p.trim(); }).map(function (p) { return '<p>' + E(p) + '</p>'; }).join("") + '</div>' +
          (c.words.length ? '<div class="card gold"><b>📚 New words</b>' + c.words.map(function (w) { return '<div style="margin-top:6px"><b>' + E(w.w) + ':</b> ' + E(w.m) + '</div>'; }).join("") + '</div>' : '') +
          (c.qs.length ? '<div class="card"><b>❓ Questions</b>' + c.qs.map(function (q, i) { return '<div style="margin-top:8px">' + (i + 1) + '. ' + E(q) + '<textarea data-sq="' + i + '" style="min-height:52px;margin-top:4px" placeholder="Your answer"></textarea></div>'; }).join("") + '<button class="scb sm" data-a="checkStory">Check my answers (1 message)</button><div id="stFb"></div></div>' : '') +
          '<div class="row" style="flex-wrap:wrap">' + (cur.ch > 0 ? '<button class="scb sm ghost" data-a="chGo" data-v="-1">← Previous</button>' : '') + (cur.ch < b.chs.length - 1 ? '<button class="scb sm" data-a="chGo" data-v="1">Next →</button>' : (b.chs.length < b.total ? '<button class="scb sm" data-a="nextCh">Write chapter ' + (b.chs.length + 1) + '</button>' : '<span class="pill g">The End</span>')) + '<button class="scb sm ghost" data-a="storyDl">Download</button></div>';
      }
    }
    if (s.stories.length) { h += '<h3>My library</h3><div class="card">'; s.stories.slice().reverse().forEach(function (b) { h += '<div class="li"><div class="t"><b>' + E(b.title) + '</b><span class="scm">' + E(b.kind) + ' · age ' + b.age + ' · ' + b.chs.length + '/' + b.total + ' part' + (b.total > 1 ? 's' : '') + '</span></div><button class="scb sm" data-a="storyOpen" data-v="' + b.id + '">Read</button><button class="scb sm ghost" data-a="storyDel" data-v="' + b.id + '">✕</button></div>'; }); h += '</div>'; }
    return h;
  };

  V.progress = function () {
    var s = load(), st = stats();
    if (!s.exams.length) return '<h2>📊 My progress</h2><div class="card gold"><p>No exams yet. Take your first exam and your analysis will appear here: your score, a pie chart, a graph and tips on where to improve.</p><button class="scb" data-a="tab" data-v="exams">Take an exam</button></div>';
    var h = '<h2>📊 My progress</h2><div class="tiles"><div class="card gold" style="text-align:center;margin:0"><div style="font-size:28px;font-weight:900">' + s.exams.length + '</div><div class="scm">exams taken</div></div><div class="card gold" style="text-align:center;margin:0"><div style="font-size:28px;font-weight:900">' + st.avg + '%</div><div class="scm">average (best ' + st.best + '%)</div></div></div>' +
      '<div class="card"><b>Answers overview</b><div class="row" style="margin-top:6px"><div>' + donut([{ v: st.right, c: "#f5b700" }, { v: st.part, c: "#b36b00" }, { v: st.wrong, c: "#e57373" }]) + '</div><div class="scm" style="line-height:1.9"><span class="pill y">●</span>Correct ' + st.right + '<br><span class="pill">●</span>Partly ' + st.part + '<br><span class="pill r">●</span>Missed ' + st.wrong + '</div></div></div>' +
      '<div class="card"><b>Your scores over time</b>' + lineChart(st.scores) + '</div>' +
      '<div class="card"><b>By topic</b><table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:13.5px"><tr style="text-align:left;color:#8a6d1f"><th>Topic</th><th>Score</th><th></th></tr>' +
      st.list.map(function (x) { var l = lvl(x.pct); return '<tr><td style="padding:6px 0">' + E(x.sub) + '<div class="bar" style="height:7px;margin-top:3px"><i style="width:' + x.pct + '%"></i></div></td><td>' + x.pct + '%</td><td><span class="pill ' + l[1] + '">' + l[0] + '</span></td></tr>'; }).join("") + '</table></div>';
    var strong = st.list.filter(function (x) { return x.pct >= 75; }).slice(-2), weak = st.list.filter(function (x) { return x.pct < 70; }).slice(0, 3);
    h += '<div class="card gold"><b>💬 Friendly feedback</b>';
    if (strong.length) h += '<p>You are doing really well in <b>' + strong.map(function (x) { return E(x.sub); }).join("</b> and <b>") + '</b>. Keep it up! 🌟</p>';
    if (weak.length) h += '<p>A little more practice will lift <b>' + weak.map(function (x) { return E(x.sub); }).join("</b>, <b>") + '</b>. Read notes or flashcards on it, then try a short exam again. You can do this!</p>';
    if (!weak.length) h += '<p>No weak spots right now. Try a harder exam to keep growing!</p>';
    h += '</div>';
 h += '<div class="card"><b>📄 Report for a parent or teacher</b><div class="scm">Share your scores in one tap.</div><button class="scb sm" data-a="repShare">Share report</button><button class="scb sm ghost" data-a="repDl">Download</button></div>';
    if (weak.length) h += '<button class="scb" data-a="practise" data-v="' + E(weak[0].sub) + '">Practise ' + E(weak[0].sub) + '</button><button class="scb blue" data-a="tab" data-v="plan">Auto timetable</button>';
    return h;
  };

  var QT = { explain: ["Explain it simply", "Paste a topic or a hard paragraph", "Explain this in very simple words for a student, with one everyday example and a 2-line summary at the end:\n"], summ: ["Summarise my text", "Paste your notes or a chapter", "Summarise this for revision: 5 to 8 bullet points of key ideas, then 3 quick self-test questions:\n"], check: ["Check my answer", "Write the question and your answer", "Mark this student answer kindly: say what is right, what is missing, give a score out of 10 and show a better answer:\n"], mnem: ["Memory tricks", "What do you need to remember?", "Make 3 fun memory tricks (mnemonic, rhyme or story) to remember this:\n"] };
  V.tools = function () {
    var mm = String(Math.floor(cur.tsec / 60)).padStart(2, "0") + ":" + String(cur.tsec % 60).padStart(2, "0");
    return '<h2>🧰 Study tools</h2><div class="card gold" style="text-align:center"><b>⏱️ Focus timer</b><div class="scm">' + (cur.tmode === "focus" ? "Focus time" : "Break time") + '</div><div id="tmr" style="font-size:52px;font-weight:900;color:#b36b00">' + mm + '</div>' +
      '<button class="scb sm" data-a="tStart">' + (cur.trun ? "Pause" : "Start") + '</button><button class="scb sm ghost" data-a="tReset">Reset</button><button class="scb sm blue" data-a="tMode">' + (cur.tmode === "focus" ? "Switch to 5 min break" : "Back to focus") + '</button><div class="scm" style="margin-top:6px">Finished focus sessions count towards your daily goal.</div></div>' +
      '<div class="card"><b>Daily goal</b><div class="row"><input id="gTarget" type="number" min="5" max="600" value="' + load().goal.target + '" style="max-width:110px"><span class="scm">minutes a day</span><button class="scb sm" data-a="setGoal">Save</button></div></div>' +
      '<div class="card"><b>Quick helpers</b> <span class="scm">(1 message each)</span><label>Choose a helper</label><select id="qtSel">' + Object.keys(QT).map(function (k) { return '<option value="' + k + '">' + QT[k][0] + '</option>'; }).join("") + '</select><label>Your text</label><textarea id="qtText" placeholder="Paste or type here" maxlength="3000"></textarea><button class="scb" data-a="qtGo">Go</button><div id="qtOut"></div></div>' +
      pcCard() +
      '<div class="card"><b>📷 Scan and solve</b> <span class="scm">(1 message)</span><div class="scm">Take a photo of a homework question. Nesty explains the answer step by step.</div><input id="scanFile" type="file" accept="image/*" capture="environment" style="margin-top:6px"><button class="scb sm" data-a="scan">Solve it</button></div>' +
      '<div class="card"><b>☁️ Backup</b><div class="scm">Save your exams, notes and flashcards so you can restore them on another phone.</div><button class="scb sm blue" data-a="backup">Back up now</button></div>' +
      '<div class="card"><b>Need a normal chat?</b><div class="scm">Ask Omni smart anything in the main chat.</div><button class="scb sm blue" data-a="toChat">Back to chat</button></div>';
  };

  /* ---------- screen ---------- */
  var NAV = [["home", "🏠", "Home"], ["exams", "📝", "Exams"], ["notes", "📒", "Notes"], ["plan", "🗓️", "Timetable"], ["stories", "📖", "Stories"], ["progress", "📊", "Progress"], ["tools", "🧰", "Tools"]];
  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "sc";
    root.innerHTML = '<div class="top"><div><b>🎓 Study Center</b><small>Omni smart</small></div><span class="sp"></span><button class="ib" data-a="help" title="Help">?</button><button class="ib" data-a="close" title="Close">✕</button></div><div id="scMain"></div><div id="scNav"></div><div id="scBusy"></div><div id="scSheet"></div>';
    document.body.appendChild(root);
    root.addEventListener("click", function (ev) {
      if (ev.target.id === "scSheet") { $("scSheet").style.display = "none"; return; }
      var t = ev.target.closest ? ev.target.closest("[data-a]") : null;
      if (t && A[t.getAttribute("data-a")]) A[t.getAttribute("data-a")](t, ev);
    });
    root.addEventListener("input", function (ev) {
      var t = ev.target;
      if (t.getAttribute && t.getAttribute("data-c") !== null && S && S.tt) {
        var r = parseInt(t.getAttribute("data-r"), 10), c = parseInt(t.getAttribute("data-c"), 10);
        if (r < 0) S.tt.cols[c] = t.textContent; else S.tt.rows[r][c] = t.textContent;
        save();
      }
    });
    root.addEventListener("focusin", function (ev) {
      var t = ev.target;
      if (t.getAttribute && t.getAttribute("data-c") !== null) {
        cur.sel = { r: parseInt(t.getAttribute("data-r"), 10), c: parseInt(t.getAttribute("data-c"), 10) };
        Array.prototype.forEach.call(root.querySelectorAll("#ttTab .sel"), function (x) { x.classList.remove("sel"); });
        t.classList.add("sel");
      }
    });
  }
  function drawNav() {
    var act = TAB === "take" || TAB === "result" ? "exams" : TAB;
    $("scNav").innerHTML = NAV.map(function (n) { return '<button class="' + (n[0] === act ? "on" : "") + '" data-a="tab" data-v="' + n[0] + '"><i>' + n[1] + '</i>' + n[2] + '</button>'; }).join("");
  }
  function render(keepScroll) {
    if (TAB === "plan") U("sc_tt");
    var m = $("scMain"), y = m.scrollTop;
    m.innerHTML = V[TAB]();
    m.scrollTop = keepScroll ? y : 0;
    drawNav();
  }
  function go(t) { TAB = t; render(); }
  function drawTT() { $("ttBox").innerHTML = ttTable(); cur.sel = { r: -1, c: -1 }; }

  window.openStudyCenter = function () {
    S = null; load(); build(); root.style.display = "flex"; document.body.style.overflow = "hidden"; touch();
    if (!V[TAB] || TAB === "take" || TAB === "result") TAB = "home";
    if (quietLocked()) TAB = "locked";
    render();
    try { if (!localStorage.getItem("nestySCwelcome")) { localStorage.setItem("nestySCwelcome", "1"); toast("Welcome to Study Center 🎓"); } } catch (e) {}
  };
  window.closeStudyCenter = function () { if (root) root.style.display = "none"; document.body.style.overflow = ""; };
  window.goStudy = function () {
    try {
      var ok = (typeof allowedModels === "function") && allowedModels().indexOf("smart") > -1;
      if (!ok) { openPlans("learnover"); return; }
      if (activeModel() !== "smart") pickModel("smart");
      openStudyCenter();
    } catch (e) { openPlans("learnover"); }
  };

  /* ---------- actions ---------- */
  var A = {};
  Object.assign(A, PCA);
  function say(text) {
    try {
      var ss = window.speechSynthesis; if (!ss) { toast("Reading aloud is not available on this phone."); return; }
      ss.cancel();
      var parts = String(text).replace(/[#*_`>|-]+/g, " ").split(/(?<=[.!?])\s+/).filter(function (x) { return x.trim(); });
      var lang = (load().lang === "sw") ? "sw-KE" : "en-GB";
      parts.forEach(function (p) { var u = new SpeechSynthesisUtterance(p.slice(0, 220)); u.lang = lang; u.rate = 0.95; ss.speak(u); });
    } catch (e) { toast("Could not read aloud."); }
  }
  A.readStop = function () { try { speechSynthesis.cancel(); } catch (e) {} };
  A.readStory = function () { var b = load().stories.filter(function (x) { return x.id === cur.story; })[0]; if (b) say((b.chs[cur.ch] || b.chs[0]).text); };
  A.readNote = function (t) { var n = load().notes.filter(function (x) { return x.id === t.getAttribute("data-v"); })[0]; if (n) say(n.text); };
  A.lang = function (t) { load().lang = t.getAttribute("data-v"); if (S.lang === "sw") U("sc_swa"); save(); render(true); toast(S.lang === "sw" ? "Kiswahili is on. New exams, notes and stories will be in Kiswahili." : "English is on."); };
  A.backup = function () { if (window.nestyBackupNow) nestyBackupNow(); else toast("Open More, then Backup and restore."); };
  A.scan = async function () {
    var f = $("scanFile") && $("scanFile").files[0]; if (!f) { toast("Choose or take a photo first."); return; }
    busy("Nesty is reading your homework...");
    try {
      U("sc_scan");
      var img = await fitImage(f, 1280, false, 0.8);
      var out = await ask("This is a photo of a student's homework or question. Read it carefully, then solve it step by step in simple words suitable for a school student, and finish with 'Final answer:'. If the picture is unclear or has no question, say so kindly and tell the student how to take a better photo.", img);
      busy(""); sheet('<h3>📷 Scan and solve</h3><div class="note">' + md(out) + '</div><button class="scb" data-a="sheetx">Close</button>');
    } catch (e) { fail(e); }
  };
  /* parent or teacher report */
  function repText() {
    var s = load(), st = stats(), nm = firstName() || "The learner";
    var strong = st.list.filter(function (x) { return x.pct >= 75; }).slice(-3).map(function (x) { return x.sub; }), weak = st.list.filter(function (x) { return x.pct < 70; }).slice(0, 4).map(function (x) { return x.sub + " (" + x.pct + "%)"; });
    return "Nesty Study Center report for " + nm + "\nDate: " + new Date().toLocaleDateString() + "\nExams taken: " + s.exams.length + "\nAverage score: " + st.avg + "%\nStudy streak: " + streakN() + " days\nStrong topics: " + (strong.join(", ") || "not enough data yet") + "\nTopics to improve: " + (weak.join(", ") || "none right now") + "\nRecent scores: " + st.scores.join("%, ") + (st.scores.length ? "%" : "") + "\n\nNesty is an AI and can make mistakes. This report only shows exams taken inside Nesty.";
  }
  A.repShare = function () { var t = repText(); if (navigator.share) navigator.share({ title: "Study report", text: t }).catch(function () {}); else window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank"); };
  A.repDl = function () { dl("Study report", "<h1>Study report</h1>" + repText().split("\n").map(function (l) { return "<p>" + E(l) + "</p>"; }).join("")); };
  /* challenge a friend (multiple choice only, marked on the friend's phone, no messages used) */
  function b64(o) { var j = unescape(encodeURIComponent(JSON.stringify(o))); return btoa(j).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function unb64(t) { t = String(t).replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return JSON.parse(decodeURIComponent(escape(atob(t)))); }
  A.challenge = function () {
    var ex = cur.res; if (!ex) return;
    var mc = ex.items.filter(function (q) { return q.type === "mcq"; }).slice(0, 10);
    if (mc.length < 3) { toast("Challenges need at least 3 multiple-choice questions."); return; }
    var link = "", n = mc.length;
    while (n >= 3) { link = location.origin + "/?quiz=" + b64({ t: ex.topic, g: ex.grade, q: mc.slice(0, n).map(function (q) { return [q.q, q.options, q.answer]; }) }); if (link.length < 7000) break; n--; }
    var txt = "I challenge you! Can you beat my score on " + ex.topic + " (" + ex.pct + "%)? Try it on Nesty AI: " + link;
    if (navigator.share) navigator.share({ title: "Nesty challenge", text: txt }).catch(function () {}); else window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
  };
  V.shared = function () {
    var q = cur.sq, h = '<div class="card gold"><b>🏆 Challenge from a friend</b><div class="scm">' + E(q.t) + ' · ' + E(q.g) + ' · ' + q.q.length + ' questions. Marked on your phone, free.</div></div>';
    q.q.forEach(function (it, i) {
      h += '<div class="card"><b>' + (i + 1) + '. ' + E(it[0]) + '</b>' + (it[1] || []).map(function (o, j) { return '<button class="opt ' + ((cur.sa || {})[i] === "ABCD".charAt(j) ? "on" : "") + '" data-a="spick" data-q="' + i + '" data-o="' + "ABCD".charAt(j) + '"><b>' + "ABCD".charAt(j) + '.</b> ' + E(o) + '</button>'; }).join("") + '</div>';
    });
    return h + '<button class="scb" data-a="sdone">Finish and see my score</button><button class="scb ghost" data-a="tab" data-v="home">Leave</button>';
  };
  V.sres = function () {
    var q = cur.sq, ok = 0, h = "";
    q.q.forEach(function (it, i) { var a = (cur.sa || {})[i]; if (a === it[2]) ok++; h += '<div class="card"><b>' + (i + 1) + '. ' + E(it[0]) + '</b>' + (it[1] || []).map(function (o, j) { var L2 = "ABCD".charAt(j); return '<div class="opt ' + (L2 === it[2] ? 'ok' : (L2 === a ? 'bad' : '')) + '"><b>' + L2 + '.</b> ' + E(o) + (L2 === a ? ' ← you' : '') + '</div>'; }).join("") + '</div>'; });
    var pc = Math.round(100 * ok / q.q.length);
    return '<div class="card gold" style="text-align:center"><div class="scm">' + E(q.t) + '</div><div style="font-size:46px;font-weight:900;color:#b36b00">' + ok + ' / ' + q.q.length + '</div><div>' + (pc >= 80 ? "Brilliant! 🌟" : pc >= 50 ? "Good try! 💪" : "Keep practising! 📚") + '</div></div>' + h + '<button class="scb" data-a="tab" data-v="exams">Make my own exam</button><button class="scb ghost" data-a="tab" data-v="home">Study Center home</button>';
  };
  A.spick = function (t) { var q = t.getAttribute("data-q"), o = t.getAttribute("data-o"); cur.sa = cur.sa || {}; cur.sa[q] = o; Array.prototype.forEach.call(root.querySelectorAll('[data-a="spick"][data-q="' + q + '"]'), function (b) { b.classList.toggle("on", b.getAttribute("data-o") === o); }); };
  A.sdone = function () { TAB = "sres"; render(); };
  window.openSharedQuiz = function (code) {
    try {
      var q = unb64(code);
      if (!q || !Array.isArray(q.q) || q.q.length < 1 || q.q.length > 20) return;
      q.q = q.q.map(function (x) { return [String(x[0] || "").slice(0, 400), (x[1] || []).slice(0, 4).map(function (o) { return String(o).slice(0, 200); }), String(x[2] || "A").charAt(0).toUpperCase()]; });
      q.t = String(q.t || "Quiz").slice(0, 80); q.g = String(q.g || "").slice(0, 40);
      S = null; load(); build(); cur.sq = q; cur.sa = {}; TAB = "shared"; root.style.display = "flex"; document.body.style.overflow = "hidden"; render();
    } catch (e) { toast("That challenge link is not valid."); }
  };
  A.close = function () { closeStudyCenter(); };
  A.help = function () { if (window.openHelp) openHelp(); };
  A.sheetx = function () { $("scSheet").style.display = "none"; };
  A.plans = function () { $("scSheet").style.display = "none"; closeStudyCenter(); openPlans("learnover"); };
  A.toChat = function () { closeStudyCenter(); var b = $("box"); if (b) b.focus(); };
  A.tab = function (t) { TAB = t.getAttribute("data-v"); if (TAB === "notes") { cur.deck = null; } render(); };
  A.practise = function (t) { TAB = "exams"; render(); $("exTopic").value = t.getAttribute("data-v"); $("exTopic").scrollIntoView({ block: "center" }); };

  A.makeExam = async function () {
    var topic = val("exTopic"); if (!topic) { toast("Type a topic first."); return; }
    var type = val("exType"), n = clamp(val("exN"), 1, type === "mcq" ? 20 : 10), grade = val("exGrade"), diff = val("exDiff"), pics = clamp(val("exPics"), 0, 3);
    if (pics > n) pics = n;
    busy("Nesty is writing your exam...");
    try {
      var style = type === "mcq" ? "ALL multiple choice with 4 options" : type === "written" ? "ALL written answers (short answers or short problems)" : "about 60% multiple choice and 40% written";
      var pst = val("exStyle"); if (pst) U("sc_past"); U("sc_exam"); if (S.lang === "sw") U("sc_swa");
      var p = "Make an exam as JSON only (no extra words, no code fence).\n" + (pst ? "Write it like a Kenyan " + pst + " past paper: the same tone, layout, wording and mark style as real " + pst + " papers, with Kenyan names, places, shillings and examples. Do not copy real papers; write new questions in that style.\n" : "") + "Topic: " + topic + ". Level: " + grade + ". Questions: exactly " + n + ". Style: " + style + ". Difficulty: " + diff + ".\n" +
        "Rules: accurate, clear questions that suit the level. Every question has \"sub\" (a 1 to 3 word sub-topic). Multiple choice: exactly 4 options WITHOUT letters, \"answer\" is one letter A, B, C or D, spread the right answers across A to D. Written: \"answer\" is a short model answer and \"marks\" is 1 to 5. \"explain\" is one friendly sentence. " +
        (pics ? "For exactly " + pics + " questions that really need a picture, set \"img\" to a short description of a simple clear educational illustration (diagram, map, chart or object, never a real person); all other questions have \"img\":\"\"." : "Set \"img\" to \"\" for every question.") + "\n" +
        'Format: {"title":"...","questions":[{"type":"mcq","q":"...","options":["...","...","...","..."],"answer":"B","marks":1,"sub":"...","explain":"...","img":""},{"type":"written","q":"...","answer":"...","marks":2,"sub":"...","explain":"...","img":""}]}';
      var j = parseJson(await ask(p));
      if (!j || !Array.isArray(j.questions) || !j.questions.length) throw { msg: "Nesty could not make that exam. Please try again." };
      var items = j.questions.slice(0, n).map(function (q) {
        var mcq = q.type === "mcq" && Array.isArray(q.options) && q.options.length >= 2;
        return { type: mcq ? "mcq" : "written", q: String(q.q || ""), options: mcq ? q.options.slice(0, 4).map(String) : [], answer: mcq ? String(q.answer || "A").trim().toUpperCase().charAt(0) : String(q.answer || ""), marks: clamp(q.marks, 1, 5), sub: String(q.sub || topic).slice(0, 40), explain: String(q.explain || ""), img: String(q.img || "").slice(0, 300) };
      }).filter(function (q) { return q.q; });
      if (!items.length) throw { msg: "Nesty could not make that exam. Please try again." };
      var want = items.filter(function (q) { return q.img; }).slice(0, pics);
      for (var k = 0; k < want.length; k++) {
        busy("Drawing picture " + (k + 1) + " of " + want.length + "...");
        try {
          var jwt = await getJwt();
          var r = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json", "X-Nesty-Token": jwt }, body: JSON.stringify({ prompt: "Simple clear educational illustration for an exam, no text labels needed, white background: " + want[k].img, image: null }) });
          var d = await r.json();
          if (d.limited) { toast("Picture limit reached. The rest of your exam has no pictures."); break; }
          if (d.image) { want[k].imgData = d.image; try { markUsed("img"); } catch (e) {} }
        } catch (e2) {}
      }
      cur.exam = { id: nid(), topic: topic, grade: grade, title: String(j.title || topic + " exam"), items: items, at: Date.now() };
      cur.ans = {}; cur.t0 = Date.now(); busy(""); TAB = "take"; render(); touch();
    } catch (e) { fail(e); }
  };
  A.pick = function (t) {
    var q = t.getAttribute("data-q"), o = t.getAttribute("data-o");
    cur.ans[q] = o;
    Array.prototype.forEach.call(root.querySelectorAll('[data-a="pick"][data-q="' + q + '"]'), function (b) { b.classList.toggle("on", b.getAttribute("data-o") === o); });
  };
  A.dlPaper = function (t) { var ex = cur.exam || cur.res; if (ex) dl(ex.title, examPaper(ex, t.getAttribute("data-v") === "1")); };
  A.submitExam = async function () {
    var ex = cur.exam; if (!ex) return;
    var marks = [], writ = [];
    ex.items.forEach(function (q, i) {
      if (q.type === "mcq") { var g = cur.ans[i] || ""; marks.push({ got: g === q.answer ? q.marks : 0, max: q.marks, given: g, sub: q.sub }); }
      else {
        var ta = root.querySelector('[data-w="' + i + '"]'), a = ta ? ta.value.trim() : "";
        marks.push({ got: 0, max: q.marks, given: a, sub: q.sub, fb: a ? "" : "No answer given." });
        if (a) writ.push({ i: i, q: q.q, model: q.answer, student: a.slice(0, 600), marks: q.marks });
      }
    });
    var unanswered = ex.items.filter(function (q, i) { return q.type === "mcq" ? !cur.ans[i] : !marks[i].given; }).length;
    if (unanswered && !confirm(unanswered + " question(s) are not answered. Submit anyway?")) return;
    var comment = "";
    busy(writ.length ? "Nesty is marking your answers..." : "Marking...");
    try {
      if (writ.length) {
        var p = "You are a kind, fair teacher. Mark these student answers against the model answers. Give partial marks where deserved. Reply with JSON only: {\"marks\":[{\"i\":0,\"score\":1.5,\"feedback\":\"one short friendly sentence\"}],\"comment\":\"2 friendly sentences about how the student did and what to improve\"}.\nLevel: " + ex.grade + ". Topic: " + ex.topic + ".\n" + JSON.stringify(writ);
        var j = parseJson(await ask(p));
        if (!j || !Array.isArray(j.marks)) throw { msg: "Marking did not work this time. Your answers are still here, please tap Submit again." };
        j.marks.forEach(function (m) { var i = parseInt(m.i, 10); if (marks[i]) { marks[i].got = Math.max(0, Math.min(marks[i].max, Math.round(Number(m.score) * 2) / 2 || 0)); marks[i].fb = String(m.feedback || "").slice(0, 200); } });
        comment = String(j.comment || "");
      }
    } catch (e) { fail(e); return; }
    var got = marks.reduce(function (a, m) { return a + m.got; }, 0), max = marks.reduce(function (a, m) { return a + m.max; }, 0), pct = max ? Math.round(100 * got / max) : 0;
    if (!comment) {
      var bad = {}; marks.forEach(function (m) { if (m.got < m.max) bad[m.sub] = 1; });
      var bl = Object.keys(bad).slice(0, 3).join(", ");
      comment = pct >= 80 ? "Excellent work, " + (firstName() || "friend") + "! You really know this topic." + (bl ? " To make it perfect, take another look at: " + bl + "." : " Try a harder exam next!") : pct >= 60 ? "Good job! You are on the right track." + (bl ? " A little more practice on " + bl + " will lift your score." : "") : "Thank you for trying, every attempt makes you stronger. " + (bl ? "Let's focus on " + bl + ": read the notes, use flashcards, then try again." : "Revise the topic and try again.");
    }
    var s = load(), rec = { id: ex.id, topic: ex.topic, grade: ex.grade, title: ex.title, at: Date.now(), pct: pct, got: got, max: max, comment: comment, marks: marks, items: ex.items.map(function (q) { return { type: q.type, q: q.q, options: q.options, answer: q.answer, marks: q.marks, sub: q.sub, explain: q.explain }; }) };
    s.exams.push(rec); if (s.exams.length > 40) s.exams.shift(); save(); touch();
    rec.items.forEach(function (q, i) { if (ex.items[i].imgData) q.imgData = ex.items[i].imgData; });
    cur.res = rec; cur.exam = null; busy(""); TAB = "result"; render();
  };
  A.viewExam = function (t) { var ex = load().exams.filter(function (x) { return x.id === t.getAttribute("data-v"); })[0]; if (ex) { cur.res = ex; TAB = "result"; render(); } };
  A.resFlash = async function () {
    var ex = cur.res, miss = ex.items.filter(function (q, i) { return ex.marks[i].got < ex.marks[i].max; }).map(function (q) { return q.q + " -> " + String(q.type === "mcq" ? q.options["ABCD".indexOf(q.answer)] : q.answer); }).slice(0, 12);
    if (!miss.length) { toast("You got everything right. Amazing!"); return; }
    await makeDeckFrom(ex.topic + " (missed questions)", ex.grade, 0, "Make flashcards that teach the correct answers to the questions this student missed:\n" + miss.join("\n"));
  };

  async function makeDeckFrom(topic, grade, n, custom) {
    busy("Making flashcards...");
    try {
      var p = (custom || "Make " + n + " flashcards on the topic: " + topic + " for " + grade + ".") + '\nReply with JSON only: {"cards":[{"q":"short question or term","a":"short clear answer"}]}. Keep answers under 25 words.';
      var j = parseJson(await ask(p));
      if (!j || !Array.isArray(j.cards) || !j.cards.length) throw { msg: "Could not make flashcards. Please try again." };
      U("sc_srs");
      var d = { id: nid(), topic: topic, at: Date.now(), cards: j.cards.slice(0, 24).map(function (c) { return { q: String(c.q || ""), a: String(c.a || "") }; }).filter(function (c) { return c.q && c.a; }) };
      load().decks.push(d); save(); touch(); cur.nsub = "cards"; cur.deck = d.id; cur.card = 0; cur.flip = false; busy(""); TAB = "notes"; render();
    } catch (e) { fail(e); }
  }
  A.makeDeck = function () { var t = val("fcTopic"); if (!t) { toast("Type a topic first."); return; } makeDeckFrom(t, val("fcGrade"), clamp(val("fcN"), 6, 20)); };
  A.nsub = function (t) { cur.nsub = t.getAttribute("data-v"); cur.deck = null; render(); };
  A.deckOpen = function (t) { cur.deck = t.getAttribute("data-v"); cur.card = 0; cur.flip = false; render(); };
  var DAYS = [0, 1, 2, 4, 8, 16];
  function dueCards(d) { var n = Date.now(); return d.cards.filter(function (c) { return !c.due || c.due <= n; }); }
  A.dueToggle = function () { cur.due = !cur.due; cur.card = 0; cur.flip = false; render(); };
  A.srs = function (t) {
    var d = load().decks.filter(function (x) { return x.id === cur.deck; })[0]; if (!d) return;
    var arr = cur.due ? dueCards(d) : d.cards, c = arr[cur.card % arr.length]; if (!c) return;
    if (t.getAttribute("data-v") === "1") { c.box = Math.min(5, (c.box || 0) + 1); c.due = Date.now() + DAYS[c.box] * 86400000; }
    else { c.box = 0; c.due = Date.now() + 600000; }
    save(); U("sc_srs"); cur.flip = false; if (!cur.due) cur.card++; render(true);
  };
  A.deckClose = function () { cur.deck = null; render(); };
  A.deckDel = function (t) { if (!confirm("Delete this deck?")) return; S.decks = S.decks.filter(function (d) { return d.id !== t.getAttribute("data-v"); }); save(); render(true); };
  A.flip = function () { cur.flip = !cur.flip; render(true); };
  A.cardGo = function (t) { var d = S.decks.filter(function (x) { return x.id === cur.deck; })[0]; cur.card = (cur.card + parseInt(t.getAttribute("data-v"), 10) + d.cards.length) % d.cards.length; cur.flip = false; render(true); };
  A.shuffle = function () { var d = S.decks.filter(function (x) { return x.id === cur.deck; })[0]; d.cards.sort(function () { return Math.random() - 0.5; }); save(); cur.card = 0; cur.flip = false; render(true); };

  A.makeNote = async function () {
    var topic = val("ntTopic"); if (!topic) { toast("Type a topic first."); return; }
    var grade = val("ntGrade"), style = val("ntStyle");
    busy("Nesty is writing your notes...");
    try {
      var t = await ask("Write clear study notes. Topic: " + topic + ". Level: " + grade + ". Style: " + style + ". Use Markdown: a title, short headings, short bullet points, **bold** key terms, one simple example, a line starting with 'Remember:' and 3 quick self-check questions at the end. Be accurate and friendly. Output only the notes.");
      if (t.length < 80) throw { msg: "Could not write the notes. Please try again." };
      var n = { id: nid(), topic: topic, grade: grade, text: t, at: Date.now() };
      load().notes.push(n); save(); touch(); cur.note = n.id; busy(""); render();
    } catch (e) { fail(e); }
  };
  function noteById(t) { return load().notes.filter(function (x) { return x.id === t.getAttribute("data-v"); })[0]; }
  A.noteOpen = function (t) { cur.note = t.getAttribute("data-v"); render(); };
  A.noteDel = function (t) { if (!confirm("Delete these notes?")) return; S.notes = S.notes.filter(function (x) { return x.id !== t.getAttribute("data-v"); }); cur.note = null; save(); render(); };
  A.noteDl = function (t) { var n = noteById(t); if (n) dl(n.topic, md(n.text)); };
  A.noteCopy = function (t) { var n = noteById(t); if (n && navigator.clipboard) navigator.clipboard.writeText(n.text).then(function () { toast("Copied"); }); };
  A.noteCards = function (t) { var n = noteById(t); if (n) makeDeckFrom(n.topic, n.grade, 0, "Make 12 flashcards from these study notes:\n" + n.text.slice(0, 3500)); };

  A.ttRow = function () { var t = S.tt, at = cur.sel.r >= 0 ? cur.sel.r + 1 : t.rows.length, row = t.cols.map(function () { return ""; }); t.rows.splice(at, 0, row); save(); drawTT(); };
  A.ttCol = function () { var t = S.tt, at = cur.sel.c >= 0 ? cur.sel.c + 1 : t.cols.length; t.cols.splice(at, 0, "New"); t.rows.forEach(function (r) { r.splice(at, 0, ""); }); save(); drawTT(); };
  A.ttDelRow = function () { var t = S.tt; if (t.rows.length < 2) { toast("Keep at least one row."); return; } t.rows.splice(cur.sel.r >= 0 ? cur.sel.r : t.rows.length - 1, 1); save(); drawTT(); };
  A.ttDelCol = function () { var t = S.tt; if (t.cols.length < 2) { toast("Keep at least one column."); return; } var at = cur.sel.c >= 0 ? cur.sel.c : t.cols.length - 1; t.cols.splice(at, 1); t.rows.forEach(function (r) { r.splice(at, 1); }); save(); drawTT(); };
  A.ttReset = function () { if (!confirm("Clear the whole timetable?")) return; S.tt = defaultTT(); save(); drawTT(); };
  function ttHtml() { var t = S.tt; return "<h1>My study timetable</h1><table><tr>" + t.cols.map(function (c) { return "<th>" + E(c) + "</th>"; }).join("") + "</tr>" + t.rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + E(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>"; }
  A.ttDl = function () { dl("My study timetable", ttHtml()); };
  A.ttPrint = function () { printIt("My study timetable", ttHtml()); };
  A.ttAuto = async function () {
    var subj = val("atSubj"); if (!subj) { toast("Type your subjects first."); return; }
    var days = val("atDays"), hrs = clamp(val("atHrs"), 1, 6), start = val("atStart") || "16:00", br = val("atBreak");
    busy("Nesty is building your timetable...");
    try {
      var dayList = days === "Mon-Fri" ? "Mon, Tue, Wed, Thu, Fri" : days === "Mon-Sat" ? "Mon, Tue, Wed, Thu, Fri, Sat" : "Mon, Tue, Wed, Thu, Fri, Sat, Sun", weak = weakText();
      var p = 'Make a weekly study timetable. Reply with JSON only: {"cols":["Time","Mon",...],"rows":[["16:00-17:00","Maths: Fractions",...]]}. The first column is the time slot, the other columns are these days: ' + dayList + ". Subjects: " + subj + ". Study hours per day: " + hrs + ". Start time: " + start + ". " + br + ". " +
        (weak ? "From the student's exam results the weak areas are: " + weak + ". Give weak areas more and earlier sessions. " : "No exam results yet, so share the time fairly. ") + "Add one light revision or rest slot. Use 1-hour slots (45 minutes study + short break is fine). At most 8 rows. Every cell is short (under 40 characters) and the same number of cells as columns.";
      var j = parseJson(await ask(p));
      if (!j || !Array.isArray(j.cols) || !Array.isArray(j.rows) || !j.rows.length) throw { msg: "Could not build the timetable. Please try again." };
      var nc = j.cols.length;
      S.tt = { cols: j.cols.map(String), rows: j.rows.slice(0, 10).map(function (r) { r = Array.isArray(r) ? r.map(String) : []; while (r.length < nc) r.push(""); return r.slice(0, nc); }) };
      save(); touch(); busy(""); render(); toast("Done. Tap any box to edit it.");
    } catch (e) { fail(e); }
  };

  function storyKind(a) { return AGE(a)[0]; }
  function parseStory(t) {
    var title = (/^\s*TITLE:\s*(.+)$/im.exec(t) || [])[1] || "";
    var s = (/===STORY===([\s\S]*?)(===WORDS===|===QUESTIONS===|===END===|$)/.exec(t) || [])[1] || "";
    var w = (/===WORDS===([\s\S]*?)(===QUESTIONS===|===END===|$)/.exec(t) || [])[1] || "";
    var q = (/===QUESTIONS===([\s\S]*?)(===END===|$)/.exec(t) || [])[1] || "";
    return {
      title: title.trim(), text: s.trim(),
      words: w.split("\n").map(function (l) { var m = /^\s*[-*\d.)\s]*([^:\-]{2,30})\s*[:\-]\s*(.+)$/.exec(l); return m ? { w: m[1].trim(), m: m[2].trim() } : null; }).filter(Boolean).slice(0, 8),
      qs: q.split("\n").map(function (l) { return l.replace(/^\s*[-*\d.)\s]+/, "").trim(); }).filter(function (l) { return l.length > 5; }).slice(0, 5)
    };
  }
  function storyPrompt(b, k, prevEnd) {
    var a = b.age, kind = b.kind, len, style;
    if (a <= 5) { len = "150 to 250 words"; style = "Very short sentences and very simple words, gentle repetition, cute animals or family, a happy ending and one small kind lesson."; }
    else if (a <= 9) { len = "350 to 500 words"; style = "Simple sentences and a few new words, a clear beginning, problem and happy ending, with a good lesson."; }
    else if (a <= 12) { len = "600 to 800 words"; style = "A real story with a beginning, a problem, a climax and an ending; richer words, humour and heart; level for ages 10 to 12."; }
    else if (a <= 15) { len = "about 900 words for this chapter"; style = "A NOVELLA of " + b.total + " chapters: believable characters, real-life challenges handled responsibly, a clear plot that builds."; }
    else { len = "about 1100 words for this chapter"; style = "A serious NOVEL of " + b.total + " chapters for older teens and adults: depth, strong characters, real consequences and mature themes (loss, ambition, justice, family, identity) handled with care."; }
    return "Write " + (b.total > 1 ? "chapter " + k + " of " + b.total + " of " : "") + AGE(a)[1] + " for a reader aged " + a + ". Genre: " + b.genre + ". " + (b.idea ? "Idea: " + b.idea + ". " : "Choose a fresh, original idea. ") + (b.total > 1 ? (k === 1 ? "Give the book a title and begin the story. " : "Book title: " + b.title + ". The previous chapter ended with: \"" + prevEnd + "\" Continue the same characters and plot. " + (k === b.total ? "This is the FINAL chapter: bring the story to a satisfying ending. " : "")) : "") +
      "Length: " + len + ". Style: " + style + " Keep everything suitable for learners: no sexual content, no drug abuse, no glorifying violence or bad behaviour (show consequences and good values instead). Then add 4 to 6 new words from the text with simple meanings, and 3 questions about the text (include one about values or lessons).\nUse EXACTLY this format:\nTITLE: <title>\n===STORY===\n<the story, plain paragraphs>\n===WORDS===\nword: meaning\n===QUESTIONS===\n1. question\n===END===";
  }
  A.makeStory = async function () {
    U("sc_story");
    var age = clamp(val("stAge"), 3, 99);
    var capA = pcGet().cap || 0; if (capA && age > capA) { age = capA; toast("A parent limited stories to age " + capA + " or younger."); }
    var b = { id: nid(), age: age, kind: storyKind(age), genre: val("stGenre").replace(/&amp;/g, "&"), idea: val("stIdea"), total: age >= 16 ? 12 : age >= 13 ? 6 : 1, title: "", chs: [], at: Date.now() };
    busy("Nesty is writing your " + b.kind.toLowerCase() + "...");
    try {
      var r = parseStory(await ask(storyPrompt(b, 1, "")));
      if (r.text.length < 60) throw { msg: "Could not write the story. Please try again." };
      b.title = r.title || "My " + b.kind; b.chs.push({ text: r.text, words: r.words, qs: r.qs });
      load().stories.push(b); save(); touch(); cur.story = b.id; cur.ch = 0; busy(""); render(); $("scMain").scrollTop = 99999;
    } catch (e) { fail(e); }
  };
  function curBook() { return load().stories.filter(function (x) { return x.id === cur.story; })[0]; }
  A.storyOpen = function (t) { cur.story = t.getAttribute("data-v"); cur.ch = 0; render(); };
  A.storyDel = function (t) { if (!confirm("Delete this book?")) return; S.stories = S.stories.filter(function (x) { return x.id !== t.getAttribute("data-v"); }); if (cur.story === t.getAttribute("data-v")) cur.story = null; save(); render(true); };
  A.chGo = function (t) { cur.ch += parseInt(t.getAttribute("data-v"), 10); render(); };
  A.nextCh = async function () {
    var b = curBook(); if (!b) return;
    var k = b.chs.length + 1, last = b.chs[b.chs.length - 1].text;
    busy("Writing chapter " + k + "...");
    try {
      var r = parseStory(await ask(storyPrompt(b, k, last.slice(-600))));
      if (r.text.length < 60) throw { msg: "Could not write the chapter. Please try again." };
      b.chs.push({ text: r.text, words: r.words, qs: r.qs }); save(); touch(); cur.ch = b.chs.length - 1; busy(""); render();
    } catch (e) { fail(e); }
  };
  A.storyDl = function () {
    var b = curBook(); if (!b) return;
    dl(b.title, "<h1>" + E(b.title) + "</h1>" + b.chs.map(function (c, i) { return (b.chs.length > 1 ? "<h2>Chapter " + (i + 1) + "</h2>" : "") + c.text.split(/\n+/).map(function (p) { return "<p>" + E(p) + "</p>"; }).join("") + (c.words.length ? "<h3>New words</h3>" + c.words.map(function (w) { return "<p><b>" + E(w.w) + ":</b> " + E(w.m) + "</p>"; }).join("") : ""); }).join(""));
  };
  A.checkStory = async function () {
    var b = curBook(), c = b.chs[cur.ch], ans = c.qs.map(function (q, i) { var t = root.querySelector('[data-sq="' + i + '"]'); return { q: q, a: t ? t.value.trim() : "" }; });
    if (!ans.some(function (x) { return x.a; })) { toast("Write at least one answer first."); return; }
    busy("Checking your answers...");
    try {
      var t = await ask("A " + b.age + "-year-old reader answered questions about this story part. Be kind. For each question say if it is right, add the best short answer, and finish with one encouraging line. Reply in short plain text.\nStory part: " + c.text.slice(0, 2500) + "\nAnswers: " + JSON.stringify(ans));
      busy(""); $("stFb").innerHTML = '<div class="note" style="margin-top:8px">' + md(t) + '</div>'; touch();
    } catch (e) { fail(e); }
  };

  /* tools */
  function tick() {
    cur.tsec--;
    var e = $("tmr");
    if (e) e.textContent = String(Math.floor(cur.tsec / 60)).padStart(2, "0") + ":" + String(cur.tsec % 60).padStart(2, "0");
    if (cur.tsec <= 0) {
      clearInterval(cur.timer); cur.trun = false;
      if (cur.tmode === "focus") { var s = load(), k = dkey(); s.goal.log[k] = (s.goal.log[k] || 0) + 25; save(); touch(); toast("Great focus! 25 minutes done 🎉"); cur.tmode = "break"; cur.tsec = 300; }
      else { toast("Break over. Ready for another round?"); cur.tmode = "focus"; cur.tsec = 1500; }
      try { navigator.vibrate && navigator.vibrate(300); } catch (x) {}
      if (TAB === "tools") render(true);
    }
  }
  A.tStart = function () { if (cur.trun) { clearInterval(cur.timer); cur.trun = false; } else { cur.trun = true; cur.timer = setInterval(tick, 1000); } render(true); };
  A.tReset = function () { clearInterval(cur.timer); cur.trun = false; cur.tsec = cur.tmode === "focus" ? 1500 : 300; render(true); };
  A.tMode = function () { clearInterval(cur.timer); cur.trun = false; cur.tmode = cur.tmode === "focus" ? "break" : "focus"; cur.tsec = cur.tmode === "focus" ? 1500 : 300; render(true); };
  A.setGoal = function () { load().goal.target = clamp(val("gTarget"), 5, 600); save(); toast("Goal saved"); };
  A.qtGo = async function () {
    var k = val("qtSel"), t = val("qtText"); if (t.length < 3) { toast("Type or paste something first."); return; }
    busy("Nesty is working...");
    try { var r = await ask(QT[k][2] + t.slice(0, 3000)); busy(""); $("qtOut").innerHTML = '<div class="note" style="margin-top:10px">' + md(r) + '</div>'; touch(); } catch (e) { fail(e); }
  };
})();
