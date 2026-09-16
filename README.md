# Volunteer & NGO Event Coordination Portal

A complete, full-stack web application developed for Computer Science & Engineering (CSE) mini-project. The system bridges the gap between Non-Governmental Organizations (NGOs) hosting community initiatives and volunteers seeking opportunities to contribute to social causes.

🌐 **Live Deployed Website**: [https://temporary-zippy-chestnut-zdhisat.vercel.app](https://temporary-zippy-chestnut-zdhisat.vercel.app)  
📦 **GitHub Repository**: [https://github.com/sathyapriyaprakash/hopeconnect](https://github.com/sathyapriyaprakash/hopeconnect)

---

## 🚀 Key Features & User Roles

### 🙋 1. Volunteer Module
* **Registration & Login**: Secure registration with password hashing (`bcryptjs`) and JWT token authentication.
* **Browse & Search Events**: Filter events dynamically by keyword, category (Environment, Education, Animal Welfare, etc.), city, and date.
* **Event Details View**: Detailed event information, capacity progress bar, host NGO details, and location.
* **Seamless Registration**: One-click event registration with real-time duplicate checks and capacity validation (prevents registration when slots = 0).
* **Volunteer Dashboard**: View active registrations and cancel registered drives.

### 🏢 2. NGO Organization Module
* **NGO Account Management**: Dedicated profile with organization details and contact info.
* **Event Creation**: Form with validation for event name, category, description, date, time, venue, city, max volunteers, and image URL.
* **Event Management**: Edit event details or delete events created by the NGO.
* **Attendee Tracking**: Modal popup displaying the list of registered volunteers with their contact information and registration timestamps.

### 👑 3. Administrator Console
* **High-Level Analytics**: Overview stats for total registered accounts, volunteers, NGOs, active events, and registrations.
* **User Management**: Inspect and manage all volunteer and NGO accounts.
* **Event Moderation**: Inspect and delete inappropriate events across the platform.
* **Audit Logs**: Complete log of all registrations with timestamps and status tracking.

---

## 🛠 Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons.
* **Backend**: Node.js, Express.js (REST API framework, MVC pattern).
* **Database**: MySQL (`mysql2/promise` connection pool) with relational schema and prepared statements. *(Includes automatic SQLite fallback for zero-config local testing if MySQL service is offline)*.
* **Security & Auth**: `bcryptjs` (password hashing), `jsonwebtoken` (JWT role-based authorization), CORS middleware.

---

## 📁 Project Directory Structure

```
volunteer-ngo-portal/
├── config/
│   ├── config.js              # Environment variable loader
│   └── db.js                  # MySQL database pool with fallback
├── database/
│   ├── schema.sql             # Full MySQL database table definitions
│   ├── seed.sql               # MySQL sample data insert script
│   └── seed.js                # Node.js automatic seed execution script
├── middleware/
│   ├── auth.js                # JWT authentication & role authorization
│   └── errorHandler.js        # Global Express exception handler
├── routes/
│   ├── auth.routes.js         # Authentication REST API endpoints
│   ├── event.routes.js        # Event CRUD & search/filter API
│   ├── registration.routes.js # Event registration & capacity control
│   ├── admin.routes.js        # Administrator management API
│   └── stats.routes.js        # Public platform metrics API
├── public/                    # Frontend client files
│   ├── css/styles.css         # Modern Bootstrap extension styling
│   ├── js/
│   │   ├── api.js             # Centralized fetch client & JWT storage
│   │   ├── main.js            # Dynamic navbar & Toast notification system
│   │   ├── events.js          # Catalog search/filter & detail handler
│   │   └── dashboard.js       # Volunteer, NGO, and Admin dashboard controllers
│   ├── index.html             # Landing page with hero & featured drives
│   ├── about.html             # Project vision & architecture details
│   ├── events.html            # Event catalog with live filters
│   ├── event-detail.html      # Individual event page with registration action
│   ├── login.html             # Unified sign-in page with Viva demo buttons
│   ├── register.html          # Dual-role account creation page
│   ├── dashboard-volunteer.html # Volunteer dashboard
│   ├── dashboard-ngo.html     # NGO host dashboard
│   └── dashboard-admin.html   # System admin console
├── .env                       # Environment configuration file
├── .env.example               # Template for environment variables
├── package.json               # Project dependencies and scripts
├── server.js                  # Entry point for Express application
└── README.md                  # Project documentation & Viva Q&A
```

---

## 📦 Setup & Installation Guide

### Prerequisites
* **Node.js**: v16+ installed ([Download Node.js](https://nodejs.org/))
* **MySQL Server**: MySQL 8.0+ / XAMPP / WAMP installed and running locally.

### Step 1: Install Dependencies
Open terminal in the project directory and run:
```bash
npm install
```

### Step 2: Database Setup (MySQL)
1. Open your MySQL terminal or MySQL Workbench / phpMyAdmin.
2. Run the SQL schema script to create the database and tables:
   ```sql
   SOURCE database/schema.sql;
   ```
3. *(Optional)* Run the seed SQL script manually or via Node script in Step 4.

### Step 3: Configure Environment Variables
Verify or update the `.env` file in the project root:
```env
PORT=5000
JWT_SECRET=super_secret_jwt_token_key_for_viva_project_2026
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=volunteer_ngo_db
DB_TYPE=mysql
```

### Step 4: Seed Sample Data
Execute the seed script to populate default users, events, and sample registrations:
```bash
npm run seed
```

### Step 5: Launch Server
Start the Express REST API server:
```bash
npm start
```
Access the application in your web browser at: **`http://localhost:5000`**

---

## 🔑 Test Credentials for Viva / Evaluation

The seed script initializes sample user accounts for all three roles (Password: `password123`):

| Role | Email Address | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@portal.org` | `password123` | Full admin control, view user tables, audit registrations |
| **NGO Host** | `ngo@greenearth.org` | `password123` | Create events, edit drives, view volunteer attendee list |
| **Volunteer** | `aarav@gmail.com` | `password123` | Browse catalog, register for events, manage registrations |

*(Quick-fill buttons are also available on the Login page for 1-click testing!)*

---

## 🌐 API Reference

### Authentication Endpoints (`/api/auth`)
* `POST /api/auth/register` - Create volunteer or NGO account.
* `POST /api/auth/login` - Authenticate user & return JWT token.
* `GET /api/auth/me` - Fetch profile details of logged-in user.

### Events Endpoints (`/api/events`)
* `GET /api/events` - List events with query filters (`search`, `category`, `city`).
* `GET /api/events/:id` - Get event details and user registration status.
* `POST /api/events` - Create event (NGO/Admin only).
* `PUT /api/events/:id` - Update event (NGO owner/Admin only).
* `DELETE /api/events/:id` - Delete event (NGO owner/Admin only).

### Registration Endpoints (`/api/registrations`)
* `POST /api/registrations` - Register for an event (Volunteer only, validates capacity & duplicates).
* `DELETE /api/registrations/:eventId` - Cancel event registration.
* `GET /api/registrations/my-registrations` - List logged-in volunteer's registrations.
* `GET /api/registrations/event/:eventId` - List attendees for an event (NGO owner/Admin only).

---

## 🎓 Viva Questions & Technical Explanations

### Q1. How does the system handle password security?
> Passwords are never stored in plain text. When a user registers, `bcryptjs` generates a cryptographic salt and hashes the password using 10 hashing rounds before saving it to MySQL. During login, `bcrypt.compare()` verifies the provided password against the hash.

### Q2. How is authentication and role-based access control implemented?
> The system uses JSON Web Tokens (JWT). Upon successful login, the server signs a JWT containing user ID and role. Clients store this token in `localStorage` and send it in the `Authorization: Bearer <token>` header for subsequent requests. Backend middleware `authenticateToken` validates the token, and `authorize('ngo', 'admin')` ensures only permitted roles can access sensitive endpoints.

### Q3. How do you prevent duplicate registrations and overbooking?
> 1. **Duplicate Prevention**: The database enforces a `UNIQUE(event_id, volunteer_id)` constraint on the `registrations` table. Before inserting, the Express route checks if a record already exists for that user and event.
> 2. **Capacity Validation**: When a volunteer registers, the server checks if `available_slots > 0`. If valid, it atomically decrements `available_slots` using `UPDATE events SET available_slots = available_slots - 1 WHERE id = ? AND available_slots > 0`. When a registration is cancelled, `available_slots` is incremented.

### Q4. What is the database architecture?
> The database consists of 3 relational tables: `users`, `events`, and `registrations`.
> - `events.ngo_id` references `users.id` (Foreign Key, 1-to-Many).
> - `registrations.event_id` references `events.id` and `registrations.volunteer_id` references `users.id` (Many-to-Many mapping table).
