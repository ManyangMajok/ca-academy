// Main JS for CA Academy (keeps existing behavior from the inline demo)

document.addEventListener('DOMContentLoaded', () => {
  // year
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // nav scrolled state
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // scroll reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // paid strategy toggle
  const paidChk = document.getElementById('paidChk');
  const budgetWrap = document.getElementById('budgetWrap');
  if (paidChk && budgetWrap) paidChk.addEventListener('change', () => {
    budgetWrap.style.display = paidChk.checked ? 'block' : 'none';
  });

  // form handling (front-end demo only — no backend)
  function wire(formId, okId){
    const f = document.getElementById(formId);
    const ok = document.getElementById(okId);
    if(!f || !ok) return;
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let valid = true;
      f.querySelectorAll('[required]').forEach(inp => {
        if(!inp.value.trim()){ inp.style.borderColor = 'var(--flame-deep)'; valid = false; }
        else { inp.style.borderColor = ''; }
      });
      if(!valid) return;
      ok.classList.add('show');
      f.querySelectorAll('input,select,textarea').forEach(i => { if(i.type!=='checkbox') i.value=''; });
      ok.scrollIntoView({ behavior:'smooth', block:'center' });
    });
  }
  ['webinarForm','guideForm','fbForm','joinForm'].forEach((id,i) =>
    wire(id, ['webinarOk','guideOk','fbOk','joinOk'][i]));

  // hidden personalized-guide modal
  const guideModal = document.getElementById('guideModal');
  window.openGuide = function(){ if(guideModal){ guideModal.classList.add('open'); guideModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }}
  window.closeGuide = function(){ if(guideModal){ guideModal.classList.remove('open'); guideModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }}
  if(guideModal){ guideModal.addEventListener('click', e => { if(e.target === guideModal) closeGuide(); }); }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeGuide(); });
});
