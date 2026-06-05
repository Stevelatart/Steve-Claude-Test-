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


  /* ── Set minimum date on date picker ───────────────────────── */
  const datePicker = document.getElementById('preferred-date');
  if (datePicker) {
    const today = new Date().toISOString().split('T')[0];
    datePicker.setAttribute('min', today);
  }

})();
