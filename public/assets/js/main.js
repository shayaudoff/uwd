// Parallax scroll effect for floating cards
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll('.floating-card');
  
  parallaxElements.forEach((el, index) => {
    const speed = 0.3 + (index * 0.1);
    const direction = index % 2 === 0 ? 1 : -1;
    el.style.transform = `translateY(${scrolled * speed * direction}px) rotate(${scrolled * 0.02}deg)`;
  });
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Observe main sections
  const sections = document.querySelectorAll('.hero, .services-section, .process-preview, .cta-section');
  sections.forEach(section => observer.observe(section));
  
  // Observe service cards with stagger
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });
  
  // Observe process steps
  const processSteps = document.querySelectorAll('.process-step');
  processSteps.forEach((step, index) => {
    step.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(step);
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
