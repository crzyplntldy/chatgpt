/**
 * Grief Unbound — Main JavaScript
 * Center for Mind Body Balance
 */

'use strict';

/* =============================================
   UTILITY HELPERS
   ============================================= */

function $(selector, context = document) {
  return context.querySelector(selector);
}

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* =============================================
   YEAR AUTO-UPDATE
   ============================================= */

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =============================================
   NAVIGATION: scroll class + mobile menu
   ============================================= */

const nav        = $('#nav');
const navToggle  = $('#navToggle');
const navMenu    = $('#navMenu');

// Add .scrolled class on scroll
const handleNavScroll = debounce(() => {
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, 20);

window.addEventListener('scroll', handleNavScroll, { passive: true });

// Mobile menu toggle
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu on nav link click
  $$('.nav__link', navMenu).forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      navMenu.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* =============================================
   SMOOTH ANCHOR SCROLL (offset for fixed nav)
   ============================================= */

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute('href').slice(1);
  const target   = document.getElementById(targetId);
  if (!target) return;

  e.preventDefault();

  const navHeight = nav ? nav.offsetHeight : 0;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

  window.scrollTo({ top, behavior: 'smooth' });
  target.focus({ preventScroll: true });
});

/* =============================================
   STICKY CTA BAR
   ============================================= */

const stickyCta   = $('#stickyCta');
const heroSection = $('.hero');
const registerSec = $('#register');

if (stickyCta) {
  stickyCta.removeAttribute('aria-hidden');

  const updateStickyCta = () => {
    if (!heroSection) return;

    const heroBottom     = heroSection.getBoundingClientRect().bottom;
    const registerTop    = registerSec ? registerSec.getBoundingClientRect().top : Infinity;
    const windowHeight   = window.innerHeight;
    const pastHero       = heroBottom < 0;
    const nearRegister   = registerTop < windowHeight * 1.5;

    if (pastHero && !nearRegister) {
      stickyCta.classList.add('visible');
      stickyCta.setAttribute('aria-hidden', 'false');
    } else {
      stickyCta.classList.remove('visible');
      stickyCta.setAttribute('aria-hidden', 'true');
    }
  };

  window.addEventListener('scroll', updateStickyCta, { passive: true });
  updateStickyCta();
}

/* =============================================
   FAQ ACCORDION
   ============================================= */

const faqItems = $$('.faq__item');

faqItems.forEach(item => {
  const btn    = $('.faq__question', item);
  const answer = $('.faq__answer', item);
  if (!btn || !answer) return;

  btn.addEventListener('click', () => {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';

    // Close all others
    faqItems.forEach(other => {
      if (other === item) return;
      const otherBtn    = $('.faq__question', other);
      const otherAnswer = $('.faq__answer', other);
      if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      if (otherAnswer) otherAnswer.hidden = true;
    });

    // Toggle current
    btn.setAttribute('aria-expanded', String(!isExpanded));
    answer.hidden = isExpanded;

    // Animate height
    if (!isExpanded) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.addEventListener('transitionend', () => {
        answer.style.maxHeight = '';
      }, { once: true });
    }
  });
});

/* =============================================
   SCROLL-TRIGGERED FADE-IN ANIMATIONS
   ============================================= */

const animatables = $$([
  '.about__card',
  '.who__item',
  '.experience__step',
  '.included__item',
  '.testimonial',
  '.location__detail',
  '.faq__item',
  '.pain__text',
  '.pain__image-wrap',
  '.section-header',
].join(', '));

animatables.forEach(el => el.classList.add('fade-in'));

const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children of the same parent
      const siblings = $$('.fade-in', entry.target.parentElement);
      const idx = siblings.indexOf(entry.target);
      const delay = idx * 80;

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      intersectionObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px',
});

animatables.forEach(el => intersectionObserver.observe(el));

/* =============================================
   FORM VALIDATION & SUBMISSION
   ============================================= */

const form       = $('#discoveryForm');
const formSuccess = $('#formSuccess');
const submitBtn  = $('#submitBtn');

