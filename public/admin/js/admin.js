// Admin state
let adminSession = null;
let allLeads = [];
let allGuides = [];
let allMailing = [];
let allFeedback = [];

const API_URL = window.location.pathname.includes('/admin') 
  ? window.location.origin + '/api' 
  : '/api';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check if already logged in
  const sessionToken = sessionStorage.getItem('adminToken');
  if (sessionToken) {
    adminSession = sessionToken;
    showDashboard();
    loadAllData();
  }

  // Setup nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(item.dataset.section);
    });
  });

  // Setup search filters
  document.getElementById('leadsSearch')?.addEventListener('input', filterLeads);
  document.getElementById('guidesSearch')?.addEventListener('input', filterGuides);
  document.getElementById('mailingSearch')?.addEventListener('input', filterMailing);

  // Setup broadcast preview
  document.querySelector('input[name="subject"]')?.addEventListener('input', updatePreview);
  document.querySelector('textarea[name="body"]')?.addEventListener('input', updatePreview);

  // Setup logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    adminSession = null;
    location.reload();
  });
});

// LOGIN
async function adminLogin() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) {
    showLoginError('Enter your admin API key');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      showLoginError(data.message || 'Invalid API key');
      return;
    }

    adminSession = apiKey;
    sessionStorage.setItem('adminToken', apiKey);
    showDashboard();
    loadAllData();
  } catch (err) {
    showLoginError('Connection error: ' + err.message);
  }
}

function showLoginError(msg) {
  const err = document.getElementById('loginError');
  err.textContent = msg;
  err.style.display = 'block';
}

// SHOW/HIDE
function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.querySelector('.sidebar').style.display = 'flex';
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  switchSection('dashboard');
}

function switchSection(sectionName) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${sectionName}"]`)?.classList.add('active');

  // Update section
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`${sectionName}Section`)?.classList.add('active');

  if (sectionName === 'leads') loadLeads();
  if (sectionName === 'guides') loadGuides();
  if (sectionName === 'mailing') loadMailing();
}

// LOAD DATA
async function loadAllData() {
  try {
    const [leads, guides, mailing, feedback] = await Promise.all([
      fetchWithAuth(`${API_URL}/admin/leads`),
      fetchWithAuth(`${API_URL}/admin/guides`),
      fetchWithAuth(`${API_URL}/admin/mailing`),
      fetchWithAuth(`${API_URL}/admin/feedback`)
    ]);

    allLeads = leads || [];
    allGuides = guides || [];
    allMailing = mailing || [];
    allFeedback = feedback || [];

    updateDashboard();
  } catch (err) {
    console.error('Load data error:', err);
  }
}

async function loadLeads() {
  if (allLeads.length === 0) {
    allLeads = await fetchWithAuth(`${API_URL}/admin/leads`) || [];
  }
  renderLeadsTable();
}

async function loadGuides() {
  if (allGuides.length === 0) {
    allGuides = await fetchWithAuth(`${API_URL}/admin/guides`) || [];
  }
  renderGuidesTable();
}

async function loadMailing() {
  if (allMailing.length === 0) {
    allMailing = await fetchWithAuth(`${API_URL}/admin/mailing`) || [];
  }
  renderMailingTable();
}

async function fetchWithAuth(url) {
  const res = await fetch(url, {
    headers: { 'X-Admin-Key': adminSession }
  });
  if (res.status === 401) {
    sessionStorage.removeItem('adminToken');
    location.reload();
  }
  return res.json();
}

// DASHBOARD
function updateDashboard() {
  document.getElementById('countWebinar').textContent = allLeads.length;
  document.getElementById('countGuide').textContent = allGuides.length;
  document.getElementById('countMailing').textContent = allMailing.length;
  document.getElementById('countFeedback').textContent = allFeedback.length;

  // Recent activity
  const recent = [];
  allLeads.slice(0, 3).forEach(l => {
    recent.push(`📅 <strong>${l.fname} ${l.lname}</strong> registered for webinar (${new Date(l.created_at).toLocaleDateString()})`);
  });
  allMailing.slice(0, 2).forEach(m => {
    recent.push(`📧 <strong>${m.jemail}</strong> joined mailing list`);
  });

  document.getElementById('recentActivity').innerHTML = recent.length 
    ? recent.map(r => `<div style="margin-bottom:10px">${r}</div>`).join('')
    : 'No recent activity';
}

