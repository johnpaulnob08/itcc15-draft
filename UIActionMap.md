# SACDEV SOMS — Complete UI Action Map
## Every Button, Input, Click, Toggle, Upload — What Happens in the Code

---

# PAGE 1 — index.html (Main Public Dashboard)

## On Page Load
**What happens automatically:**
1. `script.js` runs → `DOMContentLoaded` fires → `initDashboard()` is called
2. Auth guard runs inline:
   ```js
   var email = sessionStorage.getItem('sacdev_userEmail');
   if (email) window.location.replace('registration.html');
   ```
   If officer is already logged in → they are redirected away from this page immediately
3. `initDashboard()` in `script.js`:
   - Checks login state
   - If logged in: calls `GET /submission-status?email=...` → shows Application Status card
   - Renders Directory tab (all 62 orgs), Councils tab, Clusters tab from the hardcoded `CLUSTERS` and `councils` objects
   - Default tab: **Home** is shown

---

## Navbar

| Element | Action | Code Chain |
|---|---|---|
| XU Logo (image) | No action — decorative | — |
| "Student Activities and Leadership Development" | No action — decorative | — |
| XU Centennial logo | No action — decorative | — |
| Officer name display (`#navbarName`) | Auto-populated on login | `applyNavbarProfile()` in `firebase-auth.js` |
| Officer org display (`#navbarOrg`) | Auto-populated on login | `applyNavbarProfile()` in `firebase-auth.js` |
| **"Log out" button** | Clears sessionStorage, calls `handleSignOut()`, redirects to `index.html` | `handleLogout()` in `index.html` → `handleSignOut()` in `firebase-auth.js` → `auth.signOut()` |

---

## Home Tab

| Element | Action | Code Chain |
|---|---|---|
| **"Home" tab button** | Shows `#dashTab-home`, hides others | `switchDashTab('home')` in `script.js` → toggles `.active` class, shows/hides tab divs |
| **"Directory" tab button** | Shows directory list | `switchDashTab('directory')` → populates `#directoryList` |
| **"Councils" tab button** | Shows councils list | `switchDashTab('councils')` → populates `#councilsList` |
| **"Clusters" tab button** | Shows clusters list | `switchDashTab('clusters')` → populates `#clustersList` |
| **"Proceed to Registration" button** | Checks submission window, navigates or shows blocked modal | `proceedIfOpen('login.html')` → reads Firestore `settings/submissionWindow` directly → if open: `window.location.href = 'login.html'` → if closed: populates `#closedModalMsg`, shows `#closedModal` |
| **"Request Officer Access" button** | Same window check, different destination | `proceedIfOpen('officer-request.html')` → same flow, navigates to `officer-request.html` |
| **Application Status card** (if logged in) | Shown automatically on load | `initDashboard()` → `GET /submission-status?email=...` → renders status badge (Pending/Approved/Rejected/For Revision) |
| **"Resubmit" button** (if status = revision) | Opens registration in resubmit mode | `resubmitApplication(id)` → `GET /submissions/:id/data` → loads previous data into forms → shows resubmit banner |
| **"Refresh Status" button** | Re-fetches submission status | `checkApplicationStatus()` → `GET /submission-status?email=...` → re-renders status card |

---

## Submission Closed Modal

| Element | Action | Code Chain |
|---|---|---|
| Modal backdrop | No action | — |
| **"Got it" button** | Hides the modal | `document.getElementById('closedModal').style.display='none'` inline onclick |

---

## Directory Tab

| Element | Action | Code Chain |
|---|---|---|
| **Search input** (`#directorySearch`) | Filters org list as user types | `filterDirectory(this.value)` in `script.js` → filters the rendered list by matching org name to input text |
| **Org item (click)** | Opens strategic plans modal | `openOrgPlansModal(orgName)` in `script.js` → `GET /org-plans/:orgName` → if published: renders modal with mission, vision, 3 program tables; if not: shows "No plans available" |
| **✕ close button** (inside modal) | Closes plans modal | `closeOrgPlansModal()` → removes overlay from DOM |

---

## Councils Tab

| Element | Action | Code Chain |
|---|---|---|
| **Council item (click)** | Shows council detail page | `goToPage('councilDetail')` → `initCouncilDetail()` → populates `#councilDetailTitle`, `#councilDetailDesc`, `#orgListDetail` |

---

## Council Detail Page

