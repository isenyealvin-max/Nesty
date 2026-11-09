/* Nesty Brand Studio (inside Business tools): logo, ad poster, shop banner, payment sign, business card, loyalty card.
   Everything is drawn on the phone as pictures (SVG) so it can be printed sharp or saved as a PNG. Nesty (Hiaru) can write the words. */
(function () {
  "use strict";
  if (window.goBrand && !window.goBrand.__stub) return;

  function $(i) { return document.getElementById(i); }
  function X(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function uid() { try { return (user && user.$id) || "guest"; } catch (e) { return "guest"; } }
  function lj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  var PAL = [["#1f8a5b", "#ffc933", "#12301f"], ["#1d4ed8", "#fbbf24", "#0f172a"], ["#b91c1c", "#fde68a", "#450a0a"], ["#7c3aed", "#fcd34d", "#2e1065"], ["#0f766e", "#f97316", "#042f2e"], ["#111827", "#f59e0b", "#030712"], ["#be185d", "#fde047", "#500724"], ["#ea580c", "#1e3a8a", "#431407"], ["#166534", "#bef264", "#052e16"], ["#0369a1", "#fca5a5", "#082f49"]];
  var PALN = ["Green and gold", "Blue and amber", "Red and cream", "Purple and gold", "Teal and orange", "Black and amber", "Pink and yellow", "Orange and navy", "Forest and lime", "Sky and rose"];
  var FONTS = [["Classic", "Georgia, 'Times New Roman', serif"], ["Bold", "'Arial Black', Impact, sans-serif"], ["Modern", "'Trebuchet MS', Verdana, sans-serif"], ["Friendly", "'Segoe UI', 'Comic Sans MS', sans-serif"]];
  var ICONS = ["ABC", "🛒", "🍽️", "☕", "🍞", "💇", "👗", "👟", "🔧", "🚗", "🏠", "💊", "📚", "🎓", "💻", "📱", "🌾", "🐄", "🧵", "🎨", "📷", "🎉", "💼", "⚽", "🧼", "🥦", "🍗", "🚚", "✂️", "⭐"];
  var SHAPES = ["Circle", "Shield", "Square", "Hexagon", "Tab", "Side by side", "Monogram"];
  var D = null, root = null, view = "menu", slogans = [], busyAI = false;

  function load() {
    if (D) return D;
    D = lj("nestyBrand_" + uid(), null);
    if (!D) {
      var bp = (lj("nestyBiz_" + uid(), {}) || {}).profile || {};
      D = { name: bp.name || "", tag: "", phone: bp.phone || "", loc: bp.addr || "", email: bp.email || "", social: "", services: "", hours: "", pal: 0, font: 2, icon: "ABC", shape: 0, photo: "",
        till: "", paybill: "", acc: "", mpPhone: "", payName: bp.name || "", bank: "",
        adT: 0, adSize: 0, adHead: "", adOffer: "", adBody: "", adCta: "", adAbout: "",
        bnR: 0, bnT: 0, payT: 0, pySize: 0, lyN: 9, lyReward: "1 free" };
    }
    return D;
  }
  function save() { try { localStorage.setItem("nestyBrand_" + uid(), JSON.stringify(D)); } catch (e) { toast("Your phone storage is full. Remove the photo to save space."); } }
  function P() { return PAL[D.pal] || PAL[0]; }
  function F() { return (FONTS[D.font] || FONTS[0])[1]; }
  function nm() { return (D.name || "Your Business").trim(); }
  function ini() { var w = nm().split(/\s+/).filter(Boolean); return ((w[0] || "N").charAt(0) + (w[1] ? w[1].charAt(0) : "")).toUpperCase(); }
  function fit(len, max, width) { return Math.round(Math.min(max, width / (Math.max(len, 1) * 0.58))); }
  function wrap(t, n) {
    var out = [], line = ""; String(t || "").split(/\s+/).filter(Boolean).forEach(function (w) { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + " " + w).trim(); });
    if (line) out.push(line); return out;
  }
  function tx(x, y, s, size, fill, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (o.a || "middle") + '" font-weight="' + (o.w || 800) + '" font-family="' + F() + '"' + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.rot ? ' transform="rotate(' + o.rot + ' ' + x + ' ' + y + ')"' : '') + '>' + X(s) + '</text>';
  }
  function lines(x, y, arr, size, fill, lh, o) { return arr.map(function (l, i) { return tx(x, y + i * size * (lh || 1.25), l, size, fill, o); }).join(""); }
  function mark(cx, cy, r, onDark) {
    var p = P();
    if (D.icon && D.icon !== "ABC") return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff"/><text x="' + cx + '" y="' + (cy + r * 0.36) + '" font-size="' + Math.round(r * 1.1) + '" text-anchor="middle">' + D.icon + '</text>';
    return tx(cx, cy + r * 0.34, ini(), Math.round(r * 1.0), onDark ? "#fff" : p[0], { w: 900 });
  }
  function burst(cx, cy, r, fill) { var pts = []; for (var i = 0; i < 32; i++) { var a = Math.PI * 2 * i / 32 - Math.PI / 2, rr = i % 2 ? r * 0.82 : r; pts.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1)); } return '<polygon points="' + pts.join(" ") + '" fill="' + fill + '"/>'; }
  function svgWrap(w, h, inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' + inner + '</svg>'; }

  /* ---------- the drawings ---------- */
  function logoSvg() {
    var p = P(), n = nm(), s = D.shape, g = "", w = 600, h = 640;
    var title = function (y) { return tx(300, y, n, fit(n.length, 84, 540), p[2], { w: 900 }) + (D.tag ? tx(300, y + 48, D.tag, fit(D.tag.length, 34, 520), p[0], { w: 600 }) : ""); };
    if (s === 0) g = '<circle cx="300" cy="250" r="200" fill="' + p[0] + '"/><circle cx="300" cy="250" r="176" fill="none" stroke="' + p[1] + '" stroke-width="9"/>' + mark(300, 250, 105, true) + title(540);
    else if (s === 1) g = '<path d="M300 40 L520 120 V300 C520 420 420 480 300 520 C180 480 80 420 80 300 V120 Z" fill="' + p[0] + '" stroke="' + p[1] + '" stroke-width="12"/>' + mark(300, 270, 110, true) + title(590);
    else if (s === 2) g = '<rect x="95" y="50" width="410" height="410" rx="80" fill="' + p[0] + '"/><rect x="118" y="73" width="364" height="364" rx="60" fill="none" stroke="' + p[1] + '" stroke-width="8"/>' + mark(300, 255, 110, true) + title(550);
    else if (s === 3) g = '<polygon points="300,40 495,150 495,370 300,480 105,370 105,150" fill="' + p[0] + '" stroke="' + p[1] + '" stroke-width="12"/>' + mark(300, 260, 105, true) + title(570);
    else if (s === 4) g = '<path d="M100 60 H410 Q500 60 500 150 V450 H190 Q100 450 100 360 Z" fill="' + p[0] + '"/><path d="M130 90 H400 Q470 90 470 160 V420" fill="none" stroke="' + p[1] + '" stroke-width="8"/>' + mark(300, 255, 110, true) + title(555);
    else if (s === 5) { w = 900; h = 300; g = '<circle cx="150" cy="150" r="125" fill="' + p[0] + '"/><circle cx="150" cy="150" r="108" fill="none" stroke="' + p[1] + '" stroke-width="7"/>' + mark(150, 150, 70, true) + tx(300, D.tag ? 150 : 175, n, fit(n.length, 96, 560), p[2], { a: "start", w: 900 }) + (D.tag ? tx(302, 215, D.tag, fit(D.tag.length, 40, 560), p[0], { a: "start", w: 600 }) : ""); }
    else { g = tx(300, 330, ini(), 300, p[0], { w: 900 }) + '<rect x="130" y="365" width="340" height="14" rx="7" fill="' + p[1] + '"/>' + tx(300, 450, n.toUpperCase(), fit(n.length, 62, 520), p[2], { w: 800, ls: 6 }) + (D.tag ? tx(300, 500, D.tag, fit(D.tag.length, 32, 520), p[0], { w: 600 }) : ""); h = 560; }
    return { svg: svgWrap(w, h, '<rect width="' + w + '" height="' + h + '" fill="#fff"/>' + g), w: w, h: h };
  }
  var ADS = [[1080, 1080, "Square (WhatsApp, Facebook, Instagram)"], [1080, 1920, "Tall (WhatsApp status, Reels)"], [794, 1123, "A4 poster (print)"]];
  function adSvg() {
    var p = P(), S = ADS[D.adSize] || ADS[0], w = S[0], h = S[1], t = D.adT, o = "", dark = (t === 1 || t === 4), tc = dark ? "#fff" : p[2];
    var head = D.adHead || "Your headline here", offer = D.adOffer, body = D.adBody || "Tell people what you sell and why they should come.", cta = D.adCta || "Visit us today", contact = [D.phone, D.loc].filter(Boolean).join("  |  ");
    var defs = '<defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[2] + '"/><stop offset="1" stop-color="' + p[0] + '"/></linearGradient></defs>';
    var hasPhoto = !!D.photo, ph = Math.round(h * 0.27), px = Math.round(w * 0.1), pw = w - 2 * px;
    o += defs; var flow = Math.round(h * 0.5);
    if (t === 0) o += '<rect width="' + w + '" height="' + h + '" fill="#fff"/><rect width="' + w + '" height="' + Math.round(h * 0.15) + '" fill="' + p[0] + '"/>';
    else if (t === 1) o += '<rect width="' + w + '" height="' + h + '" fill="url(#g1)"/>';
    else if (t === 2) o += '<rect width="' + w + '" height="' + h + '" fill="' + p[1] + '"/>';
    else if (t === 3) o += '<rect width="' + w + '" height="' + h + '" fill="#fffdf6"/><rect x="' + (w * 0.03) + '" y="' + (w * 0.03) + '" width="' + (w * 0.94) + '" height="' + (h - w * 0.06) + '" fill="none" stroke="' + p[0] + '" stroke-width="' + Math.round(w * 0.012) + '" rx="' + (w * 0.03) + '"/>';
    else { o += hasPhoto ? '<image href="' + D.photo + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice"/>' : '<rect width="' + w + '" height="' + h + '" fill="url(#g1)"/>'; o += '<rect width="' + w + '" height="' + h + '" fill="#000" opacity="0.45"/>'; }
    /* header: mark + name */
    var hy = Math.round(h * (t === 0 ? 0.075 : 0.07)), mr = Math.round(w * 0.045);
    o += '<g>' + '<circle cx="' + (px + mr) + '" cy="' + hy + '" r="' + mr + '" fill="' + (t === 0 || dark ? "#fff" : p[0]) + '"/>' + (D.icon !== "ABC" ? '<text x="' + (px + mr) + '" y="' + (hy + mr * 0.36) + '" font-size="' + Math.round(mr * 1.1) + '" text-anchor="middle">' + D.icon + '</text>' : tx(px + mr, hy + mr * 0.34, ini(), Math.round(mr), t === 0 || dark ? p[0] : "#fff", { w: 900 })) + tx(px + mr * 2 + 20, hy + mr * 0.3, nm(), fit(nm().length, Math.round(w * 0.055), w - px * 2 - mr * 2 - 30), t === 0 ? "#fff" : tc, { a: "start", w: 900 }) + '</g>';
    var hs = Math.round(w * (t === 2 ? 0.085 : 0.08)), hl = wrap(head, Math.max(8, Math.floor((w - 2 * px) / (hs * 0.5)))).slice(0, 4), hyy = Math.round(h * (t === 4 ? 0.50 : 0.28));
    if (t === 2) { o += burst(w / 2, Math.round(h * 0.40), Math.round(w * 0.36), p[0]); hyy = Math.round(h * 0.34); o += lines(w / 2, hyy, hl, hs, "#fff", 1.15); if (offer) o += tx(w / 2, hyy + hl.length * hs * 1.15 + hs * 0.3, offer, fit(offer.length, Math.round(w * 0.12), w * 0.5), p[1], { w: 900 }); }
    else {
      o += lines(w / 2, hyy, hl, hs, t === 0 || t === 3 ? p[0] : tc, 1.15, { w: 900 }); flow = hyy + hl.length * hs * 1.15;
      if (hasPhoto && t !== 4) { var py = hyy + hl.length * hs * 1.15 - hs * 0.4; o += '<clipPath id="pc"><rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="' + (w * 0.03) + '"/></clipPath><image href="' + D.photo + '" x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/>'; flow = py + ph + 24; }
      if (offer && t !== 2) {
        var orad = Math.round(w * (hasPhoto || t === 4 ? 0.15 : 0.10)), ox = w / 2, oy;
        if (t === 4) { oy = Math.round(h * 0.18); ox = w - px - orad; }
        else if (hasPhoto) { oy = flow - 24 - orad * 0.2; ox = w - px - orad * 0.9; }
        else { oy = flow + orad * 0.9; flow += orad * 1.8; }
        o += burst(ox, oy, orad, p[1]) + tx(ox, oy + 8, offer, fit(offer.length, Math.round(orad * 0.5), orad * 1.5), p[2], { w: 900, rot: -8 });
      }
    }
    var bs = Math.round(w * 0.04), bl = wrap(body, Math.max(10, Math.floor((w - 2 * px) / (bs * 0.52)))).slice(0, 5), by = t === 4 ? Math.round(h * 0.70) : t === 2 ? Math.round(h * 0.76) : Math.min(Math.round(flow + bs * 1.6), Math.round(h * 0.93 - (bl.length * bs * 1.3 + bs * 0.9 + bs * 2.2 + bs * 0.5)));
    o += lines(w / 2, by, bl, bs, t === 2 ? p[2] : tc, 1.3, { w: 600 });
    var cy = by + bl.length * bs * 1.3 + bs * 0.9, cw = Math.round(w * 0.6), ch = Math.round(bs * 2.2);
    o += '<rect x="' + (w - cw) / 2 + '" y="' + cy + '" width="' + cw + '" height="' + ch + '" rx="' + ch / 2 + '" fill="' + (t === 2 ? p[0] : p[1]) + '"/>' + tx(w / 2, cy + ch * 0.66, cta, fit(cta.length, Math.round(bs * 1.15), cw * 0.9), t === 2 ? "#fff" : p[2], { w: 900 });
    o += '<rect x="0" y="' + Math.round(h * 0.93) + '" width="' + w + '" height="' + Math.round(h * 0.07) + '" fill="' + (t === 3 ? p[0] : p[2]) + '"/>' + tx(w / 2, Math.round(h * 0.93 + h * 0.045), contact || "Add your phone and location", fit((contact || "x").length, Math.round(w * 0.04), w * 0.9), "#fff", { w: 700 });
    return { svg: svgWrap(w, h, o), w: w, h: h };
  }
  var BN = [[3, "3 : 1 (for example 2 x 6 ft)"], [4, "4 : 1 (for example 3 x 12 ft)"], [2, "2 : 1 (for example 3 x 6 ft)"]];
  function bannerSvg() {
    var p = P(), r = (BN[D.bnR] || BN[0])[0], W = r * 1000, H = 1000, t = D.bnT, o = "", n = nm(), tc = t === 2 ? p[2] : "#fff";
    if (t === 0) o += '<rect width="' + W + '" height="' + H + '" fill="' + p[0] + '"/><rect x="25" y="25" width="' + (W - 50) + '" height="' + (H - 50) + '" fill="none" stroke="' + p[1] + '" stroke-width="16" rx="40"/>';
    else if (t === 1) o += '<rect width="' + W + '" height="' + H + '" fill="' + p[2] + '"/><rect width="' + Math.round(W * 0.34) + '" height="' + H + '" fill="' + p[0] + '"/><rect x="' + Math.round(W * 0.34) + '" width="24" height="' + H + '" fill="' + p[1] + '"/>';
    else o += '<rect width="' + W + '" height="' + H + '" fill="#fff"/><rect width="' + W + '" height="170" fill="' + p[0] + '"/><rect y="' + (H - 170) + '" width="' + W + '" height="170" fill="' + p[0] + '"/><rect y="170" width="' + W + '" height="16" fill="' + p[1] + '"/><rect y="' + (H - 186) + '" width="' + W + '" height="16" fill="' + p[1] + '"/>';
    var mx = t === 1 ? Math.round(W * 0.17) : 330, tx0 = t === 1 ? Math.round(W * 0.34) + 120 : 660, avail = W - tx0 - 120;
    o += '<circle cx="' + mx + '" cy="500" r="' + (t === 2 ? 250 : 270) + '" fill="' + (t === 2 ? p[0] : "#fff") + '"/><circle cx="' + mx + '" cy="500" r="' + (t === 2 ? 232 : 252) + '" fill="none" stroke="' + p[1] + '" stroke-width="12"/>';
    o += (D.icon !== "ABC") ? '<text x="' + mx + '" y="590" font-size="270" text-anchor="middle">' + D.icon + '</text>' : tx(mx, 595, ini(), 270, t === 2 ? "#fff" : p[0], { w: 900 });
    var ny = D.tag ? 400 : 450;
    o += tx(tx0, ny, n, fit(n.length, 250, avail), t === 2 ? p[0] : "#fff", { a: "start", w: 900 });
    if (D.tag) o += tx(tx0 + 4, 500, D.tag, fit(D.tag.length, 105, avail), p[1] === "#fde68a" ? "#fde68a" : (t === 2 ? p[2] : p[1]), { a: "start", w: 700 });
    var sv = (D.services || "").split(/[,\n]/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 5).join("  •  ");
    if (sv) o += tx(tx0 + 4, 640, sv, fit(sv.length, 84, avail), tc, { a: "start", w: 700 });
    var ct = [D.phone ? "📞 " + D.phone : "", D.loc ? "📍 " + D.loc : ""].filter(Boolean);
    if (ct.length) o += tx(tx0 + 4, 790, ct.join("     "), fit(ct.join("     ").length, 96, avail), t === 2 ? p[0] : p[1], { a: "start", w: 900 });
    if (D.hours) o += tx(tx0 + 4, 880, "🕒 " + D.hours, fit(D.hours.length + 3, 62, avail), tc, { a: "start", w: 600 });
    return { svg: svgWrap(W, H, o), w: W, h: H };
  }
  function paySvg() {
    var p = P(), S = D.pySize ? [559, 794] : [794, 1123], w = S[0], h = S[1], k = w / 794, o = "", n = D.payName || nm(), t = D.payT;
    o += '<rect width="' + w + '" height="' + h + '" fill="' + (t === 2 ? p[0] : "#fffdf6") + '"/>';
    var tc = t === 2 ? "#fff" : p[2];
    o += '<rect width="' + w + '" height="' + Math.round(250 * k) + '" fill="' + (t === 2 ? p[2] : p[0]) + '"/><rect y="' + Math.round(250 * k) + '" width="' + w + '" height="' + Math.round(12 * k) + '" fill="' + p[1] + '"/>';
    o += tx(w / 2, 110 * k, nm(), fit(nm().length, 70 * k, w * 0.86), "#fff", { w: 900 }) + tx(w / 2, 195 * k, "HOW TO PAY", 62 * k, p[1], { w: 900, ls: 6 });
    var rows = [];
    if (D.till) rows.push(["TILL NUMBER", D.till, ""]);
    if (D.paybill) rows.push(["PAYBILL NUMBER", D.paybill, D.acc ? "Account number: " + D.acc : ""]);
    if (D.mpPhone) rows.push(["SEND MONEY TO", D.mpPhone, ""]);
    if (D.bank) rows.push(["BANK", D.bank, ""]);
    var y = 300 * k, bh = Math.min(210, (h / k - 520) / Math.max(rows.length, 1)) * k;
    if (!rows.length) o += tx(w / 2, 520 * k, "Add your till, paybill or phone", 40 * k, tc, { w: 700 });
    rows.forEach(function (r) {
      o += '<rect x="' + 50 * k + '" y="' + y + '" width="' + (w - 100 * k) + '" height="' + (bh - 20 * k) + '" rx="' + 26 * k + '" fill="' + (t === 2 ? "#fff" : "#fff") + '" stroke="' + p[0] + '" stroke-width="' + 5 * k + '"/>';
      o += tx(w / 2, y + 44 * k, r[0], 26 * k, p[0], { w: 800, ls: 3 }) + tx(w / 2, y + (r[2] ? 112 : 128) * k, r[1], fit(r[1].length, (r[2] ? 78 : 96) * k, w - 160 * k), p[2], { w: 900, ls: 3 });
      if (r[2]) o += tx(w / 2, y + 150 * k, r[2], 30 * k, p[0], { w: 800 });
      y += bh;
    });
    o += tx(w / 2, h - 175 * k, "Account name: " + n, fit(n.length + 14, 38 * k, w * 0.86), tc, { w: 800 });
    o += tx(w / 2, h - 125 * k, "Please check that the name is right before you pay.", 27 * k, tc, { w: 600 });
    o += tx(w / 2, h - 60 * k, "Thank you for buying from us!", 40 * k, t === 2 ? p[1] : p[0], { w: 900 });
    return { svg: svgWrap(w, h, o), w: w, h: h };
  }
  function cardFront() {
    var p = P(), n = nm(), o = '<rect width="1050" height="600" fill="' + p[0] + '"/><rect x="0" y="540" width="1050" height="60" fill="' + p[1] + '"/><circle cx="210" cy="285" r="150" fill="#fff"/>' + mark(210, 285, 100, false);
    o += tx(410, D.tag ? 270 : 300, n, fit(n.length, 100, 590), "#fff", { a: "start", w: 900 }) + (D.tag ? tx(412, 350, D.tag, fit(D.tag.length, 44, 590), p[1], { a: "start", w: 600 }) : "");
    return { svg: svgWrap(1050, 600, o), w: 1050, h: 600 };
  }
  function cardBack() {
    var p = P(), o = '<rect width="1050" height="600" fill="#fff"/><rect width="26" height="600" fill="' + p[0] + '"/><rect x="26" width="10" height="600" fill="' + p[1] + '"/>' + tx(90, 110, nm(), fit(nm().length, 64, 880), p[0], { a: "start", w: 900 });
    var L = [["📞", D.phone], ["✉️", D.email], ["📍", D.loc], ["🌐", D.social], ["🕒", D.hours]].filter(function (r) { return r[1]; }), y = 210;
    if (!L.length) L = [["📞", "Add your phone and location"]];
    L.forEach(function (r) { o += '<text x="90" y="' + y + '" font-size="50">' + r[0] + '</text>' + tx(165, y, r[1], fit(r[1].length, 48, 820), p[2], { a: "start", w: 600 }); y += 80; });
    return { svg: svgWrap(1050, 600, o), w: 1050, h: 600 };
  }
  function loyalty() {
    var p = P(), N = Math.max(5, Math.min(12, parseInt(D.lyN, 10) || 9)) + 1, o = '<rect width="1050" height="600" fill="#fffaf0"/><rect width="1050" height="150" fill="' + p[0] + '"/>' + tx(525, 75, nm(), fit(nm().length, 62, 940), "#fff", { w: 900 }) + tx(525, 130, "LOYALTY CARD", 36, p[1], { w: 900, ls: 8 });
    var per = Math.ceil(N / 2), gap = 940 / per, r = Math.min(70, gap / 2 - 10);
    for (var i = 0; i < N; i++) { var row = i < per ? 0 : 1, col = row ? i - per : i, cx = 55 + gap * col + gap / 2, cy = 270 + row * 150, last = i === N - 1; o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (last ? p[1] : "#fff") + '" stroke="' + p[0] + '" stroke-width="6" stroke-dasharray="' + (last ? "0" : "12 8") + '"/>' + tx(cx, cy + 12, last ? "FREE" : String(i + 1), last ? 30 : 40, p[last ? 2 : 0], { w: 900 }); }
    o += tx(525, 545, "Buy " + (N - 1) + ", get " + (D.lyReward || "1 free") + "  •  " + (D.phone || ""), 34, p[2], { w: 700 });
    return { svg: svgWrap(1050, 600, o), w: 1050, h: 600 };
  }

  /* ---------- printing, saving, asking Nesty ---------- */
  function printHtml(title, css, body) {
    var f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; document.body.appendChild(f);
    f.onload = function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast("Could not open the print window."); } setTimeout(function () { if (f.parentNode) f.remove(); }, 180000); };
    f.srcdoc = '<html><head><meta charset="utf-8"><title>' + X(title) + '</title><style>*{box-sizing:border-box}body{margin:0}svg{display:block}' + css + '</style></head><body>' + body + '</body></html>';
  }
  function printSingle(title, d, landscape, size) {
    var body = '<div style="width:100%">' + d.svg.replace(/ width="\d+" height="\d+"/, ' style="width:100%;height:auto"') + '</div>';
    printHtml(title, '@page{size:' + (size || "A4") + (landscape ? " landscape" : " portrait") + ';margin:8mm}', body);
  }
  function sheet(title, d, count) {
    var cell = '<div style="width:90mm;height:55mm;border:0.2mm dotted #999;overflow:hidden">' + d.svg.replace(/ width="\d+" height="\d+"/, ' style="width:90mm;height:55mm"') + '</div>', cells = "";
    for (var i = 0; i < count; i++) cells += cell;
    printHtml(title, '@page{size:A4 portrait;margin:8mm}.g{display:grid;grid-template-columns:90mm 90mm;gap:0;justify-content:center}', '<div class="g">' + cells + '</div>');
  }
  function toPng(d, name) {
    var img = new Image(), sc = Math.min(2, 4000 / Math.max(d.w, d.h));
    img.onload = function () {
      var c = document.createElement("canvas"); c.width = Math.round(d.w * sc); c.height = Math.round(d.h * sc);
      var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(function (b) { if (b) saveBlob(b, name + ".png"); else toast("Could not save the picture."); }, "image/png");
    };
    img.onerror = function () { toast("Could not save the picture."); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(d.svg);
  }
  async function ask(prompt) {
    var jwt = await getJwt();
    var res = await fetch("/.netlify/functions/chat", { method: "POST", headers: { "Content-Type": "application/json", "X-Nesty-Token": jwt }, body: JSON.stringify({ model: "hiaru", stream: false, userName: (typeof firstName === "function" ? firstName() : ""), today: (typeof todayText === "function" ? todayText() : ""), messages: [{ role: "user", content: prompt }] }) });
    var d; try { d = await res.json(); } catch (e) { throw { msg: "Network problem. Please try again." }; }
    if (d.limited) throw { msg: "You have used all your messages for now. Try again later." };
    if (d.needLogin) throw { msg: "Please sign in again." };
    try { noteUsage(d); } catch (e) {}
    return String(d.reply || "");
  }
  function pj(t) { t = String(t || "").replace(/```(?:json)?/gi, ""); var a = t.indexOf("{"), b = t.lastIndexOf("}"); if (a < 0 || b < a) return null; try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { try { return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, "$1")); } catch (e2) { return null; } } }
  async function nestyDo(label, prompt, apply) {
    if (busyAI) return; busyAI = true; toast(label);
    try { var j = pj(await ask(prompt)); if (!j) throw { msg: "Nesty could not do that. Try again." }; apply(j); save(); draw(); }
    catch (e) { toast((e && e.msg) || "Something went wrong. Please try again."); }
    busyAI = false;
  }

  /* ---------- screens ---------- */
  var CSS = "#bs{display:none;position:fixed;inset:0;z-index:95;flex-direction:column;background:#fffdf3;color:#12301f}#bs *{box-sizing:border-box}" +
    "#bs .top{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#1f8a5b;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.2)}#bs .top b{flex:1;font-size:18px}#bs .ib{background:#ffc933;border:0;border-radius:50%;width:36px;height:36px;font-size:17px;color:#12301f}" +
    "#bsBody{flex:1;overflow-y:auto;padding:14px 14px 70px;max-width:760px;width:100%;margin:0 auto}#bs h3{margin:12px 0 4px;font-size:16px}#bs .m{color:#4b6355;font-size:13.5px;line-height:1.45}" +
    "#bs .card{background:#fff;border:1.5px solid #bfe3cf;border-radius:16px;padding:13px;margin:10px 0}#bs label{display:block;font-size:12.5px;font-weight:700;color:#2d5240;margin:9px 0 2px}" +
    "#bs input,#bs select,#bs textarea{width:100%;font:inherit;font-size:15px;padding:9px 10px;border:1.5px solid #9fd1b6;border-radius:10px;background:#fff;color:#12301f}#bs .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
    "#bs .b{display:inline-block;background:#ffc933;color:#12301f;border:0;border-radius:12px;padding:10px 15px;font-weight:800;font-size:14px;margin:8px 8px 0 0;font-family:inherit}#bs .b.green{background:#1f8a5b;color:#fff}#bs .b.ghost{background:#fff;border:1.5px solid #1f8a5b;color:#176b47}" +
    "#bs .tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}#bs .tile{background:#e3f5ea;border:1.5px solid #bfe3cf;border-radius:16px;padding:14px 8px;text-align:center;font-weight:700;color:#12301f;font-family:inherit;font-size:14px}#bs .tile i{display:block;font-style:normal;font-size:27px;margin-bottom:3px}" +
    "#bs .prev{background:#eef3ef;border:1.5px dashed #9fd1b6;border-radius:14px;padding:8px;margin:10px 0}#bs .prev svg{width:100%;height:auto;display:block;border-radius:8px;background:#fff}" +
    "#bs .ic{display:flex;flex-wrap:wrap;gap:6px}#bs .ic button{width:42px;height:42px;font-size:22px;border:2px solid #cfe8da;background:#fff;border-radius:10px}#bs .ic button.on{border-color:#ffb800;background:#fff3c4}" +
    "#bs .sw{display:flex;flex-wrap:wrap;gap:8px}#bs .sw button{width:46px;height:34px;border-radius:9px;border:3px solid #fff;box-shadow:0 0 0 2px #cfe8da;background-clip:padding-box}#bs .sw button.on{box-shadow:0 0 0 3px #ffb800}" +
    "#bs .chips button{background:#fff3c4;border:1.5px solid #ffd566;border-radius:20px;padding:6px 11px;margin:5px 6px 0 0;font-family:inherit;font-size:13.5px}";
  var TITLES = { menu: "Brand Studio", brand: "My brand", logo: "Logo maker", ad: "Ad poster", banner: "Shop banner", pay: "Payment sign", card: "Business card", loyal: "Loyalty card" };
  function build() {
    if (root) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.id = "bs";
    root.innerHTML = '<div class="top"><button class="ib" id="bsBack">←</button><b id="bsTitle">Brand Studio</b><button class="ib" id="bsX">✕</button></div><div id="bsBody"></div>';
    document.body.appendChild(root);
    $("bsX").onclick = function () { root.style.display = "none"; };
    $("bsBack").onclick = function () { if (view === "menu") root.style.display = "none"; else open("menu"); };
    root.addEventListener("click", click); root.addEventListener("input", input); root.addEventListener("change", input);
  }
  function fld(k, label, ph, max, type) { return '<label>' + label + '</label><input data-k="' + k + '" value="' + X(D[k] || "") + '" maxlength="' + (max || 60) + '" placeholder="' + X(ph || "") + '"' + (type ? ' inputmode="' + type + '"' : '') + '>'; }
  function sel(k, label, opts) { return '<label>' + label + '</label><select data-k="' + k + '" data-n="1">' + opts.map(function (o, i) { return '<option value="' + i + '"' + (String(D[k]) === String(i) ? " selected" : "") + '>' + X(o) + '</option>'; }).join("") + '</select>'; }
  function look() {
    return '<label>Colours</label><div class="sw">' + PAL.map(function (c, i) { return '<button data-pal="' + i + '" class="' + (D.pal === i ? "on" : "") + '" style="background:linear-gradient(90deg,' + c[0] + ' 55%,' + c[1] + ' 55%)" title="' + PALN[i] + '"></button>'; }).join("") + '</div>' +
      sel("font", "Letter style", FONTS.map(function (f) { return f[0]; }));
  }
  function icons() { return '<label>Symbol (or the first letters of your name)</label><div class="ic">' + ICONS.map(function (c) { return '<button data-ic="' + c + '" class="' + (D.icon === c ? "on" : "") + '">' + (c === "ABC" ? "<b style='font-size:15px'>ABC</b>" : c) + '</button>'; }).join("") + '</div>'; }
  function basics() { return fld("name", "Business name", "e.g. Mama Njeri Fresh Foods", 40) + '<div class="g2"><div>' + fld("phone", "Phone", "07...", 20, "tel") + '</div><div>' + fld("loc", "Location", "Town, street", 50) + '</div></div>'; }
  function actions(name, d, extra) {
    return '<div><button class="b green" data-act="print">🖨️ Print</button><button class="b ghost" data-act="png">⬇️ Save picture</button>' + (extra || "") + '</div>';
  }
  var V = {};
  V.menu = function () {
    return '<div class="m">Make your own logo, ads, banner, payment sign and cards. Print them or save them as pictures. They use your business name and colours, set once.</div>' +
      '<div class="tiles" style="margin-top:10px"><button class="tile" data-o="brand"><i>🏪</i>My brand details</button><button class="tile" data-o="logo"><i>🎨</i>Logo maker</button><button class="tile" data-o="ad"><i>📣</i>Ad poster</button><button class="tile" data-o="banner"><i>🪧</i>Shop banner</button><button class="tile" data-o="pay"><i>💳</i>Payment sign</button><button class="tile" data-o="card"><i>📇</i>Business card</button><button class="tile" data-o="loyal"><i>🎟️</i>Loyalty card</button></div>' +
      '<div class="card"><b>Nesty can write for you</b><div class="m">In the logo, ad and banner tools, tap the ✨ button and Nesty writes the slogan, the ad words or your services. Each uses 1 message.</div></div>';
  };
  V.brand = function () {
    return '<div class="card">' + basics() + fld("tag", "Slogan (optional)", "e.g. Fresh every morning", 50) + '<div class="g2"><div>' + fld("email", "Email", "", 50) + '</div><div>' + fld("social", "Website or social page", "@mynamehere", 40) + '</div></div>' + fld("hours", "Opening hours", "Mon to Sat, 8am to 7pm", 40) + fld("services", "What you sell (separate with commas)", "Vegetables, Fruits, Eggs", 90) + look() + icons() + '<button class="b green" data-o="menu">Done</button></div>';
  };
  V.logo = function () {
    return '<div class="card">' + fld("name", "Business name", "", 40) + fld("tag", "Slogan (optional)", "", 50) + '<button class="b s" data-act="slog" style="padding:6px 11px;font-size:13px">✨ Nesty, suggest slogans</button><div class="chips" id="slogs"></div>' + sel("shape", "Shape", SHAPES) + look() + icons() + '<button class="b ghost" data-act="rand">🎲 Surprise me</button></div><div class="prev" id="bsPrev"></div><div id="bsActs"></div>';
  };
  V.ad = function () {
    return '<div class="card"><div class="g2"><div>' + sel("adSize", "Size", ADS.map(function (a) { return a[2]; })) + '</div><div>' + sel("adT", "Design", ["Bold band", "Dark gradient", "Sale burst", "Clean frame", "Photo full screen"]) + '</div></div>' + basics() +
      '<label>What are you advertising? (for Nesty)</label><input data-k="adAbout" value="' + X(D.adAbout) + '" maxlength="120" placeholder="e.g. Fresh tilapia, free delivery in Kisumu">' +
      '<button class="b" data-act="adai">✨ Nesty writes my ad</button>' + fld("adHead", "Headline", "e.g. Fresh Fish Daily!", 40) + '<div class="g2"><div>' + fld("adOffer", "Offer (short)", "e.g. 20% OFF", 14) + '</div><div>' + fld("adCta", "Button words", "e.g. Order now", 22) + '</div></div>' + fld("adBody", "Details", "", 150) +
      '<label>Picture (optional)</label><input type="file" id="bsPhoto" accept="image/*">' + (D.photo ? '<button class="b ghost" data-act="nophoto" style="padding:6px 11px;font-size:13px">Remove picture</button>' : '') + look() + icons() + '</div><div class="prev" id="bsPrev"></div><div id="bsActs"></div>';
  };
  V.banner = function () {
    return '<div class="card">' + basics() + fld("tag", "Slogan", "", 50) + fld("services", "What you sell (commas, up to 5)", "Haircuts, Braids, Nails", 90) + fld("hours", "Opening hours (optional)", "", 40) + '<button class="b" data-act="bnai">✨ Nesty suggests the words</button>' + sel("bnR", "Banner shape", BN.map(function (b) { return b[1]; })) + sel("bnT", "Design", ["Frame", "Side block", "Top and bottom bands"]) + look() + icons() + '<div class="m">Print on A4 or A3 to see the design, or take the picture to a print shop and ask for a banner in the size you chose.</div></div><div class="prev" id="bsPrev"></div><div id="bsActs"></div>';
  };
  V.pay = function () {
    return '<div class="card"><div class="m">Fill only what you use. Customers see big clear numbers and the account name, so they can pay safely.</div>' + fld("name", "Business name", "", 40) + fld("payName", "Account name customers will see", "Same as on the payment message", 40) + '<div class="g2"><div>' + fld("till", "Till number", "", 12, "numeric") + '</div><div>' + fld("paybill", "Paybill number", "", 12, "numeric") + '</div></div>' + fld("acc", "Paybill account number (optional)", "", 20) + fld("mpPhone", "Send money to this phone (optional)", "07...", 20, "tel") + fld("bank", "Bank details (optional)", "Bank, account number", 50) + sel("pySize", "Size", ["A4 (counter or wall)", "A5 (table stand)"]) + sel("payT", "Design", ["Light", "Light, gold bar", "Colour page"]) + look() + '</div><div class="prev" id="bsPrev"></div><div id="bsActs"></div>';
  };
  V.card = function () { return '<div class="card">' + basics() + fld("tag", "Title or slogan", "", 50) + '<div class="g2"><div>' + fld("email", "Email", "", 50) + '</div><div>' + fld("social", "Website or social page", "", 40) + '</div></div>' + fld("hours", "Opening hours", "", 40) + look() + icons() + '</div><div class="prev" id="bsPrev"></div><div class="prev" id="bsPrev2"></div><div id="bsActs"></div>'; };
  V.loyal = function () { return '<div class="card">' + basics() + '<div class="g2"><div>' + fld("lyN", "Stamps to earn a reward (5 to 12)", "9", 2, "numeric") + '</div><div>' + fld("lyReward", "Reward", "1 free", 20) + '</div></div>' + look() + icons() + '</div><div class="prev" id="bsPrev"></div><div id="bsActs"></div>'; };

  function cur() { return view === "logo" ? logoSvg() : view === "ad" ? adSvg() : view === "banner" ? bannerSvg() : view === "pay" ? paySvg() : view === "card" ? cardFront() : view === "loyal" ? loyalty() : null; }
  function draw() {
    if (!$("bsPrev")) return;
    var d = cur(); if (!d) return;
    $("bsPrev").innerHTML = d.svg;
    if (view === "card") $("bsPrev2").innerHTML = cardBack().svg;
    var a = $("bsActs");
    if (a) a.innerHTML = view === "card"
      ? '<button class="b green" data-act="pf">🖨️ Print 10 fronts</button><button class="b green" data-act="pb">🖨️ Print 10 backs</button><button class="b ghost" data-act="png">⬇️ Save front</button><button class="b ghost" data-act="png2">⬇️ Save back</button>'
      : view === "loyal" ? '<button class="b green" data-act="pl">🖨️ Print 8 cards</button><button class="b ghost" data-act="png">⬇️ Save picture</button>'
      : '<button class="b green" data-act="print">🖨️ Print</button><button class="b ghost" data-act="png">⬇️ Save picture</button>';
  }
  function open(v) {
    build(); load(); view = v;
    $("bsTitle").textContent = TITLES[v]; $("bsBody").innerHTML = V[v](); root.style.display = "flex"; $("bsBody").scrollTop = 0; draw();
  }
  window.goBrand = function (v) { D = null; open(V[v] ? v : "menu"); };

  function click(e) {
    var t = e.target.closest ? e.target.closest("button") : null; if (!t) return; load();
    var g = function (k) { return t.getAttribute(k); };
    if (g("data-o")) { open(g("data-o")); return; }
    if (g("data-pal") !== null) { D.pal = parseInt(g("data-pal"), 10); save(); Array.prototype.forEach.call(root.querySelectorAll("[data-pal]"), function (b) { b.classList.toggle("on", b === t); }); draw(); return; }
    if (g("data-ic")) { D.icon = g("data-ic"); save(); Array.prototype.forEach.call(root.querySelectorAll("[data-ic]"), function (b) { b.classList.toggle("on", b === t); }); draw(); return; }
    if (g("data-sl") !== null) { D.tag = slogans[parseInt(g("data-sl"), 10)] || D.tag; save(); var i1 = root.querySelector('[data-k="tag"]'); if (i1) i1.value = D.tag; draw(); return; }
    var a = g("data-act"); if (!a) return;
    var nameOf = (nm() + " " + TITLES[view]).replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-");
    if (a === "print") { var d = cur(); printSingle(nm() + " " + TITLES[view], d, view === "banner", (view === "banner" ? "A3" : "A4")); }
    else if (a === "png") toPng(cur(), nameOf);
    else if (a === "png2") toPng(cardBack(), nameOf + "-back");
    else if (a === "pf") sheet(nm() + " cards", cardFront(), 10);
    else if (a === "pb") sheet(nm() + " cards back", cardBack(), 10);
    else if (a === "pl") sheet(nm() + " loyalty", loyalty(), 8);
    else if (a === "nophoto") { D.photo = ""; save(); open("ad"); }
    else if (a === "rand") { D.pal = Math.floor(Math.random() * PAL.length); D.shape = Math.floor(Math.random() * 6); D.font = Math.floor(Math.random() * FONTS.length); D.icon = ICONS[Math.floor(Math.random() * ICONS.length)]; save(); open("logo"); }
    else if (a === "slog") {
      if (!D.name) { toast("Type your business name first."); return; }
      nestyDo("Nesty is thinking of slogans...", "Give 6 short catchy slogans (max 6 words each) for a Kenyan business called \"" + D.name + "\"" + (D.services ? " that sells " + D.services : "") + ". Reply with JSON only: {\"slogans\":[\"...\"]}", function (j) { slogans = (j.slogans || []).slice(0, 6); var s = $("slogs"); if (s) s.innerHTML = slogans.map(function (x, i) { return '<button data-sl="' + i + '">' + X(x) + '</button>'; }).join(""); });
    }
    else if (a === "adai") {
      if (!D.adAbout && !D.name) { toast("Say what you are advertising first."); return; }
      nestyDo("Nesty is writing your ad...", "Write a short, catchy Kenyan advert for " + (D.name || "a shop") + ": " + (D.adAbout || D.services || "our products") + ". Reply with JSON only: {\"headline\":\"max 6 words\",\"offer\":\"max 3 words like 20% OFF or FREE DELIVERY, or empty\",\"details\":\"max 20 words\",\"button\":\"max 3 words\"}", function (j) { D.adHead = String(j.headline || "").slice(0, 40); D.adOffer = String(j.offer || "").slice(0, 14); D.adBody = String(j.details || "").slice(0, 150); D.adCta = String(j.button || "").slice(0, 22); open("ad"); });
    }
    else if (a === "bnai") {
      nestyDo("Nesty is thinking...", "For a Kenyan shop banner for \"" + (D.name || "my business") + "\"" + (D.services ? " selling " + D.services : "") + ", give a slogan (max 6 words) and up to 5 short services. Reply with JSON only: {\"slogan\":\"...\",\"services\":[\"...\"]}", function (j) { if (j.slogan) D.tag = String(j.slogan).slice(0, 50); if (Array.isArray(j.services)) D.services = j.services.slice(0, 5).join(", ").slice(0, 90); open("banner"); });
    }
  }
  function input(e) {
    var t = e.target; load();
    if (t.id === "bsPhoto" && t.files && t.files[0]) { fitImage(t.files[0], 900, false, 0.8).then(function (u) { D.photo = u; save(); open("ad"); }).catch(function () { toast("Could not open that picture."); }); return; }
    var k = t.getAttribute && t.getAttribute("data-k"); if (!k) return;
    D[k] = t.getAttribute("data-n") ? parseInt(t.value, 10) || 0 : t.value; save(); draw();
  }
})();
