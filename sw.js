var CACHE = "nesty-v32";

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(["/", "/icon-192.png", "/icon-512.png"]);
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  var url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf("/.netlify/") === 0) return;
  if (url.pathname.indexOf("/api/") === 0) return;
  if (url.pathname === "/admin.html") return;
  if (url.search) return;
  e.respondWith(
    fetch(req)
      .then(function (res) {
        // Only keep good, same-origin answers (never errors or redirects).
        if (res && res.ok && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () { return caches.match(req); })
  );
});

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data.json(); } catch (x) { d = { title: "Nesty AI", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Nesty AI", {
    body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", tag: d.tag || "nesty-push", renotify: true, data: { url: d.url || "/" }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var go = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) { if (go !== "/" && /^https?:/.test(go) && list[i].navigate) { try { list[i].navigate(go); } catch (x) {} } return list[i].focus(); }
      }
      if (clients.openWindow) return clients.openWindow(go);
    })
  );
});
