/**
 * Header shopping bag icon + preview panel.
 */
(function () {
  if (window.GuiltyCartWidget) return;

  const cart = window.GuiltyCart;
  if (!cart) return;

  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  if (!header || !menuToggle) return;

  const base = document.body.classList.contains('product-page') ? '../' : '';
  const cartUrl = base + 'add-to-cart.html';
  const checkoutUrl = base + 'thank-you.html';

  const widget = document.createElement('div');
  widget.className = 'cart-widget';
  widget.innerHTML = `
    <button type="button" class="cart-widget-toggle" aria-expanded="false" aria-controls="cart-widget-panel" aria-label="Shopping bag">
      ${cart.bagIcon()}
      <span class="cart-widget-badge" hidden>0</span>
    </button>
    <div class="cart-widget-panel" id="cart-widget-panel" hidden>
      <div class="cart-widget-panel-head">
        <p class="label">Shopping bag</p>
        <p class="cart-widget-panel-count">0 items</p>
      </div>
      <div class="cart-widget-panel-body">
        <p class="cart-widget-empty">Your bag is empty.</p>
        <ul class="cart-widget-list" hidden></ul>
      </div>
      <div class="cart-widget-panel-foot" hidden>
        <div class="cart-widget-subtotal">
          <span>Subtotal</span>
          <span class="cart-widget-subtotal-value">0.00$</span>
        </div>
        <div class="cart-widget-actions">
          <a href="${cartUrl}" class="cart-widget-link">View bag</a>
          <a href="${checkoutUrl}" class="cart-widget-checkout">Checkout</a>
        </div>
      </div>
    </div>`;

  header.insertBefore(widget, menuToggle);

  const toggle = widget.querySelector('.cart-widget-toggle');
  const panel = widget.querySelector('.cart-widget-panel');
  const badge = widget.querySelector('.cart-widget-badge');
  const panelCount = widget.querySelector('.cart-widget-panel-count');
  const emptyEl = widget.querySelector('.cart-widget-empty');
  const listEl = widget.querySelector('.cart-widget-list');
  const footEl = widget.querySelector('.cart-widget-panel-foot');
  const subtotalEl = widget.querySelector('.cart-widget-subtotal-value');

  let open = false;

  function setOpen(next) {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    widget.classList.toggle('is-open', open);
  }

  function render() {
    const items = cart.getItems();
    const count = cart.getItemCount();

    badge.textContent = String(count);
    badge.hidden = count === 0;
    panelCount.textContent = cart.countLabel(count);

    if (items.length === 0) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      footEl.hidden = true;
      listEl.innerHTML = '';
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    footEl.hidden = false;
    subtotalEl.textContent = cart.formatPrice(cart.getSubtotal());

    listEl.innerHTML = items.map((item) => {
      const product = cart.getProduct(item.slug);
      if (!product) return '';
      const qty = item.qty || 1;
      const lineTotal = cart.UNIT_PRICE * qty;
      return `
        <li class="cart-widget-item" data-slug="${item.slug}">
          <a class="cart-widget-item-image" href="${base}products/${item.slug}.html">
            <img src="${base}${product.image}" alt="" width="48" height="48" loading="lazy">
          </a>
          <div class="cart-widget-item-info">
            <a class="cart-widget-item-name" href="${base}products/${item.slug}.html">${product.name}</a>
            <div class="cart-widget-qty" aria-label="Quantity for ${product.name}">
              <button type="button" class="cart-widget-qty-btn" data-action="minus" aria-label="Decrease quantity"${qty <= 1 ? ' disabled' : ''}>−</button>
              <span class="cart-widget-qty-value">${qty}</span>
              <button type="button" class="cart-widget-qty-btn" data-action="plus" aria-label="Increase quantity"${qty >= cart.MAX_QTY ? ' disabled' : ''}>+</button>
            </div>
          </div>
          <span class="cart-widget-item-price">${cart.formatPrice(lineTotal)}</span>
        </li>`;
    }).join('');
  }

  listEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.cart-widget-qty-btn');
    if (!btn || btn.disabled) return;

    event.stopPropagation();

    const row = btn.closest('.cart-widget-item');
    const slug = row?.dataset.slug;
    if (!slug) return;

    const current = cart.getItems().find((item) => item.slug === slug)?.qty || 1;

    if (btn.dataset.action === 'plus') {
      cart.addItem(slug, 1);
    } else if (btn.dataset.action === 'minus') {
      if (current <= 1) cart.removeItem(slug);
      else cart.setQty(slug, current - 1);
    }

    render();
  });

  panel.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!open);
    if (open) render();
  });

  document.addEventListener('click', (event) => {
    if (!open) return;
    if (!widget.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) setOpen(false);
  });

  window.addEventListener('guilty-cart-updated', render);
  window.addEventListener('storage', (event) => {
    if (event.key === 'guilty-cart') render();
  });

  if (document.body.classList.contains('page-cart')) {
    widget.classList.add('is-active');
  }

  render();
  initCollectionCartButtons();
  initProductCartButtons();
  window.GuiltyCartWidget = { render, setOpen };

  function initCollectionCartButtons() {
    if (!document.body.classList.contains('page-home')) return;

    document.querySelectorAll('.home-scarf-item').forEach((item) => {
      const meta = item.querySelector('.home-scarf-meta');
      const num = meta?.querySelector('.scarf-num');
      if (!meta || !num || meta.querySelector('.home-scarf-cart')) return;

      const href = item.getAttribute('href') || '';
      const slug = href.match(/products\/([^/]+)\.html/)?.[1];
      if (!slug || !cart.getProduct(slug)) return;

      const name = meta.querySelector('h3')?.textContent?.trim() || 'scarf';
      const head = document.createElement('div');
      head.className = 'home-scarf-meta-head';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'home-scarf-cart';
      btn.dataset.slug = slug;
      btn.setAttribute('aria-label', `Add ${name} to bag`);
      btn.innerHTML = cart.bagIcon();

      meta.insertBefore(head, num);
      head.appendChild(num);
      head.appendChild(btn);

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const inCart = cart.getItems().some((item) => item.slug === slug);
        if (inCart) {
          cart.removeItem(slug);
        } else {
          cart.addItem(slug, 1);
          if (window.GuiltyCartWidget) {
            window.GuiltyCartWidget.render();
            window.GuiltyCartWidget.setOpen(true);
          }
        }
      });
    });

    syncCollectionCartStates();
    window.addEventListener('guilty-cart-updated', syncCollectionCartStates);
  }

  function syncCollectionCartStates() {
    const slugs = new Set(cart.getItems().map((item) => item.slug));
    document.querySelectorAll('.home-scarf-cart').forEach((btn) => {
      const slug = btn.dataset.slug;
      btn.classList.toggle('is-in-cart', slug ? slugs.has(slug) : false);
    });
  }

  function initProductCartButtons() {
    if (!document.body.classList.contains('product-page')) return;
    if (document.body.classList.contains('product-overlay-mode')) return;

    const slug = document.body.dataset.product;
    const product = slug ? cart.getProduct(slug) : null;
    if (!product) return;

    const details = document.querySelector('.product-details');
    if (!details || details.querySelector('.product-page-cart')) return;

    const h1 = details.querySelector('h1');
    const name = h1?.textContent?.trim() || product.name;

    if (h1 && !h1.closest('.product-details-head')) {
      const head = document.createElement('div');
      head.className = 'product-details-head';
      h1.parentNode.insertBefore(head, h1);
      head.appendChild(h1);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'product-page-cart';
      btn.dataset.slug = slug;
      btn.setAttribute('aria-label', `Add ${name} to bag`);
      btn.innerHTML = cart.bagIcon();
      head.appendChild(btn);

      btn.addEventListener('click', () => {
        const inCart = cart.getItems().some((item) => item.slug === slug);
        if (inCart) {
          cart.removeItem(slug);
        } else {
          cart.addItem(slug, 1);
          setOpen(true);
        }
        syncProductCartState(slug);
        render();
      });
    }

    const specs = details.querySelector('.product-specs');
    if (specs && !specs.querySelector('[data-spec="price"]')) {
      const priceRow = document.createElement('div');
      priceRow.dataset.spec = 'price';
      priceRow.innerHTML = `<dt>Price</dt><dd>${cart.formatPrice(cart.UNIT_PRICE)}</dd>`;
      specs.appendChild(priceRow);
    }

    const actions = details.querySelector('.product-actions');
    if (actions && !actions.querySelector('.add-to-bag')) {
      actions.innerHTML = `
        <div class="product-actions-row">
          <button type="button" class="link-arrow add-to-bag product-add-bag">${cart.bagIcon()}<span>Add to bag</span><span aria-hidden="true">&rarr;</span></button>
        </div>
        <a href="${base}index.html#collection" class="product-back">&larr; All scarfs</a>`;

      actions.querySelector('.product-add-bag').addEventListener('click', () => {
        const inCart = cart.getItems().some((item) => item.slug === slug);
        if (inCart) {
          cart.removeItem(slug);
        } else {
          cart.addItem(slug, 1);
          setOpen(true);
        }
        syncProductCartState(slug);
        render();
      });
    }

    syncProductCartState(slug);
    window.addEventListener('guilty-cart-updated', () => syncProductCartState(slug));
  }

  function syncProductCartState(slug) {
    const inCart = cart.getItems().some((item) => item.slug === slug);
    document.querySelectorAll('.product-page-cart, .product-add-bag').forEach((btn) => {
      btn.classList.toggle('is-in-cart', inCart);
    });
  }
})();
