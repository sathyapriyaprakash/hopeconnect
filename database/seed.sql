-- ============================================================
-- Volunteer & NGO Event Coordination Portal Sample Data (Seed)
-- Password for all test accounts: password123
-- ============================================================

USE volunteer_ngo_db;

-- 1. Insert Users (Admin, NGOs, Volunteers)
INSERT INTO users (id, name, email, password, role, phone, organization_name, city, bio) VALUES
(1, 'System Administrator', 'admin@portal.org', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'admin', '9876543210', 'Central Admin Hub', 'New Delhi', 'Platform Administrator'),
(2, 'Green Earth Foundation', 'ngo@greenearth.org', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'ngo', '9811223344', 'Green Earth Foundation', 'Mumbai', 'Dedicated to environmental conservation, tree planting, and beach cleanups.'),
(3, 'Hope Education Trust', 'ngo@hopeedu.org', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'ngo', '9822334455', 'Hope Education Trust', 'Bengaluru', 'Providing free tutoring, books, and digital literacy to underprivileged children.'),
(4, 'Care & Compassion Care', 'ngo@carecompassion.org', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'ngo', '9833445566', 'Care & Compassion Care', 'Delhi', 'Animal rescue, shelter management, and stray feeding initiatives.'),
(5, 'Aarav Sharma', 'aarav@gmail.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'volunteer', '9988776655', NULL, 'Mumbai', 'Passionate about nature, climate action, and community service.'),
(6, 'Priya Patel', 'priya@gmail.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'volunteer', '9977665544', NULL, 'Bengaluru', 'Computer Science student keen on teaching coding and basic tech to kids.'),
(7, 'Rohan Verma', 'rohan@gmail.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'volunteer', '9966554433', NULL, 'Delhi', 'Animal lover and active blood donor.'),
(8, 'Sneha Reddy', 'sneha@gmail.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrw.B/P6d5k8N.1P0U8zR1T5i.WqO1oNn6G', 'volunteer', '9955443322', NULL, 'Hyderabad', 'Youth volunteer enthusiast and emergency response volunteer.');

-- 2. Insert Events
INSERT INTO events (id, ngo_id, title, category, description, event_date, event_time, location, city, max_volunteers, available_slots, image_url, status) VALUES
(1, 2, 'Mega Coastal & Beach Cleanup 2026', 'Environment', 'Join hands with Green Earth Foundation to restore Juhu Beach. We will collect plastic waste, segregate recyclables, and spread awareness among beachgoers.', '2026-10-15', '07:00:00', 'Juhu Beach, Near Ramada Inn', 'Mumbai', 50, 48, 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Upcoming'),
(2, 2, 'Urban Forest Tree Plantation Drive', 'Environment', 'Help us plant 500 native trees to create a green lungs zone in the city outskirts. Tools and saplings will be provided.', '2026-11-05', '08:30:00', 'Aarey Colony Forest Reserve', 'Mumbai', 30, 28, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Upcoming'),
(3, 3, 'Weekend STEM & Math Tutoring for Kids', 'Education', 'Volunteer teachers needed to conduct engaging hands-on Math and Basic Computer classes for primary school children.', '2026-10-20', '10:00:00', 'Hope Community Center, Koramangala', 'Bengaluru', 15, 14, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', 'Upcoming'),
(4, 3, 'Digital Literacy Workshop for Youth', 'Education', 'Teach high school students basic computer usage, internet safety, and web browsing skills. Help bridge the digital divide!', '2026-11-12', '14:00:00', 'Government High School Campus, Indiranagar', 'Bengaluru', 20, 20, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', 'Upcoming'),
(5, 4, 'Stray Dog Vaccination & Feeding Drive', 'Animal Welfare', 'Accompany our veterinary team to feed stray dogs, assist in anti-rabies vaccination tagging, and record healthcare status.', '2026-10-28', '09:00:00', 'Janakpuri Community Park Gate 3', 'Delhi', 25, 24, 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80', 'Upcoming'),
(6, 4, 'Animal Shelter Adoption Fair', 'Animal Welfare', 'Help manage adoption counters, guide visitors, groom rescued puppies/kittens, and facilitate adoption paperwork for homeless animals.', '2026-11-25', '11:00:00', 'Select CITYWALK Courtyard, Saket', 'Delhi', 40, 40, 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80', 'Upcoming');

-- 3. Insert Registrations
INSERT INTO registrations (event_id, volunteer_id, status) VALUES
(1, 5, 'Registered'),
(1, 6, 'Registered'),
(2, 5, 'Registered'),
(2, 7, 'Registered'),
(3, 6, 'Registered'),
(5, 7, 'Registered');
