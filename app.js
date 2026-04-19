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

// ── Rod Finder Quiz ───────────────────────────────────────────────────────────
const QUIZ_RECS = {
  'finesse|max-sensitivity': { series: '10X', price: '$399', reason: 'Finesse demands maximum feel. The 10X\'s Elite Carbon blank and Silicon Nitride inserts transmit every light bite.' },
  'finesse|balance':         { series: '6X',  price: '$299', reason: 'The 6X\'s TORAY HP carbons and Ekko Chamber deliver finesse-grade sensitivity without the top-tier price tag.' },
  'finesse|value':           { series: '3X',  price: '$199', reason: 'The 3X gives you Trika\'s carbon grips, premium guides, and proven blank at a price finesse anglers love.' },
  'power|max-sensitivity':   { series: '6X',  price: '$299', reason: 'Power fishing with the 6X means you won\'t miss a pickup — TORAY HP carbons transfer feel even through heavy line.' },
  'power|balance':           { series: '3X',  price: '$199', reason: 'The 3X is built for power — carbon seat, carbon grips, and premium guides at a sensible price point.' },
  'power|value':             { series: 'X',   price: '$149', reason: 'The X delivers Trika\'s 100% carbon blank for power fishing at the most accessible entry price.' },
  'jigging|max-sensitivity': { series: '10X', price: '$399', reason: 'Jigging is all about feel. The 10X\'s Elite Carbon blank and Silicon Nitride inserts are built for anglers who can\'t miss a tick.' },
  'jigging|balance':         { series: '6X',  price: '$299', reason: 'The 6X\'s Ekko Chamber and Titanium Tip transmit jigging vibrations clearly — premium performance for the value.' },
  'jigging|value':           { series: '3X',  price: '$199', reason: 'The 3X delivers reliable sensitivity for jigging with premium guides and Trika\'s proven carbon tech.' },
  'versatile|max-sensitivity':{ series: '6X', price: '$299', reason: 'The 6X is the ultimate all-rounder — TORAY HP carbons and Ekko Chamber make it sensitive across every technique.' },
  'versatile|balance':       { series: '3X',  price: '$199', reason: 'The 3X is the versatile angler\'s sweet spot — premium components and great sensitivity without overinvesting.' },
  'versatile|value':         { series: 'X',   price: '$149', reason: 'The X is ideal for all-around fishing on a budget — Trika\'s core carbon construction at the best price.' },
};

const quizState      = { 1: null, 2: null };
let   quizRec        = null;

const quizStepEls    = document.querySelectorAll('.quiz-step');
const quizDividers   = document.querySelectorAll('.quiz-step-divider');

function showQuizPanel(target) {
  document.querySelectorAll('.quiz-panel').forEach(p => p.classList.remove('active'));
  const id = target === 'result' ? 'quiz-panel-result' : `quiz-panel-${target}`;
  document.getElementById(id).classList.add('active');

  const order = [1, 2, 'result'];
  const idx   = order.indexOf(target);
  quizStepEls.forEach((s, i) => {
    s.classList.toggle('active', i === idx);
    s.classList.toggle('done',   i < idx);
  });
  quizDividers.forEach((d, i) => d.classList.toggle('done', i < idx));
}

function applyQuizHighlight(series) {
  document.querySelectorAll('.quiz-recommended').forEach(el => el.classList.remove('quiz-recommended'));
  if (series) {
    document.querySelectorAll(`[data-series="${series}"]`).forEach(el => el.classList.add('quiz-recommended'));
  }
}

document.querySelectorAll('.quiz-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    const q = opt.dataset.q;
    quizState[q] = opt.dataset.value;
    opt.closest('.quiz-options').querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');

    setTimeout(() => {
      if (q === '1') {
        showQuizPanel(2);
      } else {
        quizRec = QUIZ_RECS[`${quizState[1]}|${quizState[2]}`];
        document.getElementById('quiz-result-series').textContent = quizRec.series;
        document.getElementById('quiz-result-price').textContent  = quizRec.price;
        document.getElementById('quiz-result-reason').textContent = quizRec.reason;
        showQuizPanel('result');
        applyQuizHighlight(quizRec.series);
      }
    }, 280);
  });
});

document.getElementById('quiz-see-table').addEventListener('click', () => {
  if (!quizRec) return;
  // Re-trigger spotlight animation
  applyQuizHighlight(null);
  requestAnimationFrame(() => requestAnimationFrame(() => applyQuizHighlight(quizRec.series)));
  // Scroll below sticky header
  const header  = document.querySelector('.site-header');
  const wrapper = document.querySelector('.table-wrapper');
  const offset  = (header ? header.offsetHeight : 0) + 16;
  const top     = wrapper.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
});

document.getElementById('quiz-reset').addEventListener('click', () => {
  quizState[1] = null;
  quizState[2] = null;
  quizRec      = null;
  document.querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('selected'));
  applyQuizHighlight(null);
  showQuizPanel(1);
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
