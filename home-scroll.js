(function () {
  'use strict';

  if (!document.body.classList.contains('page-home')) return;

  var SECTIONS = [
    { id: 'home', nav: '#home' },
    { id: 'collection', nav: '#collection' },
    { id: 'about', nav: '#about' },
    { id: 'community', nav: '#community' },
    { id: 'contact', nav: '#contact' },
  ];

  function getHeaderHeight() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
    var parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  document.querySelectorAll('.nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var id = hash.slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      scrollToSection(id);
      history.pushState(null, '', hash);
      updateActiveNav(id);
    });
  });

  document.querySelectorAll('a.link-arrow[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var id = hash.slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      scrollToSection(id);
      history.pushState(null, '', hash);
      updateActiveNav(id);
    });
  });

  function updateActiveNav(activeId) {
    document.querySelectorAll('.nav a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var linkId = href.startsWith('#') ? href.slice(1) : '';
      link.classList.toggle('active', linkId === activeId);
    });
  }

  function getActiveSectionId() {
    var headerH = getHeaderHeight();
    var marker = window.scrollY + headerH + window.innerHeight * 0.35;
    var activeId = SECTIONS[0].id;

    SECTIONS.forEach(function (section) {
      var el = document.getElementById(section.id);
      if (!el) return;
      if (el.offsetTop <= marker) activeId = section.id;
    });

    return activeId;
  }

  var scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      updateActiveNav(getActiveSectionId());
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  function applyHashOnLoad() {
    if (!location.hash) {
      updateActiveNav('home');
      return;
    }
    var id = location.hash.slice(1);
    if (!document.getElementById(id)) return;
    requestAnimationFrame(function () {
      scrollToSection(id);
      updateActiveNav(id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHashOnLoad, { once: true });
  } else {
    applyHashOnLoad();
  }

  window.addEventListener('popstate', function () {
    var id = location.hash ? location.hash.slice(1) : 'home';
    if (document.getElementById(id)) {
      scrollToSection(id);
      updateActiveNav(id);
    } else {
      updateActiveNav(getActiveSectionId());
    }
  });
})();
