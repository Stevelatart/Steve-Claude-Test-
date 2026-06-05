'use strict';

/* ============================================================
   651 Carpets+ — app.js
   - Sticky header shadow on scroll
   - Mobile nav hamburger toggle
   - Smooth scroll for nav anchor links
   - IntersectionObserver fade-in animations
   - Form submission handler with success message
   ============================================================ */

(function () {

  /* ── Sticky header shadow ──────────────────────────────────── */
  const header = document.getElementById('site-header');

  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run on init in case page loads mid-scroll
    onScroll();
  }


  /* ── Mobile hamburger nav toggle ───────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mainNav   = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute(
        'aria-label',
        isOpen ? 'Close navigation menu' : 'Open navigation menu'
      );
    });

    // Close nav when a link is clicked (smooth scroll takes over)
    mainNav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
      });
    });

    // Close nav on outside click
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        mainNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
      }
    });
  }


  /* ── Smooth scroll for all in-page anchor links ────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const headerHeight = header ? header.offsetHeight : 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  });


  /* ── IntersectionObserver — fade-in on scroll ──────────────── */
  const animateEls = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window && animateEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    animateEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: show all immediately if IO not supported
    animateEls.forEach((el) => el.classList.add('visible'));
  }


  /* ── Booking form submission handler ───────────────────────── */
  const form        = document.getElementById('booking-form');
  const successMsg  = document.getElementById('form-success');

  if (form && successMsg) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Basic validation
      const name    = form.querySelector('#name');
      const phone   = form.querySelector('#phone');
      const service = form.querySelector('#service');
      let valid = true;

      [name, phone, service].forEach((field) => {
        if (!field) return;
        const isEmpty = !field.value.trim();
        field.style.borderColor = isEmpty ? 'var(--error)' : '';
        if (isEmpty) valid = false;
      });

      if (!valid) {
        // Scroll to first error field
        const firstInvalid = form.querySelector('[style*="--error"]');
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      // Simulate submission — show success message
      const submitBtn = form.querySelector('.form-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      // Short delay to feel like a real request
      setTimeout(() => {
        // Hide submit button, show success
        if (submitBtn) submitBtn.style.display = 'none';
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Reset form fields
        form.reset();
      }, 800);
    });

    // Clear error styling on input
    form.querySelectorAll('.form-input').forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }


  /* ── Set minimum date on date pickers ─────────────────────── */
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach((dp) => {
    dp.setAttribute('min', today);
  });


  /* ── Hero image slideshow ──────────────────────────────────── */
  const slides   = document.querySelectorAll('.hero-slide');
  const dots     = document.querySelectorAll('.hero-dot');
  let current    = 0;
  let slideTimer = null;

  function goToSlide(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function nextSlide() {
    goToSlide(current + 1);
  }

  function startTimer() {
    slideTimer = setInterval(nextSlide, 5000);
  }

  if (slides.length > 1) {
    startTimer();

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(slideTimer);
        goToSlide(i);
        startTimer();
      });
    });

    // Pause on tab hidden, resume on visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(slideTimer);
      } else {
        startTimer();
      }
    });
  }


  /* ── Hero scheduler form handler ───────────────────────────── */
  const heroForm       = document.getElementById('hero-form');
  const heroSuccess    = document.getElementById('hero-form-success');

  function handleSchedulerForm(form, successEl) {
    if (!form || !successEl) return;

    const setMin = form.querySelector('input[type="date"]');
    if (setMin) setMin.setAttribute('min', today);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = form.querySelector('[name="name"]');
      const phone   = form.querySelector('[name="phone"]');
      const service = form.querySelector('[name="service"]');
      let valid = true;

      [name, phone, service].forEach((f) => {
        if (!f) return;
        const empty = !f.value.trim();
        f.classList.toggle('error', empty);
        if (empty) valid = false;
      });

      if (!valid) return;

      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      setTimeout(() => {
        if (btn) btn.style.display = 'none';
        successEl.hidden = false;
        form.reset();
      }, 800);
    });

    form.querySelectorAll('.sform-input').forEach((f) => {
      f.addEventListener('input', () => f.classList.remove('error'));
    });
  }

  handleSchedulerForm(heroForm, heroSuccess);


  /* ── Booking form submission handler ───────────────────────── */
  const form        = document.getElementById('booking-form');
  const successMsg  = document.getElementById('form-success');

  if (form && successMsg) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name    = form.querySelector('#name');
      const phone   = form.querySelector('#phone');
      const service = form.querySelector('#service');
      let valid = true;

      [name, phone, service].forEach((field) => {
        if (!field) return;
        const isEmpty = !field.value.trim();
        field.style.borderColor = isEmpty ? 'var(--error)' : '';
        if (isEmpty) valid = false;
      });

      if (!valid) return;

      const submitBtn = form.querySelector('.form-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      setTimeout(() => {
        if (submitBtn) submitBtn.style.display = 'none';
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        form.reset();
      }, 800);
    });

    form.querySelectorAll('.form-input').forEach((field) => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  }

})();
