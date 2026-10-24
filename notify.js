(function () {
  var asked = false;

  function ask() {
    if (asked) return;
    asked = true;
    if ("Notification" in window && Notification.permission === "default") {
      try { Notification.requestPermission(); } catch (e) {}
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.closest && t.closest("#send, #mic")) ask();
  }, true);

  function notify(text) {
    if (!text || !document.hidden) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (/^(Error|Network error|Server error|Sorry, something)/.test(text)) return;
    var body = text.replace(/```[\s\S]*?```/g, " [code] ").replace(/[*`#]/g, "").trim();
    if (body.length > 140) body = body.slice(0, 140) + "...";
    var opts = { body: body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "nesty-reply" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then(function (reg) { reg.showNotification("Nesty AI", opts); })
        .catch(function () { try { new Notification("Nesty AI", opts); } catch (e) {} });
    } else {
      try { new Notification("Nesty AI", opts); } catch (e) {}
    }
  }

  var origFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    var p = origFetch.apply(this, args);
    try {
      var first = args[0];
      var url = typeof first === "string" ? first : (first && first.url) || "";
      if (url.indexOf("/.netlify/functions/chat") !== -1) {
        p.then(function (res) {
          return res.clone().json().then(function (d) { notify(d && d.reply); });
        }).catch(function () {});
      }
    } catch (e) {}
    return p;
  };
})();
