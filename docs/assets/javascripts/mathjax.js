window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex"
  }
};

(function () {
  "use strict";

  var MATHJAX_SRC = "https://unpkg.com/mathjax@3.2.2/es5/tex-mml-chtml.js";
  var loading = null;

  function loadMathJax() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = MATHJAX_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = function () {
        window.MathJax.startup.promise.then(resolve, reject);
      };
      script.onerror = function () {
        loading = null;
        reject(new Error("Falha ao carregar o MathJax de " + MATHJAX_SRC));
      };
      document.head.appendChild(script);
    });
    return loading;
  }

  function typeset() {
    if (!document.querySelector(".arithmatex")) return;
    loadMathJax()
      .then(function () {
        var mj = window.MathJax;
        mj.startup.output.clearCache();
        mj.typesetClear();
        mj.texReset();
        return mj.typesetPromise();
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  document$.subscribe(typeset);
})();
