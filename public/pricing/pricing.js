// ============================================================
// SPAM GATE
// ============================================================
const MIN_FILL_SECONDS = 4;
const pageLoadedAt     = Date.now();

// ============================================================
// BUDGET PRESETS (rendered into #budgetBtns based on tier)
// ============================================================
const BUDGET_PRESETS = {
  micro:    ['$50–$100','$100–$250','$250–$600','$600–$1,500','$1,500+'],
  website:  ['$1,500–$4,000','$4,000–$12,000','$12,000–$25,000','$25,000–$60,000','$60,000+'],
  platform: ['$25k–$150k','$150k–$750k','$750k–$2M','$2M–$5M','$5M–$20M+']
};

// ============================================================
// STATE
// ============================================================
let selectedTier     = '';   // micro | website | platform
let currentStep      = 0;
let selectedBudget   = '';
let selectedTimeline = '';
let selectedStyle    = '';

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll reveal ──
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.pr-reveal').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.08) + 's';
    revealObs.observe(el);
  });

  // Also observe every major pricing section for reveal
  document.querySelectorAll('.pr-starter-card, .pr-micro-card, .pr-pkg-card, .pr-custom-card, .pr-retainer-card, .pr-how-item, .pr-faq-item, .pr-addon-row').forEach((el, i) => {
    el.classList.add('pr-reveal');
    el.style.transitionDelay = (i % 6) * 0.07 + 's';
    revealObs.observe(el);
  });

  // ── Sticky index nav: active link tracking + smooth scroll ──
  const indexLinks = document.querySelectorAll('.pr-index-link');
  const indexedSections = Array.from(indexLinks)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateActiveIndexLink() {
    let currentId = indexedSections[0] ? indexedSections[0].id : null;
    indexedSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.38) currentId = section.id;
    });

    indexLinks.forEach(link => {
      const isActive = link.getAttribute('href') === '#' + currentId;
      link.classList.toggle('active', isActive);
      if (isActive) link.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });
  }

  indexLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  window.addEventListener('scroll', updateActiveIndexLink, { passive: true });
  updateActiveIndexLink();

  // ── Starter cards (page section) ↔ form type buttons sync ──
  const starterCards = document.querySelectorAll('.pr-starter-card');
  const formTypeBtns = document.querySelectorAll('.pr-type-btn');
  const tierSectionByCard = { micro: 'micro', website: 'website', platform: 'platform' };

  function setTier(tier) {
    selectedTier = tier;

    // sync starter cards
    starterCards.forEach(c => c.setAttribute('aria-pressed', c.dataset.tier === tier ? 'true' : 'false'));

    // sync form type buttons
    formTypeBtns.forEach(b => b.classList.toggle('active', b.dataset.tier === tier));

    // sync step-2 conditional panels
    document.querySelectorAll('.pr-conditional').forEach(panel => {
      panel.classList.toggle('hidden', panel.dataset.show !== tier);
    });

    // clear budget selection when tier changes (presets change)
    selectedBudget = '';
    document.getElementById('est-budget').value = '';
    renderBudgetPresets();

    clearError('tier');
  }

  starterCards.forEach(card => {
    card.addEventListener('click', () => {
      const tier = card.dataset.tier;
      setTier(tier);
      const detailsId = tierSectionByCard[tier];
      const detailsSection = detailsId ? document.getElementById(detailsId) : null;
      if (detailsSection) detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  formTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTier(btn.dataset.tier);
      goToStep(1);
    });
  });

  // ── Clickable detail cards: select, glow, and scroll to estimate form ──
  const detailCardConfigs = [
    { selector: '.pr-micro-card', tier: 'micro' },
    { selector: '.pr-pkg-card', tier: 'website' },
    { selector: '.pr-custom-card', tier: 'platform' },
    { selector: '.pr-retainer-card', tier: 'website' }
  ];

  detailCardConfigs.forEach(({ selector, tier }) => {
    document.querySelectorAll(selector).forEach(card => {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-pressed', 'false');

      const activate = () => {
        const group = card.parentElement;
        if (group) {
          group.querySelectorAll(selector).forEach(item => {
            item.classList.remove('pr-choice-card-active');
            item.setAttribute('aria-pressed', 'false');
          });
        }
        card.classList.add('pr-choice-card-active');
        card.setAttribute('aria-pressed', 'true');
        setTier(tier);
        goToStep(0, false);
        const formSection = document.getElementById('estimate-form');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      card.addEventListener('click', activate);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  });

  // ── Style direction pills ──
  document.querySelectorAll('.pr-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pr-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStyle = btn.dataset.style;
      document.getElementById('est-styleDir').value = selectedStyle;
    });
  });

  // ── Timeline buttons ──
  document.querySelectorAll('.pr-tl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pr-tl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTimeline = btn.dataset.tl;
      document.getElementById('est-timeline').value = selectedTimeline;
      clearError('est-timeline');

      // rush notice
      document.getElementById('rushNotice').classList.toggle('hidden', selectedTimeline !== 'ASAP (rush)');
    });
  });

  // ── Step navigation ──
  document.querySelectorAll('.pr-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.target, 10);
      if (validateStep(currentStep)) {
        goToStep(target);
      }
    });
  });

  document.querySelectorAll('.pr-back').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.target, 10)));
  });

  // ── "Get an Estimate" hero button — scroll + open step 0 ──
  document.querySelectorAll('a[href="#estimate-form"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('estimate-form').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Submit ──
  document.getElementById('estimateForm').addEventListener('submit', handleSubmit);

  // ── Retry ──
  document.getElementById('formRetryBtn').addEventListener('click', () => {
    document.querySelectorAll('.pr-panel').forEach(p => p.classList.remove('show'));
    document.getElementById('estimateForm').style.display = '';
    setSubmitStatus('', '');
  });
});

