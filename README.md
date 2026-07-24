# Hotel AI Concierge — Backend + Embeddable Widget

This is the real, installable version of the hotel chatbot. It has two parts:

1. **The backend** (`server.js`) — a small server that holds your Anthropic API key privately
   and talks to the AI. This is the part you deploy once per hotel client.
2. **The widget** (`public/widget.js`) — the chat bubble that goes on the hotel's website.
   The hotel's web person pastes ONE line of code — they never touch anything else.

You do not need to know how to code to deploy this. Follow the steps below exactly.

---

## Part 1 — One-time setup (do this once, ever)

### 1. Get a Gemini API key
- Go to https://aistudio.google.com/apikey and sign in with a Google account.
- Click "Create API key" and copy it somewhere safe — you'll need it in Part 2.
- Check https://ai.google.dev/pricing for current free-tier limits and paid pricing.

### 2. Create a free GitHub account
- Go to https://github.com and sign up (free).
- This is just a place to store your code so the hosting service can find it — you won't
  need to use any command-line tools.

### 3. Create a free Render account
- Go to https://render.com and sign up (free tier is enough to start; paid tier is ~$7/mo
  per hotel once you want it always-on with no cold starts).

---

## Part 2 — Deploy ONE hotel (repeat this per client)

### Step 1: Edit `config.js` for this hotel
Open `config.js` in this folder and fill in:
- `hotelName`
- `greeting`
- `primaryColor` / `accentColor` (hex codes matching their branding)
- `bookingUrl` (their real booking page)
- `knowledgeBase` — get their actual rates, policies, and amenities from the hotel and
  paste them in here, following the same format as the example. This is the most
  important step — everything the bot says comes only from this text.
- `allowedOrigins` — replace `"*"` with their real website domain once you know it
  (e.g. `"https://www.solanehouse.com"`), so only their site can use this backend.

### Step 2: Upload the code to GitHub (no command line needed)
1. On github.com, click "New repository." Name it something like `solane-house-chatbot`.
   Keep it **Private**.
2. On the new repo's page, click "uploading an existing file."
3. Drag in every file from this folder EXCEPT `.env` (there isn't one yet, that's fine) —
   include `server.js`, `config.js`, `package.json`, `.gitignore`, and the `public` folder.
4. Click "Commit changes."

### Step 3: Deploy it on Render
1. In Render, click "New +" → "Web Service."
2. Connect your GitHub account and select the repo you just created.
3. Fill in:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under "Environment Variables," add:
   - `GEMINI_API_KEY` = your real key from Part 1
5. Click "Create Web Service." Wait a few minutes — Render will give you a live URL like
   `https://solane-house-chatbot.onrender.com`. That's your backend URL.

### Step 4: Give the hotel their embed snippet
Send their web person (or whoever manages their website / WordPress / Squarespace / Wix)
this exact line, with YOUR real Render URL in both places:

```html
<script src="https://solane-house-chatbot.onrender.com/widget.js" data-backend="https://solane-house-chatbot.onrender.com"></script>
```

They paste this once, right before the closing `</body>` tag of their site (most website
platforms have a "custom code" or "footer scripts" section for exactly this — it's the
same install method as Intercom, Drift, or any other chat widget). That's the entire
technical lift on their end.

### Step 5: Test it live
Open their actual website after they've installed it, click the chat bubble, and try a
few real questions. Also test the "Check rates & book direct" button and confirm it
points to their real booking page.

---

## Updating a hotel's info later
Whenever a rate or policy changes: edit `config.js` in their GitHub repo (GitHub lets you
edit files directly in the browser — click the file, click the pencil icon, edit, commit),
and Render will automatically redeploy within a minute or two. No need to touch their
website at all.

---

## Costs to expect (per hotel)
- **Render hosting:** free tier works for demos; ~$7/month for an always-on instance with
  no delay on the first message of the day (recommended once it's live for real guests).
- **Gemini API usage:** Gemini 2.5 Flash has a generous free tier and low-cost paid tier —
  typically a few cents to low dollars per month for a small-to-mid-size hotel's chat
  volume. Check https://ai.google.dev/pricing for current rates.
- Both of these are your delivery cost, separate from what you charge the hotel — factor
  them into your monthly retainer pricing.

## What this version does NOT include yet (be upfront about this in sales)
- **Real-time room availability** — the "Check rates & book direct" button currently sends
  guests to the hotel's existing booking page rather than pulling live inventory. True
  real-time availability requires integrating with their PMS (Opera, Mews, Cloudbeds, etc.),
  which is a larger, separately-scoped project.
- **Multi-hotel management dashboard** — right now each hotel is its own separate deployment.
  Fine for your first several clients; worth building a proper multi-tenant admin panel
  once you have enough clients that editing individual `config.js` files gets tedious.
