/* =============================================
   JIMPROFYL — app.js
   Student Profile Management Logic
   ============================================= */

// ---- STATE ----
let students = [];
let adminUsers = [{ username: 'admin', password: 'admin123', role: 'Super Admin' }];
let currentUser = null;
let editIndex = -1;

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  applyTheme();
  renderAdminUsers();
  renderAdminStats();
});

function loadFromStorage() {
  const s = localStorage.getItem('jimprofyl_students');
  if (s) students = JSON.parse(s);
  const a = localStorage.getItem('jimprofyl_admins');
  if (a) adminUsers = JSON.parse(a);
  const t = localStorage.getItem('jimprofyl_theme');
  if (t) document.documentElement.setAttribute('data-theme', t);
}

function saveStudents() {
  localStorage.setItem('jimprofyl_students', JSON.stringify(students));
}

function saveAdmins() {
  localStorage.setItem('jimprofyl_admins', JSON.stringify(adminUsers));
}

// ---- THEME ----
function applyTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('darkToggle').textContent = dark ? '☀️' : '🌙';
}

function toggleDark() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('jimprofyl_theme', next);
  applyTheme();
}

// ---- AUTH ----
function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const match = adminUsers.find(a => a.username === user && a.password === pass);
  if (!match) {
    document.getElementById('loginError').classList.remove('hidden');
    return;
  }
  currentUser = match;
  document.getElementById('loginError').classList.add('hidden');
  showPage('appPage');
  switchView('dashboard');
  renderDashboard();
  renderAllStudents();
  renderAdminStats();
}

function doLogout() {
  currentUser = null;
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  showPage('loginPage');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---- SIDEBAR / NAV ----
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  sb.classList.toggle('open');
  ov.classList.toggle('active');
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });
  const titles = {
    dashboard: 'Dashboard',
    addStudent: 'Add Student',
    allStudents: 'All Students',
    adminPanel: 'Admin Panel'
  };
  document.getElementById('topbarTitle').textContent = titles[view] || view;

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  }

  // Hide search results
  document.getElementById('searchResults').classList.add('hidden');
  document.getElementById('globalSearch').value = '';

  if (view === 'dashboard') renderDashboard();
  if (view === 'allStudents') renderAllStudents();
  if (view === 'adminPanel') { renderAdminUsers(); renderAdminStats(); }
  if (view === 'addStudent' && editIndex === -1) { clearForm(); }
}

// ---- SEARCH ----
function doSearch(query) {
  const container = document.getElementById('searchResults');
  if (!query.trim()) {
    container.classList.add('hidden');
    return;
  }
  const q = query.toLowerCase();
  const results = students.filter(s =>
    s.fullName.toLowerCase().includes(q) ||
    s.matricNo.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q) ||
    s.level.includes(q)
  );
  if (!results.length) {
    container.innerHTML = `<div class="search-result-item"><div class="result-info"><div class="result-name">No results found</div></div></div>`;
    container.classList.remove('hidden');
    return;
  }
  container.innerHTML = results.slice(0, 8).map((s, i) => {
    const idx = students.indexOf(s);
    return `
      <div class="search-result-item" onclick="openProfile(${idx})">
        <div class="card-passport" style="width:36px;height:36px;font-size:16px">
          ${s.passport ? `<img src="${s.passport}" alt="passport"/>` : '👤'}
        </div>
        <div class="result-info">
          <div class="result-name">${s.fullName}</div>
          <div class="result-meta">${s.matricNo} · ${s.department} · ${s.level}L</div>
        </div>
      </div>
    `;
  }).join('');
  container.classList.remove('hidden');
}

// ---- DASHBOARD ----
function renderDashboard() {
  const statsRow = document.getElementById('statsRow');
  const depts = [...new Set(students.map(s => s.department))];
  const male = students.filter(s => s.sex === 'Male').length;
  const female = students.filter(s => s.sex === 'Female').length;

  statsRow.innerHTML = `
    <div class="stat-card"><div class="stat-value">${students.length}</div><div class="stat-label">Total Students</div></div>
    <div class="stat-card"><div class="stat-value">${depts.length}</div><div class="stat-label">Departments</div></div>
    <div class="stat-card"><div class="stat-value">${male}</div><div class="stat-label">Male</div></div>
    <div class="stat-card"><div class="stat-value">${female}</div><div class="stat-label">Female</div></div>
  `;

  const recentCards = document.getElementById('recentCards');
  const dashEmpty = document.getElementById('dashboardEmpty');
  const recent = [...students].reverse().slice(0, 6);

  if (!students.length) {
    recentCards.innerHTML = '';
    dashEmpty.classList.remove('hidden');
  } else {
    dashEmpty.classList.add('hidden');
    recentCards.innerHTML = recent.map(s => {
      const idx = students.indexOf(s);
      return renderProfileCard(s, idx);
    }).join('');
  }
}

// ---- ALL STUDENTS ----
function renderAllStudents() {
  const list = document.getElementById('allStudentsList');
  const countEl = document.getElementById('studentCount');
  const emptyEl = document.getElementById('allEmpty');
  countEl.textContent = `${students.length} student${students.length !== 1 ? 's' : ''} registered`;
  if (!students.length) {
    list.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    list.innerHTML = students.map((s, i) => renderProfileCard(s, i)).join('');
  }
}

