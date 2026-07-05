(function () {
  'use strict';

  var PAGES = {
    'comunity.html': {
      panel: 'community',
      hash: 'community',
      title: 'Comunity — GUILTY.',
      description: 'Comunity — GUILTY. community. Follow the last collection.',
    },
    'contact.html': {
      panel: 'contact',
      hash: 'contact',
      title: 'Contact — GUILTY.',
      description: 'Contact GUILTY. — Inquiries about the last collection.',
    },
  };

  var FILE_PROTOCOL = window.location.protocol === 'file:';
  var DURATION_MS = 620;

  function currentFile() {
    var path = window.location.pathname.split('/').pop();
    return path || 'index.html';
  }

  function fileFromHash() {
    var hash = window.location.hash.replace('#', '');
    if (hash === 'community') return 'comunity.html';
    if (hash === 'contact') return 'contact.html';
    return null;
  }

  function resolveFile() {
    return fileFromHash() || currentFile();
  }

  var current = resolveFile();
  if (!PAGES[current]) return;

  var section = document.querySelector('.about.about-page');
  if (!section) return;

  var stage = section.querySelector('.info-page-content-stage');
  if (!stage) return;

  var transitioning = false;
  var cleanupTimer = 0;

  function getPanel(key) {
    return stage.querySelector('.info-page-inner[data-info-page="' + key + '"]');
  }

  function getActivePanel() {
    return stage.querySelector('.info-page-inner.is-info-active');
  }

  function updateNavActive(targetFile) {
    document.querySelectorAll('.nav a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var file = href.split('/').pop().split('#')[0];
      link.classList.toggle('active', file === targetFile);
    });
  }

  function updatePageMeta(meta) {
    document.title = meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc && meta.description) {
      desc.setAttribute('content', meta.description);
    }
  }

  function updateHistory(file, meta, push) {
    if (push === false) return;

    if (FILE_PROTOCOL) {
      var hash = '#' + meta.hash;
      var nextUrl = window.location.pathname + window.location.search + hash;
      try {
        history.replaceState({ infoPage: file }, meta.title, nextUrl);
      } catch (err) {
        if (window.location.hash !== hash) {
          window.location.hash = meta.hash;
        }
      }
      return;
    }

    try {
      history.pushState({ infoPage: file }, meta.title, file);
    } catch (err) {
      try {
        history.replaceState({ infoPage: file }, meta.title, file);
      } catch (ignored) {
        /* keep current URL */
      }
    }
  }

  function finishTransition(overlay) {
    clearTimeout(cleanupTimer);
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
    stage.querySelectorAll('.about-inner.is-info-overlay').forEach(function (node) {
      node.remove();
    });
    stage.classList.remove('is-crossfading');
    document.body.classList.remove('is-info-page-transitioning');
    transitioning = false;
    window.dispatchEvent(new Event('info-page-transition-end'));
  }

  function resetTransitionState() {
    finishTransition(null);
  }

  function waitTransition(el) {
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        el.removeEventListener('transitionend', onEnd);
        resolve();
      }
      function onEnd(event) {
        if (event.target === el && event.propertyName === 'opacity') {
          finish();
        }
      }
      el.addEventListener('transitionend', onEnd);
      setTimeout(finish, DURATION_MS + 80);
    });
  }

  function showPanel(panel, animate) {
    stage.querySelectorAll('.info-page-inner[data-info-page]').forEach(function (el) {
      var isActive = el === panel;
      el.classList.toggle('is-info-active', isActive);
      el.toggleAttribute('hidden', !isActive);
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      el.classList.add('reveal');
      if (!isActive || animate !== false) {
        el.classList.remove('visible');
      }
    });

    if (animate === false) {
      panel.classList.add('visible');
      stage.classList.remove('is-crossfading');
      document.body.classList.remove('is-info-page-transitioning');
    }
  }

  function navigateTo(file, push, animate) {
    if (!PAGES[file]) {
      return Promise.resolve();
    }

    if (transitioning) {
      return Promise.resolve();
    }

    var meta = PAGES[file];
    var nextPanel = getPanel(meta.panel);
    if (!nextPanel) {
      return Promise.resolve();
    }

    var currentPanel = getActivePanel();
    if (currentPanel === nextPanel) {
      updateNavActive(file);
      updatePageMeta(meta);
      updateHistory(file, meta, push);
      current = file;
      return Promise.resolve();
    }

    if (animate === false) {
      showPanel(nextPanel, false);
      updateNavActive(file);
      updatePageMeta(meta);
      updateHistory(file, meta, push);
      current = file;
      return Promise.resolve();
    }

    transitioning = true;
    document.body.classList.add('is-info-page-transitioning');

    var overlay = currentPanel.cloneNode(true);
    overlay.classList.add('is-info-overlay', 'reveal', 'visible');
    overlay.classList.remove('is-info-active');
    overlay.removeAttribute('hidden');
    overlay.setAttribute('aria-hidden', 'true');

    stage.classList.add('is-crossfading');
    stage.appendChild(overlay);
    showPanel(nextPanel);

    updateNavActive(file);
    updatePageMeta(meta);

    try {
      updateHistory(file, meta, push);
      current = file;
    } catch (err) {
      finishTransition(overlay);
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        resolve();
      }

      cleanupTimer = setTimeout(function () {
        finishTransition(overlay);
        done();
      }, DURATION_MS + 120);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          // Same text enter as home/collection/about: .reveal → .visible (fade up).
          nextPanel.classList.add('visible');
          overlay.classList.add('is-info-leaving');
          waitTransition(overlay).then(function () {
            finishTransition(overlay);
            done();
          });
        });
      });
    });
  }

  document.querySelectorAll('.nav a[href="comunity.html"], .nav a[href="contact.html"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var file = link.getAttribute('href').split('/').pop().split('#')[0];
      if (!PAGES[file]) return;
      event.preventDefault();
      navigateTo(file, true, true);
    });
  });

  window.addEventListener('popstate', function () {
    var file = resolveFile();
    if (!PAGES[file] || file === current) return;
    navigateTo(file, false, true);
  });

  window.addEventListener('hashchange', function () {
    if (!FILE_PROTOCOL) return;
    var file = resolveFile();
    if (!PAGES[file] || file === current) return;
    navigateTo(file, false, true);
  });

  (function init() {
    resetTransitionState();

    var file = resolveFile();
    var meta = PAGES[file];
    var panel = getPanel(meta.panel);
    var active = getActivePanel();
    if (panel && panel !== active) {
      showPanel(panel, false);
      updateNavActive(file);
      updatePageMeta(meta);
      current = file;
    }
  })();
})();
