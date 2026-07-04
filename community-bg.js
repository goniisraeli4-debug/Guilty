(function () {
  'use strict';

  var isInfoPage = document.body.classList.contains('page-info') ||
    document.body.classList.contains('page-comunity') ||
    document.body.classList.contains('page-contact');
  if (!isInfoPage) return;

  var bg = document.querySelector('.community-page-bg');
  var track = document.querySelector('.community-page-bg-track');
  if (!bg || !track) return;

  var STORAGE_KEY = 'guilty-info-bg-position';
  var LOOP_KEY = 'guilty-info-bg-loop-h';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var images = track.querySelectorAll('.community-page-bg-item img');
  images.forEach(function (img) {
    if (!img.src) return;
    var preload = new Image();
    preload.src = img.src;
  });

  var ITEM_COUNT = 7;
  var SECONDS_PER_ITEM = 17;
  var AUTO_DURATION = ITEM_COUNT * SECONDS_PER_ITEM;
  var IDLE_MS = 180;
  var FRICTION = 0.9;
  var VELOCITY_STOP = 8;

  var loopHeight = 0;
  var autoSpeed = 0;
  var position = 0;
  var velocity = 0;
  var lastFrame = 0;
  var lastInput = 0;
  var lastWheel = 0;
  var rafId = 0;
  var ready = false;
  var resizeTimer = 0;

  track.classList.add('is-scroll-driven');

  function readStoredPosition(nextLoopHeight) {
    try {
      var savedLoop = parseFloat(sessionStorage.getItem(LOOP_KEY));
      if (!Number.isFinite(savedLoop) || !nextLoopHeight) return null;
      if (Math.abs(savedLoop - nextLoopHeight) > 4) return null;

      var saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved === null) return null;
      var value = parseFloat(saved);
      return Number.isFinite(value) ? value : null;
    } catch (err) {
      return null;
    }
  }

  function storePosition() {
    try {
      sessionStorage.setItem(STORAGE_KEY, position.toFixed(2));
      if (loopHeight > 0) {
        sessionStorage.setItem(LOOP_KEY, String(Math.round(loopHeight)));
      }
    } catch (err) {
      /* ignore */
    }
  }

  function wrapPosition(y) {
    if (!loopHeight) return y;
    var wrapped = y % loopHeight;
    if (wrapped > 0) wrapped -= loopHeight;
    return wrapped;
  }

  function applyTransform() {
    track.style.transform = 'translate3d(0,' + position.toFixed(2) + 'px,0)';
  }

  function measure(options) {
    var restore = options && options.restore;
    var nextLoopHeight = track.scrollHeight * 0.5;
    if (nextLoopHeight < 100) {
      if (loopHeight > 0) applyTransform();
      return;
    }

    var previousLoopHeight = loopHeight;
    loopHeight = nextLoopHeight;
    autoSpeed = loopHeight / AUTO_DURATION;

    if (restore) {
      var saved = readStoredPosition(loopHeight);
      position = saved !== null ? saved : 0;
    } else if (previousLoopHeight > 0 && previousLoopHeight !== loopHeight) {
      position = position * (loopHeight / previousLoopHeight);
    }

    position = wrapPosition(position);
    applyTransform();
    ready = true;
  }

  function waitForImages() {
    var pending = Array.prototype.filter.call(images, function (img) {
      return !img.complete || !img.naturalHeight;
    });

    if (!pending.length) {
      measure({ restore: true });
      return;
    }

    var left = pending.length;
    pending.forEach(function (img) {
      function done() {
        left -= 1;
        if (left <= 0) measure({ restore: true });
      }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  function noteInput(deltaY, dt) {
    lastInput = performance.now();
    position -= deltaY;
    position = wrapPosition(position);

    if (dt > 0) {
      var instant = deltaY / dt;
      velocity = velocity * 0.35 + instant * 0.65;
    } else {
      velocity = deltaY * 16;
    }

    applyTransform();
    storePosition();
  }

  function onWheel(event) {
    if (!ready) return;
    var now = performance.now();
    var dt = lastWheel ? Math.min(0.05, (now - lastWheel) / 1000) : 0.016;
    lastWheel = now;
    noteInput(event.deltaY, dt);
    event.preventDefault();
  }

  var touchY = 0;
  var touchActive = false;

  function onTouchStart(event) {
    if (!ready || !event.touches.length) return;
    touchActive = true;
    touchY = event.touches[0].clientY;
    lastWheel = 0;
  }

  function onTouchMove(event) {
    if (!ready || !touchActive || !event.touches.length) return;
    var y = event.touches[0].clientY;
    var deltaY = touchY - y;
    touchY = y;
    noteInput(deltaY, 0.016);
    event.preventDefault();
  }

  function onTouchEnd() {
    touchActive = false;
  }

  function tick(now) {
    if (!ready) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (!lastFrame) lastFrame = now;
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    var sinceInput = now - lastInput;
    var userCoasting = sinceInput < IDLE_MS && Math.abs(velocity) > VELOCITY_STOP;
    var previousPosition = position;

    if (userCoasting) {
      position -= velocity * dt;
      velocity *= Math.pow(FRICTION, dt * 60);
      if (Math.abs(velocity) < VELOCITY_STOP) velocity = 0;
    } else if (sinceInput >= IDLE_MS && !reduceMotion) {
      velocity = 0;
      position -= autoSpeed * dt;
    }

    position = wrapPosition(position);
    applyTransform();

    if (Math.abs(position - previousPosition) > 0.05) {
      storePosition();
    }

    rafId = requestAnimationFrame(tick);
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      measure({ restore: false });
    }, 120);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('info-page-transition-end', function () {
    measure({ restore: false });
  });
  window.addEventListener('pagehide', storePosition);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      storePosition();
      cancelAnimationFrame(rafId);
    } else {
      lastFrame = 0;
      rafId = requestAnimationFrame(tick);
    }
  });

  function start() {
    measure({ restore: true });
    if (reduceMotion) return;
    waitForImages();
    rafId = requestAnimationFrame(tick);
  }

  if (document.readyState === 'complete') {
    requestAnimationFrame(function () {
      requestAnimationFrame(start);
    });
  } else {
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(start);
      });
    }, { once: true });
    measure({ restore: false });
  }
})();
