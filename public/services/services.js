// ─── Scroll-triggered reveal for service blocks ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.svc-block').forEach(block => {
  revealObserver.observe(block);
});

// ─── Active index nav link tracking ───
const indexLinks = document.querySelectorAll('.svc-index-link');
const sections = document.querySelectorAll('.svc-block[id]');

function updateActiveLink() {
  let current = null;

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    // Section is "active" when its top edge is above the middle of the viewport
    if (rect.top <= window.innerHeight * 0.4) {
      current = section.id;
    }
  });

  indexLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
      // Scroll the nav link into view (horizontal scroll) on mobile
      link.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink(); // run once on load
