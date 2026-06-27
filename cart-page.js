/**
 * Shopping bag page — renders cart from localStorage.
 */
(function () {
  const cart = window.GuiltyCart;
  if (!cart) return;

  const filled = document.getElementById('cart-filled');
  const empty = document.getElementById('cart-empty');
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const totalEl = document.getElementById('cart-total');

  if (!filled || !empty || !itemsEl) return;

  function ingestQueryParam() {
    const params = new URLSearchParams(location.search);
    const slug = params.get('scarf');
    if (!slug) return;

    cart.addItem(slug, 1);
    history.replaceState(null, '', 'add-to-cart.html');
  }

  function qtyOptions(selected) {
    let html = '';
    for (let i = 1; i <= cart.MAX_QTY; i += 1) {
      html += `<option value="${i}"${i === selected ? ' selected' : ''}>${i}</option>`;
    }
    return html;
  }

  function renderItem(item) {
    const product = cart.getProduct(item.slug);
    if (!product) return '';

    const qty = item.qty || 1;
    const lineTotal = cart.UNIT_PRICE * qty;

    return `
      <article class="cart-item" role="listitem" data-slug="${item.slug}">
        <a class="cart-item-image" href="products/${item.slug}.html">
          <img src="${product.image}" alt="${product.name} scarf" width="160" height="160" loading="lazy">
        </a>
        <div class="cart-item-body">
          <p class="cart-item-label">Limited edition · 1 of 8</p>
          <h2 class="cart-item-name">${product.name}</h2>
          <p class="cart-item-meta">70 × 70 cm · 100% Polyester</p>
          <div class="cart-item-controls">
            <label class="cart-qty">
              <span class="cart-qty-label">Qty</span>
              <select name="quantity" aria-label="Quantity for ${product.name}">
                ${qtyOptions(qty)}
              </select>
            </label>
            <button type="button" class="cart-item-remove">Remove</button>
          </div>
        </div>
        <p class="cart-item-price">${cart.formatPrice(lineTotal)}</p>
      </article>`;
  }

  function updateSummary() {
    const items = cart.getItems();
    const count = cart.getItemCount();
    const subtotal = cart.getSubtotal();

    countEl.textContent = cart.countLabel(count);
    subtotalEl.textContent = cart.formatPrice(subtotal);
    totalEl.textContent = cart.formatPrice(subtotal);

    if (items.length === 0) {
      filled.hidden = true;
      empty.hidden = false;
      return;
    }

    filled.hidden = false;
    empty.hidden = true;
    itemsEl.innerHTML = items.map(renderItem).join('');
  }

  itemsEl.addEventListener('change', function (event) {
    const select = event.target.closest('select[name="quantity"]');
    if (!select) return;

    const row = select.closest('.cart-item');
    const slug = row?.dataset.slug;
    if (!slug) return;

    cart.setQty(slug, Number(select.value));
    updateSummary();
  });

  itemsEl.addEventListener('click', function (event) {
    const btn = event.target.closest('.cart-item-remove');
    if (!btn) return;

    const row = btn.closest('.cart-item');
    const slug = row?.dataset.slug;
    if (!slug) return;

    cart.removeItem(slug);
    updateSummary();
  });

  ingestQueryParam();
  updateSummary();
  window.dispatchEvent(new CustomEvent('guilty-cart-updated'));
})();
