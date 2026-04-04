'use strict';

// ── Mobile tab switching ──────────────────────────────────────────────────────
const tabs = document.querySelectorAll('.tab-btn');
const allSeriesCells = document.querySelectorAll('[data-series]');

function showSeries(series) {
  // Hide all series columns
  allSeriesCells.forEach(el => {
    if (el.dataset.series) el.classList.remove('visible');
  });

  // Show only the selected series
  document.querySelectorAll(`[data-series="${series}"]`).forEach(el => {
    el.classList.add('visible');
  });

  // Update active tab
  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.series === series);
    btn.setAttribute('aria-selected', btn.dataset.series === series);
  });
}

tabs.forEach(btn => {
  btn.addEventListener('click', () => showSeries(btn.dataset.series));
});

// On mobile, show the first series by default
function handleResize() {
  if (window.innerWidth <= 768) {
    const active = document.querySelector('.tab-btn.active');
    if (active) showSeries(active.dataset.series);
  } else {
    // Desktop: show all columns
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

// ── Smooth "Add to Cart" feedback ────────────────────────────────────────────
document.querySelectorAll('.btn-buy').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();

    const original = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = '#28a745';

    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
    }, 1500);
  });
});
