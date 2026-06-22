# TTE Academy — Full-Stack Landing Site

A complete production-ready landing site with Node.js backend, SQLite database, email integration (Resend), lead capture, and deployment configs for Vercel/Netlify.

## Project Structure

```
ca-acad/
├── public/
│   ├── index.html          # Frontend HTML
│   ├── css/styles.css      # Styles (optimized)
│   ├── js/main.js          # Frontend JS with API calls
│   ├── favicon.svg         # Icon
│   └── manifest.json       # PWA config
├── server.js               # Express backend (API routes)
├── db.js                   # SQLite database & queries
├── email.js                # Email templates & Resend integration
├── package.json            # Node dependencies
├── .env.example            # Configuration template
├── vercel.json             # Vercel deployment config
├── netlify.toml            # Netlify deployment config
└── README.md               # This file
```

## Features

✓ Fully responsive landing site with scroll animations  
✓ Four production forms: webinar, guide, feedback, mailing list  
✓ SQLite database for lead capture (auto-initialized)  
✓ Email service (Resend): beautiful HTML templates, 100 free emails/day  
✓ Secured feedback tokens (unique per user, one-time use)  
✓ Form validation & error handling  
✓ CORS enabled for API  
✓ Static file serving optimized for performance  
✓ Deploy-ready configs for Vercel & Netlify  

## Quick Start (Local Development)

### 1. Install dependencies
```powershell
npm install
```

### 2. Configure environment
```powershell
cp .env.example .env
```

Edit `.env`:
```
RESEND_API_KEY=your_api_key_from_resend.com
FROM_EMAIL=noreply@tteacademy.com
PORT=3000
FRONTEND_URL=http://localhost:3000
```

Get free API key: [resend.com](https://resend.com) (100 free emails/day)

### 3. Run development server
```powershell
npm run dev
```

Open `http://localhost:3000` in your browser

### 4. Test a form
- Fill webinar registration form
- Watch terminal for email logs
- Database auto-created as `data.db`

## Deployment

### Vercel (Easiest)
1. Push code to GitHub
2. Go to vercel.com → "New Project" → select repo
3. Add environment variables: `RESEND_API_KEY`, `FROM_EMAIL`
4. Deploy (one click)

### Netlify
1. Push code to GitHub
2. Go to netlify.com → "New site from Git" → select repo
3. Build command: `npm install`
4. Add environment variables
5. Deploy

### Self-Hosted (Node.js required)
```powershell
npm install
export RESEND_API_KEY=your_key
npm start
```

## API Endpoints

All endpoints accept `POST`, return JSON.

**`/api/webinar`** — Register for webinar
```json
{ "fname": "Jordan", "lname": "Lee", "email": "...", "stage": "...", "slot": "...", "list": true }
```

**`/api/guide`** — Request personalized guide
```json
{ "gname": "Jordan", "gemail": "...", "gcity": "Austin", "grev": "$30k–$75k", "gnote": "..." }
```

**`/api/feedback`** — Request secured feedback link
```json
{ "fname": "Jordan", "femail": "...", "fwhat": "The free webinar", "paid": true, "budget": "..." }
```

**`/api/join`** — Join mailing list
```json
{ "jemail": "jordan@example.com" }
```

**`/api/health`** — Health check (returns `{ status: 'ok' }`)

## Database

SQLite (`data.db`) auto-initialized with 4 tables:
- `webinar_leads` — registrations
- `guide_requests` — guide inquiries
- `feedback_links` — feedback tokens
- `mailing_list` — subscribers

## Customization

**Replace placeholders in `public/index.html`:**
- Webinar dates (`[ Placeholder date — Tue 7:00 PM ]`)
- Aiden's bio and stats
- Social links, contact email
- Images (or use your own)

**Edit email templates** in `email.js`:
- Webinar confirmation
- Guide request response
- Feedback link delivery
- Mailing list welcome

**Change styling:**
- Edit `public/css/styles.css`
- CSS variables at top (colors, fonts, spacing)

**Add form fields:**
- Add input to HTML form in `public/index.html`
- Add field handler in `public/js/main.js`
- Update API endpoint in `server.js`
- Store in database (`db.js`)

## Monitoring Leads

**Locally:**
- Open `data.db` with any SQLite viewer
- Or: `sqlite3 data.db` then `SELECT * FROM webinar_leads;`

**In production:**
- Logs in Vercel/Netlify dashboard
- Export leads via CSV from database
- Set up Slack webhook for real-time notifications
- Connect to CRM (Zapier, Make, webhook)

## Troubleshooting

**Emails not sending?**
- Check `RESEND_API_KEY` in `.env`
- Verify sender email in Resend dashboard
- Check browser DevTools → Network tab for API errors

**Forms not working?**
- Open DevTools → Network → inspect API response
- Verify server is running: `http://localhost:3000/api/health`
- Check console logs

**Database issues?**
- Delete `data.db` and restart (will auto-recreate)
- Check file permissions in project folder

## Production Checklist

- [ ] Replace all `[ Placeholder ... ]` text
- [ ] Update webinar dates and times
- [ ] Add real images
- [ ] Verify Resend API key & sender email
- [ ] Test all forms locally
- [ ] Deploy to Vercel/Netlify
- [ ] Verify emails sending in production
- [ ] Add CRM integration (optional)
- [ ] Set up analytics (optional)
- [ ] Monitor leads dashboard (optional)

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JS
- **Backend:** Node.js, Express.js
- **Database:** SQLite3
- **Email:** Resend (SMTP alternative)
- **Deployment:** Vercel / Netlify

---

**Ready to go live?** Follow the deployment section above. Questions? Check troubleshooting or test `/api/health` first.
