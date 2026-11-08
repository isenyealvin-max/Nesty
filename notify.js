/* Nesty notifications: answers, birthdays, announcements, plan reminders and tips.
   They show in the phone's notification bar while Nesty is open in the background. */
(function () {
  var asked = false;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function can() { return "Notification" in window && Notification.permission === "granted"; }

  function ask() {
    if (asked) return;
    asked = true;
    if ("Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch (e) {}
    }
  }
  window.nestyAskNotify = ask;
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest("#send, #mic")) ask();
  }, true);

  function show(title, body, tag) {
    if (!can()) return false;
    var opts = { body: body, icon: "/icon-192.png", badge: "/icon-192.png", tag: tag || "nesty", renotify: true };
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) {
          if (reg && reg.showNotification) return reg.showNotification(title, opts);
          new Notification(title, opts);
        }).catch(function () { try { new Notification(title, opts); } catch (e) {} });
      } else new Notification(title, opts);
    } catch (e) { return false; }
    return true;
  }
  window.nestyNotify = function (title, body, tag) { return show(title, body, tag); };

  /* an answer arrived while the app is in the background */
  window.nestyNotifyReply = function (text) {
    if (!text || !document.hidden) return;
    if (/^(Error|Network error|Server error|Sorry, something)/.test(text)) return;
    var body = String(text).replace(/```[\s\S]*?```/g, " [code] ").replace(/[*`#_>|]/g, "").replace(/\s+/g, " ").trim();
    if (body.length > 140) body = body.slice(0, 140) + "...";
    show("Nesty AI", body, "nesty-reply");
  };

  /* background notices: at most 3 a day, only while the app is in the background */
  function today() { return new Date().toISOString().slice(0, 10); }
  function sentToday() { return parseInt(ls("nestyNfCount_" + today()) || "0", 10) || 0; }
  function bump() { ls("nestyNfCount_" + today(), String(sentToday() + 1)); }
  function once(key) { if (ls(key)) return false; ls(key, "1"); return true; }
  function check() {
    try {
      if (!document.hidden || !can() || typeof user === "undefined" || !user || sentToday() >= 3) return;
      var p = user.prefs || {}, name = p.firstName || "friend";
      if (p.dob && typeof isBirthday === "function" && isBirthday(p.dob) && once("nestyNfBd_" + user.$id + "_" + today())) {
        var age = typeof calcAge === "function" ? calcAge(p.dob) : "";
        show("Happy birthday, " + name + "! 🎂", "Everyone at Nesty wishes you a wonderful day" + (age ? " as you turn " + age : "") + ". Come say hi! 🎉", "nesty-bd"); bump(); return;
      }
      if (typeof me !== "undefined" && me) {
        var a = me.announcement;
        if (a && a.id && !ls("nestyAnn_" + a.id) && once("nestyNfAnn_" + a.id)) { show("Nesty AI 📣", String(a.text || "").slice(0, 160), "nesty-ann"); bump(); return; }
        if (me.plan && me.plan !== "free" && me.expiresAt) {
          var days = Math.ceil((me.expiresAt - Date.now()) / 864e5);
          if (days <= 3 && days >= 0 && once("nestyNfExp_" + me.expiresAt + "_" + today())) { show("Your plan ends " + (days <= 0 ? "today" : "in " + days + " day" + (days === 1 ? "" : "s")), "Renew so you keep your limits.", "nesty-exp"); bump(); return; }
        }
      }
      var last = parseInt(ls("nestyNfTipAt") || "0", 10) || 0;
      if (window.tipNext && Date.now() - last > 20 * 3600 * 1000 && Date.now() - hiddenAt > 15 * 60 * 1000) {
        var t = tipNext();
        if (t) { ls("nestyNfTipAt", String(Date.now())); show("Nesty tip 💡", String(t.txt).replace("{name}", name), "nesty-tip"); bump(); }
      }
    } catch (e) {}
  }
  var hiddenAt = Date.now();
  document.addEventListener("visibilitychange", function () { hiddenAt = Date.now(); });
  setInterval(check, 60000);
  document.addEventListener("visibilitychange", function () { if (document.hidden) setTimeout(check, 20000); });
})();
