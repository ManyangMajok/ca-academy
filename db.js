import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data.db');
let db;

// Initialize database
export function initDb() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Database connection error:', err);
      return;
    }
    console.log('✓ Connected to SQLite database');
    createTables();
  });
}

function createTables() {
  db.serialize(() => {
    // Webinar leads table
    db.run(`
      CREATE TABLE IF NOT EXISTS webinar_leads (
        id TEXT PRIMARY KEY,
        fname TEXT NOT NULL,
        lname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        stage TEXT,
        slot TEXT,
        mailing_list INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('webinar_leads table error:', err);
      else console.log('✓ webinar_leads table ready');
    });

    // Guide requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS guide_requests (
        id TEXT PRIMARY KEY,
        gname TEXT NOT NULL,
        gemail TEXT UNIQUE NOT NULL,
        gcity TEXT,
        grev TEXT,
        gnote TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('guide_requests table error:', err);
      else console.log('✓ guide_requests table ready');
    });

    // Feedback links table
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback_links (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        fname TEXT NOT NULL,
        femail TEXT NOT NULL,
        fwhat TEXT,
        paid INTEGER DEFAULT 0,
        budget TEXT,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('feedback_links table error:', err);
      else console.log('✓ feedback_links table ready');
    });

    // Mailing list table
    db.run(`
      CREATE TABLE IF NOT EXISTS mailing_list (
        id TEXT PRIMARY KEY,
        jemail TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('mailing_list table error:', err);
      else console.log('✓ mailing_list table ready');
    });
  });
}

// Insert webinar lead
export function insertWebinarLead({ fname, lname, email, stage, slot, list }) {
  return new Promise((resolve) => {
    const id = uuidv4();
    db.run(
      `INSERT INTO webinar_leads (id, fname, lname, email, stage, slot, mailing_list)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, fname, lname, email, stage, slot, list ? 1 : 0],
      function(err) {
        if (err) {
          console.error('Insert webinar lead error:', err);
          resolve({ success: false, error: err.message });
        } else {
          console.log(`✓ Webinar lead added: ${email}`);
          resolve({ success: true, id });
        }
      }
    );
  });
}

// Insert guide request
export function insertGuideRequest({ gname, gemail, gcity, grev, gnote }) {
  return new Promise((resolve) => {
    const id = uuidv4();
    db.run(
      `INSERT INTO guide_requests (id, gname, gemail, gcity, grev, gnote)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, gname, gemail, gcity, grev, gnote],
      function(err) {
        if (err) {
          console.error('Insert guide request error:', err);
          resolve({ success: false, error: err.message });
        } else {
          console.log(`✓ Guide request added: ${gemail}`);
          resolve({ success: true, id });
        }
      }
    );
  });
}

// Insert feedback link
export function insertFeedbackLink({ fname, femail, fwhat, paid, budget }) {
  return new Promise((resolve) => {
    const id = uuidv4();
    const token = uuidv4();
    db.run(
      `INSERT INTO feedback_links (id, token, fname, femail, fwhat, paid, budget)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, token, fname, femail, fwhat, paid ? 1 : 0, budget],
      function(err) {
        if (err) {
          console.error('Insert feedback link error:', err);
          resolve({ success: false, error: err.message });
        } else {
          console.log(`✓ Feedback link created: ${femail}`);
          resolve({ success: true, id, token });
        }
      }
    );
  });
}

// Insert mailing list
export function insertJoinList({ jemail }) {
  return new Promise((resolve) => {
    const id = uuidv4();
    db.run(
      `INSERT INTO mailing_list (id, jemail) VALUES (?, ?)`,
      [id, jemail],
      function(err) {
        if (err) {
          console.error('Insert mailing list error:', err);
          resolve({ success: false, error: err.message });
        } else {
          console.log(`✓ Email added to mailing list: ${jemail}`);
          resolve({ success: true, id });
        }
      }
    );
  });
}

// Get all webinar leads (for admin)
export function getWebinarLeads() {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM webinar_leads ORDER BY created_at DESC`, (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Get all guide requests
export function getGuideRequests() {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM guide_requests ORDER BY created_at DESC`, (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Get mailing list
export function getMailingList() {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM mailing_list ORDER BY created_at DESC`, (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Get feedback links
export function getFeedbackLinks() {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM feedback_links ORDER BY created_at DESC`, (err, rows) => {
      if (err) {
        console.error(err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Remove mailing list entry by email
export function removeMailingByEmail(jemail) {
  return new Promise((resolve) => {
    db.run(`DELETE FROM mailing_list WHERE jemail = ?`, [jemail], function(err) {
      if (err) {
        console.error('Remove mailing error:', err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, changes: this.changes });
      }
    });
  });
}
