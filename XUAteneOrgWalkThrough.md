# SACDEV SOMS — Complete System Walkthrough
## Every File, Every Function, Every API Endpoint, Front to Back

---

# PART 1 — THE BIG PICTURE

## How Everything Connects

```
BROWSER (User/Officer)                BROWSER (Admin)
      │                                     │
      ▼                                     ▼
  frontend/                             frontend/
  index.html                           admin.html
  login.html          ◄── static ───►  admin-log.html
  registration.html    files served    officer-request.html
  officer-request.html    by Node
      │                                     │
      │         HTTP Requests               │
      ▼                                     ▼
┌─────────────────────────────────────────────────┐
│              backend/server.js                  │
│         Node.js + Express (Port 5000)           │
│                                                 │
│  ┌─────────────────┐  ┌──────────────────────┐  │
│  │  requireAdmin   │  │  rateLimit()         │  │
│  │  middleware     │  │  middleware          │  │
│  └─────────────────┘  └──────────────────────┘  │
│                                                 │
│  25 API Routes (GET, POST, PATCH)               │
└──────────────┬───────────────────────────────────┘
               │
     ┌─────────┴──────────┐
     ▼                    ▼
Firebase Auth         Firebase Firestore
(verify tokens,       (database)
 create accounts,
 password reset)
     │                    │
     │              Collections:
     │              - submissions
     │              - officerRequests
     │              - conflicts
     │              - drafts
     │              - activityLog
     │              - settings
     │              - _health
     │
     └──── Gmail SMTP (Nodemailer)
           sends all email notifications
```

## Firestore Collections Overview

| Collection | Purpose | CRUD |
|---|---|---|
| `submissions` | All org re-registration submissions | Create (officer), Read/Update (admin) |
| `officerRequests` | Officer access requests | Create (officer), Read/Update (admin) |
| `conflicts` | Detected officer conflicts | Create (auto), Read/Update (admin) |
| `drafts` | Saved form progress | Create/Update (officer), Read (officer) |
| `activityLog` | Admin action audit trail | Create (auto), Read (admin) |
| `settings` | System settings (submission window) | Read (public), Update (admin) |
| `_health` | Startup connection test | Update (backend) |

---

# PART 2 — BACKEND (server.js)
### File: `backend/server.js` | 1,531 lines

---

## Section 1 — Startup & Configuration

### Dependencies (Lines 1–6)
```javascript
const express    = require('express');    // Web framework
const cors       = require('cors');       // Cross-Origin Resource Sharing
const admin      = require('firebase-admin'); // Firebase Admin SDK
const path       = require('path');       // File path utilities
const nodemailer = require('nodemailer'); // Email sending
const fs         = require('fs');         // File system (reading .env)
```
These are the five packages the entire backend depends on. Nothing else is installed — no ORM, no extra middleware libraries.

---

### .env Loading (Lines 8–23)
```javascript
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => { ... process.env[key] = val; });
} catch (e) {
  // .env not found — rely on environment variables set by the host
}
```
**What it does:** Reads the `.env` file manually line by line without using the `dotenv` package. It parses each line as `KEY=VALUE` and sets it on `process.env`. The `try/catch` means if the file doesn't exist (like on Railway where variables are set directly), it silently continues — the host's environment variables take over.

---

### CORS Configuration (Lines 26–45)
```javascript
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [process.env.ALLOWED_ORIGIN, 'http://localhost', ...];
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));
```
**What it does:** CORS controls which websites are allowed to call the API. Without this, browsers would block requests from your frontend to the backend. `credentials: true` allows cookies and auth headers to be sent. `!origin` allows server-to-server calls (Postman, curl) which have no origin.

---

### Firebase Initialization (Lines 48–63)
```javascript
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('./serviceAccountKey.json');
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
```
**What it does:** Loads Firebase credentials either from an environment variable (Railway/production) or from a local JSON file (Docker/local). `admin.initializeApp()` authenticates the backend with Firebase as a service account — this gives it **full admin access** to Firestore and Auth, bypassing all security rules. `ignoreUndefinedProperties: true` prevents Firestore from throwing errors when saving JavaScript objects that have `undefined` values.

---

### Startup Health Check (Lines 132–153)
```javascript
(async () => {
  try {
    await db.collection('_health').doc('ping').set({ ok: true, ts: ... });
    console.log('Firestore connection verified — database is writable.');
  } catch (err) {
    console.error('Firestore startup check FAILED:', err.message);
    // Detailed error messages about possible causes
  }
})();
```
**What it does:** An Immediately Invoked Function Expression (IIFE) that runs the moment the server starts. It writes a test document to the `_health` collection. If this fails, it means Firebase credentials are wrong, the Firestore API isn't enabled, or the service account lacks permissions. The detailed error messages guide you to exactly what's wrong.

---

### Static Files (Line 155)
```javascript
app.use(express.static(path.join(__dirname, '../frontend')));
```
**What it does:** Tells Express to serve all files in the `frontend/` folder as static assets. This is how `index.html`, `admin.html`, CSS, JS, and images are delivered to the browser. When someone visits `http://localhost:5000`, Express looks for `frontend/index.html` and sends it.

---

### Email Transporter (Lines 120–129)
```javascript
const mailer = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
  auth: { user: 'mardompaurysacdev@gmail.com', pass: process.env.GMAIL_APP_PASSWORD }
});
```
**What it does:** Creates a reusable email client configured to send through Gmail's SMTP server on port 587 (STARTTLS). `requireTLS: true` ensures the connection is encrypted. The password comes from the environment variable — never hardcoded.

---

### HTML Escape Helper (Lines 111–118)
```javascript
function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```
**What it does:** Sanitizes any text before inserting it into HTML email templates. Without this, if an admin types `<script>alert('hack')</script>` as a rejection reason, that script would execute in the officer's email client. This converts HTML special characters into their safe equivalents.

---

## Section 2 — Middleware Functions

### `requireAdmin` — Auth Middleware (Lines 68–85)
**CRUD Role:** Guards all admin endpoints (READ/UPDATE/DELETE)

```javascript
async function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  const decoded = await admin.auth().verifyIdToken(token);
  if (!decoded.email.endsWith('@xu.edu.ph'))
    return res.status(403).json({ error: 'Access denied.' });
  req.adminEmail = decoded.email;
  next();
}
```
**What it does step by step:**
1. Extracts the token from the `Authorization: Bearer <token>` header
2. Sends it to Firebase Auth to verify — Firebase confirms it's a real, non-expired token
3. Checks the email ends with `@xu.edu.ph` — only XU staff accounts are admins
4. Attaches `req.adminEmail` so route handlers know who is acting
5. Calls `next()` to let the request proceed, or returns 401/403 to block it

