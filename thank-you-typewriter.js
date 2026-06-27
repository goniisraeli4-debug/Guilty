(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var subtitle = document.getElementById('thank-you-subtitle');
  if (!subtitle) return;

  var typedEl = document.getElementById('thank-you-subtitle-typed');
  var cursorEl = subtitle.querySelector('.typewriter-cursor');
  if (!typedEl) return;

  var fullText = subtitle.getAttribute('data-full-text') || '';
  var REVEAL_DELAY_MS = 500;

  // Render a slice with GUILTY styled once the full word has been typed.
  function renderSlice(text) {
    var html = text
      .replace(/\n/g, '<br>')
      .replace(/GUILTY/g, '<span class="word-guilty">GUILTY</span>');
    typedEl.innerHTML = html;
  }

  // Initial state: hidden/empty.
  typedEl.innerHTML = '';
  if (cursorEl) cursorEl.style.display = 'inline-block';

  if (reduceMotion) {
    setTimeout(function () {
      renderSlice(fullText);
      if (cursorEl) cursorEl.style.display = 'none';
    }, REVEAL_DELAY_MS);
    return;
  }

  var TYPE_DELAY_MS = REVEAL_DELAY_MS;
  var CHAR_INTERVAL_MS = 74; // typewriter rhythm (slightly slower)

  var i = 0;
  var last = 0;
  var acc = 0;
  var rafId = 0;
  var started = false;

  function tick(now) {
    if (!started) return;
    if (!last) last = now;

    var dt = now - last;
    last = now;
    acc += dt;

    while (acc >= CHAR_INTERVAL_MS && i < fullText.length) {
      i++;
      renderSlice(fullText.slice(0, i));
      acc -= CHAR_INTERVAL_MS;
    }

    if (i < fullText.length) {
      rafId = requestAnimationFrame(tick);
    } else {
      // Typing complete: keep blinking cursor (handled by CSS).
      if (cursorEl) cursorEl.style.display = 'inline-block';
      cancelAnimationFrame(rafId);
    }
  }

  setTimeout(function () {
    started = true;
    last = 0;
    acc = 0;
    i = 0;
    // Ensure the first frame has correct timing.
    rafId = requestAnimationFrame(tick);
  }, TYPE_DELAY_MS);
})();

