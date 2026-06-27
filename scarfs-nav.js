const SCARFS = [
  { slug: 'burgundy', num: '01', name: 'Burgundy', image: 'scarfs/burgundy.png' },
  { slug: 'fuchsia', num: '02', name: 'Fuchsia', image: 'scarfs/fuchsia.png' },
  { slug: 'pink', num: '03', name: 'Pink', image: 'scarfs/pink.png' },
  { slug: 'khaki', num: '04', name: 'Khaki', image: 'scarfs/khaki.png' },
  { slug: 'lime', num: '05', name: 'Lime', image: 'scarfs/lime.png' },
  { slug: 'orange', num: '06', name: 'Orange', image: 'scarfs/orange.png' },
  { slug: 'red', num: '07', name: 'Red', image: 'scarfs/red.png' },
  { slug: 'baby-pink', num: '08', name: 'Baby Pink', image: 'scarfs/baby-pink.png' },
];

function getBasePath() {
  return window.location.pathname.includes('/products/') ? '..' : '.';
}

function buildScarfNav() {
  if (document.body.classList.contains('product-page')) return;

  const base = getBasePath();
  const currentSlug = document.body.dataset.product;

  const aside = document.createElement('aside');
  aside.className = 'scarf-nav';
  aside.setAttribute('aria-label', 'Scarf collection');

  const label = document.createElement('p');
  label.className = 'scarf-nav-label';
  label.textContent = 'Collection';

  const nav = document.createElement('nav');
  nav.className = 'scarf-nav-list';

  SCARFS.forEach((scarf, i) => {
    const href = `${base}/products/${scarf.slug}.html`;
    const isActive = currentSlug === scarf.slug;

    const link = document.createElement('a');
    link.href = href;
    link.className = `scarf-nav-item${isActive ? ' active' : ''}`;
    link.style.setProperty('--i', i);
    link.setAttribute('aria-label', scarf.name);
    link.setAttribute('title', scarf.name);

    link.innerHTML = `
      <span class="scarf-nav-tile">
        <img src="${base}/${scarf.image}" alt="" width="56" height="56" loading="lazy">
      </span>
      <span class="scarf-nav-num">${scarf.num}</span>
    `;

    nav.appendChild(link);
  });

  aside.appendChild(label);
  aside.appendChild(nav);

  document.body.appendChild(aside);

  if (document.body.classList.contains('page-home')) {
    const onScroll = () => {
      const inCollection = document.body.classList.contains('is-scarfs-on');
      aside.classList.toggle('visible', window.scrollY > 50 || inCollection);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Re-check when collection mode toggles (hover nav depends on is-scarfs-on)
    new MutationObserver(onScroll).observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
  } else {
    aside.classList.add('visible');
  }
}

buildScarfNav();
