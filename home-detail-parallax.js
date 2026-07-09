/**
 * Parallax fly-through for the home scarf detail overlay.
 * Same wheel / hover-reset behaviour as product pages.
 */
(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(t) {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function wheelDeltaY(event) {
    const normalize = window.GuiltyWheelInput?.normalizeWheelDelta;
    return normalize ? normalize(event).y : event.deltaY;
  }

  function attach(section) {
    if (!section) return null;

    const wheelRoot = section.closest('.scarf-detail') || section;
    const frame = section.querySelector('.parallax-frame');
    const world = section.querySelector('.parallax-world');
    const layers = [...section.querySelectorAll('.parallax-layer')];
    const maxOffset = 2500;
    const wheelSmoothFactor = 0.18;
    const resetDuration = 1400;
    const minZProgress = 0.004;
    const minShowProgress = 0.03;

    let targetOffset = 0;
    let displayOffset = 0;
    let animating = false;
    let pointerInside = false;
    let resetting = false;
    let resetStart = 0;
    let resetFrom = 0;

    function hasReveal(layer) {
      return layer.dataset.revealAt !== undefined;
    }

    function hasFadeOut(layer) {
      return layer.dataset.fadeOutAt !== undefined;
    }

    function layerProgress(layer, progress) {
      const zCurve = Number(layer.dataset.zCurve);
      if (zCurve > 1) return Math.pow(progress, zCurve);
      return progress;
    }

    function layerOpacity(layer, progress) {
      let opacity = hasReveal(layer) ? 0 : 1;

      if (hasReveal(layer)) {
        const revealAt = Number(layer.dataset.revealAt);
        const revealSpan = Number(layer.dataset.revealSpan) || 0.28;
        opacity = smoothstep(clamp((progress - revealAt) / revealSpan, 0, 1));
      }

      if (hasFadeOut(layer)) {
        const fadeOutAt = Number(layer.dataset.fadeOutAt);
        const fadeOutSpan = Number(layer.dataset.fadeOutSpan) || 0.32;
        const fadeT = clamp((progress - fadeOutAt) / fadeOutSpan, 0, 1);
        return opacity * (1 - smoothstep(fadeT));
      }

      if (hasReveal(layer)) return opacity;
      return null;
    }

    function updateLayers() {
      const progress = displayOffset / maxOffset;
      const showParallax = displayOffset > 0.5 && progress >= minShowProgress;

      section.classList.toggle('is-scrolling', showParallax);
      if (world) world.setAttribute('aria-hidden', showParallax ? 'false' : 'true');

      if (!showParallax) {
        layers.forEach((layer) => {
          layer.style.transform = 'translate3d(0, 0, 0)';
          if (displayOffset <= 0) {
            layer.style.opacity = hasReveal(layer) || hasFadeOut(layer) ? '0' : '';
          } else if (hasFadeOut(layer)) {
            layer.style.opacity = '1';
          } else if (hasReveal(layer)) {
            layer.style.opacity = Number(layer.dataset.revealAt) <= 0 ? '' : '0';
          } else {
            layer.style.opacity = '';
          }
        });
        return;
      }

      const zProgress = Math.max(progress, minZProgress);

      layers.forEach((layer) => {
        const baseZ = Number(layer.dataset.baseZ);
        const travel = Math.round(layerProgress(layer, zProgress) * (baseZ + maxOffset));
        layer.style.transform = `translate3d(0, 0, ${travel}px)`;

        const opacity = layerOpacity(layer, progress);
        layer.style.opacity = opacity === null ? '' : (opacity >= 0.999 ? '1' : String(opacity));
      });
    }

    function tick() {
      if (resetting) {
        const t = clamp((performance.now() - resetStart) / resetDuration, 0, 1);
        displayOffset = resetFrom * (1 - easeOutCubic(t));

        if (t >= 1) {
          displayOffset = 0;
          targetOffset = 0;
          resetting = false;
          animating = false;
        }
      } else {
        displayOffset += (targetOffset - displayOffset) * wheelSmoothFactor;

        if (targetOffset <= 0 && displayOffset < 1) displayOffset = 0;

        if (Math.abs(targetOffset - displayOffset) < 0.5) {
          displayOffset = targetOffset;
          animating = false;
        }
      }

      updateLayers();

      if (animating) requestAnimationFrame(tick);
    }

    function isAtRest() {
      return targetOffset <= 0 && displayOffset < 1;
    }

    function setOffset(next, { smooth = false } = {}) {
      resetting = false;
      targetOffset = clamp(next, 0, maxOffset);

      if (!smooth) {
        displayOffset = targetOffset;
        updateLayers();
        return;
      }

      if (!animating) {
        animating = true;
        requestAnimationFrame(tick);
      }
    }

    function startReset() {
      if (isAtRest()) return;
      resetting = true;
      resetStart = performance.now();
      resetFrom = displayOffset;
      targetOffset = 0;
      if (!animating) {
        animating = true;
        requestAnimationFrame(tick);
      }
    }

    function onEnter() {
      pointerInside = true;
    }

    function onLeave() {
      pointerInside = false;
      startReset();
    }

    function onWheel(event) {
      event.preventDefault();
      const delta = wheelDeltaY(event) * 0.85;
      if (delta < 0 && isAtRest()) return;
      setOffset(targetOffset + delta, { smooth: true });
    }

    wheelRoot.addEventListener('mouseenter', onEnter);
    wheelRoot.addEventListener('mouseleave', onLeave);
    wheelRoot.addEventListener('wheel', onWheel, { passive: false });

    updateLayers();

    return {
      reset() {
        targetOffset = 0;
        displayOffset = 0;
        resetting = false;
        animating = false;
        updateLayers();
      },
      destroy() {
        wheelRoot.removeEventListener('mouseenter', onEnter);
        wheelRoot.removeEventListener('mouseleave', onLeave);
        wheelRoot.removeEventListener('wheel', onWheel);
        section.classList.remove('is-scrolling');
        layers.forEach((layer) => {
          layer.style.transform = '';
          layer.style.opacity = '';
        });
      },
    };
  }

  window.HomeDetailParallax = { attach };
})();
