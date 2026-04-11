// Admin-specific JavaScript for SACDEV Admin Panel

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

function getSortedCouncils() {
    const others = Object.keys(councils)
        .filter(k => k !== 'CSG' && k !== 'AECO')
        .sort();
    return ['CSG', 'AECO', ...others];
}

function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageName).classList.remove('hidden');
    window.scrollTo(0, 0);
}

// ADMIN LOGIN & DASHBOARD
// ═══════════════════════════════════════════════════

const ADMIN_EMAIL    = 'sacdevAdmin@xu.edu.ph';
const ADMIN_PASSWORD = 'SacDevAdminSOMS';

function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const pass  = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('adminLoginError');

    errEl.classList.add('hidden');
    errEl.textContent = '';

    if (!email || !pass) {
        errEl.textContent = 'Please enter both email and password.';
        errEl.classList.remove('hidden');
        return;
    }
    if (email !== ADMIN_EMAIL || pass !== ADMIN_PASSWORD) {
        errEl.textContent = 'Invalid credentials. Access denied.';
        errEl.classList.remove('hidden');
        return;
    }

    // Clear fields
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';

    goToPage('adminDashboard');
    initAdminDashboard();
}

function handleAdminLogout() {
    goToPage('adminLogin');
}

function initAdminDashboard() {
    // Load submissions
    let submissions = [];
    try {
        submissions = JSON.parse(localStorage.getItem('sacdev_submissions') || '[]');
    } catch(e) {}

    // Stats
    document.getElementById('statTotal').textContent    = submissions.length;
    document.getElementById('statComplete').textContent = submissions.filter(s => s.complete).length;
    document.getElementById('statPending').textContent  = submissions.filter(s => !s.complete).length;

    // Table
    const tbody = document.getElementById('adminSubmissionsBody');
    const noData = document.getElementById('adminNoData');
    tbody.innerHTML = '';

    if (submissions.length === 0) {
        noData.classList.remove('hidden');
    } else {
        noData.classList.add('hidden');
        submissions.forEach((s, i) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-search', (s.org + s.council + s.president + s.email + s.cluster).toLowerCase());
            tr.innerHTML = `
                <td style="font-size:12px;color:#94a3b8;">${i + 1}</td>
                <td style="font-weight:600;font-size:13px;">${s.org}</td>
                <td style="font-size:13px;">${s.council}</td>
                <td style="font-size:13px;">${s.president}</td>
                <td style="font-size:12px;color:#475569;">${s.email}</td>
                <td style="font-size:12px;color:#475569;">${s.cluster}</td>
                <td><span class="admin-status-badge ${s.complete ? 'complete' : 'pending'}">${s.complete ? 'Complete' : 'Pending'}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Council overview grid
    const grid = document.getElementById('adminCouncilGrid');
    grid.innerHTML = '';
    getSortedCouncils().forEach(key => {
        const c = councils[key];
        const count = c.orgs.length + (c.isCouncilOrg ? 1 : 0);
        const card = document.createElement('div');
        card.className = 'admin-council-card';
        card.innerHTML = `
            <div class="admin-council-card-key">${key}</div>
            <div class="admin-council-card-name">${c.name}</div>
            <div class="admin-council-card-count">${count} org${count !== 1 ? 's' : ''}</div>
        `;
        grid.appendChild(card);
    });
}

function filterAdminTable() {
    const q = document.getElementById('adminSearch').value.toLowerCase();
    document.querySelectorAll('#adminSubmissionsBody tr').forEach(tr => {
        const text = tr.getAttribute('data-search') || '';
        tr.style.display = text.includes(q) ? '' : 'none';
    });
}