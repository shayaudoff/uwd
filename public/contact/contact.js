// ============================================================
// EMAILJS CONFIGURATION
// ------------------------------------------------------------
// 1.  Go to https://www.emailjs.com and create a free account.
// 2.  Create an Email Service (Gmail, Outlook, SMTP, etc.)
//     -> copy the Service ID from the dashboard sidebar.
// 3.  Create an Email Template.
//     -> In the template editor add these variables exactly:
//         {{fullName}}
//         {{email}}
//         {{phone}}
//         {{phoneIsWhatsApp}}   ("yes" or "no")
//         {{company}}
//         {{projectType}}
//         {{budget}}
//         {{timeline}}
//         {{message}}
//     -> copy the Template ID from the top of that page.
// 4.  Go to Account -> API Keys -> copy your Public Key.
// 5.  Paste all three values into the three lines below.
// ============================================================

const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID"; // <- paste here
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // <- paste here
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // <- paste here

// ============================================================
// SPAM GATE - records the timestamp when the page loads.
// If the form is submitted in under 3 seconds, it's almost
// certainly a bot. Adjust MIN_FILL_SECONDS as you like.
// ============================================================
const MIN_FILL_SECONDS = 3;
const pageLoadedAt = Date.now();

// ============================================================
// EMAILJS SDK LOADER
// Loads the official @emailjs/browser UMD build from their CDN.
// If it fails (e.g. ad-blocker) we catch it and fall back to
// the direct-email suggestion in the error panel.
// ============================================================
(function loadEmailJS() {
  const script = document.createElement("script");
  script.src = "https://cdn.emailjs.com/dist/email.min.js";
  script.onload = () => {
    if (typeof emailjs !== "undefined") {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }
  };
  script.onerror = () => {
    console.warn("[UWD] EmailJS SDK failed to load. Form will show error panel on submit.");
  };
  document.head.appendChild(script);
})();

// ============================================================
// CONFIG VALIDATION - warn early in console if keys are missing
// ============================================================
(function checkConfig() {
  const missing = [];
  if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") missing.push("SERVICE_ID");
  if (EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID") missing.push("TEMPLATE_ID");
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") missing.push("PUBLIC_KEY");
  if (missing.length) {
    console.warn(
      "[UWD Contact] EmailJS is not configured. Missing: " + missing.join(", ") +
      "\nThe form will render but submissions will fail gracefully."
    );
  }
})();

// ============================================================
// SCROLL-TRIGGERED REVEAL for .ct-reveal elements
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll(".ct-reveal").forEach((el, i) => {
    el.style.transitionDelay = (i * 0.12) + "s";
    revealObserver.observe(el);
  });
});

// ============================================================
// VALIDATION
// ============================================================

// Rules map: fieldId -> { test: (value) => bool, msg: string }
const RULES = {
  fullName: {
    test: (v) => v.trim().length >= 2,
    msg: "Please enter your full name."
  },
  email: {
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    msg: "Enter a valid email address."
  },
  phone: {
    test: (v) => v.replace(/[\s\-().+]/g, "").length >= 7,
    msg: "Enter a valid phone number."
  },
  projectType: {
    test: (v) => v !== "",
    msg: "Select a project type."
  },
  message: {
    test: (v) => v.trim().length >= 10,
    msg: "Say a bit more - at least a sentence."
  }
};

function getField(id) {
  return document.getElementById(id);
}

function getErrorSpan(id) {
  return document.getElementById("err-" + id);
}

// Show or clear an inline error for one field
function setError(id, msg) {
  const input = getField(id);
  const errEl = getErrorSpan(id);
  if (!input || !errEl) return;

  const container = input.closest(".ct-field");
  if (!container) return;

  if (msg) {
    container.classList.add("invalid");
    errEl.textContent = msg;
    errEl.classList.add("show");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errEl.id);
  } else {
    container.classList.remove("invalid");
    errEl.textContent = "";
    errEl.classList.remove("show");
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}

// Validate a single field. Returns true if valid.
function validateField(id) {
  const rule = RULES[id];
  if (!rule) return true;

  const input = getField(id);
  if (!input) return true;

  const value = input.value;
  if (rule.test(value)) {
    setError(id, null);
    return true;
  }

  setError(id, rule.msg);
  return false;
}

// Validate every required field. Returns true if ALL pass.
function validateAll() {
  let allGood = true;
  Object.keys(RULES).forEach((id) => {
    if (!validateField(id)) allGood = false;
  });
  return allGood;
}

// Wire blur listeners on every input that has a rule
document.addEventListener("DOMContentLoaded", () => {
  Object.keys(RULES).forEach((id) => {
    const el = getField(id);
    if (!el) return;

    el.addEventListener("blur", () => validateField(id));

    // Also re-validate on input so errors clear as user types
    el.addEventListener("input", () => {
      const field = el.closest(".ct-field");
      if (field && field.classList.contains("invalid")) {
        validateField(id);
      }
    });
  });
});

// ============================================================
// PANEL HELPERS
// ============================================================
function showPanel(panelId) {
  document.querySelectorAll(".ct-panel").forEach((p) => p.classList.remove("show"));
  const form = document.getElementById("contactForm");
  if (form) form.style.display = "none";
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("show");
}

function hideAllPanels() {
  document.querySelectorAll(".ct-panel").forEach((p) => p.classList.remove("show"));
  const form = document.getElementById("contactForm");
  if (form) form.style.display = "";
}

// "Try again" button restores the form
document.addEventListener("DOMContentLoaded", () => {
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", hideAllPanels);
  }
});

// ============================================================
// SUBMIT HANDLER
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Client validation
    if (!validateAll()) return;

    // 2. Honeypot check
    const hpValue = document.getElementById("hp_field")?.value || "";
    if (hpValue.trim() !== "") {
      console.warn("[UWD] Honeypot triggered.");
      showPanel("panelSuccess");
      return;
    }

    // 3. Time-on-page spam gate
    const elapsed = (Date.now() - pageLoadedAt) / 1000;
    if (elapsed < MIN_FILL_SECONDS) {
      console.warn("[UWD] Form submitted too fast (" + elapsed.toFixed(1) + "s).");
      showPanel("panelSuccess");
      return;
    }

    // 4. Check EmailJS is loaded + configured
    const keysConfigured =
      EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
      EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
      EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

    if (!keysConfigured || typeof emailjs === "undefined") {
      console.warn("[UWD] EmailJS not configured or SDK not loaded.");
      showPanel("panelError");
      return;
    }

    // 5. Disable button while sending
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // 6. Collect template params
    const params = {
      fullName: getField("fullName")?.value.trim() || "",
      email: getField("email")?.value.trim() || "",
      phone: getField("phone")?.value.trim() || "",
      phoneIsWhatsApp: document.getElementById("phoneIsWhatsApp")?.checked ? "yes" : "no",
      company: getField("company")?.value.trim() || "",
      projectType: getField("projectType")?.value || "",
      budget: getField("budget")?.value || "Not specified",
      timeline: getField("timeline")?.value || "Not specified",
      message: getField("message")?.value.trim() || ""
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);

      // 8a. Success
      showPanel("panelSuccess");
      form.reset();
      form.querySelectorAll(".ct-field").forEach((f) => f.classList.remove("invalid"));
      form.querySelectorAll(".ct-error").forEach((err) => {
        err.textContent = "";
        err.classList.remove("show");
      });
    } catch (err) {
      // 8b. Error
      console.error("[UWD] EmailJS send failed:", err);
      showPanel("panelError");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    }
  });
});
