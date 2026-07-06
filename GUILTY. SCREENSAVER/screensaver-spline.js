/**
 * Screensaver Spline — scales on ultra-wide screens so the scene
 * fills the viewport without changing laptop layout.
 */
(function () {
  const stage = document.querySelector('.screensaver-spline-stage');
  const canvas = document.querySelector('.screensaver-spline-canvas');
  const viewer = document.querySelector('.screensaver-spline-stage spline-viewer');
  if (!stage || !canvas || !viewer) return;

  const REF_WIDTH = 1440;

  function updateSplineLayout() {
    const vw = window.innerWidth - 100;
    const vh = window.innerHeight - 50;

    if (vw <= REF_WIDTH) {
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.style.inset = '';
      canvas.style.left = '';
      canvas.style.top = '';
      canvas.style.transform = '';
      canvas.style.transformOrigin = '';
      stage.style.transform = 'translateY(-20px)';
      return;
    }

    const scale = vw / REF_WIDTH;
    const nudgeX = 42;
    const nudgeY = -34;

    canvas.style.inset = 'auto';
    canvas.style.width = REF_WIDTH + 'px';
    canvas.style.height = vh + 'px';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform =
      'translate(calc(-50% - ' + nudgeX + 'px), calc(-50% - ' + nudgeY + 'px)) scale(' + scale + ')';
    canvas.style.transformOrigin = 'center center';
    stage.style.transform = '';
  }

  window.addEventListener('resize', updateSplineLayout, { passive: true });
  viewer.addEventListener('load', updateSplineLayout);
  updateSplineLayout();
})();
