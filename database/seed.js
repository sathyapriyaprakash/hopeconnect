const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');

async function seed() {
  console.log('🌱 Seeding Volunteer & NGO Event Coordination Portal Database...');
  const db = await getDb();

  const defaultPassword = await bcrypt.hash('password123', 10);

  try {
    // 1. Clear existing data
    await db.query('DELETE FROM registrations');
    await db.query('DELETE FROM events');
    await db.query('DELETE FROM users');

    // Reset sequence if sqlite
    if (db.isSqlite) {
      await db.query("DELETE FROM sqlite_sequence WHERE name IN ('users', 'events', 'registrations')");
    }

    // 2. Insert Users (1 Admin, 3 NGOs, 4 Volunteers)
    const users = [
      ['System Administrator', 'admin@portal.org', defaultPassword, 'admin', '9876543210', 'Central Admin Hub', 'New Delhi', 'Platform Administrator'],
      ['Green Earth Foundation', 'ngo@greenearth.org', defaultPassword, 'ngo', '9811223344', 'Green Earth Foundation', 'Mumbai', 'Dedicated to environmental conservation, tree planting, and beach cleanups.'],
      ['Hope Education Trust', 'ngo@hopeedu.org', defaultPassword, 'ngo', '9822334455', 'Hope Education Trust', 'Bengaluru', 'Providing free tutoring, books, and digital literacy to underprivileged children.'],
      ['Care & Compassion Care', 'ngo@carecompassion.org', defaultPassword, 'ngo', '9833445566', 'Care & Compassion Care', 'Delhi', 'Animal rescue, shelter management, and stray feeding initiatives.'],
      ['Aarav Sharma', 'aarav@gmail.com', defaultPassword, 'volunteer', '9988776655', null, 'Mumbai', 'Passionate about nature, climate action, and community service.'],
      ['Priya Patel', 'priya@gmail.com', defaultPassword, 'volunteer', '9977665544', null, 'Bengaluru', 'Computer Science student keen on teaching coding and basic tech to kids.'],
      ['Rohan Verma', 'rohan@gmail.com', defaultPassword, 'volunteer', '9966554433', null, 'Delhi', 'Animal lover and active blood donor.'],
      ['Sneha Reddy', 'sneha@gmail.com', defaultPassword, 'volunteer', '9955443322', null, 'Hyderabad', 'Youth volunteer enthusiast and emergency response volunteer.']
    ];

    for (const user of users) {
      if (db.isSqlite) {
        await db.query(
          `INSERT INTO users (name, email, password, role, phone, organization_name, city, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          user
        );
      } else {
        await db.query(
          `INSERT INTO users (name, email, password, role, phone, organization_name, city, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          user
        );
      }
    }

    console.log('✅ Users seeded successfully! (Default Password: password123)');

    // Get NGO IDs
    const ngoResults = await db.query("SELECT id, name FROM users WHERE role = 'ngo'");
    const ngos = ngoResults.rows || ngoResults[0];
    const greenEarthId = ngos.find(n => n.name.includes('Green Earth'))?.id || 2;
    const hopeEduId = ngos.find(n => n.name.includes('Hope Education'))?.id || 3;
    const careId = ngos.find(n => n.name.includes('Care & Compassion'))?.id || 4;

    // 3. Insert Events
    const events = [
      [
        greenEarthId,
        'Mega Coastal & Beach Cleanup 2026',
        'Environment',
        'Join hands with Green Earth Foundation to restore Juhu Beach. We will collect plastic waste, segregate recyclables, and spread awareness among beachgoers. Gloves, trash bags, and refreshments provided!',
        '2026-10-15',
        '07:00:00',
        'Juhu Beach, Near Ramada Inn',
        'Mumbai',
        50,
        48,
        'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        greenEarthId,
        'Urban Forest Tree Plantation Drive',
        'Environment',
        'Help us plant 500 native trees to create a green lungs zone in the city outskirts. Tools and saplings will be provided. Perfect for nature enthusiasts and eco-warriors.',
        '2026-11-05',
        '08:30:00',
        'Aarey Colony Forest Reserve',
        'Mumbai',
        30,
        28,
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        hopeEduId,
        'Weekend STEM & Math Tutoring for Kids',
        'Education',
        'Volunteer teachers needed to conduct engaging hands-on Math and Basic Computer classes for primary school children at our community center.',
        '2026-10-20',
         me = '10:00:00',
        'Hope Community Center, Koramangala',
        'Bengaluru',
        15,
        14,
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        hopeEduId,
        'Digital Literacy Workshop for Youth',
        'Education',
        'Teach high school students basic computer usage, internet safety, and web browsing skills. Help bridge the digital divide!',
        '2026-11-12',
        '14:00:00',
        'Government High School Campus, Indiranagar',
        'Bengaluru',
        20,
        20,
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        careId,
        'Stray Dog Vaccination & Feeding Drive',
        'Animal Welfare',
        'Accompany our veterinary team to feed stray dogs, assist in anti-rabies vaccination tagging, and record healthcare status across West Delhi neighborhoods.',
        '2026-10-28',
        '09:00:00',
        'Janakpuri Community Park Gate 3',
        'Delhi',
        25,
        24,
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        careId,
        'Animal Shelter Adoption Fair',
        'Animal Welfare',
        'Help manage adoption counters, guide visitors, groom rescued puppies/kittens, and facilitate adoption paperwork for homeless animals.',
        '2026-11-25',
        '11:00:00',
        'Select CITYWALK Courtyard, Saket',
        'Delhi',
        40,
        40,
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ],
      [
        greenEarthId,
        'Community Health & Hygiene Awareness',
        'Community Service',
        'Distribution of hygiene kits, sanitary products, and clean drinking water tablets to slum households along with awareness sessions.',
        '2026-12-01',
        '10:00:00',
        'Dharavi Community Hall',
        'Mumbai',
        35,
        35,
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb0?auto=format&fit=crop&w=800&q=80',
        'Upcoming'
      ]
    ];

    for (const evt of events) {
      await db.query(
        `INSERT INTO events (ngo_id, title, category, description, event_date, event_time, location, city, max_volunteers, available_slots, image_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [evt[0], evt[1], evt[2], evt[3], evt[4], evt[5], evt[6], evt[7], evt[8], evt[9], evt[10], evt[11]]
      );
    }

    console.log('✅ Events seeded successfully!');

    // Get Volunteer IDs & Event IDs
    const volResults = await db.query("SELECT id, name FROM users WHERE role = 'volunteer'");
    const vols = volResults.rows || volResults[0];
    const eventResults = await db.query("SELECT id, title FROM events");
    const evts = eventResults.rows || eventResults[0];

    if (vols.length > 0 && evts.length > 0) {
      // Add sample registrations
      const registrations = [
        [evts[0].id, vols[0].id, 'Registered'],
        [evts[0].id, vols[1].id, 'Registered'],
        [evts[1].id, vols[0].id, 'Registered'],
        [evts[1].id, vols[2].id, 'Registered'],
        [evts[2].id, vols[1].id, 'Registered'],
        [evts[4].id, vols[2].id, 'Registered']
      ];

      for (const reg of registrations) {
        await db.query(
          `INSERT INTO registrations (event_id, volunteer_id, status) VALUES (?, ?, ?)`,
          reg
        );
      }
      console.log('✅ Registrations seeded successfully!');
    }

    console.log('\n🎉 Database Seeding Completed Successfully!\n');
    console.log('Sample Logins for Testing:');
    console.log('----------------------------------------------------');
    console.log('👑 Admin:     admin@portal.org      | password123');
    console.log('🏢 NGO:       ngo@greenearth.org    | password123');
    console.log('🙋 Volunteer: aarav@gmail.com       | password123');
    console.log('----------------------------------------------------');

  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
  } finally {
    if (db.close) await db.close();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