| Element | Action | Code Chain |
|---|---|---|
| **"← Back to Dashboard"** button | Returns to dashboard | `goToPage('dashboard')` → `initDashboard()` |
| **Org item (click)** | Opens strategic plans modal | `openOrgPlansModal(orgName)` → same as Directory |
| **"← Back"** button | Returns to dashboard | `goToPage('dashboard')` |

---

## Clusters Tab

| Element | Action | Code Chain |
|---|---|---|
| **Org item (click)** | Opens strategic plans modal | `openOrgPlansModal(orgName)` → same as Directory |

---
---

# PAGE 2 — officer-request.html

## On Page Load
1. `ALL_ORGS` array is sorted alphabetically
2. Each org is appended as an `<option>` to `#reqOrg` dropdown dynamically

---

## Navigation

| Element | Action | Code Chain |
|---|---|---|
| **"← Back to Home"** link | Navigates to `index.html` | Standard `href="index.html"` link |
| **"← Back"** button | Navigates to `index.html` | Standard `href="index.html"` link |
| **"Log in here"** link | Navigates to `login.html` | Standard `href="login.html"` |

---

## Request Form

| Element | Action | Code Chain |
|---|---|---|
| **Full Name input** (`#reqFullName`) | User types name | No handler — value read on submit |
| **XU Email input** (`#reqEmail`) | User types email | No handler — value read on submit, auto `.toLowerCase()` |
| **Contact Number input** (`#reqContact`) | User types number | No handler — value read on submit |
| **Organization dropdown** (`#reqOrg`) | User selects org | No handler — value read on submit |
| **Position dropdown** (`#reqPosition`) | User selects position | No handler — value read on submit |
| **"Submit Request →" button** | Validates and submits the request | `submitRequest()` in inline `<script>` |

### `submitRequest()` Full Chain:
1. Clears previous error display
2. Reads all field values
3. **Validates:**
   - fullName not empty
   - email not empty and ends with `@my.xu.edu.ph`
   - contact not empty
   - org selected
   - position selected
4. Any validation fail → `showError(msg)` → scrolls to error banner, stops
5. Disables button, shows "Submitting…"
6. `POST /officer-request` with `{ fullName, email, contact, organization, position }`
7. If `res.status === 429` → rate limited error shown
8. If not ok → shows error message
9. **On success:**
   - Sets `#successEmail` text to the email
   - Hides `#formView`
   - Shows `#successView` (success card)
10. Re-enables button in `finally` block

---

## Success View

| Element | Action | Code Chain |
|---|---|---|
| **"← Back to Home"** button | Navigates to `index.html` | Standard `href="index.html"` |

---
---

# PAGE 3 — login.html

## On Page Load
1. Auth guard runs: if `sessionStorage` has `sacdev_userEmail` → redirect to `registration.html`
2. Firebase SDK scripts load (`firebase-app-compat.js`, `firebase-auth-compat.js`)
3. `firebase-auth.js` executes: initializes Firebase app, sets up `onAuthStateChanged` listener
4. `DOMContentLoaded` → `showPage('loginPage')` → clears fields, shows login form

---

## Navbar

| Element | Action | Code Chain |
|---|---|---|
| **"Log out" button** | Calls `handleSignOut()`, redirects | `handleLogout()` → `handleSignOut()` in `firebase-auth.js` → `auth.signOut()` → redirect to `index.html` |

---

## Login Form

| Element | Action | Code Chain |
|---|---|---|
| **XU Email input** (`#loginEmail`) | User types email | No live handler — value synced to `#authEmail` on submit |
| **Password input** (`#loginPassword`) | User types password | No live handler — value synced to `#authPassword` on submit |
| **"Forgot Password?" button** | Shows forgot password panel | `showForgotPassword()` → pre-fills email if already typed → shows `#forgotPasswordPanel` → focuses email input |
| **"Log In →" button** (`#loginSubmitBtn`) | Starts the full login chain | `handleLogin()` in login.html |

### `handleLogin()` Full Chain:
1. Copies `#loginEmail` → `#authEmail`, `#loginPassword` → `#authPassword` (syncs to hidden auth fields)
2. Waits up to 2 seconds for `window.handleAuth` to be available (Firebase may still be loading)
3. Calls `window.handleAuth()` from `firebase-auth.js`

### `handleAuth()` in `firebase-auth.js` Full Chain:
1. Reads `#authEmail` and `#authPassword`
2. Validates: email not empty, ends with `@my.xu.edu.ph`, password not empty
3. Disables `#loginSubmitBtn`, shows "Please wait…"
4. `GET /check-officer-approval?email=...`
5. Checks response:
   - `approved: false, status: 'pending'` → shows "still pending" error
   - `approved: false, status: 'rejected'` → shows "not approved" error
   - `approved: false, status: 'none'` → shows "no request submitted" error