Every admin route starts with `requireAdmin` as its second argument, making it run before the route handler.

---

### `rateLimit()` — Rate Limiter Factory (Lines 182–220)
**CRUD Role:** Protects public CREATE endpoints

```javascript
function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const ip  = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const key = `${req.path}::${ip}`;
    // Tracks attempts per IP in a Map, resets after windowMs
    if (entry.count >= max) return res.status(429).json({ error: message });
    entry.count++;
    next();
  };
}
```
**What it does:** A function that returns a middleware function (this pattern is called a "middleware factory"). It creates an in-memory `Map` that tracks how many requests each IP address has made to a specific route within a time window. Used on:
- `/submit` — max 5 per hour
- `/officer-request` — max 3 per hour

`x-forwarded-for` gets the real client IP when behind a proxy (like Railway/Nginx). A `setInterval` every 30 minutes cleans up expired entries so the Map doesn't grow forever.

---

### `logActivity()` — Activity Logger (Lines 89–104)
**CRUD Role:** CREATE — writes to `activityLog` collection

```javascript
async function logActivity({ adminEmail, action, targetType, targetId, targetName, details }) {
  const docRef = await db.collection('activityLog').add({
    adminEmail, action, targetType, targetId, targetName, details,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('[ActivityLog] Written:', docRef.id, action, targetName);
}
```
**What it does:** Called after every admin action (approve, reject, publish, etc.) to write a permanent audit record to Firestore. `serverTimestamp()` uses Firebase's server clock — not the backend server's clock — ensuring timestamps are accurate even if the server's time drifts. Called with `await` so errors surface instead of being swallowed silently.

---

## Section 3 — API Routes

### `GET /ping` (Line 173)
**Access:** Public | **CRUD:** READ

```javascript
app.get('/ping', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});
```
**What it does:** A health check endpoint. Returns immediately with `{ ok: true }`. Used by external cron services (like cron-job.org) to ping the server every 10 minutes, preventing Railway/Render free-tier instances from spinning down due to inactivity.

---

### `GET /firebase-test` (Line 158)
**Access:** Public | **CRUD:** CREATE (test write)

**What it does:** Writes a test document to Firestore and returns success. Used during development to verify Firebase connectivity is working. Not used in production flows.

---

### `POST /submit` (Lines 225–347)
**Access:** Public (rate limited: max 5/hour) | **CRUD:** CREATE

**Triggered by:** Officer clicking the final Submit button in `registration.html`

