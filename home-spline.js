/**
 * Home Spline — hero section only.
 * Fades the hero overlay on scroll; centers and scales the scene per viewport.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const canvas = document.querySelector('.hero-spline-canvas');
  const stage = document.querySelector('.hero-spline-stage');
  const viewer = document.querySelector('.hero-spline spline-viewer');
  if (!canvas || !stage || !viewer) return;

  const LAPTOP_REF_WIDTH = 1440;
  const IMAC_REF_WIDTH = 2048;
  const IMAC_REF_HEIGHT = 1152;
  const IMAC_MQ = window.matchMedia('(min-width: 2048px) and (min-height: 1080px)');

  /** Global horizontal nudge for the Spline scene (positive = right) */
  const SCENE_OFFSET_X = -20;
  /** Global vertical nudge for the Spline scene (positive = down) */
  const SCENE_OFFSET_Y = -20;
  /** Horizontal nudge for the 2048×1152 iMac layout (positive = right) */
  const IMAC_OFFSET_X = 400;
  /** Vertical nudge for the 2048×1152 iMac layout (positive = down) */
  const IMAC_OFFSET_Y = 140;
  /** Scene size multiplier for the 2048×1152 iMac layout */
  const IMAC_SCALE_BOOST = 1.5;

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

  function resetCanvas() {
    canvas.style.inset = '';
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.left = '';
    canvas.style.right = '';
    canvas.style.top = '';
    canvas.style.bottom = '';
    canvas.style.margin = '';
    canvas.style.transform = '';
    canvas.style.transformOrigin = '';
    stage.style.transform = '';
  }

  function centerCanvas(width, height, scale, offsetX, offsetY) {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    canvas.style.inset = 'auto';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.top = '0';
    canvas.style.bottom = '0';
    canvas.style.margin = 'auto';
    canvas.style.transformOrigin = 'center center';
    canvas.style.transform =
      'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
  }

  function updateSplineLayout() {
    const vw = window.innerWidth;
    resetCanvas();

    if (IMAC_MQ.matches) {
      const scale = (vw / IMAC_REF_WIDTH) * IMAC_SCALE_BOOST;
      centerCanvas(
        IMAC_REF_WIDTH,
        IMAC_REF_HEIGHT,
        scale,
        IMAC_OFFSET_X + SCENE_OFFSET_X,
        IMAC_OFFSET_Y + SCENE_OFFSET_Y
      );
      return;
    }

    if (vw <= LAPTOP_REF_WIDTH) {
      canvas.style.inset = '0';
      canvas.style.transform =
        'translate(' + SCENE_OFFSET_X + 'px, ' + SCENE_OFFSET_Y + 'px)';
      return;
    }

    const scale = vw / LAPTOP_REF_WIDTH;
    centerCanvas(LAPTOP_REF_WIDTH, window.innerHeight, scale, SCENE_OFFSET_X, SCENE_OFFSET_Y);
  }

  window.addEventListener('scroll', updateOverlay, { passive: true });
  window.addEventListener('resize', function () {
    updateOverlay();
    updateSplineLayout();
  }, { passive: true });

  if (IMAC_MQ.addEventListener) {
    IMAC_MQ.addEventListener('change', updateSplineLayout);
  } else if (IMAC_MQ.addListener) {
    IMAC_MQ.addListener(updateSplineLayout);
  }

  viewer.addEventListener('load', updateSplineLayout);
  updateOverlay();
  updateSplineLayout();
})();