6. If approved: `auth.signInWithEmailAndPassword(email, password)` (Firebase SDK call)
7. On Firebase success: `onLoginSuccess(cred.user.email)`
8. On Firebase error: `friendlyError(err)` maps error code to readable message → `showAuthError(msg)`
9. `finally`: re-enables button, resets text to "Log In →"

### `onLoginSuccess(email)` Chain:
1. Updates `currentState.isLoggedIn = true`, `currentState.userEmail = email`
2. Saves email to `sessionStorage` and `localStorage`
3. Calls `_startSessionTimeout()` (starts 25/30 min inactivity timers — only active on `registration.html`)
4. Checks `localStorage` for cached profile
5. If no cached profile: `GET /check-officer-approval?email=...` → builds profile `{ name, org, position }` → `saveUserProfile()` to `localStorage`
6. Calls `applyNavbarProfile()` → shows name and org in navbar
7. Calls `syncProgressFromServer(email)` → `GET /load-progress?email=...` → restores saved form data
8. Redirects to `registration.html`

---

## Forgot Password Panel

| Element | Action | Code Chain |
|---|---|---|
| **Email input** (`#forgotEmailInput`) | User types email | On Enter key: calls `sendForgotPassword()` via `onkeydown` |
| **"Cancel" button** | Hides the panel | `hideForgotPassword()` → `panel.style.display = 'none'` |
| **"Send Reset Link" button** | Sends password reset email | `sendForgotPassword()` |

### `sendForgotPassword()` Full Chain:
1. Reads email from `#forgotEmailInput`
2. Validates: not empty, ends with `@my.xu.edu.ph`
3. Disables button, shows "Sending…"
4. Waits for `window.handlePasswordReset` to be available
5. `window.handlePasswordReset(email)` → `auth.sendPasswordResetEmail(email)` in Firebase
6. **On success:** `showForgotFeedback('✓ Reset link sent!', true)` → green banner → auto-hides panel after 4 seconds
7. **On error:** maps Firebase error codes → `showForgotFeedback(msg, false)` → red banner → re-enables button

---

## Bottom Links

| Element | Action | Code Chain |
|---|---|---|
| **"Request Officer Access" button** | Navigates to officer-request.html | `window.location.href='officer-request.html'` inline |

---
---

# PAGE 4 — registration.html (Multi-Step Form)

## On Page Load
1. Auth guard: if no `sacdev_userEmail` in sessionStorage → redirect to `login.html`
2. Firebase SDK loads, `firebase-auth.js` runs
3. `script.js` `DOMContentLoaded` → restores `currentState` from sessionStorage → calls `goToPage()` to restore last page
4. `onAuthStateChanged` fires: restores login state, starts session timeout

---

## Navbar

| Element | Action | Code Chain |
|---|---|---|
| **"Log out" button** | Signs out, clears session | `handleLogout()` in `registration.html` → `handleSignOut()` in `firebase-auth.js` → `auth.signOut()` → redirect to `index.html` |
| **Side navigation links** (`#snav-*`) | Jump to any form step | `snavGo(pageName)` → `goToPage(pageName)` |

---

## Step 1 — Organization Type (page: `login`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to dashboard/home | `goToPage('login')` → since no login page here, navigates based on context |
| **"Existing Organization" list item** (click) | Goes to guidelines | `goToPage('guidelines')` → `initGuidelines()` |

---

## Step 2 — Guidelines (page: `guidelines`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to org type | `goToPage('login')` |
| **"Check status" button** | Shows application status inline | `checkStatusInline()` → `GET /submission-status?email=...` → shows result in the page |
| **"I Have Read the Guidelines →" button** | Shows guidelines confirm modal | `proceedWithConfirm()` → `showRegConfirm({ title: 'Confirm Guidelines', onOk: () => goToPage('orgInfo') })` |

### `showRegConfirm()` → Confirm Modal:
- Shows modal with icon, title, message, Cancel and Confirm buttons
- Cancel → `closeRegConfirm()` → hides modal
- Confirm → calls `onOk()` callback → `goToPage('orgInfo')`

---

