'use strict';

// ── State ──────────────────────────────────────────
let _token = null;
let _leads = [], _guides = [], _mailing = [], _feedback = [], _waitlist = [];
const API = () => window.location.origin + '/api';
const fmt = d => d ? new Date(d).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : '—';
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── Boot ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('adm');
  const savedEmail = sessionStorage.getItem('admEmail');
  if (saved) {
    _token = saved;
    bootShell(savedEmail || '');
    loadAll();
  }

  // Enter key on login
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('loginEmail').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // Hamburger + overlay + close button
  document.getElementById('menuBtn').addEventListener('click', openSidebar);
  document.getElementById('sbClose').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  // Close drawer on Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      goTo(btn.dataset.pg);
      closeSidebar();
    });
  });

  // Live search
  setupSearch('q-leads',    () => renderLeads(filtered(_leads, ['fname','lname','email'], document.getElementById('q-leads').value)));
  setupSearch('q-guides',   () => renderGuides(filtered(_guides, ['gname','gemail','gcity'], document.getElementById('q-guides').value)));
  setupSearch('q-mailing',  () => renderMailing(filtered(_mailing, ['jemail'], document.getElementById('q-mailing').value)));
  setupSearch('q-feedback', () => renderFeedback(filtered(_feedback, ['fname','femail'], document.getElementById('q-feedback').value)));
  setupSearch('q-waitlist', () => renderWaitlist(filtered(_waitlist, ['wname','wemail'], document.getElementById('q-waitlist').value)));

  // Broadcast preview
  document.getElementById('bc-subj')?.addEventListener('input', updatePreview);
  document.getElementById('bc-body')?.addEventListener('input', updatePreview);
});

function setupSearch(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', fn);
}

function filtered(arr, fields, q) {
  if (!q.trim()) return arr;
  const lq = q.toLowerCase();
  return arr.filter(r => fields.some(f => String(r[f]||'').toLowerCase().includes(lq)));
}

