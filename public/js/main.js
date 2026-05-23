// Main JS for CA Academy — Updated to call backend API

const API_URL = process.env.API_URL || '/api';

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

  // form submission handler with backend API
  function wire(formId, endpoint, okId){
    const f = document.getElementById(formId);
    const ok = document.getElementById(okId);
    if(!f || !ok) return;
    
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      
      // Validate required fields
      let valid = true;
      f.querySelectorAll('[required]').forEach(inp => {
        if(!inp.value.trim()){ 
          inp.style.borderColor = 'var(--flame-deep)'; 
          valid = false; 
        } else { 
          inp.style.borderColor = ''; 
        }
      });
      if(!valid) return;
      
      // Collect form data
      const formData = new FormData(f);
      const data = Object.fromEntries(formData);
      
      // Convert checkboxes to boolean
      f.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        data[cb.name] = cb.checked;
      });
      
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          ok.classList.add('show');
          f.querySelectorAll('input,select,textarea').forEach(i => { 
            if(i.type!=='checkbox') i.value=''; 
            if(i.type==='checkbox') i.checked = false;
          });
          ok.scrollIntoView({ behavior:'smooth', block:'center' });
        } else {
          alert(`Error: ${result.error || 'Something went wrong'}`);
        }
      } catch (err) {
        console.error('Form submission error:', err);
        alert('Error submitting form. Please try again.');
      }
    });
  }
  
  // Wire all forms to their endpoints
  wire('webinarForm', '/webinar', 'webinarOk');
  wire('guideForm', '/guide', 'guideOk');
  wire('fbForm', '/feedback', 'fbOk');
  wire('joinForm', '/join', 'joinOk');

  // hidden personalized-guide modal
  const guideModal = document.getElementById('guideModal');
  window.openGuide = function(){ 
    if(guideModal){ 
      guideModal.classList.add('open'); 
      guideModal.setAttribute('aria-hidden','false'); 
      document.body.style.overflow='hidden'; 
    }
  }
  window.closeGuide = function(){ 
    if(guideModal){ 
      guideModal.classList.remove('open'); 
      guideModal.setAttribute('aria-hidden','true'); 
      document.body.style.overflow=''; 
    }
  }
  if(guideModal){ 
    guideModal.addEventListener('click', e => { 
      if(e.target === guideModal) closeGuide(); 
    }); 
  }
  document.addEventListener('keydown', e => { 
    if(e.key === 'Escape') closeGuide(); 
  });
});
