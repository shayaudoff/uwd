const MIN_FILL_SECONDS = 3;
const pageLoadedAt = Date.now();

document.addEventListener("DOMContentLoaded", () => {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll(".ct-reveal").forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.12}s`;
    revealObserver.observe(el);
  });
});

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
    test: (v) => v.trim() === "" || v.replace(/[\s\-().+]/g, "").length >= 7,
    msg: "Enter a valid phone number or leave it blank."
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
  return document.getElementById(`err-${id}`);
}

function setError(id, msg) {
  const input = getField(id);
  const errEl = getErrorSpan(id);
  if (!input || !errEl) {
    return;
  }

  const container = input.closest(".ct-field");
  if (!container) {
    return;
  }

  if (msg) {
    container.classList.add("invalid");
    errEl.textContent = msg;
    errEl.classList.add("show");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errEl.id);
    return;
  }

  container.classList.remove("invalid");
  errEl.textContent = "";
  errEl.classList.remove("show");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
}

function validateField(id) {
  const rule = RULES[id];
  const input = getField(id);
  if (!rule || !input) {
    return true;
  }

  if (rule.test(input.value)) {
    setError(id, null);
    return true;
  }

  setError(id, rule.msg);
  return false;
}

function validateAll() {
  let allGood = true;
  Object.keys(RULES).forEach((id) => {
    if (!validateField(id)) {
      allGood = false;
    }
  });
  return allGood;
}

document.addEventListener("DOMContentLoaded", () => {
  Object.keys(RULES).forEach((id) => {
    const el = getField(id);
    if (!el) {
      return;
    }

    el.addEventListener("blur", () => validateField(id));
    el.addEventListener("input", () => {
      const field = el.closest(".ct-field");
      if (field && field.classList.contains("invalid")) {
        validateField(id);
      }
    });
  });
});

function showPanel(panelId) {
  document.querySelectorAll(".ct-panel").forEach((panel) => panel.classList.remove("show"));
  const form = document.getElementById("contactForm");
  if (form) {
    form.style.display = "none";
  }
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add("show");
  }
}

function hideAllPanels() {
  document.querySelectorAll(".ct-panel").forEach((panel) => panel.classList.remove("show"));
  const form = document.getElementById("contactForm");
  if (form) {
    form.style.display = "";
  }
}

function setSubmitStatus(message, type) {
  const status = document.getElementById("contactSubmitStatus");
  if (!status) {
    return;
  }
  status.textContent = message || "";
  status.classList.remove("is-success", "is-error");
  if (type === "success") {
    status.classList.add("is-success");
  }
  if (type === "error") {
    status.classList.add("is-error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      setSubmitStatus("", "");
      hideAllPanels();
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  if (!form || !submitBtn) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateAll()) {
      return;
    }

    const hpValue = document.getElementById("hp_field")?.value || "";
    if (hpValue.trim() !== "") {
      showPanel("panelSuccess");
      return;
    }

    const elapsed = (Date.now() - pageLoadedAt) / 1000;
    if (elapsed < MIN_FILL_SECONDS) {
      showPanel("panelSuccess");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    setSubmitStatus("Sending message...", "");

    const raw = Object.fromEntries(new FormData(form).entries());
    const payload = {
      name: raw.fullName || raw.name || "",
      email: raw.email || "",
      phone: raw.phone || "",
      message: raw.message || "",
      company: raw.company || "",
      projectType: raw.projectType || "",
      budget: raw.budget || "",
      timeline: raw.timeline || ""
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Send failed");
      }

      setSubmitStatus("Message sent.", "success");
      showPanel("panelSuccess");
      form.reset();
      form.querySelectorAll(".ct-field").forEach((field) => field.classList.remove("invalid"));
      form.querySelectorAll(".ct-error").forEach((err) => {
        err.textContent = "";
        err.classList.remove("show");
      });
    } catch (_error) {
      setSubmitStatus("Send failed. Please try again.", "error");
      showPanel("panelError");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send message";
    }
  });
});
