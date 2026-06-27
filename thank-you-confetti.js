(function () {
  'use strict';

  // Deconstructed scarf vector pieces. Browsers can't list a directory, so the
  // manifest is declared here; add/remove filenames to match the asset folder.
  const ASSET_DIR = 'thank you svg';
  const ASSET_FILES = [
    'Group 14.svg',
    'Group 4627.svg',
    'Group 4628.svg',
    'Group 4639.svg',
    'Group 4640.svg',
    'Group 4641.svg',
    'Group 4642.svg',
    'Group 4643 copy 2.svg',
    'Group 4643 copy 3.svg',
    'Group 4643 copy.svg',
    'Group 4643.svg',
    'Group 4646.svg',
    'Group 4649.svg',
    'Group 4650.svg',
    'Group 4651.svg',
    'Group 4652.svg',
    'Group 4653.svg',
    'Group 4654.svg',
    'Group 4656.svg',
    'Group 4659.svg',
    'Group 4660.svg',
    'Group 4662.svg',
    'Group 4663 copy 2.svg',
    'Group 4663 copy 3.svg',
    'Group 4663 copy.svg',
    'Group 4663.svg',
    'Group 4664.svg',
    'Group 4665.svg',
    'Group 4667.svg',
    'Group 4670.svg',
    'Group 4672.svg',
    'Group 4674.svg',
    'Group 4675.svg',
    'Vector (7).svg',
  ];

  // Shapes that should appear roughly twice as often in the mix.
  const FAVORED_FILES = [
    'Group 4627.svg',
    'Group 4643.svg',
    'Group 4662.svg',
    'Group 4663.svg',
  ];
  const FAVORED_WEIGHT = 2;

  // ---- Tuning (3D "towards camera" emitter) ----------------------------------
  const MAX_PARTICLES = 136;      // concurrent shapes in flight
  const SPAWN_INTERVAL = 75;      // ms between spawns while filling up
  const DISPLAY_MIN = 30;         // base rendered shape height (px), pre-perspective
  const DISPLAY_MAX = 35;         // base rendered shape height (px), pre-perspective

  const Z_START_MIN = -3000;      // deep background spawn depth (px)
  const Z_START_MAX = -1800;
  const Z_END = 820;              // depth at which approach arc completes (px)
  const PERSPECTIVE = 1000;       // matches .confetti-layer perspective (px)
  const VIEWPORT_EDGE_PAD = 24;   // px past viewport before recycle
  const Z_SPEED_MIN = 420;        // forward travel speed range (px/s)
  const Z_SPEED_MAX = 900;

  const SPREAD_MIN = 180;         // radial drift outward over full travel (px)
  const SPREAD_MAX = 620;

  // Progress-synced Y-axis parabolic arc (the "gentle toss"), in vh.
  // Upward apex reached in the far half; downward finish as it nears the camera.
  const ARC_APEX_VH_MIN = 10;     // upward lift magnitude (vh)
  const ARC_APEX_VH_MAX = 20;
  const ARC_FINISH_VH_MIN = 20;   // downward finish offset (vh)
  const ARC_FINISH_VH_MAX = 40;

  const SPIN_MIN = 8;             // angular speed range (deg/s), sign randomized
  const SPIN_MAX = 40;
  const OPACITY_MAX = 0.95;       // peak opacity in mid-ground

  // Depth-normalized fade band edges (0 = far spawn, 1 = foreground threshold).
  const FADE_IN_END = 0.18;       // fully faded in by here
  const LAYER_CROSS_Z = 0;        // past this depth, particle renders in front of text
  const REVEAL_DELAY_MS = 500;    // wait before confetti begins (matches CSS reveal delay)

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildUrl(file) {
    return encodeURI(ASSET_DIR + '/' + file);
  }

  // Preload every SVG once so spawning is instant and there are no repeat fetches.
  function preload() {
    return Promise.all(
      ASSET_FILES.map(function (file) {
        return new Promise(function (resolve) {
          const img = new Image();
          img.decoding = 'async';
          img.onload = function () {
            const ratio = (img.naturalWidth && img.naturalHeight)
              ? img.naturalWidth / img.naturalHeight
              : 1;
            const weight = FAVORED_FILES.indexOf(file) !== -1 ? FAVORED_WEIGHT : 1;
            resolve({ src: img.src, ratio: ratio, weight: weight });
          };
          img.onerror = function () { resolve(null); };
          img.src = buildUrl(file);
        });
      })
    ).then(function (results) {
      return results.filter(Boolean);
    });
  }

  function init(backLayer, frontLayer, assets) {
    if (!assets.length || !backLayer || !frontLayer) return;

    // Weighted pool: favored shapes are repeated so they're drawn more often.
    const pickPool = [];
    for (let a = 0; a < assets.length; a++) {
      const weight = assets[a].weight || 1;
      for (let w = 0; w < weight; w++) pickPool.push(assets[a]);
    }

    const particles = [];   // active
    const pool = [];        // recycled DOM nodes

    function acquireNode() {
      return pool.pop() || (function () {
        const img = document.createElement('img');
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.draggable = false;
        return img;
      })();
    }

    // Renders a particle's current state. All motion rides on top of the
    // translate(-50%,-50%) anchor, so the origin is always screen-dead-center.
    function render(p) {
      p.node.style.transform =
        'translate(-50%, -50%) translate3d(' +
        p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,' + p.z.toFixed(2) + 'px) rotate(' +
        p.angle.toFixed(2) + 'deg)';
      p.node.style.opacity = p.opacity.toFixed(3);
    }

    function spawn() {
      const asset = pickPool[(Math.random() * pickPool.length) | 0];
      const node = acquireNode();
      const height = rand(DISPLAY_MIN, DISPLAY_MAX);
      const width = height * asset.ratio;

      if (node.dataset.src !== asset.src) {
        node.src = asset.src;
        node.dataset.src = asset.src;
      }
      node.style.width = width.toFixed(1) + 'px';
      node.style.height = height.toFixed(1) + 'px';

      // Random radial direction so they spread out instead of stacking on center.
      const dir = rand(0, Math.PI * 2);
      const spread = rand(SPREAD_MIN, SPREAD_MAX);

      // Parabolic arc coefficients: arcY(prog) = c1*prog + c2*prog^2.
      // Solved so the vertex (upward apex) sits in the far half and the curve
      // finishes at +finish (downward) as the shape reaches the camera.
      const vh = window.innerHeight / 100;
      const apex = rand(ARC_APEX_VH_MIN, ARC_APEX_VH_MAX) * vh;     // upward (px)
      const finish = rand(ARC_FINISH_VH_MIN, ARC_FINISH_VH_MAX) * vh; // downward (px)
      const s = Math.sqrt(apex * (finish + apex));
      const arcC2 = finish + 2 * apex + 2 * s;
      const arcC1 = -2 * apex - 2 * s; // negative => upward start

      const p = {
        node: node,
        zStart: rand(Z_START_MIN, Z_START_MAX),
        z: 0,
        x: 0,
        y: 0,
        dirX: Math.cos(dir),
        dirY: Math.sin(dir),
        spread: spread,
        vz: rand(Z_SPEED_MIN, Z_SPEED_MAX),
        arcC1: arcC1,
        arcC2: arcC2,
        angle: rand(0, 360),
        spin: rand(SPIN_MIN, SPIN_MAX) * (Math.random() < 0.5 ? -1 : 1),
        opacity: 0,
        inFront: false,
        baseW: width,
        baseH: height,
      };
      p.z = p.zStart;

      // Seed transform before attaching so it never flashes at the center.
      render(p);
      if (!node.isConnected) backLayer.appendChild(node);
      particles.push(p);
    }

    function promoteToFront(p) {
      if (p.inFront) return;
      p.inFront = true;
      frontLayer.appendChild(p.node);
    }

    function recycle(p, i) {
      particles.splice(i, 1);
      p.node.style.opacity = '0';
      pool.push(p.node);
    }

    function isPastViewportEdge(p) {
      const depth = PERSPECTIVE - p.z;
      if (depth <= 1) return true;

      const scale = PERSPECTIVE / depth;
      const sx = p.x * scale;
      const sy = p.y * scale;
      const radius = Math.hypot(p.baseW * scale * 0.5, p.baseH * scale * 0.5);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = VIEWPORT_EDGE_PAD;
      const cx = vw * 0.5 + sx;
      const cy = vh * 0.5 + sy;
      const left = cx - radius;
      const right = cx + radius;
      const top = cy - radius;
      const bottom = cy + radius;

      if (right < -pad || left > vw + pad || bottom < -pad || top > vh + pad) {
        return true;
      }

      // Center path: fully expanded past every viewport edge (clip-only rim left).
      if (left <= -pad && right >= vw + pad && top <= -pad && bottom >= vh + pad) {
        return true;
      }

      return false;
    }

    let lastTime = performance.now();
    let spawnTimer = 0;
    let running = true;

    function frame(now) {
      if (!running) return;
      let dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab-switch / jank

      // Maintain a steady stream of forward-flying shapes up to the cap.
      spawnTimer += dt * 1000;
      while (spawnTimer >= SPAWN_INTERVAL && particles.length < MAX_PARTICLES) {
        spawnTimer -= SPAWN_INTERVAL;
        spawn();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.z += p.vz * dt;
        p.angle += p.spin * dt;

        // Depth progress along the original arc — uncapped so the path never bends.
        const prog = (p.z - p.zStart) / (Z_END - p.zStart);

        // Radial spread eases outward as the shape approaches the camera.
        p.x = p.dirX * p.spread * prog;

        // Y: radial spread + progress-synced parabolic arc (lift, hang, drift down).
        const arcY = p.arcC1 * prog + p.arcC2 * prog * prog;
        p.y = p.dirY * p.spread * prog + arcY;

        // Depth-driven fade: in while far, then hold full opacity.
        let o;
        if (prog < FADE_IN_END) {
          o = Math.max(0, prog / FADE_IN_END) * OPACITY_MAX;
        } else {
          o = OPACITY_MAX;
        }
        p.opacity = o < 0 ? 0 : o;

        if (p.z >= LAYER_CROSS_Z) promoteToFront(p);

        render(p);

        if (isPastViewportEdge(p)) {
          recycle(p, i);
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    let rafId = requestAnimationFrame(frame);

    // Pause off-screen to spare the CPU; resume cleanly without a time jump.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    });
  }

  function start() {
    const backLayer = document.querySelector('.confetti-layer--back');
    const frontLayer = document.querySelector('.confetti-layer--front');
    if (!backLayer || !frontLayer || reduceMotion) return;

    const revealAt = Date.now() + REVEAL_DELAY_MS;
    preload().then(function (assets) {
      const wait = Math.max(0, revealAt - Date.now());
      setTimeout(function () {
        init(backLayer, frontLayer, assets);
      }, wait);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
