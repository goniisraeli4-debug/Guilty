/**
 * Product pages — same scarf detail overlay as the home collection.
 */
(function () {
  if (!document.body.classList.contains('product-page')) return;

  const ui = window.GuiltyScarfDetailUI;
  const catalog = window.GuiltyScarfProducts;
  if (!ui || !catalog) return;

  const slug = document.body.dataset.product;
  if (!slug || !catalog.getConfig(slug)) return;

  const base = '..';

  document.body.classList.add('product-overlay-mode');

  const main = document.querySelector('main');
  main?.querySelector('.product')?.setAttribute('hidden', '');

  const existingFooter = main?.querySelector('.footer-standalone');
  if (existingFooter) {
    const contact = document.createElement('section');
    contact.className = 'contact product-overlay-contact';
    contact.id = 'contact';
    existingFooter.classList.remove('footer-standalone');
    contact.appendChild(existingFooter);
    document.body.appendChild(contact);
  }

  const detail = ui.createDetail({ base, showPreorder: false });
  document.body.appendChild(detail);

  let activeSlug = slug;
  ui.wireCartButton(detail, () => activeSlug);

  ui.openStandalone(detail, slug, { base, interactive: false }).then(() => {
    activeSlug = slug;
  });

  const parts = ui.getParts(detail);

  function closeToCollection() {
    window.location.href = `${base}/index.html#collection`;
  }

  parts.closeBtn.addEventListener('click', closeToCollection);

  detail.addEventListener('click', (e) => {
    if (!e.target.closest('.scarf-detail-info') && !e.target.closest('.scarf-detail-visual')) {
      closeToCollection();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeToCollection();
  });
})();
