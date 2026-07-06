/**
 * Shared scarf detail overlay UI (home collection + product pages).
 */
(function (global) {
  const catalog = global.GuiltyScarfProducts;
  if (!catalog) return;

  const LAYER_CLASS = {
    back: 'parallax-layer parallax-layer--pink',
    gradient: 'parallax-layer parallax-layer--inner parallax-layer--gradient',
    reveal: 'parallax-layer parallax-layer--inner parallax-layer--detail parallax-layer--reveal',
    front: 'parallax-layer parallax-layer--inner parallax-layer--detail',
  };

  function assetPath(base, src) {
    if (!base) return src;
    return `${base.replace(/\/$/, '')}/${src}`;
  }

  function layerDataAttrs(layer) {
    const parts = [`data-base-z="${layer.baseZ}"`];
    if (layer.revealAt != null) parts.push(`data-reveal-at="${layer.revealAt}"`);
    if (layer.revealSpan != null) parts.push(`data-reveal-span="${layer.revealSpan}"`);
    if (layer.fadeOutAt != null) parts.push(`data-fade-out-at="${layer.fadeOutAt}"`);
    if (layer.fadeOutSpan != null) parts.push(`data-fade-out-span="${layer.fadeOutSpan}"`);
    if (layer.zCurve != null) parts.push(`data-z-curve="${layer.zCurve}"`);
    return parts.join(' ');
  }

  function buildParallaxHTML(slug, name, base) {
    const config = catalog.getConfig(slug);
    if (!config) return '';

    const restSrcset = config.restSrcset
      ? ` srcset="${config.restSrcset.split(',').map((part) => {
        const trimmed = part.trim();
        const bits = trimmed.split(/\s+/);
        bits[0] = assetPath(base, bits[0]);
        return bits.join(' ');
      }).join(', ')}" sizes="(max-width: 900px) 88vw, 46vw"`
      : '';

    const layers = config.layers.map((layer) => `
      <div class="${LAYER_CLASS[layer.role]}" ${layerDataAttrs(layer)}>
        <img src="${assetPath(base, layer.src)}" width="1024" height="1024" alt="" decoding="sync">
      </div>`).join('');

    return `
      <section class="parallax-flythrough scarf-detail-parallax" aria-label="${name} scarf fly-through">
        <div class="product-image-3d parallax-frame">
          <div class="parallax-scene">
            <figure class="parallax-rest">
              <img src="${assetPath(base, config.rest)}"${restSrcset} width="1024" height="1024" alt="${name} scarf" decoding="sync">
            </figure>
            <div class="parallax-world">${layers}</div>
          </div>
        </div>
        <p class="parallax-scroll-hint">Scroll</p>
      </section>`;
  }

  function createDetail() {
    const detail = document.createElement('div');
    detail.className = 'scarf-detail';
    detail.hidden = true;
    detail.innerHTML = `
      <div class="scarf-detail-bg" aria-hidden="true"></div>
      <button class="scarf-detail-close" type="button" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <div class="scarf-detail-inner">
        <div class="scarf-detail-visual"></div>
        <div class="scarf-detail-info">
          <p class="label scarf-detail-label"></p>
          <h1 class="scarf-detail-name"></h1>
          <dl class="product-specs">
            <div><dt>Material</dt><dd>100% Polyester</dd></div>
            <div><dt>Size</dt><dd>70 &times; 70 cm</dd></div>
            <div><dt>Edition</dt><dd>1 of <span class="edition-eight">8</span></dd></div>
            <div><dt>Price</dt><dd>369.99$</dd></div>
          </dl>
          <p class="product-copy">Part of the latest GUILTY collection.<br>Minimum effort. Maximum damage.<br>One drop. No restocks.</p>
          <div class="product-actions">
            <div class="product-actions-row">
              <button type="button" class="link-arrow add-to-bag scarf-detail-bag">Add to bag <span aria-hidden="true">&rarr;</span></button>
            </div>
          </div>
        </div>
      </div>`;
    return detail;
  }

  function getParts(detail) {
    return {
      visual: detail.querySelector('.scarf-detail-visual'),
      detailLabel: detail.querySelector('.scarf-detail-label'),
      detailName: detail.querySelector('.scarf-detail-name'),
      detailCopy: detail.querySelector('.product-copy'),
      detailCart: detail.querySelector('.scarf-detail-bag'),
      closeBtn: detail.querySelector('.scarf-detail-close'),
      detailBg: detail.querySelector('.scarf-detail-bg'),
    };
  }

  function showBg(parts) {
    parts.detailBg.style.transition = 'none';
    parts.detailBg.style.opacity = '1';
  }

  function fadeBg(parts) {
    void parts.detailBg.offsetWidth;
    parts.detailBg.style.transition = 'opacity 400ms cubic-bezier(0.22, 0.84, 0.35, 1)';
    parts.detailBg.style.opacity = '0';
  }

  function fillInfo(detail, slug, overrides) {
    const parts = getParts(detail);
    const meta = catalog.getMeta(slug);
    const name = overrides?.name || meta?.name || '';
    parts.detailLabel.textContent = 'Limited Edition';
    parts.detailName.textContent = name;
    if (parts.detailCopy) {
      parts.detailCopy.innerHTML = catalog.getCopy(slug);
    }
    return name;
  }

  function refreshDetailBagButton(detail, slug) {
    const parts = getParts(detail);
    const cartApi = global.GuiltyCart;
    if (!parts.detailCart) return;
    if (cartApi && !parts.detailCart.querySelector('.cart-bag-icon')) {
      parts.detailCart.innerHTML = `${cartApi.bagIcon()}<span>Add to bag</span><span aria-hidden="true">&rarr;</span>`;
    }
    const inCart = slug && cartApi?.getItems().some((item) => item.slug === slug);
    parts.detailCart.classList.toggle('is-in-cart', !!inCart);
  }

  function wireCartButton(detail, getSlug) {
    const parts = getParts(detail);
    if (!parts.detailCart) return;

    parts.detailCart.addEventListener('click', () => {
      const slug = getSlug();
      const cartApi = global.GuiltyCart;
      if (!slug || !cartApi) return;

      const inCart = cartApi.getItems().some((item) => item.slug === slug);
      if (inCart) {
        cartApi.removeItem(slug);
      } else {
        cartApi.addItem(slug, 1);
        if (global.GuiltyCartWidget) {
          global.GuiltyCartWidget.setOpen(true);
        }
      }

      refreshDetailBagButton(detail, slug);
      if (global.GuiltyCartWidget) {
        global.GuiltyCartWidget.render();
      }
    });

    window.addEventListener('guilty-cart-updated', () => {
      refreshDetailBagButton(detail, getSlug());
    });
  }

  async function mountParallax(detail, slug, name, base, options = {}) {
    const parts = getParts(detail);
    if (detail._parallaxCtrl) {
      detail._parallaxCtrl.destroy();
      detail._parallaxCtrl = null;
    }

    parts.visual.innerHTML = buildParallaxHTML(slug, name, base);
    detail.dataset.product = slug;

    const section = parts.visual.querySelector('.parallax-flythrough');
    if (section && global.GuiltyParallaxInlineSvg) {
      await global.GuiltyParallaxInlineSvg.inlineParallaxSvgs(section, slug);
    }
    if (section && global.HomeDetailParallax && options.interactive !== false) {
      detail._parallaxCtrl = global.HomeDetailParallax.attach(section);
    }
  }

  function destroyParallax(detail) {
    if (detail._parallaxCtrl) {
      detail._parallaxCtrl.destroy();
      detail._parallaxCtrl = null;
    }
    const parts = getParts(detail);
    if (parts.visual) parts.visual.innerHTML = '';
    delete detail.dataset.product;
  }

  function resetDetailChrome(detail) {
    const info = detail.querySelector('.scarf-detail-info');
    const closeBtn = detail.querySelector('.scarf-detail-close');
    if (info) {
      info.style.transition = '';
      info.style.opacity = '';
      info.style.visibility = '';
      info.style.transform = '';
      info.style.pointerEvents = '';
    }
    if (closeBtn) {
      closeBtn.style.transition = '';
      closeBtn.style.opacity = '';
      closeBtn.style.visibility = '';
      closeBtn.style.pointerEvents = '';
    }
  }

  async function openStandalone(detail, slug, options) {
    const base = options?.base || '';
    const meta = catalog.getMeta(slug);
    if (!meta) return null;

    const parts = getParts(detail);
    const name = fillInfo(detail, slug, { base });
    await mountParallax(detail, slug, name, base, { interactive: options.interactive });
    refreshDetailBagButton(detail, slug);

    document.documentElement.classList.add('scarf-lock');
    resetDetailChrome(detail);
    showBg(parts);
    parts.visual.style.transition = '';
    parts.visual.style.transform = 'none';
    parts.visual.style.opacity = '1';
    detail.hidden = false;
    detail.classList.add('is-open');
    triggerEditionEightAnimation(detail);

    return parts;
  }

  function enhanceEditionEight(root) {
    (root || document).querySelectorAll('.product-specs dd').forEach((dd) => {
      if (dd.querySelector('.edition-eight')) return;
      if (dd.textContent.trim() === '1 of 8') {
        dd.innerHTML = '1 of <span class="edition-eight">8</span>';
      }
    });
  }

  function triggerEditionEightAnimation(root) {
    enhanceEditionEight(root);
    (root || document).querySelectorAll('.edition-eight').forEach((el) => {
      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enhanceEditionEight(document));
  } else {
    enhanceEditionEight(document);
  }

  global.GuiltyScarfDetailUI = {
    assetPath,
    buildParallaxHTML,
    createDetail,
    getParts,
    showBg,
    fadeBg,
    fillInfo,
    refreshDetailBagButton,
    wireCartButton,
    mountParallax,
    destroyParallax,
    resetDetailChrome,
    openStandalone,
    enhanceEditionEight,
    triggerEditionEightAnimation,
  };
})(typeof window !== 'undefined' ? window : globalThis);
