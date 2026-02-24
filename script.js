/* ============================================================
   AquaFix — Vodoinstalater | script.js
   Vanilla JS — no dependencies required
   ============================================================ */

'use strict';

/* ── Utility helpers ─────────────────────────────────────────── */

/**
 * Shorthand querySelector
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element|null}
 */
const qs  = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand querySelectorAll → real Array
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element[]}
 */
const qsa = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Run callback after DOM is ready
 * @param {Function} fn
 */
const onReady = fn => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn, { once: true });
};

/* ── 1. Navigation — Burger Menu ────────────────────────────── */
function initBurgerMenu() {
  const burger  = qs('#navBurger');
  const menu    = qs('#navMenu');
  const navLinks = qsa('.nav__link', menu);

  if (!burger || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close when a nav link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      burger.focus();
    }
  });

  // Close when clicking outside the menu
  document.addEventListener('click', e => {
    if (
      menu.classList.contains('is-open') &&
      !menu.contains(e.target) &&
      !burger.contains(e.target)
    ) {
      closeMenu();
    }
  });
}

/* ── 2. Header — scroll state ───────────────────────────────── */
function initHeaderScroll() {
  const header = qs('#header');
  if (!header) return;

  let ticking = false;

  function updateHeader() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });

  // Run once on init
  updateHeader();
}

/* ── 3. Sticky CTA Bar — show after hero ─────────────────────── */
function initStickyCta() {
  const stickyCta = qs('#stickyCta');
  const hero      = qs('#hero');
  if (!stickyCta || !hero) return;

  // Only show sticky bar on smaller screens (CSS also hides it ≥1024px)
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        stickyCta.classList.add('is-visible');
      } else {
        stickyCta.classList.remove('is-visible');
      }
    },
    { rootMargin: '-80px 0px 0px 0px', threshold: 0 }
  );

  observer.observe(hero);
}

/* ── 4. Smooth Scroll for anchor links ───────────────────────── */
function initSmoothScroll() {
  // Native scroll-behavior: smooth is set in CSS.
  // This function ensures correct offset compensation for the sticky nav.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = qs(targetId);
      if (!target) return;

      e.preventDefault();

      const navH    = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
      const offset  = 16;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navH - offset;

      window.scrollTo({ top: targetY, behavior: 'smooth' });

      // Update URL hash without jumping
      history.pushState(null, '', targetId);
    });
  });
}

