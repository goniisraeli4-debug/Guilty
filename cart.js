/**
 * GUILTY. cart — localStorage-backed shopping bag.
 */
(function (global) {
  const STORAGE_KEY = 'guilty-cart';
  const UNIT_PRICE = 369.99;
  const MAX_QTY = 3;

  const CATALOG = {
    burgundy: { name: 'BGD.06', image: 'scarfs/burgundy.svg' },
    fuchsia: { name: 'FCS.01', image: 'scarfs/fuchsia.svg' },
    pink: { name: 'PNK.07', image: 'scarfs/pink.png' },
    khaki: { name: 'KHK.08', image: 'scarfs/khaki.png' },
    lime: { name: 'LME.04', image: 'scarfs/lime-layers/layer-2.svg' },
    orange: { name: 'ORG.02', image: 'scarfs/orange.png' },
    red: { name: 'CHR.03', image: 'scarfs/red-layers/layer-2.svg' },
    'baby-pink': { name: 'PCH.05', image: 'scarfs/baby-pink.png' },
  };

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    global.dispatchEvent(new CustomEvent('guilty-cart-updated'));
  }

  function formatPrice(n) {
    return n.toFixed(2) + '$';
  }

  function getProduct(slug) {
    return CATALOG[slug] || null;
  }

  function getItems() {
    return read().filter((item) => getProduct(item.slug));
  }

  function getItemCount() {
    return getItems().reduce((sum, item) => sum + (item.qty || 1), 0);
  }

  function getSubtotal() {
    return getItems().reduce((sum, item) => sum + UNIT_PRICE * (item.qty || 1), 0);
  }

  function addItem(slug, qty) {
    if (!getProduct(slug)) return getItems();
    const amount = Math.min(MAX_QTY, Math.max(1, qty || 1));
    const items = read();
    const index = items.findIndex((item) => item.slug === slug);

    if (index >= 0) {
      items[index].qty = Math.min(MAX_QTY, (items[index].qty || 1) + amount);
    } else {
      items.push({ slug, qty: amount });
    }

    write(items);
    return getItems();
  }

  function setQty(slug, qty) {
    const next = Math.min(MAX_QTY, Math.max(1, qty || 1));
    const items = read();
    const index = items.findIndex((item) => item.slug === slug);
    if (index < 0) return getItems();
    items[index].qty = next;
    write(items);
    return getItems();
  }

  function removeItem(slug) {
    write(read().filter((item) => item.slug !== slug));
    return getItems();
  }

  function clear() {
    write([]);
  }

  function countLabel(n) {
    return n === 1 ? '1 item' : n + ' items';
  }

  function bagIcon() {
    return `<svg class="cart-bag-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path class="cart-bag-body" d="M6 7.5h12l-1.1 11.4H7.1L6 7.5z" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>
      <path class="cart-bag-handle" d="M9 7.5V6a3 3 0 0 1 6 0v1.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
    </svg>`;
  }

  global.GuiltyCart = {
    UNIT_PRICE,
    MAX_QTY,
    CATALOG,
    formatPrice,
    getProduct,
    getItems,
    getItemCount,
    getSubtotal,
    addItem,
    setQty,
    removeItem,
    clear,
    countLabel,
    bagIcon,
  };
})(typeof window !== 'undefined' ? window : globalThis);