## Step 3 — Organization Info (page: `orgInfo`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to guidelines | `goToPage('guidelines')` |
| **Org Name dropdown** (`#infoOrgName`) | User selects their org | `onchange="onOrgNameChange(this.value)"` → auto-fills cluster, sets org name in `currentState` |
| **All other text/number inputs** | User fills in info | No live handler — read on submit |
| **President Mobile input** | Numbers only | `oninput="this.value=this.value.replace(/[^0-9]/g,'')"`— strips non-digits live |
| **"Next: Strategic Plan →" button** | Validates and advances | `submitOrgInfo()` → validates required fields → `saveFormData('orgInfo')` → `_syncProgressToServer()` → `goToPage('strategicPlan')` |

---

## Step 4 — Strategic Plan (page: `strategicPlan`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to org info | `goToPage('orgInfo')` |
| **"+ Add Row" buttons** (3 tables) | Adds a new row to the program table | `addRow('bodyOrgDev','totalOrgDev')` / `addRow('bodyStudServ',...)` / `addRow('bodyCommInv',...)` → appends a new `<tr>` with input cells |
| **Fund input fields** (4 fields) | User types budget numbers | `oninput="calcFundTotal()"` → adds all 4 values → updates total display |
| **"Save & Next →" button** | Saves and advances | `submitStratPlan()` → validates → `saveFormData('strategicPlan')` → `_syncProgressToServer()` → `goToPage('presidentProfile')` |

---

## Step 5 — President Profile (page: `presidentProfile`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to strategic plan | `goToPage('strategicPlan')` |
| **Photo upload box** (click) | Opens file picker | `onclick="document.getElementById('presPhotoInput').click()"` → triggers hidden file input |
| **Photo file input** | User selects image file | `onchange="handleImageUpload('presPhotoInput','presPhotoPreview','presPhotoPlaceholder')"` |

### `handleImageUpload()` Full Chain:
1. `validateImageFile(file)` → checks type (JPG/PNG/WEBP) and size (≤5MB)
2. If invalid → `showUploadError(inputId, msg)` → shows red error below box → stops
3. `FileReader.readAsDataURL(file)` → shows local preview immediately
4. Shows "Uploading…" placeholder text
5. `uploadToCloudinary(file)` → POST to Cloudinary API with preset
6. Stores returned URL on `input.dataset.cloudinaryUrl` and `preview.dataset.cloudinaryUrl`
7. On error → `showUploadError(inputId, 'Upload failed')` → removes preview

| Element | Action | Code Chain |
|---|---|---|
| **Signature upload box** (click) | Opens file picker | Same as photo |
| **Signature file input** | User selects image | `handleImageUpload('presSignatureInput',...)` → same chain |
| **All phone inputs** | Numbers only | `oninput="this.value=this.value.replace(/[^0-9]/g,'')"`|
| **Birthday input** | Date picker | `type="date"` — native browser calendar |
| **"+ Add Row" (Leadership)** | Adds leadership row | `addLeadershipRow('presLeadershipBody')` → appends `<tr>` |
| **"+ Add Row" (Awards)** | Adds awards row | `addAwardsRow('presAwardsBody')` → appends `<tr>` |
| **"Save & Next →" button** | Saves and advances | `submitAndNext('presidentProfile','orgOfficers')` → `saveFormData()` → `_syncProgressToServer()` → `goToPage('orgOfficers')` |

---

## Step 6 — Officers (page: `orgOfficers`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to president profile | `goToPage('presidentProfile')` |
| **Officer name/position/ID inputs** | User fills officer card | No live handler |
| **Officer mobile input** | Numbers only | `oninput` strip non-digits |
| **"+ Add to List" button** | Adds officer to the table | `addOfficerFromCard()` → reads card fields → validates → appends row to `#officerListBody` → clears card |
| **"✓ Save Changes" button** | Saves edited officer | `addOfficerFromCard()` → same function, updates existing row |
| **"✕ Cancel" button** | Clears the officer card | `clearOfficerCard()` → empties all card inputs, hides save/cancel buttons |
| **Edit button** (per row) | Loads officer into card for editing | `editOfficer(idx)` → populates card fields, shows Save/Cancel buttons |
| **Delete button** (per row) | Removes officer from list | `deleteOfficer(idx)` → removes row from array and re-renders table |
| **"Save & Next →" button** | Saves and advances | `submitAndNext('orgOfficers','orgMembers')` → `saveFormData()` → `_syncProgressToServer()` → `goToPage('orgMembers')` |

---

## Step 7 — Members (page: `orgMembers`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to officers | `goToPage('orgOfficers')` |
| **"+ Add Member" button** | Adds a new member row | `addMemberRow()` → appends `<tr>` with name/ID inputs |
| **"Skip & Next →" / "Save & Next →" button** | Saves and advances (members optional) | `submitAndNext('orgMembers','moderatorProfile')` → same chain |

