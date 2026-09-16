// Events Listing & Detail Controller

let currentCategory = 'All';
let currentCity = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('eventsGrid')) {
    initEventsCatalog();
  } else if (document.getElementById('eventDetailContainer')) {
    initEventDetail();
  }
});

// Initialize Events Catalog Page
async function initEventsCatalog() {
  setupFilterListeners();
  await loadEvents();
}

function setupFilterListeners() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        loadEvents();
      }, 300);
    });
  }

  const citySelect = document.getElementById('cityFilter');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      currentCity = e.target.value;
      loadEvents();
    });
  }

  const categoryPills = document.querySelectorAll('.filter-pill');
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.category || 'All';
      loadEvents();
    });
  });
}

// Fetch and Render Events Catalog
async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading events...</span>
      </div>
      <p class="mt-2 text-muted">Discovering impact opportunities...</p>
    </div>
  `;

  try {
    let queryParams = [];
    if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
    if (currentCategory && currentCategory !== 'All') queryParams.push(`category=${encodeURIComponent(currentCategory)}`);
    if (currentCity && currentCity !== 'All') queryParams.push(`city=${encodeURIComponent(currentCity)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const response = await API.get(`/events${queryString}`);

    if (!response.events || response.events.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-calendar-x fs-1 text-muted"></i>
          <h4 class="mt-3 fw-bold">No Events Found</h4>
          <p class="text-muted">Try adjusting your search terms or category filters.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = response.events.map(event => renderEventCard(event)).join('');

  } catch (err) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5 text-danger">
        <i class="bi bi-exclamation-triangle fs-1"></i>
        <h4 class="mt-2">Failed to load events</h4>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// Render HTML for single Event Card
function renderEventCard(event) {
  const isFull = event.available_slots <= 0;
  const slotPercentage = Math.round(((event.max_volunteers - event.available_slots) / event.max_volunteers) * 100);

  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="custom-card h-100 d-flex flex-column">
        <div class="event-card-img-wrapper">
          <img src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.title)}" class="event-card-img" onerror="this.src='https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80'">
          <span class="category-badge">${escapeHtml(event.category)}</span>
          <span class="slots-badge ${isFull ? 'full' : ''}">
            ${isFull ? 'FULL' : `${event.available_slots} slots left`}
          </span>
        </div>
        <div class="p-4 d-flex flex-column flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
            <i class="bi bi-building text-primary"></i>
            <span class="fw-semibold">${escapeHtml(event.organization_name || event.ngo_name)}</span>
          </div>
          <h5 class="fw-bold mb-2 text-truncate" title="${escapeHtml(event.title)}">
            <a href="event-detail.html?id=${event.id}" class="text-decoration-none text-dark">${escapeHtml(event.title)}</a>
          </h5>
          <p class="text-muted small flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHtml(event.description)}
          </p>

          <div class="my-3 pt-2 border-top">
            <div class="row g-2 text-muted small">
              <div class="col-6">
                <i class="bi bi-calendar3 me-1 text-primary"></i>${formatDate(event.event_date)}
              </div>
              <div class="col-6 text-end">
                <i class="bi bi-geo-alt me-1 text-danger"></i>${escapeHtml(event.city)}
              </div>
            </div>
          </div>

          <div class="mb-3">
            <div class="d-flex justify-content-between small mb-1">
              <span class="text-muted">Registered</span>
              <span class="fw-bold text-dark">${event.max_volunteers - event.available_slots}/${event.max_volunteers}</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-primary" role="progressbar" style="width: ${slotPercentage}%" aria-valuenow="${slotPercentage}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>

          <a href="event-detail.html?id=${event.id}" class="btn btn-outline-custom w-100 mt-auto">
            View Details & Register <i class="bi bi-arrow-right ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  `;
}

