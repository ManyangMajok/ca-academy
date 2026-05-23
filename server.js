import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDb, insertWebinarLead, insertGuideRequest, insertFeedbackLink, insertJoinList, getWebinarLeads, getGuideRequests, getMailingList, getFeedbackLinks, removeMailingByEmail } from './db.js';
import { sendWebinarConfirm, sendGuideConfirm, sendFeedbackLink, sendJoinListWelcome, sendRawEmail } from './email.js';
import { enqueueEmails, getQueueLength } from './sendQueue.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB on startup
initDb();

// ===== API ROUTES =====

// Webinar registration
app.post('/api/webinar', async (req, res) => {
  try {
    const { fname, lname, email, stage, slot, list } = req.body;
    
    if (!fname || !lname || !email || !stage || !slot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = insertWebinarLead({ fname, lname, email, stage, slot, list: list || false });
    
    if (result.success) {
      // Send confirmation email
      await sendWebinarConfirm({ fname, lname, email, slot });
      return res.json({ success: true, message: 'Registered for webinar' });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Personalized guide request
app.post('/api/guide', async (req, res) => {
  try {
    const { gname, gemail, gcity, grev, gnote } = req.body;
    
    if (!gname || !gemail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = insertGuideRequest({ gname, gemail, gcity, grev, gnote });
    
    if (result.success) {
      await sendGuideConfirm({ gname, gemail, gcity, grev, gnote });
      return res.json({ success: true, message: 'Guide request received' });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Feedback link request
app.post('/api/feedback', async (req, res) => {
  try {
    const { fname, femail, fwhat, paid, budget } = req.body;
    
    if (!fname || !femail || !fwhat) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = insertFeedbackLink({ fname, femail, fwhat, paid: paid || false, budget });
    
    if (result.success) {
      const token = result.token;
      const feedbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${token}`;
      await sendFeedbackLink({ fname, femail, feedbackUrl, paid });
      return res.json({ success: true, message: 'Feedback link sent' });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join mailing list
app.post('/api/join', async (req, res) => {
  try {
    const { jemail } = req.body;
    
    if (!jemail) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const result = insertJoinList({ jemail });
    
    if (result.success) {
      await sendJoinListWelcome({ jemail });
      return res.json({ success: true, message: 'Added to mailing list' });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Admin helpers ---
function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (!process.env.ADMIN_KEY) return res.status(401).json({ error: 'Admin key not configured' });
  if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Admin auth (simple API-key check)
app.post('/api/admin/auth', (req, res) => {
  const { apiKey } = req.body || {};
  if (!process.env.ADMIN_KEY) return res.status(500).json({ success: false, message: 'Server admin key not set' });
  if (apiKey && apiKey === process.env.ADMIN_KEY) return res.json({ success: true });
  return res.status(401).json({ success: false, message: 'Invalid API key' });
});

// Admin: get webinar leads
app.get('/api/admin/leads', checkAdmin, async (req, res) => {
  try {
    const rows = await getWebinarLeads();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

// Admin: get guide requests
app.get('/api/admin/guides', checkAdmin, async (req, res) => {
  try {
    const rows = await getGuideRequests();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load guides' });
  }
});

// Admin: get mailing list
app.get('/api/admin/mailing', checkAdmin, async (req, res) => {
  try {
    const rows = await getMailingList();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load mailing list' });
  }
});

// Admin: get feedback links
app.get('/api/admin/feedback', checkAdmin, async (req, res) => {
  try {
    const rows = await getFeedbackLinks();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load feedback links' });
  }
});

// Admin: remove mailing by email
app.delete('/api/admin/mailing/:email', checkAdmin, async (req, res) => {
  try {
    const email = req.params.email;
    const result = await removeMailingByEmail(email);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove email' });
  }
});

// Admin: broadcast email
app.post('/api/admin/broadcast', checkAdmin, async (req, res) => {
  try {
    const { audiences = [], subject, body } = req.body || {};
    if (!audiences.length || !subject || !body) return res.status(400).json({ success: false, message: 'Missing fields' });

    // Collect recipients
    const sets = await Promise.all([
      audiences.includes('webinar') ? getWebinarLeads() : Promise.resolve([]),
      audiences.includes('guides') ? getGuideRequests() : Promise.resolve([]),
      audiences.includes('mailing') ? getMailingList() : Promise.resolve([])
    ]);

    const emails = new Set();
    // webinar leads: email
    (sets[0] || []).forEach(r => r.email && emails.add(r.email));
    // guides: gemail
    (sets[1] || []).forEach(r => r.gemail && emails.add(r.gemail));
    // mailing: jemail
    (sets[2] || []).forEach(r => r.jemail && emails.add(r.jemail));

    const list = Array.from(emails);
    if (list.length === 0) return res.json({ success: true, count: 0 });

    // Enqueue emails to background send queue (safe, rate-limited)
    const queued = enqueueEmails(list, subject, body, process.env.FROM_EMAIL || undefined);
    res.json({ success: true, queued, note: 'Emails enqueued and will be sent in background' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Broadcast failed' });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ CA Academy server running on port ${PORT}`);
});
