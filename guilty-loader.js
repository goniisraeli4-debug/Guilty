/**
 * GUILTY loader — spinning mark carousel when load exceeds 2 seconds.
 */
(function (global) {
  const SHOW_AFTER_MS = 2000;
  const SPLINE_TIMEOUT_MS = 12000;

  function assetBase() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src;
      if (src && /guilty-loader\.js(?:\?|$)/.test(src)) {
        return src.replace(/[^/?#]+(?:\?.*)?$/, '');
      }
    }
    return '';
  }

  function template(base) {
    const mark = base + 'images/guilty-mark-icon.svg';
    return (
      '<div class="guilty-loader" role="status" aria-live="polite" aria-label="Loading">' +
        '<div class="guilty-loader__stack">' +
          '<div class="guilty-loader__mark-wrap">' +
            '<div class="guilty-loader__mark-spin">' +
              '<div class="guilty-loader__mark-coin">' +
                '<img class="guilty-loader__mark guilty-loader__mark--front" src="' + mark + '" alt="" width="828" height="828" decoding="async">' +
                '<img class="guilty-loader__mark guilty-loader__mark--back" src="' + mark + '" alt="" width="828" height="828" decoding="async" aria-hidden="true">' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function lockScroll() {
    if (document.body) document.body.classList.add('is-loading');
  }

  function mount(options) {
    const opts = options || {};
    const base = opts.base || assetBase();
    const root = document.createElement('div');
    root.className = 'guilty-loader--overlay';
    root.id = opts.id || 'guilty-loader';
    root.innerHTML = template(base);

    (document.body || document.documentElement).appendChild(root);
    if (document.body) lockScroll();
    else document.addEventListener('DOMContentLoaded', lockScroll, { once: true });

    return {
      el: root,
      hide() {
        root.classList.add('is-hidden');
        if (document.body) document.body.classList.remove('is-loading');
        const remove = function (event) {
          if (event.propertyName !== 'opacity') return;
          root.removeEventListener('transitionend', remove);
          if (root.parentNode) root.parentNode.removeChild(root);
        };
        root.addEventListener('transitionend', remove);
      },
      show() {
        root.classList.remove('is-hidden');
        lockScroll();
      },
    };
  }

  function whenWindowLoad() {
    if (document.readyState === 'complete') return Promise.resolve();
    return new Promise(function (resolve) {
      window.addEventListener('load', resolve, { once: true });
    });
  }

  function whenSplineReady() {
    const viewer = document.querySelector('spline-viewer');
    if (!viewer) return Promise.resolve();

    return new Promise(function (resolve) {
      let done = false;
      const finish = function () {
        if (done) return;
        done = true;
        resolve();
      };

      viewer.addEventListener('load', finish, { once: true });
      setTimeout(finish, SPLINE_TIMEOUT_MS);
    });
  }

  function shouldAutoBoot() {
    if (global.__guiltyLoaderBooted) return false;
    if (/loader\.html$/i.test(location.pathname)) return false;

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') return false;

    return true;
  }

  function boot() {
    if (!shouldAutoBoot()) return;
    global.__guiltyLoaderBooted = true;

    let loader = null;
    let ready = false;

    const readyPromise = Promise.all([
      whenWindowLoad(),
      whenSplineReady(),
    ]).then(function () {
      ready = true;
    });

    const showTimer = setTimeout(function () {
      if (!ready) loader = mount();
    }, SHOW_AFTER_MS);

    readyPromise.then(function () {
      clearTimeout(showTimer);
      if (loader) loader.hide();
    });
  }

  function untilLoaded(promise) {
    const loader = mount();
    return Promise.resolve(promise).finally(function () {
      loader.hide();
    });
  }

  global.GuiltyLoader = {
    assetBase: assetBase,
    template: template,
    mount: mount,
    untilLoaded: untilLoaded,
    boot: boot,
  };

  boot();
})(typeof window !== 'undefined' ? window : globalThis);
