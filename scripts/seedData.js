require('dotenv').config();
const { pgPool } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  let client;
  try {
    console.log('🌱 Starting database seeding...');
    
    client = await pgPool.connect();
    console.log('✅ Connected to database');

    // Check if users already exist
    console.log('🔍 Checking for existing users...');
    const existingUsers = await client.query(
      'SELECT email FROM users WHERE email IN ($1, $2)',
      ['instructor@sebastopol.academy', 'student@sebastopol.academy']
    );

    const existingEmails = existingUsers.rows.map(row => row.email);
    console.log('📊 Existing users found:', existingEmails);

    let instructorId;

    // Create instructor if not exists
    if (!existingEmails.includes('instructor@sebastopol.academy')) {
      console.log('👨‍🏫 Creating instructor...');
      const instructorPassword = await bcrypt.hash('instructor123', 12);
      const instructorResult = await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        ['instructor@sebastopol.academy', instructorPassword, 'Dr. Security Expert', 'instructor']
      );
      instructorId = instructorResult.rows[0].id;
      console.log('✅ Instructor created');
    } else {
      console.log('ℹ️ Instructor already exists, fetching ID...');
      const result = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['instructor@sebastopol.academy']
      );
      instructorId = result.rows[0].id;
    }

    // Create student if not exists
    if (!existingEmails.includes('student@sebastopol.academy')) {
      console.log('👨‍🎓 Creating student...');
      const studentPassword = await bcrypt.hash('student123', 12);
      await client.query(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, $4)`,
        ['student@sebastopol.academy', studentPassword, 'Test Student', 'student']
      );
      console.log('✅ Student created');
    } else {
      console.log('ℹ️ Student already exists');
    }

    // Check if lessons exist
    console.log('🔍 Checking for existing lessons...');
    const existingLessons = await client.query(
      'SELECT COUNT(*) as count FROM lessons WHERE instructor_id = $1',
      [instructorId]
    );

    if (parseInt(existingLessons.rows[0].count) === 0) {
      console.log('📚 Creating lesson...');
      await client.query(
        `INSERT INTO lessons (title, description, content, instructor_id, category, difficulty_level, estimated_duration) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'Phishing Awareness Training',
          'Learn to identify and prevent phishing attacks',
          'This lesson covers common phishing techniques and protection strategies.',
          instructorId,
          'Security',
          'Beginner',
          30
        ]
      );
      console.log('✅ Lesson created');
    } else {
      console.log('ℹ️ Lessons already exist');
    }

    console.log('🎉 Seeding completed successfully!');
    console.log('');
    console.log('📋 Demo Accounts:');
    console.log('👨‍🏫 Instructor: instructor@sebastopol.academy / instructor123');
    console.log('👨‍🎓 Student: student@sebastopol.academy / student123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    if (client) client.release();
    process.exit();
  }
};

seedData();
