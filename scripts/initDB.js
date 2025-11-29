require('dotenv').config();
const { pgPool } = require('../src/config/database');

async function initializeDatabase() {
  let client;
  try {
    console.log('🚀 Initializing database tables...');
    
    client = await pgPool.connect();
    console.log('✅ Connected to database');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        instructor_id INTEGER REFERENCES users(id),
        category VARCHAR(100),
        difficulty_level VARCHAR(50),
        estimated_duration INTEGER,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER REFERENCES lessons(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        passing_score INTEGER DEFAULT 70,
        time_limit INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id),
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) DEFAULT 'multiple_choice',
        options JSONB NOT NULL,
        correct_answer VARCHAR(255) NOT NULL,
        points INTEGER DEFAULT 1,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id),
        lesson_id INTEGER REFERENCES lessons(id),
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMP,
        score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id, lesson_id)
      )`,

      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id),
        quiz_id INTEGER REFERENCES quizzes(id),
        score DECIMAL(5,2) NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        time_spent INTEGER,
        submitted_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const table of tables) {
      try {
        await client.query(table);
        console.log(`✅ Table ready: ${table.split(' ')[5]}`);
      } catch (error) {
        console.error(`❌ Table error: ${error.message}`);
      }
    }

    console.log('🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  } finally {
    if (client) client.release();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().then(() => process.exit());
}

module.exports = initializeDatabase;