function renderProfileCard(s, idx) {
  return `
    <div class="profile-card" onclick="openProfile(${idx})">
      <div class="card-top">
        <div class="card-passport">
          ${s.passport ? `<img src="${s.passport}" alt="passport"/>` : '👤'}
        </div>
        <div class="card-info">
          <div class="card-name">${s.fullName}</div>
          <div class="card-matric">${s.matricNo}</div>
          <div class="card-badge">${s.level}L</div>
        </div>
        ${s.logo ? `<div class="logo-preview-sm"><img src="${s.logo}" alt="logo"/></div>` : ''}
      </div>
      <div class="card-meta">
        <span>${s.department}</span>
        <span>${s.sex}</span>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-outline sm" onclick="editStudent(${idx})">Edit</button>
        <button class="btn btn-danger sm" onclick="deleteStudent(${idx})">Delete</button>
      </div>
    </div>
  `;
}

// ---- PROFILE MODAL ----
function openProfile(idx) {
  const s = students[idx];
  if (!s) return;
  document.getElementById('searchResults').classList.add('hidden');
  document.getElementById('globalSearch').value = '';

  const age = s.dob ? calcAge(s.dob) : '—';
  const dobFormatted = s.dob ? new Date(s.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-header">
      <h3>Student Profile</h3>
      <button class="btn btn-ghost sm" onclick="closeModal()">✕ Close</button>
    </div>
    <div class="modal-body">
      <div class="modal-passport-wrap">
        <div class="modal-passport">
          ${s.passport ? `<img src="${s.passport}" alt="passport"/>` : '👤'}
        </div>
        ${s.logo ? `<div class="modal-logo"><img src="${s.logo}" alt="school logo"/></div>` : ''}
        <div style="text-align:center">
          <div style="font-weight:700;font-size:16px;color:var(--text)">${s.fullName}</div>
          <div style="font-size:12px;color:var(--text-muted)">${s.matricNo}</div>
        </div>
      </div>
      <div>
        ${profileRow('Matriculation No.', s.matricNo)}
        ${profileRow('Full Name', s.fullName)}
        ${profileRow('Level', s.level + ' Level')}
        ${profileRow('Department', s.department)}
        ${profileRow('Date of Birth', dobFormatted)}
        ${profileRow('Age', age + ' years')}
        ${profileRow('Sex', s.sex)}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline sm" onclick="editStudent(${idx}); closeModal()">Edit</button>
      <button class="btn btn-danger sm" onclick="deleteStudent(${idx}); closeModal()">Delete</button>
    </div>
  `;
  document.getElementById('profileModal').classList.remove('hidden');
}

function profileRow(label, value) {
  return `
    <div class="profile-detail-row">
      <span class="pd-label">${label}</span>
      <span class="pd-value">${value || '—'}</span>
    </div>
  `;
}

function closeModal() {
  document.getElementById('profileModal').classList.add('hidden');
}

function closeModalOutside(e) {
  if (e.target.id === 'profileModal') closeModal();
}

function calcAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ---- PASSPORT / LOGO PREVIEW ----
function previewPassport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('passportPreview');
    prev.innerHTML = `<img src="${e.target.result}" alt="passport"/>`;
    prev._data = e.target.result;
  };
  reader.readAsDataURL(file);
}

function previewLogo(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('logoPreview');
    prev.innerHTML = `<img src="${e.target.result}" alt="logo"/>`;
    prev._data = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---- SAVE / EDIT / DELETE ----
function saveStudent() {
  const matricNo = document.getElementById('matricNo').value.trim();
  const fullName = document.getElementById('fullName').value.trim();
  const level = document.getElementById('level').value;
  const sex = document.getElementById('sex').value;
  const department = document.getElementById('department').value.trim();
  const dob = document.getElementById('dob').value;
  const errEl = document.getElementById('formError');

  if (!matricNo || !fullName || !level || !sex || !department || !dob) {
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const passportEl = document.getElementById('passportPreview');
  const logoEl = document.getElementById('logoPreview');
  const passport = passportEl._data || (passportEl.querySelector('img') ? passportEl.querySelector('img').src : null);
  const logo = logoEl._data || (logoEl.querySelector('img') ? logoEl.querySelector('img').src : null);

  const student = { matricNo, fullName, level, sex, department, dob, passport, logo };

  const idx = parseInt(document.getElementById('editIndex').value);
  if (idx >= 0) {
    students[idx] = student;
    showToast('Student updated successfully!');
  } else {
    // Check duplicate matric
    if (students.find(s => s.matricNo.toLowerCase() === matricNo.toLowerCase())) {
      errEl.textContent = 'A student with this matriculation number already exists.';
      errEl.classList.remove('hidden');
      return;
    }
    students.push(student);
    showToast('Student added successfully!');
  }

  saveStudents();
  clearForm();
  renderDashboard();
  renderAllStudents();
  renderAdminStats();
  switchView('allStudents');
}

function editStudent(idx) {
  const s = students[idx];
  if (!s) return;
  document.getElementById('formTitle').textContent = 'Edit Student';
  document.getElementById('editIndex').value = idx;
  document.getElementById('matricNo').value = s.matricNo;
  document.getElementById('fullName').value = s.fullName;
  document.getElementById('level').value = s.level;
  document.getElementById('sex').value = s.sex;
  document.getElementById('department').value = s.department;
  document.getElementById('dob').value = s.dob;

  const passportEl = document.getElementById('passportPreview');
  if (s.passport) {
    passportEl.innerHTML = `<img src="${s.passport}" alt="passport"/>`;
    passportEl._data = s.passport;
  } else {
    passportEl.innerHTML = `<span class="passport-placeholder">📷</span>`;
    passportEl._data = null;
  }

  const logoEl = document.getElementById('logoPreview');
  if (s.logo) {
    logoEl.innerHTML = `<img src="${s.logo}" alt="logo"/>`;
    logoEl._data = s.logo;
  } else {
    logoEl.innerHTML = `<span>🏫</span>`;
    logoEl._data = null;
  }

  switchView('addStudent');
}

function deleteStudent(idx) {
  if (!confirm(`Delete "${students[idx]?.fullName}"? This cannot be undone.`)) return;
  students.splice(idx, 1);
  saveStudents();
  renderDashboard();
  renderAllStudents();
  renderAdminStats();
  showToast('Student deleted.');
}

function clearForm() {
  document.getElementById('formTitle').textContent = 'Add New Student';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('matricNo').value = '';
  document.getElementById('fullName').value = '';
  document.getElementById('level').value = '';
  document.getElementById('sex').value = '';
  document.getElementById('department').value = '';
  document.getElementById('dob').value = '';
  const pp = document.getElementById('passportPreview');
  pp.innerHTML = `<span class="passport-placeholder">📷</span>`;
  pp._data = null;
  const lp = document.getElementById('logoPreview');
  lp.innerHTML = `<span>🏫</span>`;
  lp._data = null;
  document.getElementById('passportInput').value = '';
  document.getElementById('logoInput').value = '';
  document.getElementById('formError').classList.add('hidden');
}

// ---- ADMIN PANEL ----
function renderAdminUsers() {
  const list = document.getElementById('adminUsersList');
  list.innerHTML = adminUsers.map((a, i) => `
    <div class="admin-user-row">
      <span class="username">${a.username}</span>
      <span class="role-badge">${a.role}</span>
      ${adminUsers.length > 1 ? `<button class="btn btn-ghost sm" onclick="removeAdmin(${i})" style="padding:2px 8px;font-size:12px;color:var(--danger)">Remove</button>` : ''}
    </div>
  `).join('');
}

function addAdminUser() {
  const u = document.getElementById('newAdminUser').value.trim();
  const p = document.getElementById('newAdminPass').value.trim();
  if (!u || !p) { showToast('Enter both username and password.'); return; }
  if (adminUsers.find(a => a.username === u)) { showToast('Username already exists.'); return; }
  adminUsers.push({ username: u, password: p, role: 'Admin' });
  saveAdmins();
  renderAdminUsers();
  document.getElementById('newAdminUser').value = '';
  document.getElementById('newAdminPass').value = '';
  showToast('Admin user added!');
}

function removeAdmin(idx) {
  if (!confirm('Remove this admin user?')) return;
  adminUsers.splice(idx, 1);
  saveAdmins();
  renderAdminUsers();
  showToast('Admin user removed.');
}

function renderAdminStats() {
  const depts = [...new Set(students.map(s => s.department))];
  const levels = [...new Set(students.map(s => s.level))].sort();
  const male = students.filter(s => s.sex === 'Male').length;
  const female = students.filter(s => s.sex === 'Female').length;
  document.getElementById('adminStats').innerHTML = `
    <div class="stat-row"><span class="s-label">Total Students</span><span class="s-value">${students.length}</span></div>
    <div class="stat-row"><span class="s-label">Departments</span><span class="s-value">${depts.length}</span></div>
    <div class="stat-row"><span class="s-label">Male / Female</span><span class="s-value">${male} / ${female}</span></div>
    <div class="stat-row"><span class="s-label">Active Levels</span><span class="s-value">${levels.join(', ') || '—'}</span></div>
    <div class="stat-row"><span class="s-label">Admin Users</span><span class="s-value">${adminUsers.length}</span></div>
  `;
}

function clearAllStudents() {
  if (!confirm('Delete ALL student records permanently?')) return;
  students = [];
  saveStudents();
  renderDashboard();
  renderAllStudents();
  renderAdminStats();
  showToast('All student records deleted.');
}

// ---- TOAST ----
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

// ---- KEYBOARD: close modal on Escape ----
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('searchResults').classList.add('hidden');
  }
});

// ---- CLICK OUTSIDE SEARCH RESULTS ----
document.addEventListener('click', e => {
  const sr = document.getElementById('searchResults');
  const sb = document.querySelector('.search-bar');
  if (!sr.classList.contains('hidden') && !sr.contains(e.target) && !sb.contains(e.target)) {
    sr.classList.add('hidden');
  }
});