/* ── 5. Scroll-driven Animations (IntersectionObserver) ─────── */
function initScrollAnimations() {
  // Elements with data-animate="fade-up"
  const animEls = qsa('[data-animate="fade-up"]');

  // Why-cards (have their own class-based system)
  const whyCards = qsa('.why-card');

  const allObserved = [...animEls, ...whyCards];

  if (!allObserved.length || !('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    allObserved.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Animate once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  allObserved.forEach(el => observer.observe(el));
}

/* ── 6. Stats Counter Animation ─────────────────────────────── */
function initCounters() {
  const statNums = qsa('.stat__num[data-target]');
  if (!statNums.length) return;

  /**
   * Animate a number from start to end
   * @param {HTMLElement} el
   * @param {number} target
   * @param {number} duration ms
   */
  function animateCounter(el, target, duration = 1600) {
    const start     = performance.now();
    const startVal  = 0;
    const suffix    = el.dataset.suffix || '';

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current  = Math.round(startVal + (target - startVal) * easeOutExpo(progress));

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    statNums.forEach(el => animateCounter(el, parseInt(el.dataset.target, 10)));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.target, 10);
          if (!isNaN(target)) {
            animateCounter(entry.target, target);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statNums.forEach(el => observer.observe(el));
}

/* ── 7. Contact Form Validation ──────────────────────────────── */
function initContactForm() {
  const form        = qs('#contactForm');
  const submitBtn   = qs('#formSubmit');
  const successMsg  = qs('#formSuccess');

  if (!form) return;

  /* Validation rules */
  const rules = {
    formName: {
      required: true,
      minLength: 2,
      messages: {
        required  : 'Ime i prezime su obavezni.',
        minLength : 'Unesite puno ime (minimum 2 karaktera).',
      },
    },
    formPhone: {
      required : true,
      pattern  : /^[+]?[\d\s\-().]{7,20}$/,
      messages : {
        required : 'Broj telefona je obavezan.',
        pattern  : 'Unesite ispravan broj telefona.',
      },
    },
    formMessage: {
      required  : true,
      minLength : 10,
      messages  : {
        required  : 'Opis problema je obavezan.',
        minLength : 'Opišite problem detaljnije (min. 10 karaktera).',
      },
    },
  };

  /**
   * Validate a single field
   * @param {HTMLInputElement|HTMLTextAreaElement} field
   * @returns {string} Error message or empty string if valid
   */
  function validateField(field) {
    const rule = rules[field.id];
    if (!rule) return '';

    const val = field.value.trim();

    if (rule.required && !val) {
      return rule.messages.required;
    }
    if (val && rule.minLength && val.length < rule.minLength) {
      return rule.messages.minLength;
    }
    if (val && rule.pattern && !rule.pattern.test(val)) {
      return rule.messages.pattern;
    }
    return '';
  }

  /**
   * Show/clear error state for a field
   * @param {HTMLElement} field
   * @param {string} message
   */
  function setFieldError(field, message) {
    const errorEl = qs(`#${field.id}Error`);

    if (message) {
      field.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      if (errorEl) errorEl.textContent = message;
    } else {
      field.classList.remove('is-invalid');
      field.setAttribute('aria-invalid', 'false');
      if (errorEl) errorEl.textContent = '';
    }
  }

  /* Live validation on blur */
  Object.keys(rules).forEach(id => {
    const field = qs(`#${id}`, form);
    if (!field) return;

    field.addEventListener('blur', () => {
      const error = validateField(field);
      setFieldError(field, error);
    });

    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) {
        const error = validateField(field);
        setFieldError(field, error);
      }
    });
  });

  /* Submit handler */
  form.addEventListener('submit', e => {
    e.preventDefault();

    let isValid = true;
    let firstInvalidField = null;

    Object.keys(rules).forEach(id => {
      const field = qs(`#${id}`, form);
      if (!field) return;

      const error = validateField(field);
      setFieldError(field, error);

      if (error) {
        isValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (!isValid) {
      firstInvalidField?.focus();
      return;
    }

    /* ─ Simulate form submission (replace with fetch/backend call) ─ */
    submitBtn.disabled = true;
    submitBtn.textContent = 'Šaljem...';
    submitBtn.style.opacity = '0.7';

    // Simulate async (e.g. fetch to backend or FormSpree)
    setTimeout(() => {
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Pošalji upit
      `;
      submitBtn.style.opacity = '';

      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Hide success message after 6s
        setTimeout(() => { successMsg.hidden = true; }, 6000);
      }

      // Clear all invalid states
      Object.keys(rules).forEach(id => {
        const field = qs(`#${id}`, form);
        if (field) setFieldError(field, '');
      });
    }, 900);
  });
}

/* ── 8. Active Nav Link on Scroll ────────────────────────────── */
function initActiveNavLink() {
  const sections = qsa('main [id]');
  const navLinks = qsa('.nav__link[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  function getActiveSection() {
    const scrollY = window.scrollY;
    const navH    = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
    const offset  = navH + 32;

    let active = null;
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top + scrollY;
      if (scrollY >= top - offset) {
        active = section.id;
      }
    });
    return active;
  }

  function updateActiveLink() {
    const activeId = getActiveSection();

    navLinks.forEach(link => {
      const href = link.getAttribute('href').slice(1); // strip #
      if (href === activeId) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('is-active');
      }
    });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateActiveLink();
}

