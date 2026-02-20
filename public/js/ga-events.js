// public/js/ga-events.js
/*
=============================================================
UNIVERSAL GA BUTTON TRACKING INSTRUCTIONS
=============================================================

To track ANY clickable element on ANY page:

1) Add these attributes to the button or link in HTML:

   data-ga-event="cta_click"
   data-ga-cta="YOUR_LABEL"

Example:

   <a href="/pricing/"
      class="btn btn-primary"
      data-ga-event="cta_click"
      data-ga-cta="pricing">
      View Pricing Breakdown
   </a>

2) ONLY change:
   data-ga-cta="pricing"

   Replace "pricing" with:
   contact
   book_call
   instagram
   download
   start_project
   etc.

3) DO NOT change data-ga-event.
   Keep it as:
   cta_click

Analytics Structure:
Event name: cta_click
Parameters sent:
   cta_type   → value from data-ga-cta
   page_path  → page where click occurred
   link_url   → destination
   link_text  → button text

Rules:
- Use lowercase
- Use underscores
- No spaces
- Be consistent

DO NOT create new event names unless absolutely necessary.
=============================================================
*/

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