// Initialize Event Detail Page
async function initEventDetail() {
  const container = document.getElementById('eventDetailContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    container.innerHTML = `<div class="alert alert-danger">Invalid Event ID. <a href="events.html">Return to events</a></div>`;
    return;
  }

  try {
    const data = await API.get(`/events/${eventId}`);
    const event = data.event;
    const isUserRegistered = data.isUserRegistered;
    const currentUser = API.getUser();

    document.title = `${event.title} - Volunteer & NGO Portal`;

    const isFull = event.available_slots <= 0;
    const isNGO = currentUser && currentUser.role === 'ngo';
    const isAdmin = currentUser && currentUser.role === 'admin';

    let actionButtonHTML = '';

    if (isUserRegistered) {
      actionButtonHTML = `
        <div class="alert alert-success d-flex align-items-center gap-2 mb-3">
          <i class="bi bi-check-circle-fill fs-4"></i>
          <div>
            <strong>You are registered for this event!</strong>
            <div class="small">We look forward to seeing you there. Check your dashboard for details.</div>
          </div>
        </div>
        <button class="btn btn-danger w-100 py-3 fw-bold" onclick="cancelRegistration(${event.id})">
          <i class="bi bi-x-circle me-1"></i> Cancel Registration
        </button>
      `;
    } else if (isFull) {
      actionButtonHTML = `
        <button class="btn btn-secondary w-100 py-3 fw-bold disabled" disabled>
          <i class="bi bi-slash-circle me-1"></i> Event Capacity Full
        </button>
      `;
    } else if (isNGO || isAdmin) {
      actionButtonHTML = `
        <div class="alert alert-info small mb-0">
          <i class="bi bi-info-circle me-1"></i> Logged in as <strong>${currentUser.role.toUpperCase()}</strong>. Registration is for volunteers.
        </div>
      `;
    } else if (!currentUser) {
      actionButtonHTML = `
        <a href="login.html?redirect=event-detail.html?id=${event.id}" class="btn btn-primary-custom w-100 py-3 fs-5 fw-bold">
          Log In to Register <i class="bi bi-box-arrow-in-right ms-2"></i>
        </a>
      `;
    } else {
      actionButtonHTML = `
        <button class="btn btn-primary-custom w-100 py-3 fs-5 fw-bold" id="btnRegisterEvent" onclick="registerForEvent(${event.id})">
          Confirm Registration <i class="bi bi-check2-circle ms-1"></i>
        </button>
      `;
    }

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="custom-card p-0 overflow-hidden mb-4">
            <img src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.title)}" class="w-100" style="max-height: 420px; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80'">
            <div class="p-4">
              <div class="d-flex align-items-center gap-2 mb-3">
                <span class="badge bg-primary fs-6">${escapeHtml(event.category)}</span>
                <span class="badge bg-secondary fs-6">${escapeHtml(event.status)}</span>
              </div>
              <h2 class="fw-bold mb-3">${escapeHtml(event.title)}</h2>
              <p class="text-muted leading-relaxed fs-6" style="white-space: pre-line;">${escapeHtml(event.description)}</p>
            </div>
          </div>

          <div class="custom-card p-4">
            <h4 class="fw-bold mb-3">About the Organizer</h4>
            <div class="d-flex align-items-center gap-3">
              <div class="stat-icon indigo">
                <i class="bi bi-building"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-0">${escapeHtml(event.organization_name || event.ngo_name)}</h5>
                <p class="text-muted mb-0 small"><i class="bi bi-envelope me-1"></i>${escapeHtml(event.ngo_email)} | <i class="bi bi-telephone me-1"></i>${escapeHtml(event.ngo_phone || 'N/A')}</p>
              </div>
            </div>
            ${event.ngo_bio ? `<p class="mt-3 text-muted small border-top pt-3 mb-0">${escapeHtml(event.ngo_bio)}</p>` : ''}
          </div>
        </div>

        <div class="col-lg-4">
          <div class="custom-card p-4 sticky-top" style="top: 100px;">
            <h4 class="fw-bold mb-4">Event Summary</h4>

            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="stat-icon cyan">
                <i class="bi bi-calendar3"></i>
              </div>
              <div>
                <div class="text-muted small">Date & Time</div>
                <div class="fw-bold">${formatDate(event.event_date)} at ${formatTime(event.event_time)}</div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="stat-icon amber">
                <i class="bi bi-geo-alt"></i>
              </div>
              <div>
                <div class="text-muted small">Location</div>
                <div class="fw-bold">${escapeHtml(event.location)}, ${escapeHtml(event.city)}</div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-3 mb-4">
              <div class="stat-icon emerald">
                <i class="bi bi-people"></i>
              </div>
              <div>
                <div class="text-muted small">Available Slots</div>
                <div class="fw-bold">${event.available_slots} / ${event.max_volunteers} remaining</div>
              </div>
            </div>

            <hr class="my-4">

            ${actionButtonHTML}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <h4 class="alert-heading">Error Loading Event</h4>
        <p>${escapeHtml(err.message)}</p>
        <a href="events.html" class="btn btn-outline-danger mt-2">Back to Events</a>
      </div>
    `;
  }
}

// Action: Register for Event
async function registerForEvent(eventId) {
  const btn = document.getElementById('btnRegisterEvent');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Registering...`;
  }

  try {
    const response = await API.post('/registrations', { event_id: eventId });
    showToast(response.message, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  } catch (err) {
    showToast(err.message, 'danger');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `Confirm Registration <i class="bi bi-check2-circle ms-1"></i>`;
    }
  }
}

// Action: Cancel Registration
async function cancelRegistration(eventId) {
  if (!confirm('Are you sure you want to cancel your registration for this event?')) return;

  try {
    const response = await API.delete(`/registrations/${eventId}`);
    showToast(response.message, 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

window.registerForEvent = registerForEvent;
window.cancelRegistration = cancelRegistration;
