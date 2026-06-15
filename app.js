'use strict';
(function () {

  /* ── Sticky header shadow ── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Hamburger nav ── */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');
  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    mainNav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
      mainNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('click', e => {
      if (header && !header.contains(e.target)) {
        mainNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Products dropdown (mobile toggle, desktop hover via CSS) ── */
  document.querySelectorAll('.products-dropdown').forEach(dd => {
    const link = dd.querySelector('.nav-link-products');
    if (link) {
      link.addEventListener('click', e => {
        if (window.innerWidth <= 768) { e.preventDefault(); dd.classList.toggle('open'); }
      });
    }
  });

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = (header ? header.offsetHeight : 0) + 16;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });

  /* ── IntersectionObserver fade-in ── */
  const els = document.querySelectorAll('.animate-on-scroll');
  if ('IntersectionObserver' in window && els.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add('visible'));
  }

  /* ── Active nav link ── */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dropdown-item').forEach(l => {
    const href = l.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) l.classList.add('active');
  });

  /* ── Hero slideshow ── */
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (slides.length > 1) {
    let cur = 0, timer;
    const go = i => {
      slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('active'); dots[cur].classList.add('active');
    };
    const start = () => { timer = setInterval(() => go(cur + 1), 5000); };
    start();
    dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(timer); go(i); start(); }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearInterval(timer); else start(); });
  }

  /* ── Reusable form handler ── */
  function setupForm(formId, successId, submitClass) {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form || !success) return;
    const today = new Date().toISOString().split('T')[0];
    form.querySelectorAll('input[type="date"]').forEach(d => d.setAttribute('min', today));
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach(f => {
        const empty = !f.value.trim();
        f.style.borderColor = empty ? 'var(--error)' : '';
        if (empty) valid = false;
      });
      if (!valid) return;
      const btn = form.querySelector('.' + submitClass);
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setTimeout(() => {
        if (btn) btn.style.display = 'none';
        success.hidden = false;
        form.reset();
      }, 800);
    });
    form.querySelectorAll('input, select').forEach(f => f.addEventListener('input', () => { f.style.borderColor = ''; }));
  }

  setupForm('hero-form',    'hero-form-success', 'sform-submit');
  setupForm('booking-form', 'form-success',      'form-submit');

})();
