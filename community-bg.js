(function () {
  'use strict';

  var isStandaloneInfoPage = document.body.classList.contains('page-comunity') ||
    document.body.classList.contains('page-contact');
  var isScrollPage = document.body.classList.contains('page-home');

  if (!isStandaloneInfoPage && !isScrollPage) return;

  var sections = isScrollPage
    ? document.querySelectorAll('.about.about-page.community-page, .about.about-page.contact-page')
    : [document.querySelector('.about.about-page')].filter(Boolean);

  if (!sections.length) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getHeaderHeight() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    var parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function isSectionPinned(section) {
    if (!isScrollPage) return true;
    var rect = section.getBoundingClientRect();
    var headerH = getHeaderHeight();
    return rect.top <= headerH + 2 && rect.bottom >= window.innerHeight - 2;
  }

  sections.forEach(function (section) {
    var track = section.querySelector('.community-page-bg-track');
    if (!track) return;

    var storageKey = 'guilty-info-bg-position-' + (section.id || 'default');
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
    var sectionVisible = !isScrollPage;

    track.classList.add('is-scroll-driven');

    function readStoredPosition() {
      try {
        var saved = sessionStorage.getItem(storageKey);
        if (saved === null) return null;
        var value = parseFloat(saved);
        return Number.isFinite(value) ? value : null;
      } catch (err) {
        return null;
      }
    }

    function storePosition() {
      try {
        sessionStorage.setItem(storageKey, position.toFixed(2));
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

    function measure() {
      loopHeight = track.scrollHeight * 0.5;
      autoSpeed = loopHeight > 0 ? loopHeight / AUTO_DURATION : 0;
      position = wrapPosition(position);
      applyTransform();
      ready = loopHeight > 0;
    }

    function restorePosition() {
      var saved = readStoredPosition();
      if (saved !== null) {
        position = saved;
        applyTransform();
      }
    }

    function waitForImages() {
      var pending = Array.prototype.filter.call(images, function (img) {
        return !img.complete;
      });

      if (!pending.length) {
        restorePosition();
        measure();
        return;
      }

      var left = pending.length;
      pending.forEach(function (img) {
        function done() {
          left -= 1;
          if (left <= 0) {
            restorePosition();
            measure();
          }
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
      if (isScrollPage && !isSectionPinned(section)) return;

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
      if (isScrollPage && !isSectionPinned(section)) return;
      touchActive = true;
      touchY = event.touches[0].clientY;
      lastWheel = 0;
    }

    function onTouchMove(event) {
      if (!ready || !touchActive || !event.touches.length) return;
      if (isScrollPage && !isSectionPinned(section)) return;
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

      if (isScrollPage && !sectionVisible) {
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

    if (!isScrollPage) {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    } else {
      var visibilityObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            sectionVisible = entry.isIntersecting;
          });
        },
        { threshold: 0.05 }
      );
      visibilityObserver.observe(section);
    }

    window.addEventListener('resize', measure);
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

    if (reduceMotion) {
      restorePosition();
      measure();
      return;
    }

    waitForImages();
    rafId = requestAnimationFrame(tick);
  });
})();