// TABLES
function renderLeadsTable() {
  const tbody = document.getElementById('leadsTbody');
  document.getElementById('leadsCount').textContent = `${allLeads.length} registrations`;
  
  if (allLeads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No webinar leads yet</td></tr>';
    return;
  }

  tbody.innerHTML = allLeads.map(lead => `
    <tr>
      <td>${lead.fname} ${lead.lname}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 6px;border-radius:2px;font-size:12px">${lead.email}</code></td>
      <td>${lead.stage}</td>
      <td>${lead.slot}</td>
      <td>${lead.mailing_list ? '✓' : '—'}</td>
      <td style="color:var(--muted);font-size:12px">${new Date(lead.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function renderGuidesTable() {
  const tbody = document.getElementById('guidesTbody');
  document.getElementById('guidesCount').textContent = `${allGuides.length} requests`;
  
  if (allGuides.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">No guide requests yet</td></tr>';
    return;
  }

  tbody.innerHTML = allGuides.map(guide => `
    <tr>
      <td>${guide.gname}</td>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 6px;border-radius:2px;font-size:12px">${guide.gemail}</code></td>
      <td>${guide.gcity}</td>
      <td>${guide.grev}</td>
      <td style="font-size:12px">${guide.gnote.substring(0, 30)}...</td>
      <td style="color:var(--muted);font-size:12px">${new Date(guide.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function renderMailingTable() {
  const tbody = document.getElementById('mailingTbody');
  document.getElementById('mailingCount').textContent = `${allMailing.length} subscribers`;
  
  if (allMailing.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty">No mailing list subscribers yet</td></tr>';
    return;
  }

  tbody.innerHTML = allMailing.map(m => `
    <tr>
      <td><code style="background:rgba(0,0,0,.3);padding:2px 6px;border-radius:2px;font-size:12px">${m.jemail}</code></td>
      <td style="color:var(--muted);font-size:12px">${new Date(m.created_at).toLocaleDateString()}</td>
      <td><button onclick="removeFromMailing('${m.jemail}')" class="btn-secondary" style="font-size:11px;padding:6px 10px">Remove</button></td>
    </tr>
  `).join('');
}

// SEARCH
function filterLeads() {
  const query = document.getElementById('leadsSearch').value.toLowerCase();
  allLeads = allLeads.filter(l => 
    `${l.fname} ${l.lname} ${l.email}`.toLowerCase().includes(query)
  );
  if (query === '') loadLeads();
  renderLeadsTable();
}

function filterGuides() {
  const query = document.getElementById('guidesSearch').value.toLowerCase();
  allGuides = allGuides.filter(g => 
    `${g.gname} ${g.gemail}`.toLowerCase().includes(query)
  );
  if (query === '') loadGuides();
  renderGuidesTable();
}

function filterMailing() {
  const query = document.getElementById('mailingSearch').value.toLowerCase();
  allMailing = allMailing.filter(m => m.jemail.toLowerCase().includes(query));
  if (query === '') loadMailing();
  renderMailingTable();
}

// EXPORT
function exportLeads() {
  exportToCSV(allLeads, ['fname', 'lname', 'email', 'stage', 'slot', 'created_at'], 'webinar-leads');
}

function exportGuides() {
  exportToCSV(allGuides, ['gname', 'gemail', 'gcity', 'grev', 'gnote', 'created_at'], 'guide-requests');
}

function exportMailing() {
  exportToCSV(allMailing, ['jemail', 'created_at'], 'mailing-list');
}

function exportToCSV(data, fields, filename) {
  const headers = fields.join(',');
  const rows = data.map(row => 
    fields.map(f => {
      const val = row[f] || '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// BROADCAST
function calculateRecipients() {
  const audiences = Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(i => i.value);
  if (audiences.length === 0) {
    document.getElementById('audienceError').textContent = 'Select at least one audience';
    document.getElementById('audienceError').style.display = 'block';
    return;
  }
  document.getElementById('audienceError').style.display = 'none';

  let count = 0;
  if (audiences.includes('webinar')) count += allLeads.length;
  if (audiences.includes('mailing')) count += allMailing.length;
  if (audiences.includes('guides')) count += allGuides.filter(g => g.gemail).length;

  document.getElementById('recipientCount').textContent = count;
  document.getElementById('broadcastStats').style.display = 'block';
  document.getElementById('sendBtn').disabled = count === 0;
  document.getElementById('sendBtnCount').textContent = count;
}

function updatePreview() {
  const subject = document.querySelector('input[name="subject"]').value;
  const body = document.querySelector('textarea[name="body"]').value;
  document.getElementById('previewSubject').textContent = subject || 'Your subject here...';
  document.getElementById('previewBody').textContent = body || 'Your message preview will appear here...';
}

async function sendBroadcast(e) {
  e.preventDefault();

  const audiences = Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(i => i.value);
  if (audiences.length === 0) {
    showBroadcastError('Select at least one audience');
    return;
  }

  const subject = document.querySelector('input[name="subject"]').value;
  const body = document.querySelector('textarea[name="body"]').value;

  if (!subject || !body) {
    showBroadcastError('Enter subject and message');
    return;
  }

  // Disable send button
  document.getElementById('sendBtn').disabled = true;
  document.getElementById('sendBtn').textContent = 'Sending...';

  try {
    const res = await fetch(`${API_URL}/admin/broadcast`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Key': adminSession
      },
      body: JSON.stringify({ audiences, subject, body })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showBroadcastError(data.message || 'Send failed');
      return;
    }

    showBroadcastSuccess(`✓ Broadcast sent to ${data.count} recipients`);
    document.getElementById('broadcastForm').reset();
    document.getElementById('broadcastStats').style.display = 'none';
  } catch (err) {
    showBroadcastError('Send error: ' + err.message);
  } finally {
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('sendBtn').textContent = 'Send to ' + document.getElementById('sendBtnCount').textContent + ' Recipients';
  }
}

function showBroadcastError(msg) {
  const err = document.getElementById('broadcastError');
  err.textContent = msg;
  err.style.display = 'block';
  document.getElementById('broadcastSuccess').style.display = 'none';
}

function showBroadcastSuccess(msg) {
  const succ = document.getElementById('broadcastSuccess');
  succ.textContent = msg;
  succ.style.display = 'block';
  document.getElementById('broadcastError').style.display = 'none';
  setTimeout(() => succ.style.display = 'none', 4000);
}

async function removeFromMailing(email) {
  if (!confirm(`Remove ${email} from mailing list?`)) return;
  
  try {
    const res = await fetch(`${API_URL}/admin/mailing/${email}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': adminSession }
    });
    
    if (res.ok) {
      allMailing = allMailing.filter(m => m.jemail !== email);
      renderMailingTable();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
