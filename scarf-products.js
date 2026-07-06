/**
 * Shared scarf product config for home overlay + product pages.
 */
(function (global) {
  const PRODUCTS = {
    burgundy: {
      rest: 'scarfs/burgundy.svg',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/burgundy-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/burgundy-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/burgundy-layers/layer-2.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/burgundy-layers/layer-4.svg' },
      ],
    },
    fuchsia: {
      rest: 'scarfs/fuchsia.svg',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/fuchsia-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/fuchsia-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/fuchsia-layers/layer-5.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/fuchsia-layers/layer-2.svg' },
      ],
    },
    pink: {
      rest: 'scarfs/pink.png',
      restSrcset: 'scarfs/pink.png 1024w, scarfs/2x/pink.png 2048w',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/pink-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1550, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/pink-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -900, revealAt: 0, revealSpan: 0.68, zCurve: 1.48, src: 'scarfs/pink-layers/layer-2.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/pink-layers/layer-4.svg' },
      ],
    },
    khaki: {
      rest: 'scarfs/khaki.png',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/khaki-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/khaki-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -1000, revealAt: 0.06, src: 'scarfs/khaki-layers/layer-2.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/khaki-layers/layer-4.svg' },
      ],
    },
    lime: {
      rest: 'scarfs/lime-layers/layer-2.svg',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/lime-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/lime-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/lime-layers/layer-5.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/lime-layers/layer-4.svg' },
      ],
    },
    orange: {
      rest: 'scarfs/orange.png',
      restSrcset: 'scarfs/orange.png 1024w, scarfs/2x/orange.png 2048w',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/orange-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/orange-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/orange-layers/layer-5.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/orange-layers/layer-4.svg' },
      ],
    },
    red: {
      rest: 'scarfs/red-layers/layer-2.svg',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/red-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/red-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/red-layers/layer-5.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/red-layers/layer-4.svg' },
      ],
    },
    'baby-pink': {
      rest: 'scarfs/baby-pink.png',
      restSrcset: 'scarfs/baby-pink.png 1024w, scarfs/2x/baby-pink.png 2048w',
      layers: [
        { role: 'back', baseZ: -2000, src: 'scarfs/baby-pink-layers/layer-1.svg' },
        { role: 'gradient', baseZ: -1000, fadeOutAt: 0.3, fadeOutSpan: 0.32, src: 'scarfs/baby-pink-layers/layer-3.svg' },
        { role: 'reveal', baseZ: -500, revealAt: 0.06, src: 'scarfs/baby-pink-layers/layer-5.svg' },
        { role: 'front', baseZ: 0, src: 'scarfs/baby-pink-layers/layer-4.svg' },
      ],
    },
  };

  const DEFAULT_COPY =
    'Part of the latest GUILTY collection.<br>Minimum effort. Maximum damage.<br>One drop. No restocks.';

  const META = {
    fuchsia: { num: '01', name: 'FCS.01' },
    orange: { num: '02', name: 'ORG.02' },
    red: { num: '03', name: 'CHR.03' },
    lime: { num: '04', name: 'LME.04' },
    'baby-pink': { num: '05', name: 'PCH.05' },
    burgundy: { num: '06', name: 'BGD.06' },
    pink: { num: '07', name: 'PNK.07' },
    khaki: { num: '08', name: 'KHK.08' },
  };

  global.GuiltyScarfProducts = {
    PRODUCTS,
    META,
    DEFAULT_COPY,
    getMeta(slug) {
      return META[slug] || null;
    },
    getConfig(slug) {
      return PRODUCTS[slug] || null;
    },
    getCopy(slug) {
      return META[slug]?.copy || DEFAULT_COPY;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
