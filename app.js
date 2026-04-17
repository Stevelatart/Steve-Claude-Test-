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

// ── Interactive Comparison Mode ───────────────────────────────────────────────
const compareBar     = document.getElementById('compare-bar');
const compareBarText = document.getElementById('compare-bar-text');
const compareReset   = document.getElementById('compare-reset');
const comparisonTable = document.querySelector('.comparison-table');
let selectedSeries = [];

function updateCompareMode() {
  const count = selectedSeries.length;

  document.querySelectorAll('.compare-toggle').forEach(btn => {
    const series = btn.closest('th[data-series]').dataset.series;
    const isSelected = selectedSeries.includes(series);
    btn.classList.toggle('selected', isSelected);
    btn.setAttribute('aria-pressed', isSelected);
    btn.textContent = isSelected ? 'Selected \u2713' : 'Compare';
    btn.disabled = count === 2 && !isSelected;
  });

  compareBar.classList.toggle('visible', count > 0);

  if (count === 1) {
    compareBarText.innerHTML = `<span>${selectedSeries[0]}</span> selected \u2014 pick one more to compare`;
  } else if (count === 2) {
    compareBarText.innerHTML = `Comparing <span>${selectedSeries[0]}</span> vs <span>${selectedSeries[1]}</span>`;
  }

  const isComparing = count === 2 && window.innerWidth > 768;

  allSeriesCells.forEach(cell => {
    if (cell.dataset.series) {
      cell.classList.toggle('col-hidden', isComparing && !selectedSeries.includes(cell.dataset.series));
    }
  });

  comparisonTable.querySelectorAll('tbody tr:not(.category-row):not(.cta-row)').forEach(row => {
    if (count === 2) {
      const hasA = !!row.querySelector(`[data-series="${selectedSeries[0]}"] .dot`);
      const hasB = !!row.querySelector(`[data-series="${selectedSeries[1]}"] .dot`);
      row.classList.toggle('row-differs', hasA !== hasB);
    } else {
      row.classList.remove('row-differs');
    }
  });
}

document.querySelectorAll('.compare-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const series = btn.closest('th[data-series]').dataset.series;
    if (selectedSeries.includes(series)) {
      selectedSeries = selectedSeries.filter(s => s !== series);
    } else if (selectedSeries.length < 2) {
      selectedSeries.push(series);
    }
    updateCompareMode();
  });
});

compareReset.addEventListener('click', () => {
  selectedSeries = [];
  updateCompareMode();
});

window.addEventListener('resize', () => {
  if (selectedSeries.length > 0) updateCompareMode();
});

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
