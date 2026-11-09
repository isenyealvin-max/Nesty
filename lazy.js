/* Loads the bigger parts of Nesty (Study Center, Help Center, Business tools) only when someone opens them. */
(function () {
  "use strict";
  var loading = {};
  function load(src) {
    if (loading[src]) return loading[src];
    loading[src] = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src + "?v=29"; s.onload = res;
      s.onerror = function () { delete loading[src]; rej(new Error("load")); };
      document.head.appendChild(s);
    });
    return loading[src];
  }
  function stub(name, src) {
    if (window[name]) return;
    var f = function () {
      var a = arguments, self = this;
      load(src).then(function () {
        var g = window[name];
        if (g && !g.__stub) g.apply(self, a);
      }).catch(function () { try { toast("Could not load this part. Check your internet and try again."); } catch (e) {} });
    };
    f.__stub = true;
    window[name] = f;
  }
  stub("openStudyCenter", "/study.js");
  stub("goStudy", "/study.js");
  stub("openSharedQuiz", "/study.js");
  stub("openHelp", "/help.js");
  stub("goBiz", "/business.js");
  stub("closeStudyCenter", "/study.js");
  stub("closeHelp", "/help.js");
  stub("nestyGuide", "/help.js");
  stub("goBrand", "/studio.js");
  stub("goOffice", "/centers.js");
  stub("goResearch", "/centers.js");
})();