// ── Login / Logout ─────────────────────────────────
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  errEl.style.display = 'none';

  if (!email || !pass) { showLoginErr('Enter email and password'); return; }

  const btn = document.querySelector('#loginWrap .btn');
  btn.disabled = true; btn.textContent = 'Signing in…';

  try {
    const res  = await fetch(`${API()}/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok || !data.success) { showLoginErr(data.message || 'Invalid credentials'); return; }

    _token = data.token;
    sessionStorage.setItem('adm', _token);
    sessionStorage.setItem('admEmail', email);
    bootShell(email);
    loadAll();
  } catch (e) {
    showLoginErr('Connection error — is the server running?');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
}

function showLoginErr(msg) {
  const el = document.getElementById('loginErr');
  el.textContent = msg; el.style.display = 'block';
}

function doLogout() {
  sessionStorage.removeItem('adm');
  sessionStorage.removeItem('admEmail');
  _token = null;
  document.getElementById('shell').classList.remove('on');
  document.getElementById('loginWrap').style.display = 'flex';
  document.getElementById('loginPass').value = '';
}

function bootShell(email) {
  document.getElementById('loginWrap').style.display = 'none';
  document.getElementById('shell').classList.add('on');
  document.getElementById('sbEmail').textContent = email;
  // Add transition class after paint so sidebar doesn't flash-animate on login
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.getElementById('sb').classList.add('animated');
  }));
}

// ── Fetch helper ───────────────────────────────────
async function api(path, opts = {}) {
  opts.headers = { ...(opts.headers||{}), 'X-Admin-Key': _token };
  const res = await fetch(`${API()}${path}`, opts);
  if (res.status === 401) { doLogout(); return null; }
  return res.json();
}

// ── Navigation ─────────────────────────────────────
function goTo(pg) {
  document.querySelectorAll('.pg').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));

  const page = document.getElementById(`pg-${pg}`);
  const btn  = document.querySelector(`.nav-btn[data-pg="${pg}"]`);
  if (page) page.classList.add('on');
  if (btn)  btn.classList.add('on');

  const titles = {
    dashboard:'Dashboard', leads:'Webinar Leads', guides:'Guide Requests',
    mailing:'Mailing List', countdown:'Countdown', feedback:'Feedback Links',
    waitlist:'Blueprint Waitlist', broadcast:'Broadcast Email'
  };
  document.getElementById('tbTitle').textContent = titles[pg] || pg;

  if (pg === 'leads')     renderLeads(_leads);
  if (pg === 'guides')    renderGuides(_guides);
  if (pg === 'mailing')   renderMailing(_mailing);
  if (pg === 'feedback')  renderFeedback(_feedback);
  if (pg === 'waitlist')  renderWaitlist(_waitlist);
  if (pg === 'countdown') loadCountdown();
  if (pg === 'broadcast') {
    document.getElementById('aud-leads').textContent   = _leads.length;
    document.getElementById('aud-mailing').textContent = _mailing.length;
    document.getElementById('aud-guides').textContent  = _guides.length;
    document.getElementById('aud-waitlist').textContent= _waitlist.length;
  }
}

// ── Sidebar (mobile) ───────────────────────────────
function openSidebar() {
  document.getElementById('sb').classList.add('open');
  document.getElementById('overlay').classList.add('on');
  document.body.classList.add('drawer-open');
}
function closeSidebar() {
  document.getElementById('sb').classList.remove('open');
  document.getElementById('overlay').classList.remove('on');
  document.body.classList.remove('drawer-open');
}

// ── Load all data ──────────────────────────────────
async function loadAll() {
  const [leads, guides, mailing, feedback, waitlist] = await Promise.all([
    api('/admin/leads'),
    api('/admin/guides'),
    api('/admin/mailing'),
    api('/admin/feedback'),
    api('/admin/waitlist')
  ]);
  _leads    = leads    || [];
  _guides   = guides   || [];
  _mailing  = mailing  || [];
  _feedback = feedback || [];
  _waitlist = waitlist || [];
  renderDashboard();
}

// ── Dashboard ──────────────────────────────────────
function renderDashboard() {
  document.getElementById('cnt-leads').textContent   = _leads.length;
  document.getElementById('cnt-guides').textContent  = _guides.length;
  document.getElementById('cnt-mailing').textContent = _mailing.length;
  document.getElementById('cnt-feedback').textContent= _feedback.length;
  document.getElementById('cnt-waitlist').textContent= _waitlist.length;

  const items = [];
  _leads.slice(0,4).forEach(l => items.push({
    icon:'fa-calendar-check', color:'rgba(255,106,26,.15)', ic:'#FF6A1A',
    html:`<strong>${esc(l.fname)} ${esc(l.lname)}</strong> registered for webinar &mdash; <em>${esc(l.slot)}</em>`,
    date: l.created_at
  }));
  _mailing.slice(0,3).forEach(m => items.push({
    icon:'fa-envelope', color:'rgba(156,160,166,.15)', ic:'#9AA0A6',
    html:`<strong>${esc(m.jemail)}</strong> joined the mailing list`,
    date: m.created_at
  }));
  _guides.slice(0,2).forEach(g => items.push({
    icon:'fa-book', color:'rgba(242,183,5,.15)', ic:'#F2B705',
    html:`<strong>${esc(g.gname)}</strong> requested a personalized guide`,
    date: g.created_at
  }));
  _waitlist.slice(0,3).forEach(w => items.push({
    icon:'fa-star', color:'rgba(107,63,160,.15)', ic:'#9B6FD4',
    html:`<strong>${esc(w.wname)}</strong> joined the Blueprint waitlist`,
    date: w.created_at
  }));

  items.sort((a,b) => new Date(b.date) - new Date(a.date));

  document.getElementById('recentFeed').innerHTML = items.length
    ? items.slice(0,8).map(it => `
        <div class="act-item">
          <div class="act-ico" style="background:${it.color}"><i class="fas ${it.icon}" style="color:${it.ic}"></i></div>
          <div style="flex:1">
            <div style="font-size:13px">${it.html}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${fmt(it.date)}</div>
          </div>
        </div>`).join('')
    : '<div style="color:var(--muted);font-size:13px;padding:8px 0">No activity yet</div>';
}

// ── Webinar Leads ──────────────────────────────────
function renderLeads(rows) {
  document.getElementById('sub-leads').textContent = `${_leads.length} total registration${_leads.length !== 1 ? 's' : ''}`;
  const tb = document.getElementById('tb-leads');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="6" class="empty">No webinar leads yet</td></tr>`; return; }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.fname)} ${esc(r.lname)}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 7px;border-radius:2px;font-size:11px">${esc(r.email)}</code></td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="${esc(r.stage)}">${esc(r.stage)||'—'}</td>
      <td>${esc(r.slot)||'—'}</td>
      <td>${r.mailing_list ? '<span class="chip g">Yes</span>' : '<span class="chip m">No</span>'}</td>
      <td style="color:var(--muted)">${fmt(r.created_at)}</td>
    </tr>`).join('');
}

// ── Guide Requests ─────────────────────────────────
function renderGuides(rows) {
  document.getElementById('sub-guides').textContent = `${_guides.length} total request${_guides.length !== 1 ? 's' : ''}`;
  const tb = document.getElementById('tb-guides');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="6" class="empty">No guide requests yet</td></tr>`; return; }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.gname)}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 7px;border-radius:2px;font-size:11px">${esc(r.gemail)}</code></td>
      <td>${esc(r.gcity)||'—'}</td>
      <td>${esc(r.grev)||'—'}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis" title="${esc(r.gnote)}">${esc((r.gnote||'').substring(0,35))}${r.gnote&&r.gnote.length>35?'…':''}</td>
      <td style="color:var(--muted)">${fmt(r.created_at)}</td>
    </tr>`).join('');
}

// ── Mailing List ───────────────────────────────────
function renderMailing(rows) {
  document.getElementById('sub-mailing').textContent = `${_mailing.length} subscriber${_mailing.length !== 1 ? 's' : ''}`;
  const tb = document.getElementById('tb-mailing');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="3" class="empty">No subscribers yet</td></tr>`; return; }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 7px;border-radius:2px;font-size:11px">${esc(r.jemail)}</code></td>
      <td style="color:var(--muted)">${fmt(r.created_at)}</td>
      <td><button class="btn btn-d" style="padding:6px 12px;font-size:11px" onclick="removeMailing('${esc(r.jemail)}')">Remove</button></td>
    </tr>`).join('');
}

async function removeMailing(email) {
  if (!confirm(`Remove ${email} from mailing list?`)) return;
  const res = await api(`/admin/mailing/${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (res?.success) {
    _mailing = _mailing.filter(m => m.jemail !== email);
    renderMailing(_mailing);
    document.getElementById('cnt-mailing').textContent = _mailing.length;
  }
}

