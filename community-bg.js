(function () {
  'use strict';

  if (!document.body.classList.contains('page-comunity')) return;

  var track = document.querySelector('.community-page-bg-track');
  if (!track) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var images = track.querySelectorAll('.community-page-bg-item img');
  images.forEach(function (img) {
    if (!img.src) return;
    var preload = new Image();
    preload.src = img.src;
  });

  if (reduceMotion) return;

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

  track.classList.add('is-scroll-driven');

  function wrapPosition(y) {
    if (!loopHeight) return y;
    var wrapped = y % loopHeight;
    if (wrapped > 0) wrapped -= loopHeight;
    return wrapped;
  }

  function applyTransform() {
    track.style.transform = 'translate3d(0,' + position.toFixed(2) + 'px,0)';
  }

  function measure() {
    loopHeight = track.scrollHeight * 0.5;
    autoSpeed = loopHeight > 0 ? loopHeight / AUTO_DURATION : 0;
    position = wrapPosition(position);
    applyTransform();
    ready = loopHeight > 0;
  }

  function waitForImages() {
    var pending = Array.prototype.filter.call(images, function (img) {
      return !img.complete;
    });

    if (!pending.length) {
      measure();
      return;
    }

    var left = pending.length;
    pending.forEach(function (img) {
      function done() {
        left -= 1;
        if (left <= 0) measure();
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

    if (userCoasting) {
      position -= velocity * dt;
      velocity *= Math.pow(FRICTION, dt * 60);
      if (Math.abs(velocity) < VELOCITY_STOP) velocity = 0;
    } else if (sinceInput >= IDLE_MS) {
      velocity = 0;
      position -= autoSpeed * dt;
    }

    position = wrapPosition(position);
    applyTransform();
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('resize', measure);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      lastFrame = 0;
      rafId = requestAnimationFrame(tick);
    }
  });

  waitForImages();
  rafId = requestAnimationFrame(tick);
})();
