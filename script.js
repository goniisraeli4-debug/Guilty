// Keep at least two words with the preceding "." or "," so a lone word never starts the next line.
(function () {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);
  const PUNCT_PAIR = /([.,])\s+(\S+)\s+(\S+)/g;

  function shouldSkip(node) {
    let el = node.parentElement;
    while (el) {
      if (SKIP.has(el.tagName)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function bindPunctuationPairs(textNode) {
    if (shouldSkip(textNode)) return;

    const text = textNode.nodeValue;
    PUNCT_PAIR.lastIndex = 0;
    if (!PUNCT_PAIR.test(text)) return;

    PUNCT_PAIR.lastIndex = 0;
    const parent = textNode.parentNode;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = PUNCT_PAIR.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const keep = document.createElement('span');
      keep.className = 'text-keep';
      keep.textContent = match[1] + '\u00A0' + match[2] + '\u00A0' + match[3];
      parts.push(keep);
      lastIndex = PUNCT_PAIR.lastIndex;
    }

    if (lastIndex === 0) return;

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    for (const part of parts) {
      parent.insertBefore(
        typeof part === 'string' ? document.createTextNode(part) : part,
        textNode
      );
    }
    parent.removeChild(textNode);
  }

  function fixPunctuationOrphans(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(bindPunctuationPairs);
  }

  function run() {
    fixPunctuationOrphans(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();

// In-page hash targets (navigate only — reloads land at top via scroll-land.js)
(function () {
  const navEntry = performance.getEntriesByType('navigation')[0];
  if (!navEntry || navEntry.type !== 'navigate' || !location.hash) return;

  function scrollToHash() {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrollToHash, { once: true });
  } else {
    scrollToHash();
  }
})();

// Header wordmark (injected once — keeps HTML lean across pages)
(function () {
  const header = document.querySelector('.header');
  const nav = document.querySelector('.nav');
  if (!header || !nav || header.querySelector('.logo-link')) return;

  const base = document.body.classList.contains('product-page') ? '../' : '';
  const logo = document.createElement('a');
  logo.className = 'logo-link';
  logo.href = base + 'index.html';
  logo.setAttribute('aria-label', 'GUILTY. Home');
  logo.textContent = 'GUILTY.';
  header.insertBefore(logo, nav);
})();

// Keep --header-height in sync so dependent elements (drawer zone, etc.) sit below it
(function () {
  const header = document.querySelector('.header');
  if (!header) return;
  const sync = () => {
    document.documentElement.style.setProperty(
      '--header-height', header.getBoundingClientRect().height + 'px'
    );
  };
  sync();
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('load',   sync, { passive: true });
})();

// Mobile nav
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('.scarf-nav-item').forEach((link) => {
  link.addEventListener('click', () => {
    if (menuToggle && nav) {
      nav.classList.remove('open');
      menuToggle.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

// Text reveal on open / scroll (timing tokens live in styles.css).
// Full-page motion uses CSS @view-transition crossfade — no fade-to-transparent.
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION_MS = 620;

  window.GuiltyPageTransition = {
    navigate(url) {
      window.location.href = url;
    },
    durationMs: DURATION_MS,
  };

  if (document.body.classList.contains('page-thank-you')) return;

  // Same enter as contact / community: elements ship with .reveal, then get .visible.
  const enterSel = [
    '.page-home .hero-overlay h1.reveal',
    '.page-collection .collection-bg-text.reveal',
    '.about-parallax__text--title .about-inner.reveal',
    '.info-page-inner.reveal.is-info-active',
  ].join(', ');

  function playRevealEnter() {
    document.querySelectorAll(enterSel).forEach((el) => {
      if (el.hasAttribute('hidden')) return;
      el.classList.remove('visible');
      void el.offsetWidth;
      el.classList.add('visible');
    });
  }

  function afterViewTransition(fn) {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      fn();
    };

    const revealPromise = window.__guiltyPageReveal;
    if (revealPromise && typeof revealPromise.then === 'function') {
      revealPromise.then((event) => {
        if (event && event.viewTransition) {
          event.viewTransition.finished.then(run, run);
        } else {
          run();
        }
      });
      window.setTimeout(run, 2000);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }

  if (reduceMotion) {
    document.querySelectorAll(enterSel).forEach((el) => {
      if (!el.hasAttribute('hidden')) el.classList.add('visible');
    });
  } else {
    afterViewTransition(playRevealEnter);
  }

  const revealTargets = document.querySelectorAll(
    '.scarf-card, .section-header, .product'
  );

  revealTargets.forEach((el) => {
    el.classList.add('reveal');
  });

  if (reduceMotion) {
    revealTargets.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    }),
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
})();

// Shopping bag icon + preview panel
(function () {
  const base = document.body.classList.contains('product-page') ? '../' : '';

  function loadWidget() {
    if (window.GuiltyCartWidget) return;
    const widget = document.createElement('script');
    widget.src = base + 'cart-widget.js';
    document.body.appendChild(widget);
  }

  if (window.GuiltyCart) {
    loadWidget();
    return;
  }

  const cart = document.createElement('script');
  cart.src = base + 'cart.js';
  cart.onload = loadWidget;
  document.body.appendChild(cart);
})();

// Fixed footer — hide while scrolling, show when scroll stops
(function () {
  const fixedFooterPages = [
    'page-home',
    'page-collection',
    'page-about',
    'page-info',
    'page-comunity',
    'page-contact',
    'page-cart',
  ];
  const hasFixedContactFooter = fixedFooterPages.some((cls) => document.body.classList.contains(cls));
  const hasProductOverlayFooter = document.body.classList.contains('product-overlay-mode');
  if (!hasFixedContactFooter && !hasProductOverlayFooter) return;

  const contact = document.querySelector('main .contact#contact');
  if (contact) document.body.appendChild(contact);

  const scrollRoots = [window];
  document.querySelectorAll('.home-scarf-scroll-inner').forEach((el) => scrollRoots.push(el));

  let scrollTimer = null;
  const SHOW_DELAY_MS = 200;

  function hideFooter() {
    document.body.classList.add('is-footer-scroll-hidden');
  }

  function showFooter() {
    document.body.classList.remove('is-footer-scroll-hidden');
  }

  function onScrollActivity() {
    hideFooter();
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(showFooter, SHOW_DELAY_MS);
  }

  scrollRoots.forEach((root) => {
    root.addEventListener('scroll', onScrollActivity, { passive: true });
  });
})();
