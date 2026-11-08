/* Nesty plans screen: colourful plan cards, plans that add together, and M-Pesa STK push payment. */
(function () {
  "use strict";
  if (window.nestyPlansLoaded) return;
  window.nestyPlansLoaded = true;

  /* ---------- plan data (Learnover is now called Smart; Diamond is new; Ultra has smaller limits) ---------- */
  PLAN_ORDER = ["free", "diamond", "go", "premium", "pro", "learnover", "ultra", "gold", "platinum", "max"];
  PLAN_DATA.learnover.n = "Smart";
  PLAN_DATA.free.extras = ["Try Manuva: 3 free messages a day"];
  PLAN_DATA.diamond = { n: "Diamond", msg: 30, file: 20, img: 4, tts: 10, m: 30, y: 360, models: ["manuva"], extras: ["Adds the Manuva model to whatever plan you have", "Up to 20 Manuva messages per hour", "Other limits stay as on your main plan"] };
  PLAN_DATA.ultra.msg = 90; PLAN_DATA.ultra.file = 90; PLAN_DATA.ultra.img = 30; PLAN_DATA.ultra.tts = 70;
  PLAN_DATA.ultra.models = ["hiaru", "smart", "tyra"];
  PLAN_DATA.ultra.extras = ["3 models: Hiaru 5.1, Omni smart and Tyra", "Deep search (8 per hour) and data analysis with charts", "Big limits for work and study"];
  PLAN_DATA.free.models = ["neptune", "nova", "lexy"];
  PLAN_DATA.gold = { n: "Gold", msg: 110, file: 100, img: 35, tts: 80, win: 40, m: 799, y: 9588, models: ["nuvida", "tyra", "lexy", "vilda"], extras: ["Your limits come back every 40 minutes, not every hour", "Deep search: 10 per hour", "Four models: Nuvida, Tyra, Lexy and Vilda"] };
  PLAN_DATA.platinum = { n: "Platinum", msg: 140, file: 130, img: 45, tts: 100, win: 25, m: 999, y: 11988, models: ["nuvida", "tyra", "smart", "fenny", "vilda"], extras: ["Your limits come back every 25 minutes", "Deep search: 14 per hour and data analysis with charts", "Five models: Nuvida, Tyra, Omni smart, Fenny and Vilda"] };
  PLAN_DATA.max = { n: "Max", msg: 200, file: 180, img: 60, tts: 150, win: 15, m: 1599, y: 19188, models: ["neptune", "nova", "nuvida", "hiaru", "smart", "tyra", "manuva", "lexy", "fenny", "vilda"], extras: ["All ten models, you choose", "Your limits come back every 15 minutes", "Deep search: 20 per hour, Manuva: 40 per hour, data analysis", "The biggest limits of all"] };
  function winTxt(p) { var w = p.win || 60; return w === 60 ? "per hour" : "every " + w + " minutes"; }
  MODEL_INFO.lexy = { n: "Lexy", d: "For sports: football, athletics, rugby, basketball and more" };
  MODEL_INFO.fenny = { n: "Fenny", d: "For fitness, exercises, body parts, organs and body care" };
  MODEL_INFO.vilda = { n: "Vilda", d: "For career, business ideas and family life: budgets, shopping lists, plans, vacations and packing lists" };
  MODEL_INFO.hiaru = { n: "Hiaru 5.1", d: "For office work: documents, files, spreadsheets, PowerPoint, business papers and data analysis" };
  MODEL_INFO.manuva = { n: "Manuva", d: "For tough challenges: hard maths, logic, science, coding and multi-step problems" };
  modelLine = function (id) {
    var m = PLAN_DATA[id].models;
    if (id === "diamond") return "Unlocks model: <b>Manuva</b> – " + MODEL_INFO.manuva.d;
    if (id === "max") return "Models: <b>all ten, you choose</b>";
    if (m.length > 1) return "Models: <b>" + m.map(modelName).join(" or ") + "</b> (you choose)";
    return "Model: <b>" + modelName(m[0]) + "</b> – " + MODEL_INFO[m[0]].d;
  };
  var _pick = window.pickModel;
  var _tag = window.drawModelTag;
  window.drawModelTag = drawModelTag = function () {
    _tag();
    var mt = document.getElementById("mtag");
    if (mt && (allowedModels().length < 2)) { var a = activeModel(); mt.style.background = a === "manuva" ? "#0ea5e9" : (curPlan() === "ultra" ? "#7c3aed" : "#1a56db"); }
  };

  var LOOK = {
    free: { c: "#2e9e5b", bg: "#e8f7ee", ic: "🌱", tag: "Start here" },
    diamond: { c: "#0b8fd6", bg: "#e1f3ff", ic: "💎", tag: "For tough challenges" },
    go: { c: "#d99a00", bg: "#fff3c4", ic: "🚀", tag: "Everyday power" },
    premium: { c: "#d6246e", bg: "#ffe3ee", ic: "🔎", tag: "Research" },
    pro: { c: "#12805c", bg: "#ddf5ea", ic: "💼", tag: "Office work" },
    learnover: { c: "#e07b00", bg: "#ffecd0", ic: "🎓", tag: "For students" },
    ultra: { c: "#7c3aed", bg: "#eee6ff", ic: "👑", tag: "Work and study" },
    gold: { c: "#c98a00", bg: "#fff1bf", ic: "🥇", tag: "More models, faster limits" },
    platinum: { c: "#4a6a85", bg: "#e6eef5", ic: "🏆", tag: "Five models, 25 minute limits" },
    max: { c: "#111827", bg: "#e9e9ee", ic: "🚀", tag: "Everything, 15 minute limits" }
  };
  var css = document.createElement("style");
  css.textContent = "" +
    ".pz{border:2px solid var(--pc);border-radius:18px;margin:14px 0;background:#fff;color:#1d2433;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,.08)}" +
    ".pz.cur{box-shadow:0 0 0 3px var(--pc)}.pz.focus{outline:3px solid #7c3aed}" +
    ".pz .ph{display:flex;align-items:center;gap:12px;padding:13px 14px;background:var(--pb)}" +
    ".pz .pi{width:54px;height:54px;border-radius:50%;background:#fff;border:3px solid var(--pc);display:flex;align-items:center;justify-content:center;font-size:28px;flex:none;position:relative}" +
    ".pz .pi:after{content:'✦';position:absolute;right:-7px;top:-9px;font-size:15px;color:var(--pc)}" +
    ".pz .pn{font-size:19px;font-weight:900;color:#1d2433}.pz .pt{font-size:12.5px;font-weight:700;color:var(--pc)}" +
    ".pz .pp{margin-left:auto;text-align:right;font-weight:900;font-size:15px;color:#1d2433;line-height:1.25}.pz .pp small{display:block;font-weight:600;font-size:12px;color:#55607a}" +
    ".pz .pbd{padding:4px 14px 14px}.pz ul{list-style:none;margin:8px 0 4px;padding:0}.pz li{padding:3px 0 3px 24px;position:relative;font-size:14px;line-height:1.4}" +
    ".pz li:before{content:'✔';position:absolute;left:2px;top:3px;color:var(--pc);font-weight:900}" +
    ".pz .pbt{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.pz .pbt button{flex:1;min-width:120px;border:0;border-radius:12px;padding:11px 8px;font-weight:800;font-size:14px;background:var(--pc);color:#fff;font-family:inherit}" +
    ".pz .pbt button.alt{background:#fff;color:var(--pc);border:2px solid var(--pc)}" +
    ".pz .pay{display:none;margin-top:10px;padding:11px;border-radius:12px;background:var(--pb)}.pz .pay.on{display:block}" +
    ".pz .pay input{width:100%;font:inherit;font-size:16px;padding:10px;border:2px solid var(--pc);border-radius:10px;background:#fff;color:#1d2433;margin:6px 0}" +
    ".pz .pay .go{background:#16a34a;color:#fff;border:0;border-radius:11px;padding:11px 14px;font-weight:800;font-family:inherit;width:100%}" +
    ".pz .pay .st{font-size:13.5px;margin-top:8px;font-weight:700;line-height:1.45}.pz .pay .st.ok{color:#15803d}.pz .pay .st.bad{color:#b3261e}" +
    ".pz .own{font-size:13px;font-weight:800;color:#15803d;margin-top:8px}" +
    ".pzTop{border-radius:18px;background:#fff3c4;color:#1d2433;padding:13px 14px;margin:12px 0;border:2px solid #ffd566;font-size:14px;line-height:1.5}" +
    ".pzTop b{font-size:15px}.pzSep{font-size:12.5px;text-align:center;margin:6px 0;opacity:.8}";
  document.head.appendChild(css);

  function $(i) { return document.getElementById(i); }
  function E(s) { return esc(String(s == null ? "" : s)); }
  function activeList() { return (me && me.active && me.active.length) ? me.active : []; }
  function untilOf(id) { var a = activeList().filter(function (x) { return x.plan === id; })[0]; return a ? a.expiresAt : 0; }
  function planLabel() { var a = activeList(); return a.length ? a.map(function (x) { return PLAN_DATA[x.plan] ? PLAN_DATA[x.plan].n : x.plan; }).join(" + ") : ""; }

  window.drawPlanBtn = drawPlanBtn = function () {
    var b = $("planBtn"); if (!b) return;
    var cp = curPlan();
    drawModelTag();
    var lab = planLabel();
    var na = activeList().length; b.textContent = cp === "free" ? L("upgrade") : (PLAN_DATA[cp].n + (na > 1 ? " +" + (na - 1) : "")); b.title = lab;
    b.className = "hbtn " + (cp === "free" ? "up" : "plan");
  };
  var _cpt = curPlanText;
  window.curPlanText = curPlanText = function () {
    var a = activeList();
    if (a.length < 2) return _cpt();
    return "You have: " + a.map(function (x) { return (PLAN_DATA[x.plan] ? PLAN_DATA[x.plan].n : x.plan) + " until " + fullWhen(x.expiresAt); }).join(" · ");
  };

  var payFor = null; // {plan, period}
  window.renderPlans = renderPlans = function () {
    var body = $("plansBody");
    if (!body) return;
    var cp = curPlan();
    $("curPlan").textContent = curPlanText();
    var on = !!(me && me.mpesa); var h = '<div class="pzTop"><b>💳 ' + (on ? 'Pay with M-Pesa' : 'How to get a plan') + '</b><br>' + (on ? 'Pick a plan, tap Monthly or Yearly, type your Safaricom number, and enter your M-Pesa PIN on your phone. Your plan starts by itself in a few seconds.' : 'Pick a plan, pay by M-Pesa, and email us the proof to get your activation code.') + ' <b>Plans add together</b>, so you can have Diamond and Go at the same time.</div>';
    if (me && me.usage) {
      h += '<div class="pcard"><h3>' + L("use_title") + '</h3><ul>';
      [["msg", "k_msg"], ["file", "k_file"], ["img", "k_img"]].forEach(function (k) {
        var pl0 = PLAN_DATA[cp] || PLAN_DATA.free;
        var u = me.usage[k[0]] || { used: 0, limit: pl0[k[0]], resetAt: 0 };
        h += '<li>' + (u.resetAt && u.used ? L("use_line", { k: L(k[1]), u: u.used, l: u.limit, t: whenText(u.resetAt) }) : L("use_line0", { k: L(k[1]), u: u.used, l: u.limit })) + '</li>';
      });
      h += '</ul></div>';
    }
    if (me && me.limiter === false) h += '<div class="pcard" style="border-color:#e53935"><b>Usage counter not connected.</b><div class="muted2">The server cannot count your messages yet, so limits are not enforced.</div></div>';
    var mine = {}; activeList().forEach(function (a) { mine[a.plan] = 1; });
    PLAN_ORDER.forEach(function (id) {
      var p = PLAN_DATA[id], lk = LOOK[id];
      var own = id === "free" ? cp === "free" : !!mine[id];
      h += '<div class="pz' + (own ? ' cur' : '') + (id === plansFocus ? ' focus' : '') + '" id="pc_' + id + '" style="--pc:' + lk.c + ';--pb:' + lk.bg + '">' +
        '<div class="ph"><div class="pi">' + lk.ic + '</div><div><div class="pn">' + p.n + '</div><div class="pt">' + lk.tag + '</div></div><div class="pp">' + (id === "free" ? "KSh 0" : money(p.m) + '<small>per month</small>') + '</div></div><div class="pbd">' +
        '<ul><li>' + modelLine(id) + '</li><li>' + p.msg + ' messages ' + winTxt(p) + '</li><li>' + p.file + ' file attachments ' + winTxt(p) + '</li><li>' + p.img + ' image creations ' + winTxt(p) + '</li><li>Natural voices: ' + p.tts + ' clips ' + winTxt(p) + '</li>' + (p.extras || []).map(function (x) { return '<li>' + E(x) + '</li>'; }).join("") + '</ul>';
      if (own && id !== "free") h += '<div class="own">✅ Active until ' + fullWhen(untilOf(id)) + '</div>';
      if (id !== "free") {
        h += '<div class="pbt"><button data-pay="' + id + '|monthly">' + money(p.m) + ' monthly</button><button class="alt" data-pay="' + id + '|yearly">' + money(p.y) + ' yearly</button></div>';
        h += '<div class="pay" id="pay_' + id + '"></div>';
      }
      h += '</div></div>';
    });
    h += '<div class="muted2">' + L("pl_win") + '</div>';
    body.innerHTML = h;
    if (!(me && me.mpesa)) $("howList").innerHTML = '<li>Tap Monthly or Yearly on a plan and follow the steps.</li><li>Pay by M-Pesa to 0701244268.</li><li>Email your payment proof with the button.</li><li>Type the activation code you receive below.</li>'; else $("howList").innerHTML = '<li>Tap Monthly or Yearly on a plan.</li><li>Type your Safaricom number and tap Send M-Pesa request.</li><li>Enter your M-Pesa PIN when your phone asks.</li><li>Your plan starts automatically. Having a code from the owner (school or family plan)? Type it below.</li>';
    if (payFor && $("pay_" + payFor.plan)) showPay(payFor.plan, payFor.period, true);
  };

  function showPay(id, period, keep) {
    var box = $("pay_" + id); if (!box) return;
    var price = PLAN_DATA[id][period === "yearly" ? "y" : "m"];
    if (!(me && me.mpesa)) {
      if (!keep) payFor = { plan: id, period: period };
      Array.prototype.forEach.call(document.querySelectorAll(".pz .pay.on"), function (x) { if (x !== box) x.classList.remove("on"); });
      box.classList.add("on");
      box.innerHTML = '<b>' + PLAN_DATA[id].n + ' · ' + (period === "yearly" ? "yearly" : "monthly") + ' · ' + money(price) + '</b><div class="st">1. Send <b>' + money(price) + '</b> by M-Pesa to <b>0701244268</b>.<br>2. Tap the button below to email us your M-Pesa message.<br>3. You will get an activation code. Type it at the bottom of this screen and your plan starts.</div><button class="go" onclick="sendProof()">Email my payment proof</button>';
      return;
    }
    if (!keep) payFor = { plan: id, period: period };
    var ph = ""; try { ph = localStorage.getItem("nestyPhone") || ""; } catch (e) {}
    var old = $("pm_" + id), st = $("pst_" + id), stHtml = st ? st.outerHTML : '<div class="st" id="pst_' + id + '"></div>';
    Array.prototype.forEach.call(document.querySelectorAll(".pz .pay.on"), function (x) { if (x !== box) x.classList.remove("on"); });
    box.classList.add("on");
    box.innerHTML = '<b>' + PLAN_DATA[id].n + ' · ' + (period === "yearly" ? "yearly" : "monthly") + ' · ' + money(price) + '</b><input id="pm_' + id + '" type="tel" inputmode="numeric" placeholder="Safaricom number, e.g. 0712345678" value="' + E(old ? old.value : ph) + '" autocomplete="tel"><button class="go" id="pgo_' + id + '">Send M-Pesa request</button>' + stHtml;
    $("pgo_" + id).onclick = function () { startPay(id, period); };
    if (!keep) { var inp = $("pm_" + id); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50); }
  }
  function setSt(id, txt, cls) { var s = $("pst_" + id); if (s) { s.textContent = txt; s.className = "st " + (cls || ""); } }

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-pay]") : null;
    if (!b || !$("plansBody") || !$("plansBody").contains(b)) return;
    var p = b.getAttribute("data-pay").split("|");
    showPay(p[0], p[1]);
  });

  var polling = null;
  async function startPay(id, period) {
    var inp = $("pm_" + id), btn = $("pgo_" + id);
    var phone = (inp.value || "").trim();
    if (!/^(\+?254|0)?[17]\d{8}$/.test(phone.replace(/\s+/g, ""))) { setSt(id, "Type a Safaricom number like 0712345678.", "bad"); return; }
    try { localStorage.setItem("nestyPhone", phone); } catch (e) {}
    btn.disabled = true; setSt(id, "Sending the request to your phone...", "");
    try {
      var d = await api("/api/mpesa/pay", { plan: id, period: period, phone: phone });
      if (!d || !d.ok) { setSt(id, (d && d.error) || "Could not start the payment. Please try again.", "bad"); btn.disabled = false; return; }
      setSt(id, "📲 Check your phone and enter your M-Pesa PIN. Waiting for the payment...", "");
      try { localStorage.setItem("nestyMpPending", JSON.stringify({ id: d.id, plan: id, at: Date.now() })); } catch (e) {}
      poll(d.id, id);
    } catch (e) { setSt(id, "Network problem. If money was taken, wait a minute and open Plans again.", "bad"); btn.disabled = false; }
  }
  function poll(cid, plan) {
    clearInterval(polling);
    var t0 = Date.now(), busy = false;
    polling = setInterval(async function () {
      if (busy) return;
      if (Date.now() - t0 > 200000) { clearInterval(polling); setSt(plan, "No payment seen yet. If money was taken, open Plans again in a minute, or tap Email us in Help.", "bad"); var b0 = $("pgo_" + plan); if (b0) b0.disabled = false; return; }
      busy = true;
      try {
        var s = await api("/api/mpesa/status", { id: cid });
        if (s.status === "paid") {
          clearInterval(polling); try { localStorage.removeItem("nestyMpPending"); } catch (e) {}
          payFor = null;
          toast("🎉 Payment received. " + (PLAN_DATA[s.plan] ? PLAN_DATA[s.plan].n : "Your plan") + " is active!");
          await loadMe(); renderPlans();
          var bx = $("pay_" + plan); if (bx) { bx.classList.add("on"); bx.innerHTML = '<div class="st ok">✅ Paid' + (s.receipt ? " (" + E(s.receipt) + ")" : "") + '. Your plan is active until ' + fullWhen(s.expiresAt) + '.</div>'; }
        } else if (s.status === "failed" || s.status === "unknown") {
          clearInterval(polling); try { localStorage.removeItem("nestyMpPending"); } catch (e) {}
          setSt(plan, "Payment not completed" + (s.desc ? ": " + s.desc : ".") + " You can try again.", "bad");
          var b1 = $("pgo_" + plan); if (b1) b1.disabled = false;
        }
      } catch (e) {}
      busy = false;
    }, 3000);
  }
  /* If the app was closed while the M-Pesa prompt was open, check the payment when Nesty opens again. */
  window.nestyResumePay = function () {
    var p = null; try { p = JSON.parse(localStorage.getItem("nestyMpPending") || "null"); } catch (e) {}
    if (!p || Date.now() - p.at > 600000) { try { localStorage.removeItem("nestyMpPending"); } catch (e) {} return; }
    api("/api/mpesa/status", { id: p.id }).then(function (s) {
      if (s.status === "paid") { try { localStorage.removeItem("nestyMpPending"); } catch (e) {} toast("🎉 Payment received. Your plan is active!"); loadMe(); }
      else if (s.status === "failed" || s.status === "unknown") { try { localStorage.removeItem("nestyMpPending"); } catch (e) {} }
    }).catch(function () {});
  };
  var _lm = loadMe, once = false;
  window.loadMe = loadMe = async function () { var r = await _lm.apply(this, arguments); if (!once && me) { once = true; setTimeout(window.nestyResumePay, 800); } return r; };
})();
