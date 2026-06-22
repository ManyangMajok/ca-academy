import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ca_academy',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
});

export async function initDb() {
  try {
    const conn = await pool.getConnection();
    console.log('✓ Connected to MySQL database');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS blueprint_waitlist (
        id VARCHAR(36) PRIMARY KEY,
        wname VARCHAR(255) NOT NULL,
        wemail VARCHAR(255) NOT NULL UNIQUE,
        wstage VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    console.error('Make sure MySQL is running and DB_HOST/DB_USER/DB_PASSWORD/DB_NAME are set in .env');
    process.exit(1);
  }
}

export async function insertWebinarLead({ fname, lname, email, stage, slot, list }) {
  try {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO webinar_leads (id, fname, lname, email, stage, slot, mailing_list) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, fname, lname, email, stage, slot, list ? 1 : 0]
    );
    console.log(`✓ Webinar lead added: ${email}`);
    return { success: true, id };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { success: false, error: 'Email already registered' };
    console.error('Insert webinar lead error:', err);
    return { success: false, error: err.message };
  }
}

export async function insertGuideRequest({ gname, gemail, gcity, grev, gnote }) {
  try {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO guide_requests (id, gname, gemail, gcity, grev, gnote) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, gname, gemail, gcity, grev, gnote]
    );
    console.log(`✓ Guide request added: ${gemail}`);
    return { success: true, id };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { success: false, error: 'Email already submitted' };
    console.error('Insert guide request error:', err);
    return { success: false, error: err.message };
  }
}

export async function insertFeedbackLink({ fname, femail, fwhat, paid, budget }) {
  try {
    const id = uuidv4();
    const token = uuidv4();
    await pool.execute(
      `INSERT INTO feedback_links (id, token, fname, femail, fwhat, paid, budget) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, token, fname, femail, fwhat, paid ? 1 : 0, budget]
    );
    console.log(`✓ Feedback link created: ${femail}`);
    return { success: true, id, token };
  } catch (err) {
    console.error('Insert feedback link error:', err);
    return { success: false, error: err.message };
  }
}

export async function insertJoinList({ jemail }) {
  try {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO mailing_list (id, jemail) VALUES (?, ?)`,
      [id, jemail]
    );
    console.log(`✓ Email added to mailing list: ${jemail}`);
    return { success: true, id };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { success: false, error: 'Email already subscribed' };
    console.error('Insert mailing list error:', err);
    return { success: false, error: err.message };
  }
}

export async function getWebinarLeads() {
  const [rows] = await pool.execute(`SELECT * FROM webinar_leads ORDER BY created_at DESC`);
  return rows;
}

export async function getGuideRequests() {
  const [rows] = await pool.execute(`SELECT * FROM guide_requests ORDER BY created_at DESC`);
  return rows;
}

export async function getMailingList() {
  const [rows] = await pool.execute(`SELECT * FROM mailing_list ORDER BY created_at DESC`);
  return rows;
}

export async function getFeedbackLinks() {
  const [rows] = await pool.execute(`SELECT * FROM feedback_links ORDER BY created_at DESC`);
  return rows;
}

export async function removeMailingByEmail(jemail) {
  try {
    const [result] = await pool.execute(`DELETE FROM mailing_list WHERE jemail = ?`, [jemail]);
    return { success: true, changes: result.affectedRows };
  } catch (err) {
    console.error('Remove mailing error:', err);
    return { success: false, error: err.message };
  }
}

export async function setCountdown({ title, target_datetime, webinar_link }) {
  try {
    await pool.execute(`UPDATE countdown SET is_active = 0`);
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO countdown (id, title, target_datetime, webinar_link, is_active) VALUES (?, ?, ?, ?, 1)`,
      [id, title || 'Free Webinar', target_datetime, webinar_link]
    );
    return { success: true, id };
  } catch (err) {
    console.error('Set countdown error:', err);
    return { success: false, error: err.message };
  }
}

export async function getActiveCountdown() {
  const [rows] = await pool.execute(
    `SELECT * FROM countdown WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1`
  );
  return rows[0] || null;
}

export async function insertBlueprintWaitlist({ wname, wemail, wstage }) {
  try {
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO blueprint_waitlist (id, wname, wemail, wstage) VALUES (?, ?, ?, ?)`,
      [id, wname, wemail, wstage || null]
    );
    console.log(`✓ Blueprint waitlist added: ${wemail}`);
    return { success: true, id };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return { success: false, error: 'Email already on the waitlist' };
    console.error('Insert blueprint waitlist error:', err);
    return { success: false, error: err.message };
  }
}

export async function getBlueprintWaitlist() {
  const [rows] = await pool.execute(`SELECT * FROM blueprint_waitlist ORDER BY created_at DESC`);
  return rows;
}

export async function clearCountdown() {
  try {
    await pool.execute(`UPDATE countdown SET is_active = 0`);
    return { success: true };
  } catch (err) {
    console.error('Clear countdown error:', err);
    return { success: false, error: err.message };
  }
}
