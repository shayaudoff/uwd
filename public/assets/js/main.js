const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const isMobile = window.innerWidth <= 768;
    const parallaxElements = document.querySelectorAll('.floating-card');

    parallaxElements.forEach((el, index) => {
      const direction = index % 2 === 0 ? 1 : -1;

      if (isMobile) {
        const speed = 0.15 + (index * 0.05);
        el.style.transform = `translateY(${scrolled * speed * direction}px)`;
        return;
      }

      const speed = 0.3 + (index * 0.1);
      el.style.transform = `translateY(${scrolled * speed * direction}px) rotate(${scrolled * 0.02}deg)`;
    });
  });
}

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = ('IntersectionObserver' in window && !prefersReducedMotion)
  ? new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions)
  : null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');

  if (navToggle && nav && header) {
    const closeNav = () => {
      nav.classList.remove('is-open');
      header.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.textContent = 'Menu';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      header.classList.toggle('nav-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.textContent = isOpen ? 'Close' : 'Menu';
    });

    nav.addEventListener('click', (event) => {
      if (event.target && event.target.tagName === 'A') {
        closeNav();
      }
    });

    const mediaQuery = window.matchMedia('(min-width: 769px)');
    mediaQuery.addEventListener('change', (event) => {
      if (event.matches) {
        closeNav();
      }
    });
  }

  // Observe main sections
  const sections = document.querySelectorAll('.hero, .services-section, .process-preview, .cta-section');
  if (observer) {
    sections.forEach(section => observer.observe(section));
  } else {
    sections.forEach(section => section.classList.add('visible'));
  }
  
  // Observe service cards with stagger
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    if (observer) {
      observer.observe(card);
    } else {
      card.classList.add('visible');
    }
  });
  
  // Observe process steps
  const processSteps = document.querySelectorAll('.process-step');
  processSteps.forEach((step, index) => {
    step.style.transitionDelay = `${index * 0.15}s`;
    if (observer) {
      observer.observe(step);
    } else {
      step.classList.add('visible');
    }
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