/* ── 9. Add active-link CSS rule dynamically ─────────────────── */
function injectActiveLinkStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .nav__link.is-active:not(.nav__link--cta) {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.10);
    }
  `;
  document.head.appendChild(style);
}

/* ── 10. Prefers-reduced-motion guard ────────────────────────── */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── 11. Lazy-load font fallback ─────────────────────────────── */
function ensureFontLoad() {
  if (!('fonts' in document)) return;
  document.fonts.ready.then(() => {
    document.documentElement.classList.add('fonts-loaded');
  });
}

/* ── 12. Hero CTA micro-interaction — ripple on click ────────── */
function initButtonRipple() {
  if (prefersReducedMotion()) return;

  // Inject ripple CSS once
  const style = document.createElement('style');
  style.textContent = `
    .btn { position: relative; overflow: hidden; }
    .btn-ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: btn-ripple-anim .55s linear;
      background: rgba(255,255,255,.28);
      pointer-events: none;
    }
    @keyframes btn-ripple-anim {
      to { transform: scale(4); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  qsa('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;

      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });
}

/* ── 13. Process steps — staggered reveal ────────────────────── */
function initProcessReveal() {
  if (prefersReducedMotion()) return;

  const steps = qsa('.process-step');
  if (!steps.length || !('IntersectionObserver' in window)) return;

  // Set initial state
  steps.forEach((step, i) => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(24px)';
    step.style.transition = `opacity 0.55s ease ${i * 0.12}s, transform 0.55s cubic-bezier(.22,1,.36,1) ${i * 0.12}s`;
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
  );

  steps.forEach(step => observer.observe(step));
}

/* ── 14. Service cards — staggered reveal ────────────────────── */
function initServiceCardReveal() {
  if (prefersReducedMotion()) return;

  const cards = qsa('.service-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${i * 0.07}s`;
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );

  cards.forEach(card => observer.observe(card));
}

/* ── 15. Testimonial cards — staggered reveal ────────────────── */
function initTestimonialReveal() {
  if (prefersReducedMotion()) return;

  const cards = qsa('.testimonial-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(18px)';
    card.style.transition = `opacity 0.55s ease ${i * 0.1}s, transform 0.55s cubic-bezier(.22,1,.36,1) ${i * 0.1}s`;
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach(card => observer.observe(card));
}

/* ── 16. Scroll-to-top on logo click ─────────────────────────── */
function initLogoScrollTop() {
  qsa('.nav__logo').forEach(logo => {
    logo.addEventListener('click', e => {
      const href = logo.getAttribute('href');
      if (href === '#' || href === '') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState(null, '', ' ');
      }
    });
  });
}

/* ── 17. Phone number copy on long-press (mobile UX) ─────────── */
function initPhoneCopy() {
  const phoneLinks = qsa('a[href^="tel:"]');

  phoneLinks.forEach(link => {
    let pressTimer = null;

    link.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        const number = link.href.replace('tel:', '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(number).then(() => {
            showToast('Broj kopiran u clipboard!');
          }).catch(() => {});
        }
      }, 700);
    }, { passive: true });

    ['touchend', 'touchmove', 'touchcancel'].forEach(evt => {
      link.addEventListener(evt, () => clearTimeout(pressTimer), { passive: true });
    });
  });
}

