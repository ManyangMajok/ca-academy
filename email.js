import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resend;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY not set — emails will be logged and saved to mock-emails/.');
  const MOCK_DIR = path.join(process.cwd(), 'mock-emails');
  // ensure directory exists
  await fs.mkdir(MOCK_DIR, { recursive: true }).catch(() => {});
  resend = {
    emails: {
      send: async ({ from, to, subject, html }) => {
        try {
          const id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          const filename = path.join(MOCK_DIR, `${id}.html`);
          const content = `<!-- mock email -->\n<!-- from: ${from} -->\n<!-- to: ${to} -->\n<!-- subject: ${subject} -->\n\n${html}`;
          await fs.writeFile(filename, content, 'utf8');
          console.log(`[MOCK EMAIL] saved ${filename}`);
          return { ok: true, mock: true, path: filename };
        } catch (err) {
          console.log('[MOCK EMAIL] failed to save:', err.message);
          return { ok: false, mock: true, error: err.message };
        }
      }
    }
  };
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tteacademy.com';
const BRAND_NAME = 'TTE Academy';

// Send webinar confirmation email
export async function sendWebinarConfirm({ fname, lname, email, slot }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🎬 Your free webinar seat is confirmed — ${BRAND_NAME}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6A1A;">You're all set, ${fname}!</h2>
          <p>Your free seat for the webinar is confirmed.</p>
          
          <div style="background: #1B1813; padding: 20px; border-radius: 4px; margin: 20px 0; color: #F5EEE0;">
            <p><strong>45-minute live training</strong></p>
            <p>Where the money hides in food truck operations, location strategy, systems, and live Q&A.</p>
            <p style="color: #F2B705;"><strong>Session: ${slot}</strong></p>
            <p style="margin-bottom: 0;"><a href="#" style="color: #FF6A1A; text-decoration: none;">Add to calendar →</a></p>
          </div>
          
          <p>See you on the call!</p>
          <p style="color: #8C8472; font-size: 12px;">— Adan Rispoli & the TTE Academy team</p>
        </div>
      `
    });
    console.log(`✓ Webinar confirmation sent to ${email}`);
  } catch (err) {
    console.error('Failed to send webinar email:', err);
  }
}

// Send guide request confirmation
export async function sendGuideConfirm({ gname, gemail, gcity, grev, gnote }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: gemail,
      subject: `📋 Your personalized growth guide is being built — ${BRAND_NAME}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6A1A;">Your guide is on the way, ${gname}!</h2>
          <p>We received your request and are building a tailored plan around your truck.</p>
          
          <div style="background: #1B1813; padding: 20px; border-radius: 4px; margin: 20px 0; color: #F5EEE0; font-size: 14px;">
            <p><strong>What we're including:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Pricing & margin review based on your numbers</li>
              <li>Location and event opportunities for ${gcity || 'your area'}</li>
              <li>Prioritized 90-day action plan</li>
              <li>Pricing for the full guide (if you want it)</li>
            </ul>
          </div>
          
          <p>You'll hear from us within 24 hours with your personalized guide + pricing details.</p>
          <p style="color: #8C8472; font-size: 12px;">— Adan Rispoli & the TTE Academy team</p>
        </div>
      `
    });
    console.log(`✓ Guide confirmation sent to ${gemail}`);
  } catch (err) {
    console.error('Failed to send guide email:', err);
  }
}

// Send feedback link
export async function sendFeedbackLink({ fname, femail, feedbackUrl, paid }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: femail,
      subject: `🔗 Your private feedback link — ${BRAND_NAME}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6A1A;">Your feedback link, ${fname}</h2>
          <p>This is your personal, secured link to share feedback about the program and content you saw.</p>
          
          <div style="background: #FF6A1A; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
            <a href="${feedbackUrl}" style="color: #0E0D0B; font-weight: bold; font-size: 16px; text-decoration: none; display: inline-block; padding: 10px 20px; background: #F5EEE0; border-radius: 3px;">
              Open my feedback link →
            </a>
          </div>
          
          <p style="font-size: 14px; color: #8C8472;">
            This link is unique to you and expires after one use. Your feedback stays private and directly shapes future TTE Academy updates.
          </p>
          
          ${paid ? `
            <div style="background: rgba(242, 183, 5, 0.1); border: 1px solid rgba(242, 183, 5, 0.4); padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #F2B705;"><strong>👉 You also checked "interested in strategy session"</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">When you submit feedback, we'll include personalized pricing for a 1:1 session with Adan.</p>
            </div>
          ` : ''}
          
          <p style="color: #8C8472; font-size: 12px;">— TTE Academy team</p>
        </div>
      `
    });
    console.log(`✓ Feedback link sent to ${femail}`);
  } catch (err) {
    console.error('Failed to send feedback link email:', err);
  }
}

// Send mailing list welcome
export async function sendJoinListWelcome({ jemail }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: jemail,
      subject: `📚 Welcome to TTE Academy's mailing list`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6A1A;">Welcome!</h2>
          <p>You're on our list for case studies, pricing breakdowns, location strategy, and first access to new TTE Academy trainings.</p>
          
          <p style="font-size: 14px; color: #8C8472; margin-top: 30px;">
            Next playbook drops in your inbox soon. <br/>
            — Adan Rispoli & the TTE Academy team
          </p>
        </div>
      `
    });
    console.log(`✓ Welcome email sent to ${jemail}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

// Send Blueprint waitlist confirmation
export async function sendWaitlistConfirm({ wname, wemail }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: wemail,
      subject: `You're on the Blueprint waiting list — ${BRAND_NAME}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0E0D0B;color:#F5EEE0">
          <div style="padding:32px 32px 24px;border-bottom:1px solid rgba(201,168,76,.25)">
            <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C9A84C;margin:0 0 14px">TTE Academy · The Blueprint</p>
            <h2 style="font-family:Georgia,serif;font-size:26px;margin:0 0 10px;color:#F5EEE0">You're on the list, ${wname}.</h2>
            <p style="color:#C4BEB3;margin:0;font-size:15px">Your spot on the TTE Academy Blueprint waitlist is secured.</p>
          </div>

          <div style="padding:28px 32px">
            <p style="color:#C4BEB3;font-size:15px;line-height:1.7">The Blueprint is the full TTE Academy program — the complete system Adan used to take a single trailer to seven figures. Mindset, menu engineering, pricing, location strategy, branding, hiring, and scale. All of it.</p>

            <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.3);border-radius:4px;padding:20px;margin:24px 0">
              <p style="color:#C9A84C;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px">As a waitlist member, you get:</p>
              <ul style="color:#C4BEB3;font-size:14px;margin:0;padding-left:20px;line-height:2">
                <li>First notification when enrollment opens</li>
                <li>Founding member pricing — locked in before the public launch</li>
                <li>Direct early access before the wider release</li>
                <li>Pre-launch content drops from Adan</li>
              </ul>
            </div>

            <p style="color:#7A7369;font-size:13px;line-height:1.7">In the meantime, if you haven't attended the free webinar, that's where to start — it's 45 minutes with Adan breaking down the levers that actually move a trailer business.</p>
          </div>

          <div style="padding:20px 32px;border-top:1px solid rgba(201,168,76,.15)">
            <p style="color:#7A7369;font-size:12px;margin:0">— Adan Rispoli &amp; the TTE Academy team<br>Questions? <a href="mailto:hello@tteacademy.com" style="color:#C9A84C">hello@tteacademy.com</a></p>
          </div>
        </div>
      `
    });
    console.log(`✓ Blueprint waitlist confirmation sent to ${wemail}`);
  } catch (err) {
    console.error('Failed to send waitlist email:', err);
  }
}

// Send a raw email (used for admin broadcast)
export async function sendRawEmail({ to, subject, html, from }) {
  try {
    await resend.emails.send({
      from: from || FROM_EMAIL,
      to,
      subject,
      html
    });
    console.log(`✓ Broadcast email sent to ${to}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to send raw email:', err);
    return { success: false, error: err.message };
  }
}
