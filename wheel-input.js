/**
 * Normalize wheel deltas across trackpad, mouse wheel, and Magic Mouse.
 * Also maps vertical wheel to horizontal scroll containers.
 */
(function (global) {
  'use strict';

  var LINE_HEIGHT = 16;

  function normalizeWheelDelta(event) {
    var dx = event.deltaX;
    var dy = event.deltaY;

    if (event.deltaMode === 1) {
      dx *= LINE_HEIGHT;
      dy *= LINE_HEIGHT;
    } else if (event.deltaMode === 2) {
      dx *= global.innerWidth;
      dy *= global.innerHeight;
    } else if (dy !== 0 && Math.abs(dy) <= 4 && Math.abs(dx) <= 4) {
      /* Magic Mouse / some iMac mice report tiny pixel deltas per notch */
      if (Math.abs(dy) >= Math.abs(dx)) {
        dy = Math.sign(dy) * LINE_HEIGHT;
      } else {
        dx = Math.sign(dx) * LINE_HEIGHT;
      }
    }

    return { x: dx, y: dy };
  }

  function bindHorizontalWheelScroll(container) {
    if (!container || container._guiltyHorizontalWheel) return;
    container._guiltyHorizontalWheel = true;

    container.addEventListener('wheel', function (event) {
      var delta = normalizeWheelDelta(event);
      var absX = Math.abs(delta.x);
      var absY = Math.abs(delta.y);
      if (absX < 0.5 && absY < 0.5) return;

      var horizontal = absX >= absY ? delta.x : delta.y;
      if (horizontal === 0) return;

      var maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      var next = container.scrollLeft + horizontal;
      if (next === container.scrollLeft) return;

      container.scrollLeft = next;
      event.preventDefault();
    }, { passive: false });
  }

  function bindAllHorizontalWheelScroll(root) {
    (root || document).querySelectorAll('.home-scarf-scroll-inner').forEach(bindHorizontalWheelScroll);
  }

  global.GuiltyWheelInput = {
    normalizeWheelDelta: normalizeWheelDelta,
    bindHorizontalWheelScroll: bindHorizontalWheelScroll,
    bindAllHorizontalWheelScroll: bindAllHorizontalWheelScroll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
