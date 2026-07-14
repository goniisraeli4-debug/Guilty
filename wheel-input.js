/**
 * Normalize wheel deltas across trackpad, mouse wheel, and Magic Mouse.
 * Maps vertical wheel to horizontal scarf-row scroll on home + collection pages.
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

  function shouldSkipScarfWheel() {
    return document.body.classList.contains('scarf-expanded');
  }

  var SNAP_RESTORE_MS = 140;

  /*
   * CSS scroll-snap re-snaps every small programmatic scrollLeft change back to
   * the current item, which swallows per-notch mouse-wheel / trackpad input.
   * Suspend snapping while the wheel is actively moving, then restore it shortly
   * after the user stops so the row still settles neatly on a scarf.
   */
  function suspendSnapWhileScrolling(container) {
    if (container.style.scrollSnapType !== 'none') {
      container.style.scrollSnapType = 'none';
    }
    if (container._guiltySnapTimer) {
      clearTimeout(container._guiltySnapTimer);
    }
    container._guiltySnapTimer = setTimeout(function () {
      container.style.scrollSnapType = '';
      container._guiltySnapTimer = null;
    }, SNAP_RESTORE_MS);
  }

  function scrollHorizontally(container, event) {
    if (!container || shouldSkipScarfWheel()) return false;
    if (event.ctrlKey) return false;

    var delta = normalizeWheelDelta(event);
    var absX = Math.abs(delta.x);
    var absY = Math.abs(delta.y);
    if (absX < 0.5 && absY < 0.5) return false;

    var horizontal = absX >= absY ? delta.x : delta.y;
    if (horizontal === 0) return false;

    var maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return false;

    var next = Math.max(0, Math.min(maxScroll, container.scrollLeft + horizontal));

    /* At a travel edge in the requested direction: let the event pass through. */
    if (next === container.scrollLeft) return false;

    suspendSnapWhileScrolling(container);
    container.scrollLeft = next;
    event.preventDefault();
    return true;
  }

  function bindScarfSectionWheel(section) {
    if (!section || section._guiltyScarfWheel) return;
    section._guiltyScarfWheel = true;

    var container = section.querySelector('.home-scarf-scroll-inner');
    if (!container) return;

    /*
     * Home collection only: horizontal when the cursor is on a scarf product;
     * otherwise leave the event alone so the page can scroll vertically.
     */
    section.addEventListener('wheel', function (event) {
      if (!event.target.closest('.home-scarf-item')) return;
      scrollHorizontally(container, event);
    }, { passive: false });
  }

  function bindCollectionPageWheel() {
    if (!document.body.classList.contains('page-collection')) return;
    if (document.body._guiltyCollectionWheel) return;
    document.body._guiltyCollectionWheel = true;

    var container = document.querySelector('.home-scarf-scroll-inner');
    if (!container) return;

    document.addEventListener('wheel', function (event) {
      scrollHorizontally(container, event);
    }, { passive: false });
  }

  function bindDragScroll(container) {
    if (!container || container._guiltyDragScroll) return;
    container._guiltyDragScroll = true;

    var DRAG_THRESHOLD = 8;
    var activePointer = null;
    var startX = 0;
    var startScrollLeft = 0;
    var dragging = false;
    var blockNextClick = false;

    container.addEventListener('click', function (event) {
      if (!blockNextClick) return;
      event.preventDefault();
      event.stopPropagation();
      blockNextClick = false;
    }, true);

    function endDrag(event) {
      if (activePointer === null || (event && event.pointerId !== activePointer)) return;

      blockNextClick = dragging;

      if (dragging) {
        try {
          container.releasePointerCapture(activePointer);
        } catch (err) {
          /* ignore */
        }
      }

      dragging = false;
      activePointer = null;
      container.classList.remove('is-dragging');
    }

    container.addEventListener('pointerdown', function (event) {
      if (shouldSkipScarfWheel()) return;
      if (event.button !== 0) return;
      if (event.target.closest('.scarf-scroll-arrow, .home-scarf-cart, button')) return;

      activePointer = event.pointerId;
      startX = event.clientX;
      startScrollLeft = container.scrollLeft;
      dragging = false;
      blockNextClick = false;
    });

    container.addEventListener('pointermove', function (event) {
      if (event.pointerId !== activePointer) return;
      if (shouldSkipScarfWheel()) {
        endDrag(event);
        return;
      }

      var dx = event.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragging = true;
        container.classList.add('is-dragging');
        try {
          container.setPointerCapture(activePointer);
        } catch (err) {
          /* ignore */
        }
      }

      event.preventDefault();

      var maxScroll = container.scrollWidth - container.clientWidth;
      suspendSnapWhileScrolling(container);
      container.scrollLeft = Math.max(0, Math.min(maxScroll, startScrollLeft - dx));
    });

    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
  }

  function bindAllDragScroll(root) {
    var body = document.body;
    if (!body.classList.contains('page-home') && !body.classList.contains('page-collection')) {
      return;
    }

    (root || document).querySelectorAll('.home-scarf-scroll-inner').forEach(bindDragScroll);
  }

  function bindHorizontalWheelScroll(container) {
    if (!container || container._guiltyHorizontalWheel) return;
    container._guiltyHorizontalWheel = true;

    container.addEventListener('wheel', function (event) {
      scrollHorizontally(container, event);
    }, { passive: false });
  }

  function bindAllHorizontalWheelScroll(root) {
    var body = document.body;
    if (!body.classList.contains('page-home') && !body.classList.contains('page-collection')) {
      return;
    }

    bindAllDragScroll(root);

    if (body.classList.contains('page-collection')) {
      bindCollectionPageWheel();
      return;
    }

    (root || document).querySelectorAll('.home-scarf-scroll').forEach(bindScarfSectionWheel);
  }

  global.GuiltyWheelInput = {
    normalizeWheelDelta: normalizeWheelDelta,
    scrollHorizontally: scrollHorizontally,
    bindHorizontalWheelScroll: bindHorizontalWheelScroll,
    bindDragScroll: bindDragScroll,
    bindAllDragScroll: bindAllDragScroll,
    bindScarfSectionWheel: bindScarfSectionWheel,
    bindCollectionPageWheel: bindCollectionPageWheel,
    bindAllHorizontalWheelScroll: bindAllHorizontalWheelScroll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
