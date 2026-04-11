const councils = {
    CSG: {
        name: 'Central Student Government',
        isCouncilOrg: true,
        orgs: []
    },
    AECO: {
        name: 'Assembly of Extra-Curricular Organizations',
        isCouncilOrg: true,
        orgs: [
            'Atenista Ako Movement (AAM)',
            'Ateneo Camera Club (ACC)',
            'Ateneo Diplomatic Corps (ADC)',
            'Ateneo Mountaineering Society (AMS)',
            'Ateneo Rover Circle (ARC)',
            'Ateneo School for Upcoming Leaders (ASUL)',
            'Association of Xavier University Oro Scholars (AXUOS)',
            'Circulo de Arte (CDA)',
            'Crusader Publication (CRUSADER)',
            'Crusader Yearbook (CYB)',
            'Google Developers Student Clubs (GDSC)',
            'Kaliwat Ki Apu Aguy (KALIWAT)',
            'Nature Crusaders of the Philippines Foundation (NCPF)',
            'Soundtable (SOUNDTABLE)',
            'STREAMS – Pathways to Higher Education (STREAMS)',
            'Xavier Ateneo Film Society (XAFS)',
            'Xavier Campus Esports and Entertainment Development (XCEED)',
            'Xavier Philharmonia (XU PHIL)',
            'Xavier University Band (XU BAND)',
            'Xavier University Cultural Dance Troupe (XUCDT)',
            'Xavier University Glee Club (XUGC)',
            'XU Bullriders (BULLRIDERS)',
            'Xavier University Japan Karate Association (XU JKA)',
            'Xavier University Red Cross Youth (XU RCY)',
            'Graduate School Student Council (GSSC)'
        ]
    },
    ACES: {
        name: 'Association of the College of Engineering Students',
        isCouncilOrg: true,
        orgs: [
            'Institute of Integrated Electrical Engineers (IIEE)',
            'Junior Institute of Electronics Engineers of the Philippines (JIECEP)',
            'Junior Philippine Institute of Chemical Engineers - XU Chapter (JPIChE)',
            'Junior Philippine Society of Mechanical Engineers - XU Chapter (JPSME)',
            'Philippine Institute of Civil Engineers - XU Student Chapter (PICE)',
            'Philippine Institute of Industrial Engineers - XU Student Chapter (PIIE)'
        ]
    },
    ASC: {
        name: 'Agriculture Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Agri-Business Circle (AAC)',
            'Ateneo Crop Science Society (ACROSS)',
            'Ateneo Society of Agricultural Economists (ASAGE)',
            'Junior Philippine Society of Animal Science (JPSAS)',
            'Philippine Association of Food Technologists (PAFT)',
            'Philippine Society of Agricultural and Biosystems Engineers Pre-Professional Group – XU Chapter (PSABE-PPG)',
            'Philippine Association of Agriculturists – Junior Chapter (PAA Jrs)'
        ]
    },
    CONUS: {
        name: 'Council of Nursing Students',
        isCouncilOrg: true,
        orgs: []
    },
    CSSC: {
        name: 'Computer Studies Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Information Systems Student Association (AISSA)',
            'Xavier Computer Enthusiasts\' League (XCEL)',
            'Xavier Circle of Information Technology (XCITeS)'
        ]
    },
    SBMSC: {
        name: 'School of Business Management Student Council',
        isCouncilOrg: true,
        orgs: [
            'Junior Financial Executives (JFINEX)',
            'Junior Marketing Association (JMA)',
            'Junior Philippine Institute of Accountants (JPIA)',
            'Junior Philippine Association of Management Accountants – XU Chapter (XU-JPAMA)'
        ]
    },
    TG: {
        name: 'Teacher\'s Guild',
        isCouncilOrg: true,
        orgs: [
            'Kabalikat na Atenista sa Filipino (KAFIL)',
            'Xavier English Language and Literature Organization (XELLO)',
            'Xavier University Association of Science Educators – School of Education (XASED)',
            'Xavier University Holistic Union of General Educators (XU-HUGE)',
            'Xavier University Kapisanan ng mga Atenista sa Araling Panlipunan (XU-KASAPI)',
            'Xavier University Special Educators\' Society (SPEDSOC)',
            'Xavier University School of Education Literary and Communications Society (XUSELICS)'
        ]
    },
    UNITASS: {
        name: 'United Arts and Sciences Student Council',
        isCouncilOrg: true,
        orgs: [
            'Ateneo Diplomatic Corps (ADC)',
            'Ateneo Historical Society (AHS)',
            'Ateneo Philosophy Club (APC)',
            'Chemistry Society (CHEMSOC)',
            'Development Communication Society (DEVCOMSOC)',
            'Economics Society (ECOSOC)',
            'Mathematics Society (MATHSOC)',
            'Biophilic Society (BIOPHILIC)',
            'Xavier International Students Association (XISA)',
            'Xavier University Psychology Society (XUPS)',
            'Xavier Ateneo Sociology Society (XASS)'
        ]
    }
};

// STATE

let currentState = {
    selectedCouncil: null,
    selectedOrg: null,
    isLoggedIn: false,
    userEmail: null,
    authMode: 'register', // 'register' | 'login'
    // org info
    orgCluster: null,
    presidentName: null,
    presidentMobile: null,
    presidentEmail: null,
    moderatorName: null
};