---

## Step 8 — Moderator Profile (page: `moderatorProfile`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to members | `goToPage('orgMembers')` |
| **Photo upload box** | Opens file picker | `onclick` → clicks hidden `#modPhotoInput` |
| **Photo file input** | User selects image | `handleImageUpload('modPhotoInput',...)` → same Cloudinary upload chain |
| **Signature upload box** | Opens file picker | `onclick` → clicks hidden `#modSignatureInput` |
| **Signature file input** | User selects image | `handleImageUpload('modSignatureInput',...)` |
| **All phone inputs** | Numbers only | `oninput` strip non-digits |
| **Birthday input** | Date picker | `type="date"` |
| **"+ Add Row" (Leadership)** | Adds row | `addLeadershipRow('modLeadershipBody')` |
| **"Save & Next →" button** | Saves and advances | `submitAndNext('moderatorProfile','gradeAndDocs')` |

---

## Step 9 — Documents (page: `gradeAndDocs`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to moderator | `goToPage('moderatorProfile')` |
| **Constitution upload box** (click) | Opens file picker | `onclick` → clicks hidden `#constitutionInput` |
| **Constitution file input** | User selects PDF | `onchange="handleFileUpload('constitutionInput','constitutionFileName','constitutionBox')"` |

### `handleFileUpload()` Full Chain:
1. `validatePdfFile(file)` → checks type (PDF only) and size (≤10MB)
2. If invalid → `showUploadError(inputId, msg)` → red error shown, stops
3. Shows "Uploading filename…"
4. `uploadToCloudinary(file)` → uploads to Cloudinary
5. Stores URL on `input.dataset.cloudinaryUrl`
6. Shows "+ filename.pdf" on success
7. On error → `showUploadError(inputId, 'Upload failed')`, clears filename

| Element | Action | Code Chain |
|---|---|---|
| **Logo upload box** (click) | Opens file picker | `onclick` → clicks hidden `#orgLogoInput` |
| **Logo file input** | User selects image | `handleImageUpload('orgLogoInput',...)` → same image upload chain |
| **"Review & Submit →" button** | Goes to summary | `goToSummary()` → `saveFormData('gradeAndDocs')` → builds summary HTML → `goToPage('submissionSummary')` |

---

## Step 10 — Summary / Review (page: `submissionSummary`)

| Element | Action | Code Chain |
|---|---|---|
| **"← Back"** button | Returns to documents | `goToPage('gradeAndDocs')` |
| **Side nav links** (`#summary-*`) | Scroll to section | `scrollToSection(id)` → `el.scrollIntoView({ behavior: 'smooth' })` |
| **"→ Org Info" quick-jump buttons** | Jump to any form step to edit | `goToPage('orgInfo')` / `goToPage('strategicPlan')` etc. |
| **"Submit All Requirements →" button** (`#finalSubmitBtn`) | Starts final submission | `submitAllForms()` |

### `submitAllForms()` Full Chain:
1. Checks if constitution or logo is still missing
2. If missing → `showRegConfirm({ title: 'Missing Documents', okText: 'Submit Anyway', onOk: () => doFinalSubmit() })`
3. If complete → `doFinalSubmit()`