/* ── Toast notification ──────────────────────────────────────── */
function showToast(message, duration = 3000) {
  // Remove existing toast
  const existing = qs('.aq-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'aq-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  // Inject toast styles once
  if (!qs('#aq-toast-style')) {
    const style = document.createElement('style');
    style.id = 'aq-toast-style';
    style.textContent = `
      .aq-toast {
        position: fixed;
        bottom: calc(72px + 12px);
        left: 50%;
        transform: translateX(-50%) translateY(0);
        background: #03045e;
        color: #caf0f8;
        font-family: 'Inter', sans-serif;
        font-size: .875rem;
        font-weight: 500;
        padding: .65rem 1.4rem;
        border-radius: 9999px;
        box-shadow: 0 8px 28px rgba(3,4,94,.35);
        z-index: 9999;
        white-space: nowrap;
        animation: toast-in .3s cubic-bezier(.34,1.56,.64,1) forwards;
        border: 1px solid rgba(72,202,228,.25);
      }
      .aq-toast.aq-toast--out {
        animation: toast-out .25s ease forwards;
      }
      @keyframes toast-in  { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      @keyframes toast-out { from { opacity:1; } to { opacity:0; transform:translateX(-50%) translateY(8px); } }
      @media (min-width: 1024px) { .aq-toast { bottom: 20px; } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('aq-toast--out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ── 18. Viewport height fix for mobile browsers ─────────────── */
function initViewportHeightFix() {
  function setVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  setVh();
  window.addEventListener('resize', setVh, { passive: true });
}

/* ── 19. Performance: passive scroll listeners check ─────────── */
function addPassiveScrollStyle() {
  // CSS scroll snap / perf hint — nothing needed in JS,
  // all scroll listeners above already use { passive: true } where applicable.
}

/* ── 20. Scroll Progress Bar ─────────────────────────────────── */
function initScrollProgress() {
  const bar = qs('#scrollProgress');
  if (!bar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const docH    = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docH > 0 ? (window.scrollY / docH) * 100 : 0;
        bar.style.width = percent + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── 21. Hero Parallax on mouse move ────────────────────────── */
function initHeroParallax() {
  if (prefersReducedMotion()) return;

  const hero    = qs('.hero');
  const bubbles = qsa('.hero__bubble');
  if (!hero || !bubbles.length) return;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const cx   = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 to 0.5
    const cy   = (e.clientY - rect.top)  / rect.height - 0.5;

    bubbles.forEach((bubble, i) => {
      const depth = (i + 1) * 10;
      bubble.style.transform = `translate(${cx * depth}px, ${cy * depth}px)`;
    });
  });

  hero.addEventListener('mouseleave', () => {
    bubbles.forEach(bubble => {
      bubble.style.transform = '';
      bubble.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
    });
    setTimeout(() => {
      bubbles.forEach(b => b.style.transition = '');
    }, 800);
  });
}

/* ── 22. Service card 3D tilt on hover (desktop) ─────────────── */
function initCardTilt() {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(hover: none)').matches) return; // skip touch devices

  const cards = qsa('.service-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const x     = (e.clientX - rect.left) / rect.width  - 0.5;
      const y     = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX = +(y * -6).toFixed(2);
      const tiltY = +(x *  6).toFixed(2);

      card.style.transform = `translateY(-5px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      card.style.transition = 'transform .1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform .4s cubic-bezier(.22,1,.36,1), box-shadow .42s cubic-bezier(.22,1,.36,1), border-color .42s';
    });
  });
}

/* ── 23. Why card counter badge on hover ─────────────────────── */
function initWhyCardHover() {
  if (prefersReducedMotion()) return;

  qsa('.why-card').forEach(card => {
    const num = card.querySelector('.why-card__num');
    if (!num) return;

    card.addEventListener('mouseenter', () => {
      num.style.color    = 'rgba(255,255,255,.09)';
      num.style.fontSize = '3.4rem';
      num.style.transition = 'font-size .3s cubic-bezier(.34,1.56,.64,1), color .3s';
    });
    card.addEventListener('mouseleave', () => {
      num.style.fontSize = '';
      num.style.color    = '';
    });
  });
}

/* ── 24. Stat suffix display (+ or %) ───────────────────────── */
function patchStatSuffixes() {
  const map = { 197: '+', 15: '+', 98: '%', 60: '' };
  qsa('.stat__num[data-target]').forEach(el => {
    const t = parseInt(el.dataset.target, 10);
    if (map[t] !== undefined) el.dataset.suffix = map[t];
  });
}