**What it does step by step:**
1. **Checks submission window** — reads `settings/submissionWindow` from Firestore. If `isOpen === 0`, or the current time is outside the open/close date range, returns 403 with a descriptive error message
2. **Sanitizes the payload** — the `sanitize()` function recursively walks the form data object and:
   - Strips any `data:` URI strings (base64 image blobs that weren't uploaded to Cloudinary)
   - Strips large non-Cloudinary strings from photo/signature/logo fields
   - Converts nested arrays (table rows) into objects with `c0`, `c1`, `c2`... keys (Firestore doesn't support nested arrays)
3. **Normalizes emails** to lowercase for consistent querying
4. **Tags the academic year** — calculates AY based on current month (August = new year start)
5. **Writes to Firestore** `submissions` collection with status `pending`, `published: false`
6. **Triggers conflict detection** asynchronously (`detectAndStoreConflicts`) — doesn't block the response
7. **Sends confirmation email** to the organization's email address
8. **Returns** `{ message, id }` with the new Firestore document ID

---

### `GET /submissions` (Lines 351–373)
**Access:** Admin only | **CRUD:** READ

**Triggered by:** `initAdminDashboard()` in `admin.js` on dashboard load

**What it does:** Fetches all documents from the `submissions` collection. Converts Firestore `Timestamp` objects to readable date strings. Sorts newest first by the raw millisecond timestamp (in-memory sort to avoid composite index requirement). Strips the internal `_ts` field before sending.

---

### `GET /submissions/:id/data` (Lines 377–395)
**Access:** Public | **CRUD:** READ

**Triggered by:** Officer clicking "Resubmit" on the Application Status page

**What it does:** Fetches a single submission's full data for pre-filling the resubmit form. Security check: only returns data if the submission's status is `revision`. If it's `approved`, `pending`, or `rejected`, it returns 403. This prevents anyone from using a submission ID to read another org's data.

---

### `PATCH /submissions/:id/status` (Lines 399–621)
**Access:** Admin only | **CRUD:** UPDATE

**Triggered by:** Admin clicking Approve, Reject, or Request Revision in the submission modal

**What it does step by step:**
1. **Validates** the new status is one of: `pending`, `approved`, `rejected`, `revision`
2. **Updates** the Firestore document with new status + timestamp
3. If `rejected` — also saves `rejectionReason`
4. If `revision` — also saves `revisionNotes`
5. **Sends the appropriate email** based on the new status:
   - `approved` → approval email with congratulations
   - `rejected` → rejection email with reason block
   - `revision` → revision email with notes block
   - `pending` → "back under review" email (only if previously approved or rejected)
6. **Calls `logActivity()`** to record the action in the audit log

---

### `PATCH /submissions/:id/publish` (Lines 625–655)
**Access:** Admin only | **CRUD:** UPDATE

**Triggered by:** Admin clicking Publish/Unpublish in the submission modal

**What it does:** Updates the `published` boolean on a submission document. If publishing, also sets `publishedAt` timestamp. If unpublishing, deletes the `publishedAt` field using `FieldValue.delete()`. Then calls `logActivity()`. The `published` flag controls whether the org's strategic plans appear on the public-facing main dashboard.

---

### `GET /org-plans/:orgName` (Lines 659–744)
**Access:** Public | **CRUD:** READ

**Triggered by:** User clicking an organization on the main `index.html` dashboard

**What it does:** One of the most complex query functions in the backend. The challenge is that org names are stored inconsistently — sometimes `"XCITeS"`, sometimes `"Xavier Circle of Information Technology (XCITeS)"`, sometimes with an em-dash. To handle this, it builds a `variants` array of different possible name formats and tries each one until it finds a match. Returns the org's strategic plan data (mission, vision, three program tables) formatted for display.

---

### `GET /submission-status` (Lines 748–816)
**Access:** Public | **CRUD:** READ

**Triggered by:** Logged-in officer viewing the Application Status section on `index.html`

**What it does:** Finds a submission by the officer's email address. Tries three strategies in order:
1. Exact match on `email` field
2. Exact match on `orgEmail` field
3. Full collection scan with case-insensitive comparison (catches old docs with mixed-case emails saved before normalization)

Returns the submission status, org name, revision notes, and rejection reason. The three-strategy approach ensures officers who submitted before email normalization was added can still see their status.

---

### `POST /officer-request` (Lines 820–903)
**Access:** Public (rate limited: max 3/hour) | **CRUD:** CREATE

**Triggered by:** Officer submitting the Request Access form on `officer-request.html`

**What it does:**
1. Validates all required fields are present
2. Validates position is one of: `President`, `Vice President`, `Secretary`
3. Validates email ends with `@my.xu.edu.ph`
4. Checks Firestore for an existing `pending` or `approved` request from the same email — prevents duplicate requests
5. Creates a new document in `officerRequests` collection with `status: 'pending'`
6. Sends a confirmation email to the officer

---

### `GET /check-officer-approval` (Lines 907–935)
**Access:** Public | **CRUD:** READ

**Triggered by:** Two places:
1. `firebase-auth.js` — before login, to verify the officer is approved
2. `onLoginSuccess()` — to fetch the officer's profile data (name, org, position)

**What it does:** Queries `officerRequests` by email, sorts results in memory to get the most recent one, returns `{ approved, status, fullName, organization, position }`. The in-memory sort avoids the Firestore composite index requirement that would be needed for `orderBy` combined with `where`.

---

### `GET /officer-requests` (Lines 939–962)
**Access:** Admin only | **CRUD:** READ

**Triggered by:** `loadOfficerRequests()` in `admin.js` on dashboard load

**What it does:** Fetches all officer requests, sorts newest first, converts timestamps to readable strings, strips internal `_ts` field.

---

### `PATCH /officer-requests/:id/status` (Lines 966–1104)
**Access:** Admin only | **CRUD:** UPDATE

**Triggered by:** Admin clicking Approve or Reject on an officer request

**What it does for approval:**
1. Updates Firestore document: `status: 'approved'`, `reviewedAt`, `reviewedBy`
2. Tries to find the Firebase Auth user by email using `admin.auth().getUserByEmail()`
3. If user doesn't exist (`auth/user-not-found`): creates one with `admin.auth().createUser()` and a random temporary password
4. Generates a **password reset link** using `admin.auth().generatePasswordResetLink()` — this is a real Firebase-hosted link
5. Sends approval email with the "Set My Password →" button linking to that URL
6. Calls `logActivity()`

**What it does for rejection:**
1. Updates Firestore: `status: 'rejected'`, saves `rejectionReason`
2. Sends rejection email with reason
3. Calls `logActivity()`

---

### `detectAndStoreConflicts()` (Lines 1113–1163)
**Access:** Internal function | **CRUD:** CREATE

**Triggered by:** `POST /submit` (async, doesn't block the response)

**What it does:** After a new submission is saved, this function scans all other submissions looking for the same student ID holding an executive position in multiple organizations. Executive positions are: President, Vice President, Secretary, Treasurer, Auditor (defined in `EXEC_POSITIONS`). For each conflict found, it checks if it already exists in the `conflicts` collection before creating a new one (prevents duplicates). This is the automated conflict detection that runs silently after every submission.

---

### `GET /conflicts` (Lines 1167–1180)
**Access:** Admin only | **CRUD:** READ

**Triggered by:** `loadAndRenderConflicts()` in `admin.js`

**What it does:** Fetches all conflicts ordered by `createdAt` descending. This one uses `orderBy` directly because the `conflicts` collection only queries on a single field — no composite index needed.

---

### `POST /conflicts/:id/notify` (Lines 1184–1253)
**Access:** Admin only | **CRUD:** UPDATE + email

**Triggered by:** Admin clicking "Notify Orgs" on a conflict

**What it does:** Sends an email notification to both organizations involved in the conflict (using their `orgEmail` fields). Updates the conflict document: `notified: true`, `notifiedAt`. Returns the list of recipients.

---

### `POST /conflicts/:id/resolve` (Lines 1324–1340)
**Access:** Admin only | **CRUD:** UPDATE

**What it does:** Sets `resolved: true` and `resolvedAt` on a conflict document. Resolved conflicts are visually moved to a collapsed "Resolved Conflicts" section in the admin panel.

---

### `POST /rescan-conflicts` (Lines 1344–1399)
**Access:** Admin only | **CRUD:** CREATE

**Triggered by:** Admin clicking "Re-scan All" button

**What it does:** A full brute-force scan of all submissions against each other. Uses a nested loop: for every pair of submissions (i, j), compares their executive officers by student ID. Creates a conflict document for any match not already in the database. Returns the count of new conflicts found.

---

### `POST /submissions/:id/notes` (Lines 1257–1275)
**Access:** Admin only | **CRUD:** CREATE

**What it does:** Adds a note to a **subcollection** inside the submission document: `submissions/{id}/notes`. Firestore supports subcollections — this keeps notes contained within their parent submission. Records the admin email as author.

---

### `GET /submissions/:id/notes` (Lines 1277–1295)
**Access:** Admin only | **CRUD:** READ

**What it does:** Fetches all notes from the subcollection, ordered by `createdAt` ascending (oldest first, like a chat thread).

---

### `PATCH /submissions/:id/resubmit` (Lines 1299–1320)
**Access:** Public | **CRUD:** UPDATE

**Triggered by:** Officer clicking "Resubmit" after addressing revision notes

**What it does:** Verifies the submission status is `revision` (rejects otherwise), then resets it to `pending`, clears `revisionNotes`, and sets `resubmittedAt`. This puts it back in the admin's review queue.

---

### `POST /save-progress` (Lines 1403–1419)
**Access:** Public | **CRUD:** CREATE/UPDATE (upsert)

**Triggered by:** `_syncProgressToServer()` in `script.js` (called periodically and after each form step)

**What it does:** Saves the entire form state to the `drafts` collection using the officer's email as the document ID. Using `set()` (not `add()`) means it overwrites the same document each time — this is an **upsert** (update if exists, create if not). Allows the officer to continue from a different device.

---

### `GET /load-progress` (Lines 1421–1434)
**Access:** Public | **CRUD:** READ

**Triggered by:** `syncProgressFromServer()` in `script.js` after login

**What it does:** Fetches the saved draft for the officer's email. If found, `script.js` restores the entire form state from it.

---

### `GET /submission-window` (Lines 1438–1455)
**Access:** Public | **CRUD:** READ

**Triggered by:** Two places:
1. `index.html` — `proceedIfOpen()` before allowing navigation to login/request
2. `admin.js` — `loadSubmissionWindow()` to populate the settings panel

**What it does:** Reads `settings/submissionWindow` from Firestore. Returns `isOpen` (converted from `0`/`1` integer to boolean), `openDate`, `closeDate`, `updatedAt`, `updatedBy`. Returns safe defaults if the document doesn't exist yet.

---

### `PATCH /submission-window` (Lines 1459–1481)
**Access:** Admin only | **CRUD:** UPDATE

**Triggered by:** Admin toggling or changing dates in the Submission Window panel

**What it does:** Uses `set()` (full overwrite, not merge) to write the entire settings document at once. Stores `isOpen` as an integer `0` or `1` instead of a boolean — this was a deliberate fix because Firestore's `ignoreUndefinedProperties` setting was silently dropping `false` boolean values.

---

### `GET /activity-log` (Lines 1485–1514)
**Access:** Admin only | **CRUD:** READ

**Triggered by:** `admin-log.html` on page load and on refresh

**What it does:** Fetches all activity log entries, attaches the raw millisecond timestamp for sorting, sorts newest first in memory, slices to the requested limit (default 100), strips the internal `_ts` field before returning.

---

### Catch-All Route (Lines 1518–1520)
```javascript
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
```
**What it does:** Any GET request that doesn't match a defined API route (like `/about` or `/somepage`) returns `index.html`. This enables client-side navigation — the frontend handles its own routing. **Critical:** This must be the LAST route defined, otherwise it intercepts API routes.

---

# PART 3 — FRONTEND FILES

---

## `firebase-auth.js` — Officer Authentication
### 299 lines | Loaded only by `login.html` and `registration.html`

This file handles everything related to logging officers in and out. It's a plain JavaScript file (not a module) that loads after the Firebase SDK `<script>` tags in `login.html`.

---

### Firebase Setup (Lines 4–19)
```javascript
const firebaseConfig = { apiKey, authDomain, projectId, ... };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const ALLOWED_DOMAIN = "@my.xu.edu.ph";
window._firebaseAuth = auth;
```
Initializes Firebase on the client side using the project's public config (this is safe to expose — Firebase security rules protect the data). Sets `ALLOWED_DOMAIN` as a constant used for every email validation check. Exposes `auth` on `window._firebaseAuth` so other scripts can access it.

---

### `handleAuth()` — Login Flow (Lines 28–72)
**Triggered by:** Officer clicking "Log In →" button

```javascript
window.handleAuth = async function () {
  // 1. Validate email and password fields
  // 2. Check officer approval with backend
  // 3. Sign in with Firebase
  // 4. Call onLoginSuccess()
}
```
**Step by step:**
1. Gets email and password from the hidden `authEmail` and `authPassword` fields (these are synced from the visible login fields by `handleLogin()` in `script.js`)
2. Validates email format and `@my.xu.edu.ph` domain
3. Calls `GET /check-officer-approval?email=...` to verify the officer is approved before even attempting Firebase login — prevents unauthorized access attempts
4. If not approved: shows specific error (pending / rejected / not submitted)
5. If approved: calls `auth.signInWithEmailAndPassword()` — this is a Firebase SDK call
6. On success: calls `onLoginSuccess(email)`

---

### `onAuthStateChanged` (Lines 74–85)
```javascript
auth.onAuthStateChanged((user) => {
  if (user && user.email.endsWith(ALLOWED_DOMAIN)) {
    // update currentState, save to sessionStorage/localStorage
    // show navbar profile, start session timeout
  }
});
```
**What it does:** Firebase automatically calls this whenever the auth state changes — on page load (if the user was already logged in), after login, and after logout. It's the "always-on" auth listener. On `registration.html`, if the user refreshes the page, this fires and restores their logged-in state and starts the session timeout timer.

---

### `getUserProfile()` / `saveUserProfile()` (Lines 87–98)
**What they do:** Store and retrieve the officer's profile (name, org, position) from `localStorage` under the key `sacdev_profile_<email>`. This caches the profile so the navbar shows their name without needing a network request on every page load.

---

### `applyNavbarProfile()` (Lines 100–113)
**What it does:** Updates the navbar's name and organization display. Finds `#navbarName`, `#navbarOrg`, and `#navbarUser` elements and populates them. Makes the user section visible by removing the `hidden` class.

---

### `onLoginSuccess()` (Lines 115–172)
**What it does after login:**
1. Updates `currentState` in `script.js` (if it exists)
2. Saves email to `sessionStorage` and `localStorage`
3. Starts session timeout
4. Checks if a profile is already cached in `localStorage`
5. If not cached: fetches from `GET /check-officer-approval` to get their name, org, and position
6. Saves profile to `localStorage`
7. Calls `syncProgressFromServer()` to load any saved draft
8. Navigates to `registration.html`

---

### `handleSignOut()` (Lines 174–188)
**Triggered by:** Officer clicking "Log out" in the navbar

**What it does:** Signs out from Firebase Auth, clears `sessionStorage`, resets `currentState`, hides the navbar user section, redirects to `index.html`.

---

### `handlePasswordReset()` (Line 190–192)
```javascript
window.handlePasswordReset = async function (email) {
  await auth.sendPasswordResetEmail(email);
};
```
**What it does:** Calls Firebase's built-in password reset. Firebase sends a reset email directly — the backend is not involved at all for this operation.

---

### Session Timeout System (Lines 194–271)
**Variables:**
- `SESSION_WARN_MS = 25 * 60 * 1000` — 25 minutes
- `SESSION_LOGOUT_MS = 30 * 60 * 1000` — 30 minutes

**`_startSessionTimeout()`** — only runs on `registration.html`:
1. Injects a hidden warning banner div into the page DOM
2. Attaches event listeners for `mousemove`, `keydown`, `click`, `scroll`, `touchstart`
3. Starts the timers

**`_resetSessionTimers()`** — called on every user activity:
1. Clears existing timers
2. Hides the warning banner
3. Sets a new 25-minute warn timer
4. Sets a new 30-minute logout timer

When the warn timer fires: the banner becomes visible (`display: flex`).
When the logout timer fires: signs out Firebase, clears session, redirects to `login.html?timeout=1`.

On `login.html`, if `?timeout=1` is in the URL, an inactivity message is shown.

---

### `friendlyError()` (Lines 274–289)
**What it does:** Maps Firebase error codes to human-readable messages. Instead of showing `auth/invalid-credential`, shows "Incorrect email or password. Please try again." Covers 10 different Firebase error codes.

---

## `admin.js` — Admin Dashboard Logic
### 2,014 lines | Loaded only by `admin.html`

The largest frontend file. Controls everything the admin sees and does.

---

### `toggleSection()` (Lines 2–9)
```javascript
function toggleSection(bodyId, chevronId) {
  const body = document.getElementById(bodyId);
  body.classList.toggle('open', !isOpen);
  chevron.classList.toggle('open', !isOpen);
}
```
**What it does:** Toggles the `open` CSS class on collapsible section bodies. The CSS handles the actual animation using `max-height` and `opacity` transitions. The chevron `▶` rotates 90° when `open` class is added.

---

### `showConfirm()` / `showAlert()` / `closeConfirmModal()` (Lines 12–39)
**What they do:** Replace all native browser `confirm()` and `alert()` dialogs with a styled modal. `showConfirm()` shows a modal with Cancel + Confirm buttons and accepts an `onOk` callback. `showAlert()` shows a modal with only a "Got it" button by hiding the Cancel button. `closeConfirmModal()` hides the modal and restores the Cancel button visibility for the next use.

---

### `CLUSTERS` constant (Lines 42–164)
A hardcoded JavaScript object mapping cluster names to arrays of org names. This is the master list of all 62 recognized organizations across 11 clusters. Used to:
1. Populate the cluster accordion on the admin dashboard
2. Populate the organization dropdown on `officer-request.html`
3. Filter submissions by cluster in the admin table

---

### Firebase Admin Auth Setup (Lines 167–198)
```javascript
const _firebaseConfig = { ... };
let _fbApp = null, _fbAuth = null;
async function getFirebaseAuth() {
  // Lazy-loads Firebase Auth module on first call
  // Returns the auth instance
}
async function getAuthHeaders() {
  // Gets current user's ID token
  // Falls back to sessionStorage if Firebase unavailable
  // Returns { Authorization: 'Bearer <token>' }
}
```
The admin uses the **modular Firebase SDK** (v10) loaded as ES modules via dynamic `import()`, unlike the officer side which uses the compat SDK. `getFirebaseAuth()` initializes it lazily — only when first needed. `getAuthHeaders()` is called before every API request to get a fresh, valid token.

---

### Admin Login Functions (Lines 199–324)

**`handleAdminLogin()`** — email+password login:
1. Gets email/password from form fields
2. Imports `signInWithEmailAndPassword` from Firebase modular SDK
3. Signs in with Firebase
4. Immediately tests against `/submissions` to verify `@xu.edu.ph` access
5. Saves token to `sessionStorage`
6. Shows dashboard, calls `initAdminDashboard()`

**`handleAdminGoogleLogin()`** — Google SSO:
1. Imports `GoogleAuthProvider` and `signInWithPopup` from Firebase
2. Opens Google popup (user selects account)
3. Verifies email ends with `@xu.edu.ph`
4. Tests against `/submissions` endpoint
5. Saves token, shows dashboard

**`handleAdminLogout()`**:
Clears session storage, returns to login page. Simple — no Firebase signOut needed for admin since token is just discarded.

---

### Academic Year System (Lines 326–412)

**`getSubmissionAY(submission)`** — determines which AY a submission belongs to:
- Uses the stored `academicYear` field if present
- Falls back to calculating from `createdAt` timestamp (August 1 = new AY start)

**`buildAYTabs()`** — builds the tab buttons:
1. Collects all distinct AYs from `allSubmissions` into a Set
2. Sorts them chronologically
3. Latest AY gets a white active-style tab
4. Older AYs get gold archive-style tabs
5. Sets `_activeAY` to the latest on first load

**`switchAY(ay)`** — called when a tab is clicked:
Sets `_activeAY`, rebuilds tabs (to update active state), calls `applyAYFilter()`

**`getFilteredSubmissions()`** — returns only submissions for the active AY

**`applyAYFilter()`** — re-renders everything with the filtered subset:
Stats, table, cluster accordion, cluster filter dropdown, hint text

---

### `initAdminDashboard()` (Lines 414–441)
**The main orchestration function. Called once after admin login.**

```javascript
async function initAdminDashboard() {
  // 1. Show loading spinner
  // 2. Fetch all submissions from backend
  // 3. Attach raw timestamps for AY calculation
  // 4. Build AY tabs
  // 5. Apply AY filter (renders stats, table, clusters)
  // 6. Load conflicts
  // 7. Load officer requests
  // 8. Load submission window settings
  // 9. Update browser tab title
}
```
Everything the admin sees flows from this one function.

---

### `updateTabTitle()` (Lines 443–450)
**What it does:** Counts pending submissions + pending officer requests, updates the browser tab title. If there are 3 pending items: tab shows `(3) Admin Panel — SACDEV SOMS`. Resets to `Admin Panel — SACDEV SOMS` when nothing is pending.

---

### `renderStats()` (Lines 452–468)
**What it does:** Counts totals from the filtered submissions array, calls `animateCount()` for each stat card. Sets/removes `has-conflicts` class on the conflicts card (turns it red when conflicts exist).

**`animateCount(id, target)`** (Lines 470–480):
Animates a number from 0 to target over ~800ms using `setInterval`. Steps 1/20th of the target value every 40ms.

---

### `renderTable(submissions)` (Lines 483–...)
**What it does:**
1. Sorts submissions: Pending → Revision → Rejected → Approved (approved go to bottom)
2. Builds duplicate detection map (same org name appearing twice)
3. Renders each row with status badge, colored background for approved rows
4. Each row has `onclick` opening the detail modal
5. Shows "No submissions found" if empty

---

### `openDetailModal(submissionId)` (Lines ~850–1190)
**What it does:** One of the most complex frontend functions. When admin clicks a row:
1. Finds the submission in `allSubmissions` by ID
2. Builds a large HTML string with all the org's data (officers table, members table, documents, strategic plan)
3. Sets it as the modal's `innerHTML`
4. Fetches internal notes from `/submissions/:id/notes`
5. Shows the modal with action buttons (Approve, Request Revision, Reject)
6. Shows Publish/Unpublish button based on current `published` state

---

### Status Update Functions

**`confirmApproveSubmission(id, orgName)`** — shows a confirm modal, then calls `updateStatusAndRefresh(id, 'approved')`

**`updateStatusAndRefresh(id, status, reason)`**:
1. Calls `PATCH /submissions/:id/status`
2. If successful: sets `success = true`
3. Closes modal
4. Calls `initAdminDashboard()` outside try/catch (so its errors don't show a false "Failed" alert)

**`openRejectModal(id, orgName)`** — shows the reject modal (prompts for reason)
**`confirmReject()`** — reads the reason, calls `updateStatusAndRefresh(id, 'rejected', reason)`

**`openRevisionModal(id, orgName)`** — shows the revision notes modal
**`confirmRevision()`** — reads notes, calls `updateStatusAndRefresh(id, 'revision', notes)`

---

### `togglePublish(id, publish)` (Lines ~1292–1330)
**What it does:**
1. Shows confirm modal (green for publish, red for unpublish)
2. Calls `PATCH /submissions/:id/publish`
3. On success: closes modal, shows success alert, calls `initAdminDashboard()` outside try/catch

---

### `loadAndRenderConflicts()` (Lines ~670–780)
**What it does:**
1. Shows conflicts loading state
2. Fetches from `GET /conflicts`
3. Separates into active conflicts and resolved conflicts
4. Renders active conflicts table with Notify Orgs and Mark Resolved buttons
5. If any resolved conflicts exist, shows the collapsed "Resolved Conflicts" section

**`notifyConflict(id, btnEl)`** — shows confirm modal, calls `POST /conflicts/:id/notify`
**`resolveConflict(id, btnEl)`** — shows confirm modal, calls `POST /conflicts/:id/resolve`
**`rescanConflicts()`** — shows confirm modal, calls `POST /rescan-conflicts`

---

### Officer Requests Section (Lines ~1674–1780)
**`loadOfficerRequests()`** — fetches from `GET /officer-requests`, renders table, updates badge
**`updateOfficerBadge()`** — updates the pending count badge, auto-opens section if pending > 0
**`setOfficerFilter(btn)`** — filters the table by status (All/Pending/Approved/Rejected)
**`renderOfficerRequests(requests)`** — builds the table rows with Approve/Reject buttons
**`approveOfficerRequest(id, btnEl)`** — shows confirm, calls `PATCH /officer-requests/:id/status` with `approved`
**`openOfficerRejectModal(id, name)`** / **`confirmOfficerReject()`** — reject flow with reason

---

### Submission Window Section (Lines ~1795–1965)

**`getFirebaseFirestore()`** — lazily loads the Firebase Firestore modular SDK, returns `{ db, doc, setDoc, getDoc, serverTimestamp }`

**`loadSubmissionWindow()`**:
1. Calls `getDoc()` directly on Firestore (bypasses backend for reads)
2. Sets the toggle checkbox state (`isOpen !== 0`)
3. Populates the date/time fields
4. Updates the status badge

**`saveWindowSettings()`** — triggered by any change to the toggle or dates:
1. Gets values from the form elements
2. Calls `setDoc()` directly on Firestore to write `{ isOpen: 0/1, openDate, closeDate }`
3. Shows "✓ Settings saved" or error message

**`updateWindowStatusBadge()`** — calculates and displays the current status: Open / Submissions Closed / Deadline Passed / Opens [date] with days remaining

---

### `renderClusterAccordion(submissions)` (Lines ~520–600)
**What it does:** Builds the Organizations accordion using the `CLUSTERS` constant. For each cluster, creates a collapsible section. Each org gets a status indicator based on whether it has an approved/pending/no submission in the filtered data.

---

### Export Functions (Lines ~1600–1700)

**`exportCSV()`**:
1. Gets filtered submissions from `getFilteredSubmissions()`
2. Builds CSV string with headers and rows
3. Creates a Blob, generates an object URL
4. Creates a temporary `<a>` element, clicks it programmatically, removes it
5. Downloads as `SACDEV_Submissions_<date>.csv`

**`exportPDF()`**:
1. Uses jsPDF + jsPDF-autotable libraries (loaded via CDN)
2. Creates a landscape A4 document
3. Adds a navy header bar with title
4. Adds a summary table with all submissions
5. Adds page numbers in the footer
6. Saves as `SACDEV_Submissions_<date>.pdf`

---

## `script.js` — Registration Form Logic
### 2,678 lines | Loaded only by `registration.html`

Manages the entire multi-step registration form — navigation, validation, auto-save, data collection, and submission.

---

### `currentState` Object (Lines ~190–205)
```javascript
let currentState = {
  selectedCouncil: null, selectedOrg: null,
  isLoggedIn: false, userEmail: null,
  dashTab: 'home', orgName: null, orgEmail: null, ...
};
```
A single object that holds the entire application state. Everything the form needs to know is in here. Persisted to `sessionStorage` between page navigations.

---

### `goToPage(pageName)` (Lines ~208–260)
**The core navigation function.** Called every time the user moves between form steps.

1. Hides all `.page` divs
2. Shows the target page div
3. Calls the init function for that page if it exists
4. Saves state to sessionStorage

All pages are always in the DOM — just hidden/shown with CSS classes. There's no actual navigation between URLs.

---

### `initDashboard()` (Lines ~420–500)
**What it does:**
1. Checks login status
2. If logged in: calls `GET /submission-status?email=...` to check if there's an existing submission
3. Shows Application Status card with the current status (Pending/Approved/Rejected/For Revision)
4. If status is `revision`: shows the Resubmit button
5. Renders the org directory (Directory tab), councils (Councils tab), clusters (Clusters tab)

---

### `openOrgPlansModal(orgName)` (Lines ~1217–...)
**Triggered by:** Clicking an org in the Directory, Councils, or Clusters tab

**What it does:**
1. Creates or reuses an overlay element
2. Shows loading state
3. Calls `GET /org-plans/:orgName`
4. If published: renders mission, vision, and three strategic plan tables
5. If not published: shows "No strategic plans available"

---

### Form Data Management

**`saveFormData(formId)`** — serializes a form's input values into a plain object and saves to `localStorage` under `sacdev_form_<formId>`

**`loadFormData(formId)`** — retrieves and returns the saved form data object

**`_syncProgressToServer()`** — collects all form data from all steps, POSTs to `/save-progress`. Called after each step and periodically.

**`window.syncProgressFromServer(email)`** — called after login. Fetches from `/load-progress?email=...`, restores all form data to their respective localStorage keys.

---

### Form Step Functions

Each form step has a pair of functions:

| Function | What it does |
|---|---|
| `initOrgInfo()` | Populates org info fields from saved data, sets up cluster dropdown |
| `submitOrgInfo()` | Validates required fields, saves data, goes to next page |
| `initStratPlan()` | Loads saved strategic plan data, sets up the table rows |
| `submitStratPlan()` | Validates, saves, goes to next |
| `initPresidentProfile()` | Loads president data, populates fields |
| `submitPresidentProfile()` | Validates, saves |
| ... and so on for officers, members, moderator, documents |

---

### `proceedWithConfirm()` (Lines ~747–755)
**Triggered by:** Officer clicking "I have read the guidelines, Proceed" button

**What it does:** Shows a styled confirm modal ("I confirm that I have read all guidelines"). On confirm: calls `goToPage('orgInfo')`.

---

### File Upload Functions (Lines ~1708–1820)

**`validateImageFile(file)`** — checks file type (JPG/PNG/WEBP only) and size (max 5MB), returns error string or null

**`validatePdfFile(file)`** — checks PDF type only, max 10MB

**`showUploadError(inputId, message)`** — creates or reuses an error element below the upload box, shows the message, auto-hides after 6 seconds

**`handleImageUpload(inputId, previewId, placeholderId)`**:
1. Runs `validateImageFile()` — stops if invalid
2. Shows local preview immediately using `FileReader` (before upload completes)
3. Shows "Uploading…" placeholder text
4. Calls `uploadToCloudinary(file)` — uploads to Cloudinary
5. Stores the returned Cloudinary URL on the input element as `dataset.cloudinaryUrl`

**`handleFileUpload(inputId, fileNameElId, boxId)`** — same but for PDFs

**`uploadToCloudinary(file)`** — sends the file to Cloudinary's upload API using a preconfigured preset, returns the secure URL

---

### `submitAllForms()` (Lines ~2234–2260) + `doFinalSubmit()` (Lines ~2428–...)

**`submitAllForms()`** — the wrapper function called by the Submit button:
1. Checks if some documents are still missing — shows "Submit anyway?" confirm if so
2. Calls `doFinalSubmit()`

**`doFinalSubmit()`** — the actual submission function:
1. Collects all form data from all steps using `loadFormData()`
2. Builds the complete submission payload
3. Posts to `POST /submit`
4. On success: shows success modal, clears all form data, redirects to dashboard
5. On failure: shows error message

---

### Confirmation Modals in script.js

**`showRegConfirm({ icon, title, message, okText, okColor, onOk })`** — shows the registration page's confirm modal

**`closeRegConfirm()`** — hides the modal

These mirror the admin's `showConfirm()`/`closeConfirmModal()` but are separate instances for the registration page.

---

## `index.html` — Main Public Dashboard
### Key JavaScript embedded in the page

**`proceedIfOpen(dest)`** — called when clicking "Proceed to Registration" or "Request Officer Access":
1. Fetches directly from Firestore's `settings/submissionWindow` document using Firebase client SDK (not through backend)
2. Checks `isOpen`, `openDate`, `closeDate`
3. If submissions are closed: shows the "Submissions Not Available" modal with the reason
4. If open: navigates to `dest`

The Firestore direct read is used here instead of the backend `/submission-window` endpoint because `index.html` doesn't need auth and Firestore security rules allow public reads on the `settings` collection.

---

## `officer-request.html` — Request Access Form
### Key JavaScript embedded in the page

**`submitRequest()`**:
1. Validates all fields including `@my.xu.edu.ph` email check
2. Posts to `POST /officer-request`
3. Handles 429 rate limit error with a clear message
4. On success: hides form, shows success card with the officer's email

---

## `admin-log.html` — Activity Log Page

**`onAuthStateChanged` callback**:
1. If no user: redirects to `admin.html` immediately
2. If user doesn't end in `@xu.edu.ph`: shows "Access Denied" message
3. If valid admin: shows page content, calls `loadLog(user)`

**`loadLog(user)`**:
1. Gets token from the `user` object passed in (not from `auth.currentUser` — avoids null timing issue)
2. Fetches `GET /activity-log?limit=200`
3. If fetch fails: shows error message with details
4. Calls `renderLog()`

**`filterLog()`** — filters `_allLogs` by search text and action type, re-renders

**`renderLog(logs)`** — builds the table rows with action badges

**`exportLogCSV()`** — exports currently visible logs as CSV

**`exportLogPDF()`** — exports currently visible logs as PDF using jsPDF + autoTable

---

# PART 4 — HOW EVERYTHING CONNECTS (Flow Diagrams)

## Officer Registration Flow

```
officer-request.html          server.js                  Firestore
       │                          │                          │
       ├─ fills form ─────────────┤                          │
       ├─ POST /officer-request ──►─── validate ────────────►│ CREATE officerRequests
       │                          │                          │
       │◄─── confirmation email ──┤                          │
       │                          │                          │
       │  [Admin approves]        │                          │
       │                          ├── CREATE Firebase Auth ──►│
       │◄─── password setup email─┤                          │
       │                          │                          │
login.html                        │                          │
       │                          │                          │
       ├─ enters email+pass        │                          │
       ├─ GET /check-officer ─────►│──── READ officerRequests►│
       │◄─── { approved: true } ──┤                          │
       │                          │                          │
       ├─ Firebase signIn          │                          │
       ├─ GET /load-progress ─────►│──── READ drafts ─────────►│
       │                          │                          │
       │   navigate ──────────────►                          │
       ▼                                                      │
registration.html                                             │
       │                                                      │
       ├─ fills each form step                                │
       ├─ POST /save-progress ────►─── UPSERT drafts ─────────►│
       │                                                      │
       ├─ final submit                                        │
       ├─ POST /submit ──────────►─── CREATE submissions ─────►│
       │                         │                            │
       │◄── confirmation email ──┤                            │
       │                         └── detectConflicts() ──────►│ CREATE conflicts (if any)
```

## Admin Review Flow

```
admin.html                   server.js                  Firestore
    │                            │                          │
    ├─ Google/email login         │                          │
    ├─ GET /submissions ─────────►│──── READ submissions ────►│
    │◄─── all submissions ────────┤                          │
    │                            │                          │
    ├─ GET /conflicts ───────────►│──── READ conflicts ──────►│
    ├─ GET /officer-requests ────►│──── READ officerRequests ►│
    ├─ GET /submission-window ───►│──── READ settings ───────►│
    │                            │                          │
    ├─ clicks Approve            │                          │
    ├─ PATCH /submissions/:id/status ─── UPDATE submission ──►│
    │                            │                          │
    │                            ├─ send approval email      │
    │                            ├─ logActivity() ──────────►│ CREATE activityLog
    │                            │                          │
    ├─ clicks Publish            │                          │
    ├─ PATCH /submissions/:id/publish ── UPDATE submission ──►│
    │                            ├─ logActivity() ──────────►│ CREATE activityLog
```

---

# PART 5 — CRUD SUMMARY TABLE

| Operation | Who | What | How | Firestore Collection |
|---|---|---|---|---|
| CREATE submission | Officer | Submit re-registration form | POST /submit | `submissions` |
| READ submissions | Admin | View all submissions | GET /submissions | `submissions` |
| READ single submission | Officer | Resubmit prefill | GET /submissions/:id/data | `submissions` |
| UPDATE submission status | Admin | Approve/Reject/Revision | PATCH /submissions/:id/status | `submissions` |
| UPDATE submission publish | Admin | Publish/Unpublish plans | PATCH /submissions/:id/publish | `submissions` |
| UPDATE submission resubmit | Officer | Resubmit after revision | PATCH /submissions/:id/resubmit | `submissions` |
| CREATE note | Admin | Add internal note | POST /submissions/:id/notes | `submissions/{id}/notes` |
| READ notes | Admin | View notes | GET /submissions/:id/notes | `submissions/{id}/notes` |
| CREATE officer request | Officer | Request access | POST /officer-request | `officerRequests` |
| READ officer requests | Admin | View all requests | GET /officer-requests | `officerRequests` |
| READ approval check | System | Login gate check | GET /check-officer-approval | `officerRequests` |
| UPDATE officer request | Admin | Approve/Reject | PATCH /officer-requests/:id/status | `officerRequests` |
| CREATE conflict | System | Auto-detect on submit | detectAndStoreConflicts() | `conflicts` |
| READ conflicts | Admin | View conflicts panel | GET /conflicts | `conflicts` |
| UPDATE conflict notify | Admin | Send notification | POST /conflicts/:id/notify | `conflicts` |
| UPDATE conflict resolve | Admin | Mark resolved | POST /conflicts/:id/resolve | `conflicts` |
| CREATE/UPDATE draft | Officer | Auto-save form | POST /save-progress | `drafts` |
| READ draft | Officer | Load saved progress | GET /load-progress | `drafts` |
| READ org plans | Public | View strategic plans | GET /org-plans/:orgName | `submissions` |
| READ submission status | Officer | Check own status | GET /submission-status | `submissions` |
| READ window settings | Public/Admin | Check open/close | GET /submission-window | `settings` |
| UPDATE window settings | Admin | Set dates/toggle | PATCH /submission-window | `settings` (via Firestore SDK) |
| CREATE activity log | System | Auto-log admin actions | logActivity() | `activityLog` |
| READ activity log | Admin | View audit trail | GET /activity-log | `activityLog` |

---

# PART 6 — SECURITY MODEL

## Two Separate Auth Systems

| Side | System | Domain | Token Type |
|---|---|---|---|
| Officer | Firebase Auth (email+password) | `@my.xu.edu.ph` | Firebase ID token (not used for API — officer uses public endpoints) |
| Admin | Firebase Auth (email+password or Google SSO) | `@xu.edu.ph` | Firebase ID token (sent as Bearer token to all admin API calls) |

## Why Officers Don't Need Tokens for the API
Officers use **public endpoints** (`POST /submit`, `GET /submission-status`, etc.). Their "security" comes from the fact that they can only submit using their approved email, and the backend validates against `officerRequests`. The form data itself doesn't contain anything sensitive that needs to be hidden from the officer.

## How Admin Endpoints Are Secured
Every admin route has `requireAdmin` as middleware. The middleware:
1. Extracts the Bearer token from the `Authorization` header
2. Verifies it with Firebase Admin SDK (which has full authority)
3. Checks the email ends with `@xu.edu.ph`
4. Only then allows the request to proceed

If the token is expired, Firebase returns an error and the middleware returns 401.

## Rate Limiting
- `/submit` — max 5 per hour per IP
- `/officer-request` — max 3 per hour per IP
- In-memory (resets if server restarts) — fine for the scale of this system

## Submission Window Security
The submission window is checked at two levels:
1. **Frontend** — `proceedIfOpen()` on `index.html` blocks navigation before the officer even reaches the login page
2. **Backend** — `POST /submit` re-checks the window settings from Firestore, rejecting submissions even if someone bypasses the frontend

---

# PART 7 — KEY DESIGN DECISIONS

**Why no dotenv package?** The `.env` is parsed manually to avoid an extra dependency. The code is simple enough to do it in ~10 lines.

**Why store `isOpen` as `0`/`1` instead of `false`/`true`?** Firestore's `ignoreUndefinedProperties: true` setting was silently dropping `false` boolean values when using `set()` with `merge: true`. Integer `0` is never dropped.

**Why sort in memory instead of using Firestore `orderBy`?** Many queries combine `where()` with `orderBy()` which requires a composite index to be manually created in Firebase Console. Sorting in memory avoids this requirement entirely for small datasets.

**Why are officer requests rate limited but not admin actions?** Officers are untrusted public users who could spam requests. Admins are authenticated, verified `@xu.edu.ph` users — rate limiting them would be counterproductive.

**Why use Firebase client SDK directly for the submission window write (not through the backend)?** Sending the window toggle state through the backend requires an authenticated API call. The direct Firestore write uses the already-authenticated admin Firebase session, eliminating the token/auth complexity for this one operation.

**Why is the catch-all route last?** Express matches routes in order. If the catch-all `app.get('/{*path}')` appeared before API routes, it would intercept every API call and return `index.html` instead. It must always be the very last route.

**Why does the detail modal close before `initAdminDashboard()` runs?** If the modal is open when `initAdminDashboard()` tries to re-render, it tries to set `innerHTML` on elements that no longer exist (the modal content was replaced). Closing the modal first, then refreshing the dashboard separately, avoids this null reference error.
