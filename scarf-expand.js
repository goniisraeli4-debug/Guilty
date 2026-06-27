/**
 * Scarf expand (home page)
 *
 * Click a scarf -> morph to detail with parallax layers, product info on the right.
 */
(function () {
  if (!document.body.classList.contains('page-home')) return;

  const ui = window.GuiltyScarfDetailUI;
  const catalog = window.GuiltyScarfProducts;
  if (!ui || !catalog) return;

  const MORPH_MS = 600;
  const CLOSE_MS = 680;
  const HANDOFF_MS = 80;
  const SWITCH_MS = 520;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const CLOSE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const row = document.querySelector('.home-scarf-scroll-inner');
  if (!row) return;

  document.querySelectorAll('.home-scarf-item .home-scarf-image').forEach((wrap) => {
    const cloth = wrap.querySelector('.home-scarf-cloth');
    if (!cloth) return;
    const img = cloth.querySelector('img');
    if (img) wrap.replaceChildren(img);
  });

  let activeItem = null;
  let activeSlug = null;
  let closeTimer = null;
  let handoffTimer = null;
  let switching = false;
  let hiddenRowItem = null;

  const detail = ui.createDetail({ base: '' });
  document.body.appendChild(detail);
  const parts = ui.getParts(detail);
  ui.wireCartButton(detail, () => activeSlug);

  function hideRowItem(item) {
    if (hiddenRowItem && hiddenRowItem !== item) hiddenRowItem.style.visibility = '';
    hiddenRowItem = item || null;
    if (hiddenRowItem) hiddenRowItem.style.visibility = 'hidden';
  }

  function restoreRowItem() {
    if (hiddenRowItem) hiddenRowItem.style.visibility = '';
    hiddenRowItem = null;
  }

  function clearCloseTimers() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (handoffTimer) {
      clearTimeout(handoffTimer);
      handoffTimer = null;
    }
  }

  function beginCloseHandoff() {
    if (!activeItem) return;
    restoreRowItem();
    requestAnimationFrame(() => {
      parts.visual.style.transition = `opacity ${HANDOFF_MS}ms ease-out`;
      parts.visual.style.opacity = '0';
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function slugFromItem(item) {
    const href = item.getAttribute('href') || '';
    const match = href.match(/products\/([^/]+)\.html/);
    return match ? match[1] : null;
  }

  function restImage() {
    return parts.visual.querySelector('.parallax-rest img');
  }

  function restClothEl() {
    return parts.visual.querySelector('.parallax-rest > img, .parallax-rest > svg');
  }

  function syncRestClothMotion(item) {
    const cloth = restClothEl();
    const rowImg = item?.querySelector('.home-scarf-image img');
    if (!cloth || !rowImg) return;

    const cs = getComputedStyle(rowImg);
    cloth.style.transformOrigin = cs.transformOrigin;
    cloth.style.animationName = cs.animationName;
    cloth.style.animationDuration = cs.animationDuration;
    cloth.style.animationTimingFunction = cs.animationTimingFunction;
    cloth.style.animationDelay = cs.animationDelay;
    cloth.style.animationIterationCount = cs.animationIterationCount;
    cloth.style.filter = cs.filter;
    cloth.style.willChange = 'transform, filter';
    cloth.style.backfaceVisibility = 'hidden';
  }

  function clearRestClothMotion() {
    const cloth = restClothEl();
    if (!cloth) return;
    cloth.style.transformOrigin = '';
    cloth.style.animationName = '';
    cloth.style.animationDuration = '';
    cloth.style.animationTimingFunction = '';
    cloth.style.animationDelay = '';
    cloth.style.animationIterationCount = '';
    cloth.style.filter = '';
    cloth.style.willChange = '';
    cloth.style.backfaceVisibility = '';
  }

  function fillInfo(item) {
    const num = (item.querySelector('.scarf-num')?.textContent || '').trim();
    const name = (item.querySelector('h3')?.textContent || '').trim();
    const slug = slugFromItem(item);
    ui.fillInfo(detail, slug, { num, name });
    ui.refreshDetailBagButton(detail, slug);
    return name;
  }

  function isOpen() {
    return !!activeItem;
  }

  function rectOf(el) {
    return el.getBoundingClientRect();
  }

  function morphFrom(fromRect) {
    const img = restImage();
    if (!img) return;

    const target = rectOf(img);
    const dx = (fromRect.left + fromRect.width / 2) - (target.left + target.width / 2);
    const dy = (fromRect.top + fromRect.height / 2) - (target.top + target.height / 2);
    const scale = target.width ? fromRect.width / target.width : 1;

    parts.visual.style.transition = 'none';
    parts.visual.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    void parts.visual.offsetWidth;

    requestAnimationFrame(() => {
      parts.visual.style.transition = `transform ${MORPH_MS}ms ${EASE}`;
      parts.visual.style.transform = 'none';
    });
  }

  async function switchItem(item) {
    if (!item || item === activeItem || switching) return;
    const slug = slugFromItem(item);
    if (!slug || !catalog.getConfig(slug)) return;

    switching = true;
    detail.classList.add('is-switching-out');
    await wait(SWITCH_MS);

    const name = fillInfo(item);
    await ui.mountParallax(detail, slug, name, '');
    activeItem = item;
    activeSlug = slug;
    hideRowItem(item);

    detail.classList.remove('is-switching-out');
    detail.classList.add('is-switching-in');

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    detail.classList.remove('is-switching-in');
    await wait(SWITCH_MS);
    switching = false;
  }

  async function openItem(item) {
    if (!item || switching) return;
    if (item === activeItem) return;

    clearCloseTimers();

    const slug = slugFromItem(item);
    if (!slug || !catalog.getConfig(slug)) return;

    if (activeItem && detail.classList.contains('is-open')) {
      switchItem(item);
      return;
    }

    const rowImg = item.querySelector('img');
    if (!rowImg) return;

    const name = fillInfo(item);
    await ui.mountParallax(detail, slug, name, '');
    activeItem = item;
    activeSlug = slug;

    const fromRect = rectOf(rowImg);

    document.documentElement.classList.add('scarf-lock');
    document.body.classList.add('scarf-expanded');

    ui.resetDetailChrome(detail);
    ui.showBg(parts);
    parts.visual.style.transition = '';
    parts.visual.style.opacity = '1';
    detail.hidden = false;
    detail.classList.add('is-open');

    hideRowItem(item);
    morphFrom(fromRect);
  }

  function openBySlug(slug) {
    const item = row.querySelector(`.home-scarf-item[href$="products/${slug}.html"]`);
    if (item) openItem(item);
  }

  function hideDetailChrome() {
    const info = detail.querySelector('.scarf-detail-info');
    if (info) {
      info.style.transition = 'opacity 70ms ease-out, transform 70ms ease-out, visibility 0s linear 70ms';
      info.style.opacity = '0';
      info.style.visibility = 'hidden';
      info.style.transform = 'translateY(6px)';
      info.style.pointerEvents = 'none';
    }
    parts.closeBtn.style.transition = 'opacity 50ms ease-out, visibility 0s linear 50ms';
    parts.closeBtn.style.opacity = '0';
    parts.closeBtn.style.visibility = 'hidden';
    parts.closeBtn.style.pointerEvents = 'none';
  }

  function close() {
    if (!activeItem || switching) return;

    hideDetailChrome();
    ui.fadeBg(parts);
    syncRestClothMotion(activeItem);

    const rowImg = activeItem.querySelector('img');
    const toRect = rowImg ? rectOf(rowImg) : null;

    if (toRect) {
      const cur = rectOf(parts.visual);
      const dx = (toRect.left + toRect.width / 2) - (cur.left + cur.width / 2);
      const dy = (toRect.top + toRect.height / 2) - (cur.top + cur.height / 2);
      const scale = cur.width ? toRect.width / cur.width : 1;
      parts.visual.style.transition = `transform ${CLOSE_MS}ms ${CLOSE_EASE}`;
      parts.visual.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    }

    detail.classList.add('is-closing');
    detail.classList.remove('is-switching-out', 'is-switching-in');
    delete detail.dataset.product;
    document.body.classList.remove('scarf-expanded');

    handoffTimer = setTimeout(beginCloseHandoff, Math.max(0, CLOSE_MS - HANDOFF_MS));

    closeTimer = setTimeout(() => {
      detail.classList.remove('is-open', 'is-closing');
      detail.hidden = true;
      parts.visual.style.transition = 'none';
      parts.visual.style.transform = 'none';
      parts.visual.style.opacity = '';
      ui.destroyParallax(detail);
      clearRestClothMotion();
      ui.resetDetailChrome(detail);
      document.documentElement.classList.remove('scarf-lock');
      restoreRowItem();
      activeItem = null;
      activeSlug = null;
      handoffTimer = null;
      closeTimer = null;
    }, CLOSE_MS);
  }

  row.querySelectorAll('.home-scarf-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openItem(item);
    });
  });

  parts.closeBtn.addEventListener('click', close);

  detail.addEventListener('click', (e) => {
    if (!e.target.closest('.scarf-detail-info') && !e.target.closest('.scarf-detail-visual')) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  window.addEventListener('resize', () => {
    if (isOpen()) {
      parts.visual.style.transition = 'none';
      parts.visual.style.transform = 'none';
    }
  });

  window.GuiltyScarfDetail = { openBySlug, openItem, close, isOpen };
})();
