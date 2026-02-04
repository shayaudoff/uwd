const MIN_FILL_SECONDS = 3;
const pageLoadedAt = Date.now();

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
  location: {
    test: (v) => v.trim().length >= 2,
    msg: "Enter your city and state."
  },
  roleInterest: {
    test: (v) => v !== "",
    msg: "Select a role interest."
  },
  experienceLevel: {
    test: (v) => v !== "",
    msg: "Select your experience level."
  },
  yearsExperience: {
    test: (v) => v !== "" && Number(v) >= 0,
    msg: "Enter your years of experience."
  },
  schooling: {
    test: (v) => v.trim().length >= 2,
    msg: "Enter schooling details or N/A."
  },
  selfTaught: {
    test: (v) => v.trim().length >= 10,
    msg: "Add details about self-learning and courses."
  },
  systemsExperience: {
    test: (v) => v.trim().length >= 20,
    msg: "Share your web systems experience."
  },
  portfolioLinks: {
    test: (v) => v.trim().length >= 6,
    msg: "Add at least one portfolio link."
  },
  biggestProject: {
    test: (v) => v.trim().length >= 20,
    msg: "Tell us about your biggest shipped project."
  },
  availability: {
    test: (v) => v !== "",
    msg: "Select your availability."
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

  const container = input.closest(".ap-field");
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

function setGroupError(groupId, errorId, msg) {
  const group = document.getElementById(groupId);
  const errEl = document.getElementById(errorId);
  if (!group || !errEl) {
    return;
  }

  if (msg) {
    group.classList.add("invalid");
    errEl.textContent = msg;
    errEl.classList.add("show");
    group.setAttribute("aria-invalid", "true");
    return;
  }

  group.classList.remove("invalid");
  errEl.textContent = "";
  errEl.classList.remove("show");
  group.removeAttribute("aria-invalid");
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

function validateWorkType() {
  const checked = document.querySelectorAll('input[name="workType"]:checked').length > 0;
  setGroupError("workTypeGroup", "err-workType", checked ? null : "Select at least one work type.");
  return checked;
}

function validateEmploymentType() {
  const selected = document.querySelector('input[name="employmentType"]:checked');
  setGroupError("employmentTypeGroup", "err-employmentType", selected ? null : "Select full-time or part-time.");
  return Boolean(selected);
}

function validateConsent() {
  const consent = document.getElementById("consent")?.checked === true;
  setGroupError("consentGroup", "err-consent", consent ? null : "You must confirm your information is accurate.");
  return consent;
}

function validateAll() {
  let allGood = true;
  Object.keys(RULES).forEach((id) => {
    if (!validateField(id)) {
      allGood = false;
    }
  });

  if (!validateEmploymentType()) {
    allGood = false;
  }
  if (!validateWorkType()) {
    allGood = false;
  }
  if (!validateConsent()) {
    allGood = false;
  }

  return allGood;
}

function showPanel(panelId) {
  document.querySelectorAll(".ap-panel").forEach((panel) => panel.classList.remove("show"));
  const form = document.getElementById("applyForm");
  if (form) {
    form.style.display = "none";
  }
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add("show");
  }
}

function hideAllPanels() {
  document.querySelectorAll(".ap-panel").forEach((panel) => panel.classList.remove("show"));
  const form = document.getElementById("applyForm");
  if (form) {
    form.style.display = "";
  }
}

function setSubmitStatus(message, type) {
  const status = document.getElementById("applySubmitStatus");
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

function resetValidationState(form) {
  form.querySelectorAll(".ap-field").forEach((field) => field.classList.remove("invalid"));
  form.querySelectorAll(".ap-error").forEach((err) => {
    err.textContent = "";
    err.classList.remove("show");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  document.querySelectorAll(".ap-reveal").forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
    revealObserver.observe(el);
  });

  Object.keys(RULES).forEach((id) => {
    const el = getField(id);
    if (!el) {
      return;
    }
    el.addEventListener("blur", () => validateField(id));
    el.addEventListener("input", () => {
      const field = el.closest(".ap-field");
      if (field && field.classList.contains("invalid")) {
        validateField(id);
      }
    });
  });

  document.querySelectorAll('input[name="workType"]').forEach((el) => {
    el.addEventListener("change", validateWorkType);
  });

  document.querySelectorAll('input[name="employmentType"]').forEach((el) => {
    el.addEventListener("change", validateEmploymentType);
  });

  const consent = document.getElementById("consent");
  if (consent) {
    consent.addEventListener("change", validateConsent);
  }

  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      setSubmitStatus("", "");
      hideAllPanels();
    });
  }

  const form = document.getElementById("applyForm");
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
    setSubmitStatus("Sending application...", "");

    const formData = new FormData(form);
    const raw = Object.fromEntries(formData.entries());
    const payload = {
      name: raw.fullName || "",
      fullName: raw.fullName || "",
      email: raw.email || "",
      phone: raw.phone || "",
      location: raw.location || "",
      roleInterest: raw.roleInterest || "",
      experienceLevel: raw.experienceLevel || "",
      yearsExperience: raw.yearsExperience || "",
      schooling: raw.schooling || "",
      selfTaught: raw.selfTaught || "",
      systemsExperience: raw.systemsExperience || "",
      portfolioLinks: raw.portfolioLinks || "",
      biggestProject: raw.biggestProject || "",
      availability: raw.availability || "",
      employmentType: raw.employmentType || "",
      workType: formData.getAll("workType"),
      consent: raw.consent || ""
    };

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Send failed");
      }

      setSubmitStatus("Application sent.", "success");
      showPanel("panelSuccess");
      form.reset();
      resetValidationState(form);
    } catch (_error) {
      setSubmitStatus("Submission failed. Please try again.", "error");
      showPanel("panelError");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit application";
    }
  });
});
