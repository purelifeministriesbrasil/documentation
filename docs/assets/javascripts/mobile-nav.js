document.addEventListener("DOMContentLoaded", function () {
  function initMobileNav() {
    if (window.innerWidth >= 1220) return;

    const navLinks = document.querySelectorAll(".md-nav__link");

    navLinks.forEach(function (link) {
      if (link.tagName.toLowerCase() === "a") {
        const container = link.closest(".md-nav__container");
        if (container) {
          link.addEventListener("click", function (e) {
            e.preventDefault();
            const label = container.querySelector("label.md-nav__icon");
            if (label) {
              label.click();
            }
          });
        }
      }
    });
  }

  initMobileNav();

  document.addEventListener("DOMContentSwitch", function () {
    initMobileNav();
  });
});