/* ── 25. Section headers reveal ─────────────────────────────── */
function initSectionHeaderReveal() {
  if (prefersReducedMotion()) return;
  const headers = qsa('.section-header');
  if (!headers.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  headers.forEach(h => observer.observe(h));
}

/* ── 26. Hero title word-by-word reveal ─────────────────────── */
function initHeroTitleReveal() {
  if (prefersReducedMotion()) return;

  const title = qs('.hero__title');
  if (!title) return;

  // Wrap each word (preserving <br> and <span> structure)
  title.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(word => {
        if (word.trim()) {
          const span = document.createElement('span');
          span.className = 'hero__title-word';
          span.textContent = word;
          frag.appendChild(span);
        } else if (word) {
          frag.appendChild(document.createTextNode(word));
        }
      });
      node.replaceWith(frag);
    }
  });

  // Stagger delay for each word span
  qsa('.hero__title-word', title).forEach((word, i) => {
    word.style.animationDelay = `${.12 + i * .08}s`;
  });
}

/* ── 27. Testimonial alternate slide-in ─────────────────────── */
function initTestimonialSlide() {
  if (prefersReducedMotion()) return;

  const cards = qsa('.testimonial-card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  cards.forEach(c => observer.observe(c));
}

/* ── 28. Process connector line draw ────────────────────────── */
function initConnectorDraw() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(min-width: 800px)').matches) return;

  const connectors = qsa('.process-step__connector');
  if (!connectors.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.closest('.process-step').classList.add('is-connector-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  connectors.forEach(c => observer.observe(c));
}

/* ── 29. Area list reveal ────────────────────────────────────── */
function initAreaListReveal() {
  if (prefersReducedMotion()) return;

  const list = qs('.area__list');
  if (!list || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        list.classList.add('is-visible');
        observer.unobserve(list);
      }
    },
    { threshold: 0.3 }
  );
  observer.observe(list);
}

/* ── 30. Service card overlay inject ────────────────────────── */
function initServiceCardOverlay() {
  qsa('.service-card').forEach(card => {
    if (!card.querySelector('.service-card__overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'service-card__overlay';
      card.prepend(overlay);
    }
  });
}

/* ── 31. Submit button loading class ────────────────────────── */
function patchFormSubmitButton() {
  const form      = qs('#contactForm');
  const submitBtn = qs('#formSubmit');
  if (!form || !submitBtn) return;

  const origSubmit = form.onsubmit;
  form.addEventListener('submit', () => {
    // Add spinner class — removed when reset in initContactForm timeout
    setTimeout(() => submitBtn.classList.add('btn--submitting'), 0);
    setTimeout(() => submitBtn.classList.remove('btn--submitting'), 900);
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
onReady(() => {
  ensureFontLoad();
  initViewportHeightFix();
  injectActiveLinkStyle();

  initBurgerMenu();
  initHeaderScroll();
  initStickyCta();
  initSmoothScroll();
  initActiveNavLink();
  initLogoScrollTop();

  initScrollProgress();

  if (!prefersReducedMotion()) {
    initScrollAnimations();
    initProcessReveal();
    initServiceCardReveal();
    initTestimonialReveal();
    initButtonRipple();
    initHeroParallax();
    initCardTilt();
    initWhyCardHover();
    // ── nove animacije ──
    initHeroTitleReveal();
    initSectionHeaderReveal();
    initTestimonialSlide();
    initConnectorDraw();
    initAreaListReveal();
  } else {
    // Immediately show all animated elements for reduced-motion users
    qsa('[data-animate="fade-up"], .why-card, .service-card, .process-step, .testimonial-card')
      .forEach(el => {
        el.style.opacity   = '1';
        el.style.transform = 'none';
        el.classList.add('is-visible');
      });
    // pokazati section headere i za reduced-motion korisnike
    qsa('.section-header').forEach(h => h.classList.add('is-visible'));
  }

  patchStatSuffixes();
  initCounters();
  initContactForm();
  initPhoneCopy();
  initServiceCardOverlay();
  patchFormSubmitButton();
});

// New animations
if (!prefersReducedMotion()) {
  initHeroTitleReveal();
  initSectionHeaderReveal();
  initTestimonialSlide();
  initConnectorDraw();
  initAreaListReveal();
}

initServiceCardOverlay();
patchFormSubmitButton();
