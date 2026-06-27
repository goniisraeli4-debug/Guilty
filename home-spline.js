/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; Spline stays in the top hero block
 * and does not follow into the collection or scarf detail views.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!viewer) return;

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function updateOverlay() {
    const end = Math.max(520, window.innerHeight * 0.72);
    const raw = Math.min(1, Math.max(0, window.scrollY / end));

    const fadeStart = 0.42;
    const fadeRaw = raw <= fadeStart ? 0 : (raw - fadeStart) / (1 - fadeStart);
    const fadeT = smoothstep(fadeRaw);

    document.documentElement.style.setProperty('--overlay-opacity', 1 - fadeT);
  }

  window.addEventListener('scroll', updateOverlay, { passive: true });
  window.addEventListener('resize', updateOverlay, { passive: true });
  updateOverlay();
})();