// ROUTING
function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName).classList.remove('hidden');
    window.scrollTo(0, 0);

    document.querySelectorAll('[id^="progress-circle-"]').forEach(el => el.remove());

    // Show/hide global form sidebar
    const formPages = ['orgInfo','strategicPlan','presidentProfile','orgOfficers','orgMembers','moderatorProfile','gradeAndDocs','submissionSummary'];
    const sidenav = document.getElementById('formSidenav');
    if (formPages.includes(pageName)) {
        sidenav.classList.remove('hidden');
        document.body.classList.add('has-form-sidenav');
        // Highlight active item
        document.querySelectorAll('.form-sidenav-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.getElementById('snav-' + pageName);
        if (activeItem) activeItem.classList.add('active');
    } else {
        sidenav.classList.add('hidden');
        document.body.classList.remove('has-form-sidenav');
    }

    if (pageName === 'dashboard')     initDashboard();
    if (pageName === 'councilDetail') initCouncilDetail();
    if (pageName === 'auth')          initAuth();
    if (pageName === 'councilSelect') initCouncilSelect();
    if (pageName === 'orgSelect')     initOrgSelect();
    if (pageName === 'orgInfo')       { initOrgInfo(); initOrgInfoProgress(); }
    if (pageName === 'strategicPlan')   { initStrategicPlan(); createProgressCircle('strategicPlan'); updateStratPlanProgress(); }
    if (pageName === 'presidentProfile') { initPresidentProfile(); createProgressCircle('presidentProfile'); updatePresidentProgress(); }
    if (pageName === 'orgOfficers')      { initOrgOfficers(); createProgressCircle('orgOfficers'); updateOfficersProgress(); }
    if (pageName === 'orgMembers')       { initOrgMembers(); createProgressCircle('orgMembers'); updateMembersProgress(); }
    if (pageName === 'moderatorProfile') { initModeratorProfile(); createProgressCircle('moderatorProfile'); updateModeratorProgress(); }
    if (pageName === 'gradeAndDocs')     { initGradeAndDocs(); createProgressCircle('gradeAndDocs'); updateGradeDocsProgress(); }
}

// Navigate from sidebar — saves current form data first
function snavGo(page) {
    const currentPage = [...document.querySelectorAll('.page')].find(p => !p.classList.contains('hidden'));
    if (currentPage) {
        const id = currentPage.id;
        if (['orgInfo','strategicPlan','presidentProfile','orgOfficers','orgMembers','moderatorProfile','gradeAndDocs'].includes(id)) {
            saveFormData(id);
        }
    }
    goToPage(page);
}

// HELPERS
function getSortedCouncils() {
    const others = Object.keys(councils)
        .filter(k => k !== 'CSG' && k !== 'AECO')
        .sort();
    return ['CSG', 'AECO', ...others];
}

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
function initDashboard() {
    const gridFeatured = document.getElementById('councilGridFeatured');
    const gridOther    = document.getElementById('councilGrid');
    const gridCentered = document.getElementById('councilGridCentered');
    gridFeatured.innerHTML = '';
    gridOther.innerHTML    = '';
    gridCentered.innerHTML = '';

    const featured = ['CSG', 'AECO'];
    const rest = getSortedCouncils().filter(c => !featured.includes(c));
    const others  = rest.filter(c => c !== 'UNITASS');
    const centered = rest.filter(c => c === 'UNITASS');

    featured.forEach(k  => gridFeatured.appendChild(createCouncilCard(k)));
    others.forEach(k    => gridOther.appendChild(createCouncilCard(k)));
    centered.forEach(k  => gridCentered.appendChild(createCouncilCard(k)));
}

function createCouncilCard(key) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => {
        currentState.selectedCouncil = key;
        goToPage('councilDetail');
    };
    const count = councils[key].orgs.length + (councils[key].isCouncilOrg ? 1 : 0);
    card.innerHTML = `
        <div class="card-icon">›</div>
        <h3>${key}</h3>
        <p>${councils[key].name}</p>
        <div class="card-meta">${count} organization${count !== 1 ? 's' : ''}</div>
    `;
    return card;
}