// ── Feedback Links ─────────────────────────────────
function renderFeedback(rows) {
  document.getElementById('sub-feedback').textContent = `${_feedback.length} link${_feedback.length !== 1 ? 's' : ''} generated`;
  const tb = document.getElementById('tb-feedback');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="6" class="empty">No feedback links yet</td></tr>`; return; }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.fname)}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 7px;border-radius:2px;font-size:11px">${esc(r.femail)}</code></td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis" title="${esc(r.fwhat)}">${esc((r.fwhat||'—').substring(0,35))}</td>
      <td>${r.paid ? '<span class="chip g">Yes</span>' : '<span class="chip m">No</span>'}</td>
      <td>${r.used ? '<span class="chip y">Used</span>' : '<span class="chip m">Pending</span>'}</td>
      <td style="color:var(--muted)">${fmt(r.created_at)}</td>
    </tr>`).join('');
}

// ── Blueprint Waitlist ─────────────────────────────
function renderWaitlist(rows) {
  document.getElementById('sub-waitlist').textContent = `${_waitlist.length} on the waitlist`;
  const tb = document.getElementById('tb-waitlist');
  if (!rows.length) { tb.innerHTML = `<tr><td colspan="4" class="empty">No waitlist entries yet</td></tr>`; return; }
  tb.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.wname)}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 7px;border-radius:2px;font-size:11px">${esc(r.wemail)}</code></td>
      <td>${esc(r.wstage)||'—'}</td>
      <td style="color:var(--muted)">${fmt(r.created_at)}</td>
    </tr>`).join('');
}

// ── Countdown ──────────────────────────────────────
async function loadCountdown() {
  const data = await api('/admin/countdown');
  const box  = document.getElementById('cd-status');
  const clrBtn = document.getElementById('cd-clear');

  if (!data || !data.is_active) {
    box.innerHTML = `<div style="color:var(--muted);font-size:13px"><i class="fas fa-circle-xmark" style="margin-right:8px"></i>No active countdown — website looks normal</div>`;
    clrBtn.style.display = 'none';
    return;
  }

  const target = new Date(data.target_datetime);
  const live   = target - Date.now() <= 0;
  const color  = live ? '#22c55e' : '#C9A84C';

  box.innerHTML = `
    <div class="cd-active">
      <span class="cd-dot" style="background:${color}"></span>
      <div>
        <div style="font-weight:700;color:${color};margin-bottom:6px">${live ? '🔴 LIVE NOW' : '✅ ACTIVE'} — ${esc(data.title)}</div>
        <div style="font-size:13px;color:var(--dim);line-height:1.8">
          <div><strong>Target:</strong> ${target.toLocaleString()}</div>
          <div><strong>Link:</strong> <a href="${esc(data.webinar_link)}" target="_blank" rel="noopener" style="color:var(--flame);word-break:break-all">${esc(data.webinar_link)}</a></div>
        </div>
      </div>
    </div>`;
  clrBtn.style.display = 'inline-flex';

  // Pre-fill form
  const local = new Date(target.getTime() - target.getTimezoneOffset() * 60000);
  document.getElementById('cd-dt').value    = local.toISOString().slice(0, 16);
  document.getElementById('cd-title').value = data.title || 'Free Webinar';
  document.getElementById('cd-link').value  = data.webinar_link || '';
}

async function saveCountdown(e) {
  e.preventDefault();
  const title = document.getElementById('cd-title').value.trim() || 'Free Webinar';
  const dt    = document.getElementById('cd-dt').value;
  const link  = document.getElementById('cd-link').value.trim();
  if (!dt || !link) { showAlert('cd-err', 'Date/time and link are required'); return; }

  const btn = document.getElementById('cd-save');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

  const res = await api('/admin/countdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, target_datetime: dt, webinar_link: link })
  });

  btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Launch Countdown';
  if (res?.success) { showAlert('cd-ok', 'Countdown live! Refresh the public site to see it.'); loadCountdown(); }
  else showAlert('cd-err', res?.message || 'Failed to save');
}

async function clearCountdown() {
  if (!confirm('Remove the countdown from the website?')) return;
  const res = await api('/admin/countdown', { method: 'DELETE' });
  if (res?.success) { showAlert('cd-ok', 'Countdown cleared.'); loadCountdown(); }
}

// ── Broadcast ──────────────────────────────────────
function calcRecip() {
  const auds = Array.from(document.querySelectorAll('input[name="aud"]:checked')).map(i => i.value);
  let n = 0;
  if (auds.includes('webinar'))  n += _leads.length;
  if (auds.includes('mailing'))  n += _mailing.length;
  if (auds.includes('guides'))   n += _guides.length;
  if (auds.includes('waitlist')) n += _waitlist.length;
  document.getElementById('recip-n').textContent = n;
  document.getElementById('bc-n').textContent    = n;
  document.getElementById('recip-badge').style.display = n > 0 ? 'block' : 'none';
  document.getElementById('bc-send').disabled = n === 0;
}

function updatePreview() {
  document.getElementById('prev-subj').textContent = document.getElementById('bc-subj').value || '—';
  document.getElementById('prev-body').textContent = document.getElementById('bc-body').value || 'Your message will appear here…';
}

async function sendBroadcast(e) {
  e.preventDefault();
  const auds = Array.from(document.querySelectorAll('input[name="aud"]:checked')).map(i => i.value);
  const subj = document.getElementById('bc-subj').value;
  const body = document.getElementById('bc-body').value;
  if (!auds.length) { showAlert('bc-err', 'Select at least one audience'); return; }
  if (!subj || !body) { showAlert('bc-err', 'Subject and message are required'); return; }

  const btn = document.getElementById('bc-send');
  btn.disabled = true; btn.textContent = 'Sending…';

  const res = await api('/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audiences: auds, subject: subj, body })
  });

  btn.disabled = false; btn.textContent = `Send to ${document.getElementById('bc-n').textContent} Recipients`;
  if (res?.success) {
    showAlert('bc-ok', `Broadcast queued for ${document.getElementById('bc-n').textContent} recipients`);
    document.getElementById('bc-subj').value = '';
    document.getElementById('bc-body').value = '';
    document.getElementById('recip-badge').style.display = 'none';
    document.querySelectorAll('input[name="aud"]').forEach(c => c.checked = false);
    updatePreview();
  } else showAlert('bc-err', res?.message || 'Send failed');
}

// ── CSV export ─────────────────────────────────────
function exportCSV(data, fields, name) {
  const rows = [fields.join(','), ...data.map(r =>
    fields.map(f => `"${String(r[f]||'').replace(/"/g,'""')}"`).join(',')
  )].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([rows], {type:'text/csv'})),
    download: `${name}-${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click(); URL.revokeObjectURL(a.href);
}

// ── Alert helper ───────────────────────────────────
function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 5000);
}
