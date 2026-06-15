'use strict';
(function () {

  /* ── Header scroll ── */
  const header = document.getElementById('site-header');
  if (header) {
    const tick = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── Hamburger ── */
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (ham && nav) {
    ham.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      ham.classList.toggle('open', open);
      ham.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-link').forEach(l =>
      l.addEventListener('click', () => {
        nav.classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
      })
    );
    document.addEventListener('click', e => {
      if (header && !header.contains(e.target)) {
        nav.classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Products dropdown (mobile) ── */
  document.querySelectorAll('.products-dropdown').forEach(dd => {
    const link = dd.querySelector('.nav-link-products');
    if (link) {
      link.addEventListener('click', e => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dd.classList.toggle('open');
        }
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

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ── Active nav ── */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dropdown-item').forEach(l => {
    const href = (l.getAttribute('href') || '').split('#')[0];
    if (href === path || (path === '' && href === 'index.html')) l.classList.add('active');
  });

  /* ── Hero slideshow ── */
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (slides.length > 1) {
    let cur = 0, timer;
    const go = i => {
      slides[cur].classList.remove('active');
      dots[cur] && dots[cur].classList.remove('active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('active');
      dots[cur] && dots[cur].classList.add('active');
    };
    const start = () => { timer = setInterval(() => go(cur + 1), 5500); };
    start();
    dots.forEach((d, i) => d.addEventListener('click', () => { clearInterval(timer); go(i); start(); }));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInterval(timer); else start();
    });
  }

  /* ══════════════════════════════════════════════════════════
     BOOKING CALENDAR WIDGET
     ══════════════════════════════════════════════════════════ */
  class BookingCalendar {
    constructor(el) {
      this.el = el;
      this.today = new Date(); this.today.setHours(0,0,0,0);
      this.viewMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      this.selectedDate = null;
      this.selectedTime = null;
      this.step = 1;
      this.service = el.dataset.service || '';
      this.slots = {
        morning:   ['9:00 AM', '10:00 AM', '11:00 AM'],
        afternoon: ['1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
      };
      this.render();
    }

    isAvail(d) {
      if (d < this.today) return false;
      const day = d.getDay();
      return day >= 1 && day <= 6;
    }

    fmt(d, opts) { return d.toLocaleDateString('en-US', opts); }

    calHTML() {
      const y = this.viewMonth.getFullYear();
      const m = this.viewMonth.getMonth();
      const name = this.viewMonth.toLocaleString('default', { month:'long' });
      const firstDay = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const prevOk = new Date(y, m, 1) > this.today;

      let h = `
        <div class="cal-header">
          <button class="cal-nav" id="cp" ${prevOk?'':' disabled style="opacity:.3;cursor:not-allowed"'}>&#8249;</button>
          <span class="cal-month-title">${name} ${y}</span>
          <button class="cal-nav" id="cn">&#8250;</button>
        </div>
        <div class="cal-grid">
          ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div class="cal-day-label">${d}</div>`).join('')}
      `;

      for (let i = 0; i < firstDay; i++) h += '<div class="cal-cell empty"></div>';

      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const avail = this.isAvail(date);
        const sel   = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
        const tod   = date.toDateString() === this.today.toDateString();
        let cls = 'cal-cell';
        if (!avail) cls += ' disabled';
        else cls += ' available';
        if (sel) cls += ' selected';
        if (tod && !sel) cls += ' today';
        h += `<div class="${cls}" data-ts="${date.getTime()}">${d}</div>`;
      }
      h += '</div>';
      return h;
    }

    html() {
      if (this.step === 4) return `
        <div class="cal-success">
          <div class="cal-success-icon">&#10003;</div>
          <h3>You're Confirmed!</h3>
          <p><strong>${this.fmt(this.selectedDate,{weekday:'long',month:'long',day:'numeric'})}</strong><br>at <strong>${this.selectedTime}</strong></p>
          <p style="margin-top:8px">We'll call you within 2 hours to confirm. See you soon!</p>
        </div>`;

      const steps = `
        <div class="cal-step-indicators">
          <div class="cal-step-ind ${this.step>=1?'active':''}"><span>1</span><label>Date</label></div>
          <div class="cal-step-line"></div>
          <div class="cal-step-ind ${this.step>=2?'active':''}"><span>2</span><label>Time</label></div>
          <div class="cal-step-line"></div>
          <div class="cal-step-ind ${this.step>=3?'active':''}"><span>3</span><label>Info</label></div>
        </div>`;

      if (this.step === 1) return steps + this.calHTML();

      const dateLbl = this.fmt(this.selectedDate, {weekday:'long',month:'long',day:'numeric'});

      if (this.step === 2) return steps + `
        <p class="cal-selected-date">&#128197; ${dateLbl}</p>
        <div class="cal-time-group"><h4>Morning</h4><div class="cal-time-slots">${this.slots.morning.map(t=>`<button class="cal-time-btn" data-t="${t}">${t}</button>`).join('')}</div></div>
        <div class="cal-time-group"><h4>Afternoon</h4><div class="cal-time-slots">${this.slots.afternoon.map(t=>`<button class="cal-time-btn" data-t="${t}">${t}</button>`).join('')}</div></div>
        <button class="cal-back">&#8592; Back</button>`;

      if (this.step === 3) return steps + `
        <p class="cal-selected-date">&#128197; ${dateLbl} &nbsp;&#183;&nbsp; &#128336; ${this.selectedTime}</p>
        <form id="cbf" novalidate>
          <div class="cal-form-row">
            <div class="cal-form-group"><label>First Name *</label><input name="fn" required placeholder="Jane" autocomplete="given-name"/></div>
            <div class="cal-form-group"><label>Last Name *</label><input name="ln" required placeholder="Smith" autocomplete="family-name"/></div>
          </div>
          <div class="cal-form-group"><label>Phone Number *</label><input type="tel" name="ph" required placeholder="(651) 555-0000" autocomplete="tel"/></div>
          <div class="cal-form-group"><label>Email</label><input type="email" name="em" placeholder="jane@email.com" autocomplete="email"/></div>
          <div class="cal-form-group">
            <label>Flooring Interest *</label>
            <select name="svc" required>
              <option value="" disabled ${this.service?'':'selected'}>Select…</option>
              <option ${this.service==='Carpet'?'selected':''}>Carpet</option>
              <option ${this.service==='Hardwood'?'selected':''}>Hardwood</option>
              <option ${this.service==='Luxury Vinyl Plank (LVP)'?'selected':''}>Luxury Vinyl Plank (LVP)</option>
              <option ${this.service==='Laminate'?'selected':''}>Laminate</option>
              <option ${this.service==='Luxury Vinyl Tile (LVT)'?'selected':''}>Luxury Vinyl Tile (LVT)</option>
              <option ${this.service==='Countertops'?'selected':''}>Countertops</option>
              <option>Multiple / Not Sure Yet</option>
            </select>
          </div>
          <div class="cal-form-group"><label>Notes (optional)</label><textarea name="notes" rows="2" placeholder="Room size, current flooring, questions…"></textarea></div>
          <div class="cal-form-actions">
            <button type="button" class="cal-back">&#8592; Back</button>
            <button type="submit" class="btn btn-orange cal-submit">Confirm Consultation &#10003;</button>
          </div>
        </form>`;
    }

    bind() {
      const cp = this.el.querySelector('#cp');
      const cn = this.el.querySelector('#cn');
      if (cp) cp.addEventListener('click', () => {
        const prev = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth()-1, 1);
        if (prev >= new Date(this.today.getFullYear(), this.today.getMonth(), 1)) {
          this.viewMonth = prev; this.render();
        }
      });
      if (cn) cn.addEventListener('click', () => {
        this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth()+1, 1);
        this.render();
      });
      this.el.querySelectorAll('.cal-cell.available').forEach(c => {
        c.addEventListener('click', () => { this.selectedDate = new Date(Number(c.dataset.ts)); this.step=2; this.render(); });
      });
      this.el.querySelectorAll('.cal-time-btn').forEach(b => {
        b.addEventListener('click', () => { this.selectedTime = b.dataset.t; this.step=3; this.render(); });
      });
      const back = this.el.querySelector('.cal-back');
      if (back) back.addEventListener('click', () => { this.step--; this.render(); });
      const form = this.el.querySelector('#cbf');
      if (form) {
        form.addEventListener('submit', e => {
          e.preventDefault();
          let ok = true;
          form.querySelectorAll('[required]').forEach(f => {
            const empty = !f.value.trim();
            f.style.borderColor = empty ? 'var(--error)' : '';
            if (empty) ok = false;
          });
          if (!ok) return;
          const btn = form.querySelector('.cal-submit');
          if (btn) { btn.disabled=true; btn.textContent='Scheduling…'; }
          setTimeout(() => { this.step=4; this.render(); }, 900);
        });
        form.querySelectorAll('input,select,textarea').forEach(f =>
          f.addEventListener('input', () => f.style.borderColor='')
        );
      }
    }

    render() {
      this.el.innerHTML = this.html();
      this.bind();
    }
  }

  /* Init all calendar widgets */
  document.querySelectorAll('[data-calendar]').forEach(el => new BookingCalendar(el));

})();
