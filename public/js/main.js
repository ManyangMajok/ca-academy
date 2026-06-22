document.addEventListener('DOMContentLoaded', () => {
  // theme toggle
  const root = document.documentElement;
  const saved = localStorage.getItem('ca-theme');
  if (saved) root.setAttribute('data-theme', saved);
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('ca-theme', next);
  });

  // year
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // nav scrolled state
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // mobile menu
  const burgerBtn = document.getElementById('burgerBtn');
  const navlinks = document.querySelector('.navlinks');
  if (burgerBtn && navlinks) {
    burgerBtn.addEventListener('click', () => {
      navlinks.classList.toggle('open');
      document.body.style.overflow = navlinks.classList.contains('open') ? 'hidden' : '';
    });
    navlinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navlinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // paid strategy budget toggle
  const paidChk = document.getElementById('paidChk');
  const budgetWrap = document.getElementById('budgetWrap');
  if (paidChk && budgetWrap) paidChk.addEventListener('change', () => {
    budgetWrap.style.display = paidChk.checked ? 'block' : 'none';
  });

  // form handler — validates required fields then shows success (no API call)
  function wire(formId, okId) {
    const f = document.getElementById(formId);
    const ok = document.getElementById(okId);
    if (!f || !ok) return;
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let valid = true;
      f.querySelectorAll('[required]').forEach(inp => {
        if (!inp.value.trim()) { inp.style.borderColor = 'var(--error)'; valid = false; }
        else { inp.style.borderColor = ''; }
      });
      if (!valid) return;
      if (formId === 'webinarForm') {
        const fname = f.querySelector('[name="fname"]').value;
        const lname = f.querySelector('[name="lname"]').value;
        const email = f.querySelector('[name="email"]').value;
        
        const cFname = document.getElementById('chkFname');
        const cLname = document.getElementById('chkLname');
        const cEmail = document.getElementById('chkEmail');
        if (cFname) cFname.value = fname;
        if (cLname) cLname.value = lname;
        if (cEmail) cEmail.value = email;
        
        if (window.openCheckout && window.showCheckoutStep) {
          window.openCheckout();
          window.showCheckoutStep(2);
        }
        return; // Skip normal success behavior
      }

      ok.classList.add('show');
      f.querySelectorAll('input, select, textarea').forEach(i => {
        if (i.type !== 'checkbox') i.value = '';
        else i.checked = false;
      });
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  wire('webinarForm',  'webinarOk');
  wire('guideForm',    'guideOk');
  wire('joinForm',     'joinOk');
  wire('waitlistForm', 'waitlistOk');

  // personalized-guide modal
  const guideModal = document.getElementById('guideModal');
  window.openGuide = function () {
    if (guideModal) { guideModal.classList.add('open'); guideModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  };
  window.closeGuide = function () {
    if (guideModal) { guideModal.classList.remove('open'); guideModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  };
  if (guideModal) guideModal.addEventListener('click', e => { if (e.target === guideModal) closeGuide(); });
  
  // CHECKOUT MODAL LOGIC
  const checkoutModal = document.getElementById('checkoutModal');
  
  window.openCheckout = function (upsellId) {
    if (checkoutModal) {
      checkoutModal.classList.add('open');
      checkoutModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Reset to Step 1
      showCheckoutStep(1);
      
      // If an upsell is passed, pre-select it and skip to step 2
      if (upsellId) {
        let chk;
        if (upsellId === 'system') chk = document.getElementById('chkUpsellSystem');
        else if (upsellId === 'formula') chk = document.getElementById('chkUpsellFormula');
        else if (upsellId === 'strategy') chk = document.getElementById('chkUpsellStrategy');
        
        if (chk) chk.checked = true;
        updateCheckoutTotal();
        showCheckoutStep(2);
      }
    }
  };

  window.closeCheckout = function () {
    if (checkoutModal) {
      checkoutModal.classList.remove('open');
      checkoutModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      
      // reset form
      const ok = document.getElementById('chkOk');
      if (ok) ok.style.display = 'none';
      const f3 = document.getElementById('chkForm3');
      const btn = document.getElementById('chkPayBtn');
      if (f3) f3.reset();
      if (btn) btn.disabled = false;
    }
  };

  window.showCheckoutStep = function(stepNum) {
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById('chkStep' + i);
      const ind = document.getElementById('chkStepInd' + i);
      if (step) step.style.display = (i === stepNum) ? 'block' : 'none';
      if (ind) {
        if (i === stepNum) ind.classList.add('active');
        else ind.classList.remove('active');
      }
    }
  };

  window.nextCheckoutStep = function(stepNum) {
    showCheckoutStep(stepNum);
  };
  
  window.prevCheckoutStep = function(stepNum) {
    showCheckoutStep(stepNum);
  };

  window.updateCheckoutTotal = function() {
    let total = 0;
    const upsells = ['chkUpsellSystem', 'chkUpsellFormula', 'chkUpsellStrategy'];
    upsells.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) {
        total += parseFloat(el.value);
      }
    });
    const disp = document.getElementById('chkTotalDisplay');
    if (disp) disp.textContent = '$' + total.toFixed(2);
  };

  window.submitCheckout = function() {
    const ok = document.getElementById('chkOk');
    const btn = document.getElementById('chkPayBtn');
    if (btn) btn.disabled = true;
    if (ok) {
      ok.style.display = 'block';
      // Redirect back to home page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  if (checkoutModal) checkoutModal.addEventListener('click', e => { if (e.target === checkoutModal) closeCheckout(); });
  
  document.addEventListener('keydown', e => { 
    if (e.key === 'Escape') {
      closeGuide(); 
      if (window.closeCheckout) closeCheckout();
    }
  });
});
