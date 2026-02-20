// public/js/ga-events.js
(function () {
  function trackAndFollow(e) {
    const el = e.currentTarget;
    const eventName = el.getAttribute("data-ga-event") || "cta_click";
    const href = el.getAttribute("href");

    if (typeof gtag !== "function") return; // GA not loaded yet, fail silently

    // If it's a normal link, prevent immediate nav so GA can send the event
    if (href) e.preventDefault();

    gtag("event", eventName, {
      link_url: href || null,
      link_text: (el.innerText || "").trim() || null,
      event_callback: function () {
        if (href) window.location.href = href;
      },
    });

    // Fallback navigation in case callback doesn't fire (ad blockers, network, etc.)
    if (href) setTimeout(() => (window.location.href = href), 800);
  }

  // Attach to anything with data-ga-event
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-ga-event]").forEach(function (el) {
      el.addEventListener("click", trackAndFollow);
    });
  });
})();