// ============================================================
// STEP NAVIGATION
// ============================================================
function goToStep(n, shouldScroll = true) {
  // hide all
  document.querySelectorAll('.pr-step-panel').forEach(p => p.classList.add('hidden'));
  // show target
  const targetStep = document.getElementById('step' + n);
  targetStep.classList.remove('hidden');

  // update dots
  document.querySelectorAll('.pr-step-dot').forEach((d, i) => d.classList.toggle('active', i === n));

  currentStep = n;

  // render budget presets when landing on step 4
  if (n === 4) renderBudgetPresets();

  if (shouldScroll) targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// BUDGET PRESET RENDERER
// ============================================================
function renderBudgetPresets() {
  const container = document.getElementById('budgetBtns');
  container.innerHTML = '';
  const presets = BUDGET_PRESETS[selectedTier] || BUDGET_PRESETS.website;
  presets.forEach(label => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pr-budget-btn' + (selectedBudget === label ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pr-budget-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedBudget = label;
      document.getElementById('est-budget').value = label;
      clearError('est-budget');
    });
    container.appendChild(btn);
  });
}

// ============================================================
// VALIDATION
// ============================================================

// Static rules — always checked on their step
const STATIC_RULES = {
  // step 1
  'est-name':  { step: 1, test: v => v.trim().length >= 2,                            msg: 'Enter your full name.' },
  'est-email': { step: 1, test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),    msg: 'Enter a valid email.' },

  // step 3
  'est-designScope': { step: 3, test: () => {
    return document.querySelector('input[name="designScope"]:checked') !== null;
  }, msg: 'Pick a design scope.' },

  // step 4  (budget + timeline use hidden inputs)
  'est-budget':   { step: 4, test: v => v !== '', msg: 'Pick a budget range.' },
  'est-timeline': { step: 4, test: v => v !== '', msg: 'Pick a timeline.' },

  // step 5
  'est-desc':    { step: 5, test: v => v.trim().length >= 10, msg: 'Describe the project in a sentence or two.' },
  'est-consent': { step: 5, test: () => document.getElementById('est-consent').checked, msg: 'Please accept to continue.' }
};

// Dynamic rules — depend on selectedTier, checked on step 2
function getDynamicRules() {
  if (selectedTier === 'micro') {
    return {
      'est-microType': { test: v => v !== '', msg: 'Pick a service type.' },
      'est-microDesc': { test: v => v.trim().length >= 5, msg: 'Describe the task.' }
    };
  }
  if (selectedTier === 'website') {
    return {
      'est-siteType': { test: v => v !== '', msg: 'Pick a website type.' },
      'est-pages':    { test: v => v !== '', msg: 'How many pages?' }
    };
  }
  if (selectedTier === 'platform') {
    return {
      'est-prodType': { test: v => v !== '', msg: 'Pick a product type.' },
      'est-features': { test: () => document.querySelectorAll('input[name="features"]:checked').length > 0, msg: 'Select at least one feature.' }
    };
  }
  return {};
}

function getFieldValue(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  return el.value || '';
}

function setError(id, msg) {
  const errEl = document.getElementById('err-' + id);
  if (!errEl) return;

  const input = document.getElementById(id);
  const container = input ? input.closest('.pr-field') : null;

  if (msg) {
    if (container) container.classList.add('invalid');
    errEl.textContent = msg;
    errEl.classList.add('show');
  } else {
    if (container) container.classList.remove('invalid');
    errEl.textContent = '';
    errEl.classList.remove('show');
  }
}