// ═══════════════════════════════════════════════════
// COUNCIL DETAIL (public view)
// ═══════════════════════════════════════════════════
function initCouncilDetail() {
    const key = currentState.selectedCouncil;
    document.getElementById('councilDetailTitle').textContent = key;
    document.getElementById('councilDetailDesc').textContent = councils[key].name;
    const list = document.getElementById('orgListDetail');
    list.innerHTML = '';
    getOrgChoices(key).forEach(org => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<span>${org}</span><span>›</span>`;
        list.appendChild(item);
    });
}

// Returns full org list: council una tapos  orgs under niya
function getOrgChoices(key) {
    const councilEntry = `${key} – ${councils[key].name}`;
    const subOrgs = councils[key].orgs.slice().sort();
    return [councilEntry, ...subOrgs];
}

// AUTH
function initAuth() {
    document.getElementById('authEmail').value    = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authConfirm').value  = '';
    document.getElementById('authError').classList.add('hidden');
    document.getElementById('authError').textContent = '';
    setAuthMode(currentState.authMode || 'register');
}

function setAuthMode(mode) {
    currentState.authMode = mode;
    const isRegister = mode === 'register';
    document.getElementById('authTitle').textContent    = isRegister ? 'Create Account' : 'Log In';
    document.getElementById('authSubtitle').textContent = isRegister
        ? 'Use your XU email address to register'
        : 'Welcome back! Log in to continue.';
    document.getElementById('authConfirmGroup').style.display = isRegister ? '' : 'none';
    document.getElementById('authSubmitBtn').textContent  = isRegister ? 'Register →' : 'Log In →';
    document.getElementById('authSwitchText').textContent = isRegister
        ? 'Already have an account?'
        : "Don't have an account yet?";
    document.getElementById('authSwitchBtn').textContent  = isRegister ? 'Log in instead' : 'Register here';
}

function toggleAuthMode() {
    setAuthMode(currentState.authMode === 'register' ? 'login' : 'register');
}

function handleAuth() {
    const email    = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const confirm  = document.getElementById('authConfirm').value;
    const errEl    = document.getElementById('authError');

    errEl.classList.add('hidden');
    errEl.textContent = '';

    // Validate XU email
    if (!email) {
        showAuthError('Please enter your XU email address.');
        return;
    }
    if (!email.endsWith('@my.xu.edu.ph')) {
        showAuthError('Please use your official XU email address ending in @my.xu.edu.ph.');
        return;
    }
    if (!password) {
        showAuthError('Please enter your password.');
        return;
    }
    if (currentState.authMode === 'register') {
        if (password.length < 6) {
            showAuthError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            showAuthError('Passwords do not match. Please try again.');
            return;
        }
    }


    currentState.isLoggedIn = true;
    currentState.userEmail  = email;
    document.getElementById('navbarUser').classList.remove('hidden');
    document.getElementById('navbarEmail').textContent = email;
    goToPage('login');
}

function showAuthError(msg) {
    const errEl = document.getElementById('authError');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
}

function handleLogout() {
    currentState.isLoggedIn = false;
    currentState.userEmail  = null;
    document.getElementById('navbarUser').classList.add('hidden');
    document.getElementById('navbarEmail').textContent = '';
    goToPage('dashboard');
}


// COUNCIL SELECT
function initCouncilSelect() {
    const list = document.getElementById('councilSelectList');
    list.innerHTML = '';
    getSortedCouncils().forEach(key => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.onclick = () => {
            currentState.selectedCouncil = key;
            goToPage('orgSelect');
        };
        item.innerHTML = `
            <div>
                <div style="font-weight:600;">${key}</div>
                <div style="font-size:12px;color:#94a3b8;margin-top:4px;">${councils[key].name}</div>
            </div>
            <span>›</span>
        `;
        list.appendChild(item);
    });
}

// ORG SELECT
function initOrgSelect() {
    const key = currentState.selectedCouncil;
    document.getElementById('orgSelectCouncil').textContent = councils[key].name;
    const list = document.getElementById('orgSelectList');
    list.innerHTML = '';

    getOrgChoices(key).forEach((org, idx) => {
        const item = document.createElement('div');
        item.className = 'list-item';
        if (idx === 0) {
            // Council itself — highlight
            item.classList.add('list-item-council');
        }
        item.onclick = () => {
            currentState.selectedOrg = org;
            goToPage('guidelines');
        };
        item.innerHTML = `
            <div>
                <span>${org}</span>
                ${idx === 0 ? '<span class="council-badge">Council</span>' : ''}
            </div>
            <span>›</span>
        `;
        list.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════
// GUIDELINES
// ═══════════════════════════════════════════════════
function proceedWithConfirm() {
    if (confirm('I confirm that I have read and understood all the re-registration guidelines. Proceed?')) {
        goToPage('orgInfo');
    }
}

// ═══════════════════════════════════════════════════
// ORG INFO
// ═══════════════════════════════════════════════════
function initOrgInfo() {
    if (currentState.orgCluster)       document.getElementById('infoCluster').value        = currentState.orgCluster;
    if (currentState.presidentName)    document.getElementById('infoPresidentName').value   = currentState.presidentName;
    if (currentState.presidentMobile)  document.getElementById('infoPresidentMobile').value = currentState.presidentMobile;
    if (currentState.presidentEmail)   document.getElementById('infoPresidentEmail').value  = currentState.presidentEmail;
    if (currentState.moderatorName)    document.getElementById('infoModeratorName').value   = currentState.moderatorName;
}

function submitOrgInfo() {
    const cluster  = document.getElementById('infoCluster').value.trim();
    const presName = document.getElementById('infoPresidentName').value.trim();
    const presMob  = document.getElementById('infoPresidentMobile').value.trim();
    const presEmail= document.getElementById('infoPresidentEmail').value.trim();
    const modName  = document.getElementById('infoModeratorName').value.trim();

    if (!cluster)   { alert('Please select an Org Cluster.');              document.getElementById('infoCluster').focus();         return; }
    if (!presName)  { alert("Please enter the President's Full Name.");    document.getElementById('infoPresidentName').focus();    return; }
    if (!presMob)   { alert("Please enter the President's Mobile Number.");document.getElementById('infoPresidentMobile').focus();  return; }
    if (!presEmail) { alert("Please enter the President's Email Address.");document.getElementById('infoPresidentEmail').focus();   return; }
    if (!modName)   { alert('Please enter the Name of Moderator-Nominee.');document.getElementById('infoModeratorName').focus();   return; }

    currentState.orgCluster      = cluster;
    currentState.presidentName   = presName;
    currentState.presidentMobile = presMob;
    currentState.presidentEmail  = presEmail;
    currentState.moderatorName   = modName;

    goToPage('strategicPlan');
}

// ═══════════════════════════════════════════════════
// STRATEGIC PLAN
// ═══════════════════════════════════════════════════
function initStrategicPlan() {
    // Pre-fill org name if available
    if (currentState.selectedOrg) {
        document.getElementById('stratOrgFullName').value = currentState.selectedOrg;
    }
    // Seed rows if empty
    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(id => {
        if (!document.getElementById(id).hasChildNodes()) {
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
            addRow(id, id.replace('body','total').replace('OrgDev','OrgDev').replace('StudServ','StudServ').replace('CommInv','CommInv'));
        }
    });
    // Attach live listeners to core text fields
    ['stratAcronym','stratOrgFullName','stratMission','stratVision'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateStratPlanProgress);
    });
    updateStratPlanProgress();
}

function addRow(bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="date" class="strat-cell-input"></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><textarea class="strat-cell-textarea" rows="2"></textarea></td>
        <td><input type="number" class="strat-cell-input strat-budget-cell" placeholder="0.00" min="0" oninput="recalcTotal('${bodyId}','${totalId}')"></td>
        <td><button class="btn-del-row" onclick="deleteRow(this, '${bodyId}', '${totalId}')" title="Remove row">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    // Attach progress listeners to project name cell (2nd td textarea)
    const projectNameTA = tr.querySelector('td:nth-child(2) textarea');
    if (projectNameTA) projectNameTA.addEventListener('input', updateStratPlanProgress);
}

function deleteRow(btn, bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    if (tbody.rows.length <= 1) { alert('At least one row is required.'); return; }
    btn.closest('tr').remove();
    recalcTotal(bodyId, totalId);
}

function recalcTotal(bodyId, totalId) {
    const tbody = document.getElementById(bodyId);
    let sum = 0;
    tbody.querySelectorAll('.strat-budget-cell').forEach(inp => {
        sum += parseFloat(inp.value) || 0;
    });
    const totalEl = document.getElementById(totalId);
    if (totalEl) totalEl.value = sum > 0 ? 'Php ' + sum.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
    // Sync budget summary from table totals
    syncBudgetSummary();
    updateStratPlanProgress();
}

function syncBudgetSummary() {
    const getTableSum = (bodyId) => {
        let s = 0;
        document.getElementById(bodyId).querySelectorAll('.strat-budget-cell').forEach(inp => {
            s += parseFloat(inp.value) || 0;
        });
        return s;
    };
    const a = getTableSum('bodyOrgDev');
    const b = getTableSum('bodyStudServ');
    const c = getTableSum('bodyCommInv');
    const t = a + b + c;
    const fmt = v => v > 0 ? v.toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
    document.getElementById('budgetOrgDev').value  = fmt(a);
    document.getElementById('budgetStudServ').value = fmt(b);
    document.getElementById('budgetCommInv').value  = fmt(c);
    document.getElementById('budgetTotal').value    = fmt(t);
}

function calcBudgetTotal() {
    // Legacy – now handled by syncBudgetSummary; kept for safety
    syncBudgetSummary();
}

function calcFundTotal() {
    const vals = ['fundSOF','fundPTA','fundMembership','fundRaised']
        .map(id => parseFloat(document.getElementById(id).value) || 0);
    const t = vals.reduce((a,b) => a+b, 0);
    document.getElementById('fundTotal').value = t > 0 ? t.toLocaleString('en-PH', {minimumFractionDigits:2}) : '';
    updateStratPlanProgress();
}

function submitStratPlan() {
    const acronym = document.getElementById('stratAcronym').value.trim();
    const orgName = document.getElementById('stratOrgFullName').value.trim();
    if (!acronym || !orgName) {
        alert('Please fill in the Org Acronym and Complete Name of Organization before continuing.');
        return;
    }
    saveFormData('strategicPlan');
    goToPage('presidentProfile');
}

// ═══════════════════════════════════════════════════
// PROGRESS TRACKERS
// ═══════════════════════════════════════════════════

function createProgressCircle(containerId) {
    // Remove existing if any
    const existing = document.getElementById('progress-circle-' + containerId);
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 'progress-circle-' + containerId;
    wrap.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        pointer-events: none;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '72');
    svg.setAttribute('height', '72');
    svg.setAttribute('viewBox', '0 0 72 72');

    const r = 30;
    const cx = 36, cy = 36;
    const circumference = 2 * Math.PI * r;

    // Background track
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', cx); bgCircle.setAttribute('cy', cy); bgCircle.setAttribute('r', r);
    bgCircle.setAttribute('fill', 'rgba(255,255,255,0.95)');
    bgCircle.setAttribute('stroke', '#e2e8f0'); bgCircle.setAttribute('stroke-width', '5');
    svg.appendChild(bgCircle);

    // Progress arc
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    arc.setAttribute('cx', cx); arc.setAttribute('cy', cy); arc.setAttribute('r', r);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#1f3a70'); arc.setAttribute('stroke-width', '5');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('stroke-dasharray', circumference);
    arc.setAttribute('stroke-dashoffset', circumference);
    arc.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    arc.style.transition = 'stroke-dashoffset 0.4s ease, stroke 0.3s ease';
    arc.id = 'progress-arc-' + containerId;
    svg.appendChild(arc);

    // Percentage text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx); text.setAttribute('y', cy + 1);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '13'); text.setAttribute('font-weight', '700');
    text.setAttribute('fill', '#1f3a70'); text.setAttribute('font-family', 'Inter, sans-serif');
    text.id = 'progress-text-' + containerId;
    text.textContent = '0%';
    svg.appendChild(text);

    wrap.appendChild(svg);

    // Label
    const label = document.createElement('div');
    label.style.cssText = `
        font-size: 10px;
        font-weight: 600;
        color: #475569;
        background: rgba(255,255,255,0.95);
        padding: 2px 8px;
        border-radius: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        white-space: nowrap;
        letter-spacing: 0.3px;
        pointer-events: none;
    `;
    label.id = 'progress-label-' + containerId;
    label.textContent = 'Progress';
    wrap.appendChild(label);

    document.body.appendChild(wrap);
    return { arc, text, label, circumference };
}

function updateCircle(containerId, pct, label) {
    const arc  = document.getElementById('progress-arc-' + containerId);
    const text = document.getElementById('progress-text-' + containerId);
    const lbl  = document.getElementById('progress-label-' + containerId);
    if (!arc) return;
    const r = 30;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - pct / 100);
    arc.setAttribute('stroke-dashoffset', offset);
    arc.setAttribute('stroke', pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#1f3a70');
    text.textContent = Math.round(pct) + '%';
    if (lbl && label) lbl.textContent = label;
}

// ── Org Info progress ──────────────────────────────
function initOrgInfoProgress() {
    createProgressCircle('orgInfo');
    const fields = ['infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateOrgInfoProgress);
        if (el) el.addEventListener('change', updateOrgInfoProgress);
    });
    updateOrgInfoProgress();
}

function updateOrgInfoProgress() {
    const fields = ['infoCluster','infoPresidentName','infoPresidentMobile','infoPresidentEmail','infoModeratorName'];
    let filled = 0;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    const pct = (filled / fields.length) * 100;
    updateCircle('orgInfo', pct, 'Org Info');
}

// ── Strategic Plan progress ────────────────────────
function updateStratPlanProgress() {
    let total = 0, filled = 0;

    // Core fields: acronym, full name, mission, vision (4 fields)
    const coreFields = ['stratAcronym','stratOrgFullName','stratMission','stratVision'];
    coreFields.forEach(id => {
        total++;
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });

    // Each section: count as 1 field if at least 1 row has a project name filled (3 sections)
    ['bodyOrgDev','bodyStudServ','bodyCommInv'].forEach(bodyId => {
        total++;
        const tbody = document.getElementById(bodyId);
        if (!tbody) return;
        const textareas = tbody.querySelectorAll('td:nth-child(2) textarea');
        let hasEntry = false;
        textareas.forEach(ta => { if (ta.value.trim()) hasEntry = true; });
        if (hasEntry) filled++;
    });

    // Sources of funds: at least 1 source filled (1 field)
    total++;
    const fundIds = ['fundSOF','fundPTA','fundMembership','fundRaised'];
    let hasFund = false;
    fundIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() && parseFloat(el.value) > 0) hasFund = true;
    });
    if (hasFund) filled++;

    const pct = total > 0 ? (filled / total) * 100 : 0;
    updateCircle('strategicPlan', pct, 'Form B-1');
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    goToPage('dashboard');
});

// ═══════════════════════════════════════════════════
// SAVE / LOAD PERSISTENCE (localStorage)
// ═══════════════════════════════════════════════════

const STORAGE_KEY_PREFIX = 'sacdev_form_';

function saveFormData(formId) {
    const data = collectFormData(formId);
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + formId, JSON.stringify(data));
        showSaveToast('Progress saved!');
    } catch(e) {
        console.warn('localStorage save failed:', e);
    }
}

function loadFormData(formId) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + formId);
        return raw ? JSON.parse(raw) : null;
    } catch(e) {
        return null;
    }
}

function showSaveToast(msg) {
    let toast = document.getElementById('saveToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'saveToast';
        toast.className = 'save-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = '+ ' + msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function submitAndNext(currentForm, nextPage) {
    saveFormData(currentForm);
    goToPage(nextPage);
}

// ── Generic field collector ───────────────────────
function collectFormData(formId) {
    const container = document.getElementById(formId);
    if (!container) return {};
    const data = {};
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        data[el.id] = el.value;
    });
    // Collect table rows as arrays
    container.querySelectorAll('tbody[id]').forEach(tbody => {
        data['__table_' + tbody.id] = collectTableRows(tbody);
    });
    // Collect image previews (base64)
    container.querySelectorAll('img.upload-preview[id]').forEach(img => {
        if (!img.classList.contains('hidden') && img.src) {
            data['__img_' + img.id] = img.src;
        }
    });
    return data;
}

function collectTableRows(tbody) {
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('input, select, textarea').forEach(el => {
            cells.push(el.value);
        });
        rows.push(cells);
    });
    return rows;
}

function restoreFormData(formId) {
    const data = loadFormData(formId);
    if (!data) return;
    const container = document.getElementById(formId);
    if (!container) return;
    // Restore simple fields
    container.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (data[el.id] !== undefined) el.value = data[el.id];
    });
    // Restore images
    container.querySelectorAll('img.upload-preview[id]').forEach(img => {
        const key = '__img_' + img.id;
        if (data[key]) {
            img.src = data[key];
            img.classList.remove('hidden');
            const placeholderId = img.id.replace('Preview', 'Placeholder');
            const ph = document.getElementById(placeholderId);
            if (ph) ph.style.display = 'none';
        }
    });
    // Restore file upload names
    if (data['__file_gradeSlipsFileName']) document.getElementById('gradeSlipsFileName').textContent = data['__file_gradeSlipsFileName'];
    if (data['__file_constitutionFileName']) document.getElementById('constitutionFileName').textContent = data['__file_constitutionFileName'];
}

// ═══════════════════════════════════════════════════
// IMAGE / FILE UPLOAD HELPERS
// ═══════════════════════════════════════════════════

function handleImageUpload(inputId, previewId, placeholderId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.style.display = 'none';
        // Mark parent box
        const box = input.closest('.upload-box') || input.previousElementSibling;
        if (box) box.classList.add('has-file');
        // Trigger progress update
        const pageEl = input.closest('.page');
        if (pageEl) triggerProgressUpdate(pageEl.id);
    };
    reader.readAsDataURL(file);
}

function handleFileUpload(inputId, fileNameElId, boxId) {
    const input = document.getElementById(inputId);
    const nameEl = document.getElementById(fileNameElId);
    const box = document.getElementById(boxId);
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (nameEl) nameEl.textContent = '+ ' + file.name;
    if (box) box.classList.add('has-file');
    const pageEl = input.closest('.page');
    if (pageEl) triggerProgressUpdate(pageEl.id);
}

function triggerProgressUpdate(pageId) {
    if (pageId === 'presidentProfile') updatePresidentProgress();
    else if (pageId === 'orgOfficers') updateOfficersProgress();
    else if (pageId === 'orgMembers') updateMembersProgress();
    else if (pageId === 'moderatorProfile') updateModeratorProgress();
    else if (pageId === 'gradeAndDocs') updateGradeDocsProgress();
}

// ═══════════════════════════════════════════════════
// PRESIDENT'S PROFILE (Form B-2)
// ═══════════════════════════════════════════════════

function initPresidentProfile() {
    // Pre-fill from orgInfo if available
    if (currentState.presidentName && !document.getElementById('presFullName').value) {
        document.getElementById('presFullName').value = currentState.presidentName;
    }
    if (currentState.presidentMobile && !document.getElementById('presMobile').value) {
        document.getElementById('presMobile').value = currentState.presidentMobile;
    }
    if (currentState.presidentEmail && !document.getElementById('presEmail').value) {
        document.getElementById('presEmail').value = currentState.presidentEmail;
    }

    // Seed leadership table if empty
    const lb = document.getElementById('presLeadershipBody');
    if (lb && lb.children.length === 0) {
        addLeadershipRow('presLeadershipBody');
        addLeadershipRow('presLeadershipBody');
    }
    const ab = document.getElementById('presAwardsBody');
    if (ab && ab.children.length === 0) {
        addAwardsRow('presAwardsBody');
        addAwardsRow('presAwardsBody');
    }

    // Restore saved data
    restoreFormData('presidentProfile');

    // Attach progress listeners
    ['presFullName','presCourseYear','presMobile','presEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updatePresidentProgress); el.addEventListener('change', updatePresidentProgress); }
    });
    updatePresidentProgress();
}

function addLeadershipRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Organization name"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Position held"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Address / School / City"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. 2022–2024"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
}

function addAwardsRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Name of award"></td>
        <td><textarea class="strat-cell-textarea" rows="2" placeholder="Description of award"></textarea></td>
        <td><input type="text" class="strat-cell-input" placeholder="Conferring organization/institution"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Date received"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
}

function deleteSimpleRow(btn) {
    const tbody = btn.closest('tbody');
    if (tbody && tbody.rows.length <= 1) { alert('At least one row is required.'); return; }
    btn.closest('tr').remove();
}

function updatePresidentProgress() {
    const required = ['presFullName','presCourseYear','presMobile','presEmail'];
    let filled = 0;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    // Check signature
    const sig = document.getElementById('presSignaturePreview');
    if (sig && !sig.classList.contains('hidden') && sig.src) filled++;
    const total = required.length + 1; // +1 for signature
    updateCircle('presidentProfile', (filled / total) * 100, 'Form B-2');
}

// ═══════════════════════════════════════════════════
// ORGANIZATION OFFICERS (Form B-3)
// ═══════════════════════════════════════════════════

function initOrgOfficers() {
    // Pre-fill cluster from orgInfo
    const clusterEl = document.getElementById('officersCluster');
    if (currentState.orgCluster && clusterEl && !clusterEl.value) {
        clusterEl.value = currentState.orgCluster;
    }
    const tbody = document.getElementById('officersTableBody');
    if (tbody && tbody.children.length === 0) {
        // Pre-seed president row
        addOfficerRow();
        if (currentState.presidentName) {
            const firstRow = tbody.querySelector('tr');
            if (firstRow) {
                const inputs = firstRow.querySelectorAll('input');
                inputs[0].value = 'President';
                inputs[1].value = currentState.presidentName;
                if (currentState.presidentMobile) inputs[4].value = currentState.presidentMobile;
            }
        }
        addOfficerRow();
    }
    restoreFormData('orgOfficers');

    ['officersOrgType','officersCluster','officersYearEstablished'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updateOfficersProgress); el.addEventListener('change', updateOfficersProgress); }
    });
    updateOfficersProgress();
}

function addOfficerRow() {
    const tbody = document.getElementById('officersTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="e.g. President"></td>
        <td><input type="text" class="strat-cell-input" placeholder="Last Name, First Name, MI"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. BS CS, 3rd Year"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4"></td>
        <td><input type="tel" class="strat-cell-input" placeholder="09XXXXXXXXX"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateOfficersProgress));
}

function updateOfficersProgress() {
    const tbody = document.getElementById('officersTableBody');
    let filledRows = 0;
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            if (inputs[0] && inputs[0].value.trim() && inputs[1] && inputs[1].value.trim()) filledRows++;
        });
    }
    const total = 3; // at least 1 row + cluster + org type
    let filled = Math.min(filledRows, 1);
    if (document.getElementById('officersOrgType')?.value) filled++;
    if (document.getElementById('officersCluster')?.value) filled++;
    updateCircle('orgOfficers', (filled / total) * 100, 'Form B-3');
}

// ═══════════════════════════════════════════════════
// ORGANIZATION MEMBERS (Form B-4)
// ═══════════════════════════════════════════════════

function initOrgMembers() {
    const clusterEl = document.getElementById('membersCluster');
    if (currentState.orgCluster && clusterEl && !clusterEl.value) {
        clusterEl.value = currentState.orgCluster;
    }
    const tbody = document.getElementById('membersTableBody');
    if (tbody && tbody.children.length === 0) {
        addMemberRow();
        addMemberRow();
    }
    restoreFormData('orgMembers');
    updateMembersProgress();
}

function addMemberRow() {
    const tbody = document.getElementById('membersTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="strat-cell-input" placeholder="Last Name, First Name, MI"></td>
        <td><input type="text" class="strat-cell-input" placeholder="e.g. BS CS, 3rd Year"></td>
        <td><input type="number" class="strat-cell-input" placeholder="0.00" step="0.01" min="0" max="4"></td>
        <td><input type="tel" class="strat-cell-input" placeholder="09XXXXXXXXX"></td>
        <td><button class="btn-del-row" onclick="deleteSimpleRow(this)" title="Remove">&#215;</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateMembersProgress));
}

function updateMembersProgress() {
    const tbody = document.getElementById('membersTableBody');
    let filledRows = 0;
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(tr => {
            const first = tr.querySelector('input');
            if (first && first.value.trim()) filledRows++;
        });
    }
    const pct = filledRows > 0 ? Math.min(filledRows * 10, 100) : 0;
    updateCircle('orgMembers', pct, 'Form B-4');
}

// ═══════════════════════════════════════════════════
// MODERATOR PROFILE (Form B-5.1)
// ═══════════════════════════════════════════════════

function initModeratorProfile() {
    // Pre-fill nominating org
    if (currentState.selectedOrg && !document.getElementById('modNominatingOrg').value) {
        document.getElementById('modNominatingOrg').value = currentState.selectedOrg;
    }
    if (currentState.moderatorName && !document.getElementById('modFullName').value) {
        document.getElementById('modFullName').value = currentState.moderatorName;
    }

    const lb = document.getElementById('modLeadershipBody');
    if (lb && lb.children.length === 0) {
        addLeadershipRow('modLeadershipBody');
        addLeadershipRow('modLeadershipBody');
    }
    restoreFormData('moderatorProfile');

    ['modFullName','modDesignation','modDepartment','modMobile','modEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updateModeratorProgress); el.addEventListener('change', updateModeratorProgress); }
    });
    updateModeratorProgress();
}

function updateModeratorProgress() {
    const required = ['modFullName','modDesignation','modDepartment','modMobile','modEmail'];
    let filled = 0;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim()) filled++;
    });
    const sig = document.getElementById('modSignaturePreview');
    if (sig && !sig.classList.contains('hidden') && sig.src) filled++;
    const total = required.length + 1;
    updateCircle('moderatorProfile', (filled / total) * 100, 'Form B-5.1');
}

// ═══════════════════════════════════════════════════
// GRADE SLIPS + DOCS (Combined)
// ═══════════════════════════════════════════════════

function initGradeAndDocs() {
    restoreFormData('gradeAndDocs');
    updateGradeDocsProgress();
}

function updateGradeDocsProgress() {
    let filled = 0;
    const total = 3;

    const gradeBox = document.getElementById('gradeSlipsBox');
    if (gradeBox && gradeBox.classList.contains('has-file')) filled++;

    const constBox = document.getElementById('constitutionBox');
    if (constBox && constBox.classList.contains('has-file')) filled++;

    const logoPreview = document.getElementById('orgLogoPreview');
    if (logoPreview && !logoPreview.classList.contains('hidden') && logoPreview.src) filled++;

    updateCircle('gradeAndDocs', (filled / total) * 100, 'Documents');
}

function submitAllForms() {
    // Save final form
    saveFormData('gradeAndDocs');
    const gradeBox = document.getElementById('gradeSlipsBox');
    const constBox = document.getElementById('constitutionBox');
    const logoPreview = document.getElementById('orgLogoPreview');

    if (!gradeBox.classList.contains('has-file') || !constBox.classList.contains('has-file') || logoPreview.classList.contains('hidden')) {
        if (!confirm('Some documents are still missing. Submit anyway?')) return;
    }
    alert('All requirements have been submitted successfully!\n\nPlease ensure you have completed all forms and uploaded all required documents. OSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
}

// ═══════════════════════════════════════════════════
// SUBMISSION SUMMARY
// ═══════════════════════════════════════════════════

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return false;
}

function goToSummary() {
    saveFormData('gradeAndDocs');
    buildSummary();
    goToPage('submissionSummary');
}

function buildSummary() {
    const container = document.getElementById('summaryContent');
    const warning   = document.getElementById('summaryWarning');
    const submitBtn = document.getElementById('finalSubmitBtn');
    const missingFields = [];

    container.innerHTML = '';

    // ── Helper ──────────────────────────────────────
    function val(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }
    function imgFilled(previewId) {
        const el = document.getElementById(previewId);
        return el && !el.classList.contains('hidden') && el.src && el.src !== window.location.href;
    }
    function fileFilled(boxId) {
        const el = document.getElementById(boxId);
        return el && el.classList.contains('has-file');
    }

    function buildSection(title, badge, fields, sectionId) {
        const section = document.createElement('div');
        section.className = 'summary-section';
        if (sectionId) section.id = sectionId;

        const titleEl = document.createElement('div');
        titleEl.className = 'summary-section-title';
        titleEl.innerHTML = title + (badge ? ` <span class="summary-badge">${badge}</span>` : '');
        section.appendChild(titleEl);

        const body = document.createElement('div');
        body.className = 'summary-section-body';

        fields.forEach(f => {
            const div = document.createElement('div');
            div.className = 'summary-field' + (f.fullWidth ? ' summary-full-width' : '');
            const lbl = document.createElement('div');
            lbl.className = 'summary-field-label';
            lbl.textContent = f.label;
            const valDiv = document.createElement('div');
            if (f.value) {
                valDiv.className = 'summary-field-value filled';
                valDiv.textContent = f.value;
            } else if (f.required) {
                valDiv.className = 'summary-field-value missing';
                valDiv.innerHTML = '! Not filled in';
                missingFields.push(f.label);
            } else {
                valDiv.className = 'summary-field-value';
                valDiv.textContent = '—';
                valDiv.style.color = '#94a3b8';
            }
            div.appendChild(lbl);
            div.appendChild(valDiv);
            body.appendChild(div);
        });

        section.appendChild(body);
        return section;
    }

    // ── Account Info ────────────────────────────────
    container.appendChild(buildSection('ACCOUNT', null, [
        { label: 'XU Email', value: currentState.userEmail, required: true },
        { label: 'Organization', value: currentState.selectedOrg, required: true },
        { label: 'Council', value: currentState.selectedCouncil ? (currentState.selectedCouncil + ' – ' + (councils[currentState.selectedCouncil]?.name || '')) : '', required: true },
    ], 'summary-account'));

    // ── Org Info ────────────────────────────────────
    container.appendChild(buildSection('ORGANIZATION INFORMATION', null, [
        { label: 'Org Cluster', value: val('infoCluster'), required: true },
        { label: "President's Name", value: val('infoPresidentName'), required: true },
        { label: "President's Mobile", value: val('infoPresidentMobile'), required: true },
        { label: "President's Email", value: val('infoPresidentEmail'), required: true },
        { label: 'Moderator Nominee', value: val('infoModeratorName'), required: true },
    ], 'summary-orginfo'));

    // ── Form B-1 ─────────────────────────────────
    container.appendChild(buildSection('STRATEGIC PLAN', 'Form B-1', [
        { label: 'Org Acronym', value: val('stratAcronym'), required: true },
        { label: 'Full Org Name', value: val('stratOrgFullName'), required: true },
        { label: 'Mission Statement', value: val('stratMission') ? '+ Filled' : '', required: true },
        { label: 'Vision Statement', value: val('stratVision') ? '+ Filled' : '', required: true },
    ], 'summary-b1'));

    // ── Form B-2 ─────────────────────────────────
    container.appendChild(buildSection("PRESIDENT'S PROFILE", 'Form B-2', [
        { label: 'Full Name', value: val('presFullName'), required: true },
        { label: 'Course and Year', value: val('presCourseYear'), required: true },
        { label: 'Mobile Number', value: val('presMobile'), required: true },
        { label: 'Email', value: val('presEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('presSignaturePreview') ? '+ Uploaded' : '', required: true },
        { label: 'Photo ID', value: imgFilled('presPhotoPreview') ? '+ Uploaded' : '', required: false },
    ], 'summary-b2'));

    // ── Form B-3 ─────────────────────────────────
    const officerRows = document.getElementById('officersTableBody')?.querySelectorAll('tr') || [];
    let officerCount = 0;
    officerRows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]?.value.trim() && inputs[1]?.value.trim()) officerCount++;
    });
    container.appendChild(buildSection('ORGANIZATION OFFICERS', 'Form B-3', [
        { label: 'Organization Type', value: val('officersOrgType'), required: true },
        { label: 'Cluster', value: val('officersCluster'), required: false },
        { label: 'Officers Listed', value: officerCount > 0 ? `${officerCount} officer(s)` : '', required: true },
    ], 'summary-b3'));

    // ── Form B-4 ─────────────────────────────────
    const memberRows = document.getElementById('membersTableBody')?.querySelectorAll('tr') || [];
    let memberCount = 0;
    memberRows.forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        if (inputs[0]?.value.trim()) memberCount++;
    });
    container.appendChild(buildSection('ORGANIZATION MEMBERS', 'Form B-4', [
        { label: 'Members Listed', value: memberCount > 0 ? `${memberCount} member(s)` : 'None / Not applicable', required: false },
    ], 'summary-b4'));

    // ── Form B-5.1 ───────────────────────────────
    container.appendChild(buildSection("MODERATOR'S PROFILE", 'Form B-5.1', [
        { label: 'Full Name', value: val('modFullName'), required: true },
        { label: 'Nominating Org', value: val('modNominatingOrg'), required: true },
        { label: 'Designation', value: val('modDesignation'), required: true },
        { label: 'Department', value: val('modDepartment'), required: true },
        { label: 'Mobile Number', value: val('modMobile'), required: true },
        { label: 'Email', value: val('modEmail'), required: true },
        { label: 'E-Signature', value: imgFilled('modSignaturePreview') ? '+ Uploaded' : '', required: true },
    ], 'summary-b5'));

    // ── Form B-6 & Documents ─────────────────────
    container.appendChild(buildSection('GRADE SLIPS, CONSTITUTION & LOGO', 'Form B-6 & Docs', [
        { label: 'Grade Slips (Form B-6)', value: fileFilled('gradeSlipsBox') ? '+ Uploaded' : '', required: true },
        { label: 'Organization Constitution', value: fileFilled('constitutionBox') ? '+ Uploaded' : '', required: true },
        { label: 'Organization Logo', value: imgFilled('orgLogoPreview') ? '+ Uploaded' : '', required: true },
    ], 'summary-b6'));

    // ── Warning banner ───────────────────────────
    if (missingFields.length > 0) {
        warning.classList.remove('hidden');
        document.getElementById('summaryWarningText').innerHTML =
            `<strong>${missingFields.length} required field(s) are incomplete:</strong> ${missingFields.join(', ')}. Please go back and fill in all required fields before submitting.`;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        warning.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
    }
}

// Override submitAllForms to use summary page gate
function submitAllForms() {
    const submitBtn = document.getElementById('finalSubmitBtn');
    if (submitBtn && submitBtn.disabled) {
        alert('Please fill in all required fields before submitting.');
        return;
    }
    saveFormData('gradeAndDocs');

    // Store submission in admin records
    const submission = {
        id: Date.now(),
        org: currentState.selectedOrg || '—',
        council: currentState.selectedCouncil || '—',
        president: document.getElementById('presFullName')?.value?.trim() || currentState.presidentName || '—',
        email: currentState.userEmail || '—',
        cluster: document.getElementById('infoCluster')?.value || currentState.orgCluster || '—',
        submittedAt: new Date().toLocaleString('en-PH'),
        complete: true
    };

    try {
        const existing = JSON.parse(localStorage.getItem('sacdev_submissions') || '[]');
        existing.push(submission);
        localStorage.setItem('sacdev_submissions', JSON.stringify(existing));
    } catch(e) {}

    alert('✅ All requirements have been submitted successfully!\n\nPlease ensure you have completed all forms and uploaded all required documents. OSA-SACDEV will evaluate your re-registration requirements before granting recognition.');
    goToPage('dashboard');
}


