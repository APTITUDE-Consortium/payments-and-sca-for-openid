(function () {
  'use strict';

  // ---------- Sticky nav state on home -------------------------------
  const nav = document.querySelector('.site-nav');
  if (nav && document.body.classList.contains('page-home')) {
    const update = () => {
      if (window.scrollY > 60) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // ---------- Tabs ---------------------------------------------------
  const tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (!panel) return;
      const group = tab.parentElement;
      group.querySelectorAll('[role="tab"]').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const panels = panel.parentElement.querySelectorAll('[role="tabpanel"]');
      panels.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('hidden', '');
      });
      panel.classList.add('is-active');
      panel.removeAttribute('hidden');
    });
  });

  // ---------- Scroll reveal ------------------------------------------
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const candidates = document.querySelectorAll(
    '.band__inner > h2, .band__inner > p.lede, .cards, .modules, .roles, .compare, .proof-grid, .spec-grid, .reg-table, .urn, .urn-parts, .callout, .diagram, .tabs'
  );
  candidates.forEach((el) => el.classList.add('reveal'));

  if (reduced || !('IntersectionObserver' in window)) {
    candidates.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    candidates.forEach((el) => io.observe(el));
  }
})();