### `doFinalSubmit()` Full Chain:
1. Checks `submitBtn.disabled` (shouldn't be, but safety check)
2. `saveFormData('gradeAndDocs')`
3. Loads all form data from all localStorage keys: `strategicPlan`, `presidentProfile`, `moderatorProfile`, `orgOfficers`, `orgMembers`, `gradeAndDocs`
4. Builds the complete submission payload object
5. Disables button, shows "Submitting…"
6. `POST /submit` with full payload
7. **On success:**
   - Shows success modal
   - Clears all form data from localStorage
   - Redirects to `index.html`
8. **On error:** shows error message in modal, re-enables button

---

## Session Timeout Warning (registration.html only)

| Element | Action | Code Chain |
|---|---|---|
| **Any mouse movement** | Resets inactivity timer | `document.addEventListener('mousemove', _resetSessionTimers)` |
| **Any keypress** | Resets inactivity timer | `document.addEventListener('keydown', _resetSessionTimers)` |
| **Any click** | Resets inactivity timer | `document.addEventListener('click', _resetSessionTimers)` |
| **Any scroll** | Resets inactivity timer | `document.addEventListener('scroll', _resetSessionTimers)` |
| **25 min of inactivity** | Shows warning banner | `_warnTimer` fires → `sessionTimeoutWarning.style.display = 'flex'` |
| **"Stay Logged In" button** (in banner) | Resets timers, hides banner | `window._resetSessionTimers()` → clears timers, hides banner, restarts |
| **30 min of inactivity** | Auto logout | `_logoutTimer` fires → `auth.signOut()` → `sessionStorage.clear()` → redirect to `login.html?timeout=1` |

---

## Confirm Modal (used throughout registration)

| Element | Action | Code Chain |
|---|---|---|
| **"Cancel" button** | Hides modal | `closeRegConfirm()` → `regConfirmModal.style.display = 'none'` |
| **"Confirm" / custom button** | Runs the `onOk` callback | `okBtn.onclick = () => { closeRegConfirm(); onOk(); }` |

---
---

# PAGE 5 — admin.html (Admin Dashboard)

## On Page Load
1. Checks `sessionStorage.sacdev_adminLoggedIn`
2. If set: shows `#adminDashboard`, calls `initAdminDashboard()`
3. If not: shows `#adminLogin` form

---

## Admin Login Form

| Element | Action | Code Chain |
|---|---|---|
| **Email input** (`#adminEmail`) | User types email | No live handler |
| **Password input** (`#adminPassword`) | User types password | No live handler |
| **"Log In →" button** | Email+password login | `handleAdminLogin()` in `admin.js` → Firebase `signInWithEmailAndPassword()` → tests `/submissions` endpoint → saves token → `initAdminDashboard()` |
| **"Continue with Google" button** | Google SSO login | `handleAdminGoogleLogin()` → Firebase `signInWithPopup()` → verifies `@xu.edu.ph` → tests `/submissions` → saves token → `initAdminDashboard()` |

---

## Admin Dashboard Header

| Element | Action | Code Chain |
|---|---|---|
| **"📋 Activity Log" link** | Opens `admin-log.html` | Standard `href="admin-log.html"` |
| **"Log Out" button** | Clears session, shows login | `handleAdminLogout()` → clears `sessionStorage` → `goToPage('adminLogin')` |

---

## Academic Year Tabs

| Element | Action | Code Chain |
|---|---|---|
| **AY tab button** (e.g. "2025-2026") | Filters all data to that year | `switchAY(ay)` → sets `_activeAY` → `buildAYTabs()` (re-renders tabs) → `applyAYFilter()` → re-renders stats, table, clusters, hints |
| **Archive AY tab** (older year) | Same — filters to older year | `switchAY(ay)` → same chain |

---

## Submission Window Panel

| Element | Action | Code Chain |
|---|---|---|
| **"Accept Submissions" toggle** | Turns submissions on/off | `onchange="updateWindowToggle()"` → `saveWindowSettings()` → `getFirebaseFirestore()` → `setDoc(doc(db, 'settings', 'submissionWindow'), { isOpen: 0/1, ... })` → shows "✓ Settings saved" or error |
| **Open Date input** | Admin sets open date/time | `onchange="saveWindowSettings()"` → same Firestore write chain |
| **Deadline input** | Admin sets close date/time | `onchange="saveWindowSettings()"` → same Firestore write chain |

---

## Officer Authorization Requests Section

| Element | Action | Code Chain |
|---|---|---|
| **Section header** (click) | Expands/collapses section | `toggleSection('officerRequestsBody','officerChevron')` → toggles `open` CSS class → CSS animates `max-height` |
| **"All" filter button** | Shows all requests | `setOfficerFilter(this)` → filters `allOfficerRequests` array → `renderOfficerRequests(filtered)` |
| **"Pending" filter button** | Shows only pending | Same — filters by `status === 'pending'` |
| **"Approved" filter button** | Shows only approved | Same — filters by `status === 'approved'` |
| **"Rejected" filter button** | Shows only rejected | Same — filters by `status === 'rejected'` |
| **"✓ Approve" button** (per row) | Opens confirm modal | `approveOfficerRequest(id, btnEl)` → `showConfirm({ title: 'Approve Officer Request', onOk: async () => { PATCH /officer-requests/:id/status approved } })` |
| **"✕ Reject" button** (per row) | Opens reject reason modal | `openOfficerRejectModal(id, fullName)` → shows `#officerRejectModal` |

### Officer Reject Modal:
| Element | Action | Code Chain |
|---|---|---|
| **Reason textarea** | Admin types rejection reason | No live handler |
| **"Cancel" button** | Closes modal | `closeOfficerRejectModal()` → adds `hidden` class |
| **"✕ Confirm Reject" button** | Submits rejection | `confirmOfficerReject()` → validates reason not empty → `PATCH /officer-requests/:id/status` with `{ status: 'rejected', reason }` → `loadOfficerRequests()` |

---

## Officer Conflicts Section

| Element | Action | Code Chain |
|---|---|---|
| **Section header** (click) | Expands/collapses | `toggleSection('conflictsBody','conflictsChevron')` |
| **"Re-scan All" button** | Opens confirm modal | `event.stopPropagation()` (prevents section collapse) → `rescanConflicts()` → `showConfirm({ onOk: async () => { POST /rescan-conflicts } })` → `loadAndRenderConflicts()` |
| **"Notify Orgs" button** (per row) | Opens confirm modal | `notifyConflict(conflictId, btnEl)` → `showConfirm({ onOk: async () => { POST /conflicts/:id/notify } })` → replaces button with "Notified" badge |
| **"Mark Resolved" button** (per row) | Opens confirm modal | `resolveConflict(conflictId, btnEl)` → `showConfirm({ onOk: async () => { POST /conflicts/:id/resolve } })` → `loadAndRenderConflicts()` |
| **Resolved Conflicts header** (click) | Expands/collapses resolved list | `toggleResolvedSection()` → toggles `#resolvedConflictsBody` display |

---

## Registered Organizations Section

| Element | Action | Code Chain |
|---|---|---|
| **Section header** (click) | Expands/collapses | `toggleSection('registeredOrgsBody','registeredOrgsChevron')` |
| **Search input** (`#adminSearch`) | Filters table live | `oninput="filterAdminTable()"` → filters `allSubmissions` by org name or email match |
| **"All" / "Pending" / "Approved" / "Rejected" / "For Revision" filter buttons** | Filter by status | `setStatusFilter(this)` → sets active button → `filterAdminTable()` |
| **Cluster filter dropdown** (`#clusterFilter`) | Filters by cluster | `onchange="filterAdminTable()"` → `filterAdminTable()` re-renders only matching cluster's orgs |
| **"Clear" button** | Resets all filters | `clearFilters()` → resets search input, status filter, cluster filter → `filterAdminTable()` |
| **Table row** (click) | Opens submission detail modal | `openDetailModal(submissionId)` → finds submission in `allSubmissions` → builds full HTML → sets modal content → fetches notes → shows modal |

---

## Submission Detail Modal

| Element | Action | Code Chain |
|---|---|---|
| **"✕" close button** | Closes modal | `closeDetailModal()` → adds `hidden` class to `#detailModal` |
| **Click outside modal** | Closes modal | `onclick="closeModal(event)"` on overlay → checks if click was on overlay (not content) → `closeDetailModal()` |
| **"✓ Approve" button** | Opens confirm modal | `confirmApproveSubmission(id, orgName)` → `showConfirm({ onOk: () => updateStatusAndRefresh(id, 'approved') })` |
| **"↩ Request Revision" button** | Opens revision notes modal | `openRevisionModal(id, orgName)` → shows `#revisionModal` |
| **"✕ Reject" button** | Opens reject reason modal | `openRejectModal(id, orgName)` → shows `#rejectModal` |
| **"📢 Publish" / "🔒 Unpublish" button** | Opens confirm modal | `togglePublish(id, true/false)` → `showConfirm({ onOk: async () => { PATCH /submissions/:id/publish } })` |
| **"Add Note" button** | Saves internal note | `saveNote(id)` → reads textarea → `POST /submissions/:id/notes` → refreshes notes display |
| **Document links** (if uploaded) | Opens Cloudinary URL | Standard `href` to Cloudinary URL, `target="_blank"` |

### Reject Modal:
| Element | Action | Code Chain |
|---|---|---|
| **Reason textarea** | Admin types reason | No live handler |
| **"Cancel" button** | Closes modal | `closeRejectModal()` |
| **"✕ Confirm Reject" button** | Submits rejection | `confirmReject()` → validates reason → `updateStatusAndRefresh(id, 'rejected', reason)` → `closeDetailModal()` → `initAdminDashboard()` |

### Revision Modal:
| Element | Action | Code Chain |
|---|---|---|
| **Notes textarea** | Admin types revision notes | No live handler |
| **"Cancel" button** | Closes modal | `closeRevisionModal()` |
| **"↩ Send Revision Request" button** | Submits revision | `confirmRevision()` → validates notes → `updateStatusAndRefresh(id, 'revision', notes)` → `closeDetailModal()` → `initAdminDashboard()` |

### Shared Confirm Modal (used for Approve, Publish, Rescan, etc.):
| Element | Action | Code Chain |
|---|---|---|
| **"Cancel" button** | Closes modal | `closeConfirmModal()` → hides modal, restores Cancel button visibility |
| **Confirm button** (custom label) | Runs the action | `okBtn.onclick = () => { closeConfirmModal(); onOk(); }` → executes the specific action |

---

## Organizations Section

| Element | Action | Code Chain |
|---|---|---|
| **Section header** (click) | Expands/collapses | `toggleSection('organizationsBody','organizationsChevron')` |
| **Cluster header** (click) | Expands/collapses cluster | CSS accordion toggle via `renderClusterAccordion()` built elements |
| **Org item** (click) | Opens strategic plans modal | `openDetailModal(submissionId)` if submitted, or info display |

---

## Report Panel (📊 FAB button)

| Element | Action | Code Chain |
|---|---|---|
| **"📊 Report" FAB button** | Opens report panel | `toggleReportPanel()` → removes `hidden` class from `#reportPanel` |
| **"⬇ Export CSV" button** | Downloads CSV | `exportCSV()` → gets filtered submissions → builds CSV string → creates Blob → auto-downloads |
| **"⬇ Export PDF" button** | Downloads PDF | `exportPDF()` → uses jsPDF + autoTable → builds landscape A4 PDF → auto-downloads |
| **"✕" close button** | Closes panel | `toggleReportPanel()` → adds `hidden` class |
| **Click outside panel** | Closes panel | `onclick="closeReportPanel(event)"` on overlay → checks click target → closes |

---
---

# PAGE 6 — admin-log.html (Activity Log)

## On Page Load
1. Firebase Auth SDK loads
2. `onAuthStateChanged` fires:
   - No user → `window.location.href = 'admin.html'` immediately
   - User not `@xu.edu.ph` → shows "Access Denied" message
   - Valid admin → hides auth guard, shows content → calls `loadLog(user)`
3. `loadLog(user)` → `GET /activity-log?limit=200` with Bearer token → renders table

---

## Header

| Element | Action | Code Chain |
|---|---|---|
| **"← Back to Dashboard" button** | Returns to admin panel | `window.location.href='admin.html'` inline |

---

## Log Controls

| Element | Action | Code Chain |
|---|---|---|
| **Search input** (`#logSearch`) | Filters log live | `oninput="filterLog()"` → filters `_allLogs` by targetName, adminEmail, action, details → `renderLog(filtered)` |
| **"All Actions" dropdown** (`#logTypeFilter`) | Filters by action type | `onchange="filterLog()"` → same filter chain |
| **"⬇ CSV" button** | Downloads filtered log as CSV | `exportLogCSV()` → `getVisibleLogs()` → builds CSV → Blob → auto-download |
| **"⬇ PDF" button** | Downloads filtered log as PDF | `exportLogPDF()` → jsPDF + autoTable → builds PDF → auto-download |
| **"↺ Refresh" button** | Reloads log from server | `loadLog(auth.currentUser)` → re-fetches `GET /activity-log` → re-renders |

---
---

# AUTOMATIC / BACKGROUND ACTIONS (No User Click Needed)

| Trigger | What Happens | Code |
|---|---|---|
| **New submission saved** | Conflict detection runs automatically | `POST /submit` → `detectAndStoreConflicts()` async — doesn't block response |
| **Every form step completed** | Progress saved to server | `_syncProgressToServer()` → `POST /save-progress` |
| **Admin approves officer request** | Firebase account created + password link generated + email sent | `PATCH /officer-requests/:id/status` → `admin.auth().createUser()` → `admin.auth().generatePasswordResetLink()` → `mailer.sendMail()` |
| **Any admin action** | Audit log entry created | `logActivity()` → Firestore `activityLog` collection |
| **Every 30 min (server)** | Rate limit store cleaned | `setInterval` → loops `_rateLimitStore`, deletes expired entries |
| **Server startup** | Firebase connection test | IIFE → writes to `_health` collection → logs result |
| **`?timeout=1` in URL on login page** | Shows inactivity message | Checks `window.location.search` on load → sets `#loginError` text |
| **Token expires (1 hour)** | Auto-refreshed on next API call | `getAuthHeaders()` → `user.getIdToken(false)` → Firebase refreshes if expired |
