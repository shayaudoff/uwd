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
let isSubmitting     = false;
const TIER_LABELS = {
  micro: 'Quick Fix / Micro',
  website: 'Website Build',
  platform: 'Platform / App'
};

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pr-panel').forEach(p => p.classList.remove('show'));
  const initialForm = document.getElementById('estimateForm');
  if (initialForm) initialForm.style.display = '';

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
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = parseInt(btn.dataset.target, 10);
      if (validateStep(currentStep)) {
        goToStep(target, false);

        const nextStep = document.getElementById('step' + target);
        if (!nextStep) return;

        const header = nextStep.querySelector('.pr-step-title') || nextStep;
        const rect = header.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;
        if (isVisible) return;

        const rawTargetY = window.scrollY + rect.top - (window.innerHeight * 0.3);
        const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const targetY = Math.min(Math.max(0, rawTargetY), maxScrollY);
        window.scrollTo({ top: targetY, behavior: 'smooth' });
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
  const estimateForm = document.getElementById('estimateForm');
  if (estimateForm && estimateForm.dataset.submitBound !== 'true') {
    estimateForm.addEventListener('submit', handleSubmit);
    estimateForm.dataset.submitBound = 'true';
  }

  // ── Retry ──
  document.getElementById('formRetryBtn').addEventListener('click', () => {
    document.querySelectorAll('.pr-panel').forEach(p => p.classList.remove('show'));
    document.getElementById('estimateForm').style.display = '';
    setSubmitStatus('', '');
    goToStep(0, false);
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

  const form = document.getElementById('estimateForm');
  if (!form) return;
  if (isSubmitting) return;

  // 1. strict final validation for all required data
  if (!validateAll()) {
    setSubmitStatus('Please complete all required fields before sending.', 'error');
    return;
  }

  const formData = new FormData(form);
  const name = (formData.get('fullName') || '').toString().trim();
  const email = (formData.get('email') || '').toString().trim();
  const phone = (formData.get('phone') || '').toString().trim();
  const budget = (formData.get('budget') || '').toString().trim();
  const timeline = (formData.get('timeline') || '').toString().trim();
  const description = (formData.get('description') || '').toString().trim();
  const consentChecked = (document.getElementById('est-consent')?.checked === true) || Boolean(formData.get('consent'));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!selectedTier) { setSubmitStatus('Please select a project type.', 'error'); return; }
  if (!name) { setSubmitStatus('Please enter your full name.', 'error'); return; }
  if (!email || !emailOk) { setSubmitStatus('Please enter a valid email address.', 'error'); return; }
  if (!budget) { setSubmitStatus('Please pick a budget range.', 'error'); return; }
  if (!timeline) { setSubmitStatus('Please pick a timeline.', 'error'); return; }
  if (!description) { setSubmitStatus('Please add a project description.', 'error'); return; }
  if (!consentChecked) { setSubmitStatus('Please accept the estimate acknowledgment.', 'error'); return; }

  if (selectedTier === 'micro') {
    const microType = (formData.get('microType') || '').toString().trim();
    const microDesc = (formData.get('microDesc') || '').toString().trim();
    if (!microType || !microDesc) {
      setSubmitStatus('Please complete micro service type and task description.', 'error');
      return;
    }
  }
  if (selectedTier === 'website') {
    const siteType = (formData.get('siteType') || '').toString().trim();
    const pages = (formData.get('pages') || '').toString().trim();
    if (!siteType || !pages) {
      setSubmitStatus('Please choose website type and number of pages.', 'error');
      return;
    }
  }
  if (selectedTier === 'platform') {
    const prodType = (formData.get('prodType') || '').toString().trim();
    const features = formData.getAll('features').map(v => String(v).trim()).filter(Boolean);
    if (!prodType || features.length === 0) {
      setSubmitStatus('Please choose product type and at least one feature.', 'error');
      return;
    }
  }

  // 2. honeypot
  if ((document.getElementById('pr_hp')?.value || '').trim() !== '') {
    setSubmitStatus('Unable to submit.', 'error');
    return;
  }

  // 3. time gate
  if ((Date.now() - pageLoadedAt) / 1000 < MIN_FILL_SECONDS) {
    setSubmitStatus('Please take a few seconds to complete the form, then submit again.', 'error');
    return;
  }

  // 4. disable
  const btn = document.getElementById('estimateSubmitBtn');
  isSubmitting = true;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  setSubmitStatus('Sending…', '');

  // 5. send
  try {
    const microType = (formData.get('microType') || '').toString().trim();
    const siteType = (formData.get('siteType') || '').toString().trim();
    const pages = (formData.get('pages') || '').toString().trim();
    const cms = (formData.get('cms') || '').toString().trim();
    const features = formData.getAll('features').map(v => String(v).trim()).filter(Boolean);

    let services = [];
    if (selectedTier === 'micro') {
      services = ['micro', microType].filter(Boolean);
    } else if (selectedTier === 'website') {
      services = [
        'website',
        siteType ? `siteType:${siteType}` : '',
        pages ? `pages:${pages}` : '',
        cms ? `cms:${cms}` : ''
      ].filter(Boolean);
    } else if (selectedTier === 'platform') {
      services = features.length ? features : ['platform'];
    }

    const listOrDefault = (items) => items.length ? items.join(', ') : 'Not provided';
    const checkedValue = (group) => (formData.get(group) || '').toString().trim() || 'Not provided';
    const checkedList = (group) => formData.getAll(group).map(v => String(v).trim()).filter(Boolean);
    const selectedOptionText = (() => {
      const activeBtn = document.querySelector('.pr-type-btn.active');
      if (activeBtn && activeBtn.textContent) return activeBtn.textContent.trim();
      const matched = document.querySelector(`.pr-type-btn[data-tier="${selectedTier}"]`);
      return matched && matched.textContent ? matched.textContent.trim() : 'Not provided';
    })();
    const tierLabel = TIER_LABELS[selectedTier] || selectedTier || 'Not provided';
    const tierHeader = `Tier: ${tierLabel}${selectedTier ? ` (${selectedTier})` : ''}`;

    const selectedTierDetails = (() => {
      if (selectedTier === 'micro') {
        return [
          '[Selected Tier Details: Micro]',
          `Service Type: ${microType || 'Not provided'}`,
          `Task Description: ${(formData.get('microDesc') || '').toString().trim() || 'Not provided'}`,
          `Relevant URL: ${(formData.get('microUrl') || '').toString().trim() || 'Not provided'}`
        ];
      }
      if (selectedTier === 'website') {
        return [
          '[Selected Tier Details: Website]',
          `Website Type: ${siteType || 'Not provided'}`,
          `Pages: ${pages || 'Not provided'}`,
          `CMS: ${cms || 'Not provided'}`,
          `Content Status: ${(formData.get('content') || '').toString().trim() || 'Not provided'}`,
          `Brand Assets: ${checkedValue('brandAssets')}`
        ];
      }
      return [
        '[Selected Tier Details: Platform]',
        `Product Type: ${(formData.get('prodType') || '').toString().trim() || 'Not provided'}`,
        `Features: ${listOrDefault(features)}`,
        `Compliance: ${listOrDefault(checkedList('compliance'))}`
      ];
    })();

    const details = [
      tierHeader,
      `Selected option text: ${selectedOptionText}`,
      '',
      `Name: ${name || 'Not provided'}`,
      `Email: ${email || 'Not provided'}`,
      `Phone: ${phone || 'Not provided'}`,
      `Company: ${(formData.get('company') || '').toString().trim() || 'Not provided'}`,
      `Contact Method: ${checkedValue('contactMethod')}`,
      '',
      ...selectedTierDetails,
      '',
      '[Design]',
      `Design Scope: ${checkedValue('designScope')}`,
      `Style Direction: ${(formData.get('styleDirection') || '').toString().trim() || 'Not provided'}`,
      `Ref 1: ${(formData.get('ref1') || '').toString().trim() || 'Not provided'}`,
      `Ref 2: ${(formData.get('ref2') || '').toString().trim() || 'Not provided'}`,
      `Ref 3: ${(formData.get('ref3') || '').toString().trim() || 'Not provided'}`,
      `Must Keep: ${(formData.get('mustKeep') || '').toString().trim() || 'Not provided'}`,
      '',
      '[Budget & Timeline]',
      `Budget: ${budget || 'Not provided'}`,
      `Timeline: ${timeline || 'Not provided'}`,
      '',
      '[Technical & Logistics]',
      `Has Domain: ${checkedValue('hasDomain')}`,
      `Hosting: ${(formData.get('hosting') || '').toString().trim() || 'Not provided'}`,
      `Current Site: ${(formData.get('currentSite') || '').toString().trim() || 'Not provided'}`,
      `Access Readiness: ${listOrDefault(checkedList('access'))}`,
      `NDA Needed: ${checkedValue('nda')}`,
      `Source: ${(formData.get('source') || '').toString().trim() || 'Not provided'}`,
      `Consent: ${consentChecked ? 'Yes' : 'No'}`,
      '',
      '[Final Description]',
      description
    ].join('\n');

    const payload = {
      tier: selectedTier,
      name,
      email,
      phone,
      budget,
      timeline,
      services,
      details
    };

    const response = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Send failed');
    }

    setSubmitStatus('Request sent ✅', 'success');
    showPanel('formSuccess');
    resetEstimateFormState(form);
    goToStep(0, false);
  } catch (_err) {
    setSubmitStatus('Send failed. Please try again.', 'error');
    showPanel('formError');
  } finally {
    isSubmitting = false;
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

function resetEstimateFormState(form) {
  form.reset();
  selectedTier = '';
  selectedBudget = '';
  selectedTimeline = '';
  selectedStyle = '';
  document.querySelectorAll('.pr-starter-card').forEach(c => c.setAttribute('aria-pressed','false'));
  document.querySelectorAll('.pr-choice-card-active').forEach(c => c.classList.remove('pr-choice-card-active'));
  document.querySelectorAll('.pr-micro-card, .pr-pkg-card, .pr-custom-card, .pr-retainer-card').forEach(c => c.setAttribute('aria-pressed', 'false'));
  document.querySelectorAll('.pr-type-btn, .pr-budget-btn, .pr-tl-btn, .pr-style-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('est-styleDir').value = '';
  document.getElementById('est-budget').value   = '';
  document.getElementById('est-timeline').value = '';
}
