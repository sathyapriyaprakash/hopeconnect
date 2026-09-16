-- ============================================================
-- Volunteer & NGO Event Coordination Portal Database Schema
-- MySQL Script for CSE Mini Project
-- ============================================================

CREATE DATABASE IF NOT EXISTS volunteer_ngo_db;
USE volunteer_ngo_db;

-- 1. Users Table (Volunteers, NGOs, Admins)
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('volunteer', 'ngo', 'admin') NOT NULL DEFAULT 'volunteer',
    phone VARCHAR(20) DEFAULT NULL,
    organization_name VARCHAR(150) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Events Table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ngo_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    max_volunteers INT NOT NULL,
    available_slots INT NOT NULL,
    image_url TEXT DEFAULT NULL,
    status ENUM('Upcoming', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Registrations Table
CREATE TABLE registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    volunteer_id INT NOT NULL,
    status ENUM('Registered', 'Cancelled', 'Attended') DEFAULT 'Registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_volunteer_event (event_id, volunteer_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index optimization for fast query filters
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_users_role ON users(role);
