// Minimal prev/next arrows for the horizontal scarf row (home + collection).
(function () {
  const sections = document.querySelectorAll('.home-scarf-scroll');
  if (!sections.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  const chevron = (dir) => (
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
    '<path d="' + (dir === 'prev' ? 'M11 3L5 9L11 15' : 'M7 3L13 9L7 15') + '" ' +
    'stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>'
  );

  function makeArrow(dir) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scarf-scroll-arrow scarf-scroll-arrow--' + dir;
    btn.setAttribute('aria-label', dir === 'prev' ? 'Previous scarf' : 'Next scarf');
    btn.innerHTML = chevron(dir);
    return btn;
  }

  sections.forEach((section) => {
    const container = section.querySelector('.home-scarf-scroll-inner');
    if (!container) return;

    const prev = makeArrow('prev');
    const next = makeArrow('next');
    section.append(prev, next);

    const items = () => Array.from(container.querySelectorAll('.home-scarf-item'));

    function getCurrentIndex() {
      const list = items();
      if (!list.length) return 0;

      const center = container.scrollLeft + container.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;

      list.forEach((item, i) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const dist = Math.abs(itemCenter - center);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });

      return closest;
    }

    function scrollToIndex(index) {
      const list = items();
      const clamped = Math.max(0, Math.min(index, list.length - 1));
      const target = list[clamped];
      if (!target) return;

      const inline = clamped === 0 ? 'start' : clamped === list.length - 1 ? 'end' : 'center';
      target.scrollIntoView({ inline, block: 'nearest', behavior: scrollBehavior });
    }

    function updateArrows() {
      const idx = getCurrentIndex();
      const last = items().length - 1;
      prev.disabled = idx <= 0;
      next.disabled = idx >= last;
    }

    prev.addEventListener('click', () => scrollToIndex(getCurrentIndex() - 1));
    next.addEventListener('click', () => scrollToIndex(getCurrentIndex() + 1));

    container.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    updateArrows();

    if (document.body.classList.contains('page-home')) {
      const observer = new IntersectionObserver(
        ([entry]) => section.classList.toggle('is-scarf-nav-visible', entry.isIntersecting),
        { threshold: 0.35 }
      );
      observer.observe(section);
    } else {
      section.classList.add('is-scarf-nav-visible');
    }
  });
})();