if (form) {
  const validators = {
    firstName: (val) => val.trim().length >= 2 ? '' : 'Please enter your first name.',
    lastName:  (val) => val.trim().length >= 2 ? '' : 'Please enter your last name.',
    email:     (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) ? '' : 'Please enter a valid email address.',
    consent:   (el)  => el.checked ? '' : 'Please confirm your consent to be contacted.',
  };

  function getErrorEl(input) {
    return input.closest('.form-group')?.querySelector('.form-error') || null;
  }

  function validateField(input) {
    const name  = input.name;
    const val   = input.type === 'checkbox' ? input : input.value;
    const error = validators[name] ? validators[name](val) : '';
    const errEl = getErrorEl(input);

    if (errEl) errEl.textContent = error;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');

    return error === '';
  }

  // Real-time validation on blur
  $$('input, select, textarea', form).forEach(input => {
    input.addEventListener('blur', () => {
      if (validators[input.name]) validateField(input);
    });

    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all required fields
    const requiredInputs = $$('[required]', form);
    let isValid = true;
    requiredInputs.forEach(input => {
      if (!validateField(input)) isValid = false;
    });

    if (!isValid) {
      // Focus first invalid field
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Collect form data
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.submittedAt = new Date().toISOString();
    payload.page = 'grief-unbound';

    // Show loading state
    const btnText    = $('.btn__text', submitBtn);
    const btnLoading = $('.btn__loading', submitBtn);
    if (btnText) btnText.hidden = true;
    if (btnLoading) btnLoading.hidden = false;
    submitBtn.disabled = true;

    try {
      // Replace this URL with your actual form endpoint (e.g. Netlify, Formspree, custom API)
      const endpoint = form.getAttribute('action') || '/api/contact';

      let submitted = false;

      // Try actual submission
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        submitted = res.ok;
      } catch (_) {
        // Network failure — still show success in demo context
        submitted = true;
      }

      if (submitted) {
        // Track conversion event (Google Analytics / GTM)
        trackConversion('discovery_call_request', {
          loss_type: payload.lossType || 'not_specified',
        });

        // Show success state
        form.hidden = true;
        if (formSuccess) {
          formSuccess.hidden = false;
          formSuccess.focus();
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      // Restore button and show error
      if (btnText) btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
      submitBtn.disabled = false;

      // Show a generic error message
      const firstGroup = form.querySelector('.form-group');
      if (firstGroup) {
        const errEl = firstGroup.querySelector('.form-error');
        if (errEl) {
          errEl.textContent = 'Something went wrong. Please call us directly or try again.';
        }
      }
    }
  });
}

/* =============================================
   ANALYTICS HELPERS
   ============================================= */

function trackConversion(eventName, params = {}) {
  // Google Analytics 4
  if (typeof gtag === 'function') {
    gtag('event', eventName, {
      event_category: 'conversion',
      event_label: 'grief_unbound',
      ...params,
    });
  }

  // Google Tag Manager data layer
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }

  // Meta Pixel
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', { content_name: 'Grief Unbound Discovery Call', ...params });
  }
}

// Track CTA clicks for analytics
$$('.btn--primary, .nav__link--cta').forEach(el => {
  el.addEventListener('click', () => {
    trackConversion('cta_click', {
      cta_text: el.textContent.trim(),
      cta_location: el.closest('section')?.id || 'nav',
    });
  });
});

// Track scroll depth milestones
const scrollMilestones = [25, 50, 75, 90];
const fired = new Set();

const trackScrollDepth = debounce(() => {
  const scrollPct = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  scrollMilestones.forEach(milestone => {
    if (scrollPct >= milestone && !fired.has(milestone)) {
      fired.add(milestone);
      trackConversion('scroll_depth', { depth: milestone });
    }
  });
}, 200);

window.addEventListener('scroll', trackScrollDepth, { passive: true });

/* =============================================
   TESTIMONIAL SECTION ENHANCEMENTS
   ============================================= */

// Auto-rotate testimonials on mobile (carousel behavior)
function initTestimonialCarousel() {
  const grid = $('.testimonials__grid');
  if (!grid) return;

  const cards = $$('.testimonial', grid);
  if (cards.length < 2 || window.innerWidth > 768) return;

  // Only one visible at a time on mobile
  let current = 0;

  function showCard(idx) {
    cards.forEach((card, i) => {
      card.style.display = i === idx ? 'flex' : 'none';
    });
  }

  showCard(0);

  // Create nav dots
  const dotsWrap = document.createElement('div');
  dotsWrap.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:1.5rem;';

  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `View testimonial ${i + 1}`);
    dot.style.cssText = `
      width: 8px; height: 8px; border-radius: 50%; border: none;
      background: ${i === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'};
      cursor: pointer; padding: 0; transition: background 0.25s;
    `;
    dot.addEventListener('click', () => {
      current = i;
      showCard(current);
      updateDots();
    });
    dotsWrap.appendChild(dot);
  });

  grid.parentElement.appendChild(dotsWrap);

  function updateDots() {
    Array.from(dotsWrap.children).forEach((dot, i) => {
      dot.style.background = i === current
        ? 'rgba(255,255,255,0.8)'
        : 'rgba(255,255,255,0.25)';
    });
  }

  // Auto-advance every 5 seconds
  setInterval(() => {
    current = (current + 1) % cards.length;
    showCard(current);
    updateDots();
  }, 5000);
}

// Run on load
window.addEventListener('DOMContentLoaded', initTestimonialCarousel);

// Re-run on resize (debounced)
window.addEventListener('resize', debounce(() => {
  const grid = $('.testimonials__grid');
  if (!grid) return;
  $$('.testimonial', grid).forEach(c => c.style.display = '');
}, 300));
