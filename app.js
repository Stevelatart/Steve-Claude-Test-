'use strict';

// Price lookup used by GA4 event payloads
const SERIES_PRICE = { '10X': 399, '6X': 299, '3X': 199, 'X': 149 };

// ── Mobile tab switching ──────────────────────────────────────────────────────
const tabs = document.querySelectorAll('.tab-btn');
const allSeriesCells = document.querySelectorAll('[data-series]');

function showSeries(series) {
  allSeriesCells.forEach(el => {
    if (el.dataset.series) el.classList.remove('visible');
  });

  document.querySelectorAll(`[data-series="${series}"]`).forEach(el => {
    el.classList.add('visible');
  });

  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.series === series);
    btn.setAttribute('aria-selected', btn.dataset.series === series);
  });

  // GA4: track which series the user browsed on mobile
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_series', { series_name: series });
  }
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => showSeries(btn.dataset.series));
});

function handleResize() {
  if (window.innerWidth <= 768) {
    const active = document.querySelector('.tab-btn.active');
    if (active) showSeries(active.dataset.series);
  } else {
    allSeriesCells.forEach(el => el.classList.remove('visible'));
  }
}

window.addEventListener('resize', handleResize);
handleResize();

// ── Animate bars on scroll ────────────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const bars = document.querySelectorAll('.bar-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => {
    bar.style.animationPlayState = 'paused';
    observer.observe(bar);
  });
}

// ── Smooth "Add to Cart" feedback + GA4 event ─────────────────────────────────
document.querySelectorAll('.btn-buy').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();

    // Resolve which series this button belongs to
    const seriesEl = btn.closest('[data-series]');
    const cardEl   = btn.closest('.rod-card');
    let series = null;
    if (seriesEl) {
      series = seriesEl.dataset.series;
    } else if (cardEl) {
      series = cardEl.querySelector('.card-series')?.textContent?.trim() ?? null;
    }

    // GA4 add_to_cart event (standard e-commerce schema)
    if (typeof gtag !== 'undefined' && series) {
      gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: SERIES_PRICE[series] ?? 0,
        items: [{
          item_id:   `trika-${series.toLowerCase()}-rod`,
          item_name: `Trika ${series} Rod`,
          price:      SERIES_PRICE[series] ?? 0,
          quantity:   1,
        }],
      });
    }

    const original = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = '#28a745';

    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
    }, 1500);
  });
});