function clearError(id) { setError(id, null); }

// Validate a single step. Returns true if valid.
function validateStep(step) {
  let ok = true;

  // step 0: tier must be picked
  if (step === 0) {
    if (!selectedTier) {
      setError('tier', 'Pick a project type to continue.');
      ok = false;
    } else {
      clearError('tier');
    }
    return ok;
  }

  // step 2: dynamic rules
  if (step === 2) {
    const dynRules = getDynamicRules();
    Object.keys(dynRules).forEach(id => {
      const rule  = dynRules[id];
      const value = getFieldValue(id);
      if (!rule.test(value)) { setError(id, rule.msg); ok = false; }
      else                   { clearError(id); }
    });
    return ok;
  }

  // all other steps: check static rules for that step number
  Object.keys(STATIC_RULES).forEach(id => {
    const rule = STATIC_RULES[id];
    if (rule.step !== step) return;
    const value = getFieldValue(id);
    if (!rule.test(value)) { setError(id, rule.msg); ok = false; }
    else                   { clearError(id); }
  });

  return ok;
}

// Full validation (all steps) — run before submit
function validateAll() {
  let ok = true;
  for (let s = 0; s <= 5; s++) {
    if (!validateStep(s)) ok = false;
  }
  return ok;
}

// ============================================================
// SUBMIT HANDLER
// ============================================================
async function handleSubmit(e) {
  e.preventDefault();

  // 1. validate current (last) step only — previous steps were gated
  if (!validateStep(5)) return;

  // 2. honeypot
  if ((document.getElementById('pr_hp')?.value || '').trim() !== '') {
    showPanel('formSuccess'); return;
  }

  // 3. time gate
  if ((Date.now() - pageLoadedAt) / 1000 < MIN_FILL_SECONDS) {
    showPanel('formSuccess'); return;
  }

  // 4. disable
  const btn = document.getElementById('estimateSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  setSubmitStatus('Sending request...', '');

  // 5. send
  try {
    const form = document.getElementById('estimateForm');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.tier = selectedTier || payload.tier || '';
    payload.name = payload.fullName || payload.name || '';
    payload.details = payload.details || payload.description || payload.message || payload.notes || payload.microDesc || '';
    payload.budget_range = payload.budget_range || payload.budget || '';

    ['features', 'compliance', 'access', 'services'].forEach((key) => {
      const values = formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
      if (values.length === 1) payload[key] = values[0];
      if (values.length > 1) payload[key] = values;
    });

    if (!payload.services) {
      const fallbackServices = [
        payload.projectType,
        payload.microType,
        payload.siteType,
        payload.prodType,
        payload.designScope
      ].filter(Boolean);
      if (Array.isArray(payload.features)) fallbackServices.push(...payload.features);
      if (typeof payload.features === 'string') fallbackServices.push(payload.features);
      if (fallbackServices.length) payload.services = fallbackServices;
    }

    const response = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Send failed');
    }

    setSubmitStatus('Estimate request sent.', 'success');
    showPanel('formSuccess');
    form.reset();
    selectedTier = ''; selectedBudget = ''; selectedTimeline = ''; selectedStyle = '';
    document.querySelectorAll('.pr-starter-card').forEach(c => c.setAttribute('aria-pressed','false'));
    document.querySelectorAll('.pr-choice-card-active').forEach(c => c.classList.remove('pr-choice-card-active'));
    document.querySelectorAll('.pr-micro-card, .pr-pkg-card, .pr-custom-card, .pr-retainer-card').forEach(c => c.setAttribute('aria-pressed', 'false'));
    document.querySelectorAll('.pr-type-btn, .pr-budget-btn, .pr-tl-btn, .pr-style-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('est-styleDir').value = '';
    document.getElementById('est-budget').value   = '';
    document.getElementById('est-timeline').value = '';
    goToStep(0, false);
  } catch (_err) {
    setSubmitStatus('Send failed. Please try again.', 'error');
    showPanel('formError');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Request Estimate';
  }
}

// ============================================================
// PANEL HELPERS
// ============================================================
function showPanel(id) {
  document.querySelectorAll('.pr-panel').forEach(p => p.classList.remove('show'));
  document.getElementById('estimateForm').style.display = 'none';
  document.getElementById(id).classList.add('show');
}

function setSubmitStatus(message, type) {
  const status = document.getElementById('estimateSubmitStatus');
  if (!status) return;
  status.textContent = message || '';
  status.classList.remove('is-success', 'is-error');
  if (type === 'success') status.classList.add('is-success');
  if (type === 'error') status.classList.add('is-error');
}
