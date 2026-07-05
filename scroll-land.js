(function () {
  'use strict';

  // Capture pagereveal in <head> before first paint (script.js waits on this).
  window.__guiltyPageReveal = new Promise(function (resolve) {
    if (!('onpagereveal' in window)) {
      resolve(null);
      return;
    }
    window.addEventListener('pagereveal', function (event) {
      resolve(event);
    }, { once: true });
  });

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const navEntry = performance.getEntriesByType('navigation')[0];
  const isReload = navEntry && navEntry.type === 'reload';

  function scrollToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }

  if (isReload) {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    scrollToTop();
    document.addEventListener('DOMContentLoaded', scrollToTop, { once: true });
    window.addEventListener('load', scrollToTop, { once: true });
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) scrollToTop();
  });
})();
