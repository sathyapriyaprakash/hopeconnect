// Dynamic Dashboard Controller (Volunteer, NGO, Admin)

document.addEventListener('DOMContentLoaded', () => {
  const user = API.getUser();

  if (document.getElementById('volunteerDashboard')) {
    if (!user || user.role !== 'volunteer') {
      window.location.href = 'login.html';
      return;
    }
    initVolunteerDashboard();
  } else if (document.getElementById('ngoDashboard')) {
    if (!user || (user.role !== 'ngo' && user.role !== 'admin')) {
      window.location.href = 'login.html';
      return;
    }
    initNgoDashboard();
  } else if (document.getElementById('adminDashboard')) {
    if (!user || user.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
    initAdminDashboard();
  }
});

/* ============================================================
   1. VOLUNTEER DASHBOARD
   ============================================================ */
async function initVolunteerDashboard() {
  const tableBody = document.getElementById('myRegistrationsBody');
  if (!tableBody) return;

  try {
    const data = await API.get('/registrations/my-registrations');
    const regs = data.registrations || [];

    // Update Stats
    document.getElementById('statTotalRegistered').textContent = regs.length;
    document.getElementById('statUpcomingEvents').textContent = regs.filter(r => r.registration_status === 'Registered').length;

    if (regs.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-2"></i>
            <p class="mt-2 mb-0">You haven't registered for any events yet.</p>
            <a href="events.html" class="btn btn-sm btn-primary-custom mt-2">Explore Events</a>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = regs.map(reg => `
      <tr>
        <td>
          <div class="fw-bold"><a href="event-detail.html?id=${reg.id}" class="text-dark text-decoration-none">${escapeHtml(reg.title)}</a></div>
          <div class="small text-muted">${escapeHtml(reg.category)}</div>
        </td>
        <td>${escapeHtml(reg.organization_name || reg.ngo_name)}</td>
        <td>${formatDate(reg.event_date)} at ${formatTime(reg.event_time)}</td>
        <td>${escapeHtml(reg.city)}</td>
        <td>
          <span class="badge-status ${reg.registration_status.toLowerCase()}">${reg.registration_status}</span>
        </td>
        <td class="text-end">
          ${reg.registration_status === 'Registered' ? `
            <button class="btn btn-sm btn-outline-danger" onclick="cancelRegistrationDashboard(${reg.id})">
              <i class="bi bi-x-circle me-1"></i> Cancel
            </button>
          ` : '<span class="text-muted small">-</span>'}
        </td>
      </tr>
    `).join('');

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function cancelRegistrationDashboard(eventId) {
  if (!confirm('Cancel registration for this event?')) return;
  try {
    const response = await API.delete(`/registrations/${eventId}`);
    showToast(response.message, 'info');
    initVolunteerDashboard();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}


/* ============================================================
   2. NGO DASHBOARD
   ============================================================ */
async function initNgoDashboard() {
  loadNgoEvents();

  // Create Event Form Listener
  const createForm = document.getElementById('createEventForm');
  if (createForm) {
    createForm.addEventListener('submit', handleCreateEventSubmit);
  }
}

async function loadNgoEvents() {
  const container = document.getElementById('ngoEventsContainer');
  if (!container) return;

  try {
    const data = await API.get('/events/ngo/my-events');
    const events = data.events || [];

    // Update Stats
    document.getElementById('statNgoEvents').textContent = events.length;
    const totalVolunteers = events.reduce((sum, e) => sum + (e.registered_count || 0), 0);
    document.getElementById('statNgoVolunteers').textContent = totalVolunteers;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
          <i class="bi bi-journal-plus fs-1"></i>
          <h4 class="mt-2 fw-bold">No Events Hosted Yet</h4>
          <p>Create your first volunteer event to start recruiting passionate volunteers!</p>
          <button class="btn btn-primary-custom" data-bs-toggle="modal" data-bs-target="#createEventModal">
            <i class="bi bi-plus-circle me-1"></i> Create Event Now
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(event => `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="custom-card h-100 d-flex flex-column">
          <div class="event-card-img-wrapper">
            <img src="${escapeHtml(event.image_url)}" class="event-card-img" alt="${escapeHtml(event.title)}" onerror="this.src='https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80'">
            <span class="category-badge">${escapeHtml(event.category)}</span>
          </div>
          <div class="p-4 d-flex flex-column flex-grow-1">
            <h5 class="fw-bold mb-2 text-truncate">${escapeHtml(event.title)}</h5>
            <p class="text-muted small">${formatDate(event.event_date)} | ${escapeHtml(event.city)}</p>

            <div class="bg-light p-3 rounded-3 mb-3 mt-auto">
              <div class="d-flex justify-content-between text-muted small mb-1">
                <span>Registered Volunteers</span>
                <span class="fw-bold text-dark">${event.registered_count || (event.max_volunteers - event.available_slots)} / ${event.max_volunteers}</span>
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-custom flex-grow-1" onclick="viewRegisteredVolunteers(${event.id})">
                <i class="bi bi-people me-1"></i> Attendees
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteNgoEvent(${event.id})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function handleCreateEventSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');

  const payload = {
    title: form.title.value.trim(),
    category: form.category.value,
    description: form.description.value.trim(),
    event_date: form.event_date.value,
    event_time: form.event_time.value,
    location: form.location.value.trim(),
    city: form.city.value.trim(),
    max_volunteers: parseInt(form.max_volunteers.value, 10),
    image_url: form.image_url.value.trim()
  };

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating...`;

  try {
    const response = await API.post('/events', payload);
    showToast(response.message, 'success');

    // Close Modal
    const modalEl = document.getElementById('createEventModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    form.reset();

    loadNgoEvents();
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Publish Event`;
  }
}

async function viewRegisteredVolunteers(eventId) {
  const modalBody = document.getElementById('volunteersModalBody');
  const modalTitle = document.getElementById('volunteersModalTitle');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Fetching attendee records...</p>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('volunteersModal'));
  modal.show();

  try {
    const data = await API.get(`/registrations/event/${eventId}`);
    modalTitle.textContent = `Attendees - ${data.event_title}`;

    if (!data.volunteers || data.volunteers.length === 0) {
      modalBody.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-people fs-2"></i>
          <p class="mt-2">No volunteers have registered for this event yet.</p>
        </div>
      `;
      return;
    }

    modalBody.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Volunteer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Registered On</th>
            </tr>
          </thead>
          <tbody>
            ${data.volunteers.map((vol, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="fw-bold">${escapeHtml(vol.volunteer_name)}</td>
                <td><a href="mailto:${escapeHtml(vol.volunteer_email)}">${escapeHtml(vol.volunteer_email)}</a></td>
                <td>${escapeHtml(vol.volunteer_phone || 'N/A')}</td>
                <td>${escapeHtml(vol.volunteer_city || 'N/A')}</td>
                <td>${formatDate(vol.registered_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    modalBody.innerHTML = `<div class="alert alert-danger">${escapeHtml(err.message)}</div>`;
  }
}

async function deleteNgoEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event? All volunteer registrations will be removed.')) return;
  try {
    const response = await API.delete(`/events/${eventId}`);
    showToast(response.message, 'success');
    loadNgoEvents();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}


/* ============================================================
   3. ADMIN DASHBOARD
   ============================================================ */
async function initAdminDashboard() {
  loadAdminStats();
  loadAdminUsers();
  loadAdminEvents();
  loadAdminRegistrations();
}

async function loadAdminStats() {
  try {
    const data = await API.get('/stats');
    const stats = data.stats;
    document.getElementById('adminTotalUsers').textContent = stats.totalUsers;
    document.getElementById('adminTotalVolunteers').textContent = stats.totalVolunteers;
    document.getElementById('adminTotalNGOs').textContent = stats.totalNGOs;
    document.getElementById('adminTotalEvents').textContent = stats.totalEvents;
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadAdminUsers() {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;

  try {
    const data = await API.get('/admin/users');
    const users = data.users || [];

    tableBody.innerHTML = users.map(user => `
      <tr>
        <td>#${user.id}</td>
        <td class="fw-bold">${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'ngo' ? 'bg-primary' : 'bg-success'}">${user.role.toUpperCase()}</span></td>
        <td>${escapeHtml(user.organization_name || user.city || '-')}</td>
        <td>${formatDate(user.created_at)}</td>
        <td class="text-end">
          ${user.role !== 'admin' ? `
            <button class="btn btn-sm btn-outline-danger" onclick="deleteUserAdmin(${user.id})">
              <i class="bi bi-trash"></i> Delete
            </button>
          ` : '<span class="text-muted small">Protected</span>'}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadAdminEvents() {
  const tableBody = document.getElementById('adminEventsTableBody');
  if (!tableBody) return;

  try {
    const data = await API.get('/events');
    const events = data.events || [];

    tableBody.innerHTML = events.map(event => `
      <tr>
        <td>#${event.id}</td>
        <td class="fw-bold">${escapeHtml(event.title)}</td>
        <td>${escapeHtml(event.organization_name || event.ngo_name)}</td>
        <td>${escapeHtml(event.category)}</td>
        <td>${formatDate(event.event_date)}</td>
        <td>${event.available_slots} / ${event.max_volunteers}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEventAdmin(${event.id})">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function loadAdminRegistrations() {
  const tableBody = document.getElementById('adminRegistrationsTableBody');
  if (!tableBody) return;

  try {
    const data = await API.get('/admin/registrations');
    const regs = data.registrations || [];

    tableBody.innerHTML = regs.map(reg => `
      <tr>
        <td>#${reg.registration_id}</td>
        <td class="fw-bold">${escapeHtml(reg.volunteer_name)} (${escapeHtml(reg.volunteer_email)})</td>
        <td>${escapeHtml(reg.event_title)}</td>
        <td>${escapeHtml(reg.ngo_name)}</td>
        <td><span class="badge-status ${reg.status.toLowerCase()}">${reg.status}</span></td>
        <td>${formatDate(reg.registered_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteUserAdmin(userId) {
  if (!confirm('Are you sure you want to delete this user account? All associated events and registrations will be removed.')) return;

  try {
    const response = await API.delete(`/admin/users/${userId}`);
    showToast(response.message, 'success');
    initAdminDashboard();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteEventAdmin(eventId) {
  if (!confirm('Are you sure you want to delete this event?')) return;

  try {
    const response = await API.delete(`/events/${eventId}`);
    showToast(response.message, 'success');
    initAdminDashboard();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

window.cancelRegistrationDashboard = cancelRegistrationDashboard;
window.viewRegisteredVolunteers = viewRegisteredVolunteers;
window.deleteNgoEvent = deleteNgoEvent;
window.deleteUserAdmin = deleteUserAdmin;
window.deleteEventAdmin = deleteEventAdmin;
