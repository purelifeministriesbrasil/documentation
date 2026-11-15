/*
 * Interações da documentação: entrada animada, progresso de leitura,
 * tempo de leitura e atalhos de teclado.
 * Reinicializa a cada navegação instantânea via document$ (MkDocs Material).
 */
(function () {
  "use strict";

  var WORDS_PER_MINUTE = 200;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var revealObserver = null;

  var CLOCK_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7Z"/></svg>';

  /* ---------- Entrada animada ---------- */
  function setupReveal() {
    if (revealObserver) revealObserver.disconnect();
    var targets = document.querySelectorAll(
      ".md-content .four-card, .md-content .pillar-card"
    );
    if (!targets.length || reducedMotion.matches || !("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("js-reveal");
      return;
    }
    document.documentElement.classList.add("js-reveal");

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      el.setAttribute("data-plm-reveal", "");
      var siblings = el.parentElement ? el.parentElement.children : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      el.style.setProperty("--plm-delay", Math.min(index, 5) * 0.07 + "s");
      revealObserver.observe(el);
    });
  }

  /* ---------- Progresso de leitura ---------- */
  var progress = null;
  var ticking = false;

  function ensureProgress() {
    if (progress) return progress;
    progress = document.createElement("div");
    progress.className = "plm-progress";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Progresso de leitura da página");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.innerHTML = '<div class="plm-progress__bar"></div>';
    document.body.appendChild(progress);
    return progress;
  }

  function updateProgress() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    var el = ensureProgress();
    el.style.setProperty("--plm-progress", ratio.toFixed(4));
    el.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }

  /* ---------- Tempo de leitura ---------- */
  function setupReadingTime() {
    var article = document.querySelector(".md-content__inner");
    if (!article || article.querySelector(".plm-meta")) return;
    var heading = article.querySelector("h1");
    if (!heading || document.querySelector(".docs-hero")) return;

    var words = (article.innerText || "").trim().split(/\s+/).filter(Boolean).length;
    var minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));

    var meta = document.createElement("p");
    meta.className = "plm-meta";
    meta.innerHTML =
      '<span class="plm-meta__item">' + CLOCK_ICON + "<span></span></span>";
    meta.querySelector("span > span").textContent =
      minutes + (minutes === 1 ? " minuto de leitura" : " minutos de leitura");

    var hint = document.createElement("button");
    hint.type = "button";
    hint.className = "plm-shortcuts-hint";
    hint.textContent = "Atalhos de teclado (?)";
    hint.addEventListener("click", openShortcuts);
    meta.appendChild(hint);

    heading.insertAdjacentElement("afterend", meta);
  }

  /* ---------- Atalhos de teclado ---------- */
  var dialog = null;
  var lastFocus = null;

  function buildDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "plm-shortcuts";
    dialog.setAttribute("aria-labelledby", "plm-shortcuts-title");
    dialog.innerHTML =
      '<h2 id="plm-shortcuts-title">Atalhos de teclado</h2>' +
      "<dl>" +
      "<dt><kbd>/</kbd> ou <kbd>s</kbd></dt><dd>Abrir a busca</dd>" +
      "<dt><kbd>n</kbd></dt><dd>Próxima página</dd>" +
      "<dt><kbd>p</kbd></dt><dd>Página anterior</dd>" +
      "<dt><kbd>t</kbd></dt><dd>Voltar ao topo</dd>" +
      "<dt><kbd>?</kbd></dt><dd>Mostrar esta ajuda</dd>" +
      "<dt><kbd>Esc</kbd></dt><dd>Fechar</dd>" +
      "</dl>" +
      '<button type="button" class="plm-shortcuts__close">Fechar</button>';
    dialog.querySelector(".plm-shortcuts__close").addEventListener("click", function () {
      dialog.close();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", function () {
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function openShortcuts() {
    var d = buildDialog();
    if (d.open) return;
    lastFocus = document.activeElement;
    d.showModal();
    d.querySelector(".plm-shortcuts__close").focus();
  }

  function isTyping(target) {
    if (!target) return false;
    var tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function onKeydown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target)) return;
    if (dialog && dialog.open) return;

    switch (event.key) {
      case "?":
        event.preventDefault();
        openShortcuts();
        break;
      case "t":
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
        break;
      default:
        break;
    }
  }

  /* ---------- Inicialização ---------- */
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("keydown", onKeydown);

  document$.subscribe(function () {
    setupReveal();
    setupReadingTime();
    updateProgress();
  });
})();
