(() => {
  // --- Scroll-triggered reveal ---
  // Shared observer config - matches services.js threshold.
  const procObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  });

  // Timeline steps - staggered so each one cascades in.
  document.querySelectorAll(".proc-step").forEach((step, i) => {
    step.style.transitionDelay = (i * 0.1) + "s";
    procObserver.observe(step);
  });

  // FAQ items - short stagger.
  document.querySelectorAll(".proc-faq-item").forEach((item, i) => {
    item.style.transitionDelay = (i * 0.12) + "s";
    procObserver.observe(item);
  });
})();
