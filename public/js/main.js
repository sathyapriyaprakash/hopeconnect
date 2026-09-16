// Global UI Utilities and Navigation Controller

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

// Render Dynamic Navbar Based on User Auth State
function renderNavbar() {
  const authNav = document.getElementById('navAuthSection');
  if (!authNav) return;

  const user = API.getUser();

  if (user) {
    let dashboardUrl = '/dashboard-volunteer.html';
    let roleBadge = 'Volunteer';

    if (user.role === 'ngo') {
      dashboardUrl = '/dashboard-ngo.html';
      roleBadge = 'NGO Host';
    } else if (user.role === 'admin') {
      dashboardUrl = '/dashboard-admin.html';
      roleBadge = 'Admin';
    }

    authNav.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-custom dropdown-toggle d-flex align-items-center gap-2" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle fs-5 text-primary"></i>
          <span>${escapeHtml(user.name)}</span>
          <span class="badge bg-primary-subtle text-primary rounded-pill px-2 py-1">${roleBadge}</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="userMenuBtn">
          <li><h6 class="dropdown-header">Signed in as <strong>${escapeHtml(user.email)}</strong></h6></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2"></i>My Dashboard</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item text-danger" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
        </ul>
      </div>
    `;
  } else {
    authNav.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <a href="login.html" class="btn btn-outline-custom">Sign In</a>
        <a href="register.html" class="btn btn-primary-custom">Get Started</a>
      </div>
    `;
  }

  // Highlight active page link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Global Logout Handler
function logout() {
  API.clearAuth();
  showToast('You have been signed out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Global Toast Notification Helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const bgClass = type === 'success' ? 'bg-success' : type === 'danger' || type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-info';
  const icon = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' || type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white ${bgClass} border-0 shadow-lg mb-2`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${icon} fs-5"></i>
        <span>${escapeHtml(message)}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// Formatting Helper Functions
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedH = h % 12 || 12;
  return `${formattedH}:${minutes} ${ampm}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.showToast = showToast;
window.logout = logout;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.escapeHtml = escapeHtml;
