const { Pool } = require('pg');
const mongoose = require('mongoose');

console.log('🔗 Database Configuration Loading...');

// Validate connection string with better error handling
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ POSTGRES_URL is not defined in environment variables');
  console.log('💡 Make sure your .env file exists and contains POSTGRES_URL');
  // Don't exit - allow the app to start but database operations will fail
}

// Create PostgreSQL pool with NO SSL for Railway
const pgPool = new Pool({
  connectionString: connectionString,
  ssl: false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection function
const testConnection = async () => {
  if (!connectionString) {
    console.log('❌ Cannot test connection: POSTGRES_URL not set');
    return false;
  }

  let client;
  try {
    console.log('🚀 Testing database connection...');
    client = await pgPool.connect();
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log('✅ Database connected successfully!');
    console.log(`📊 Database: ${result.rows[0].current_database}`);
    console.log(`👤 User: ${result.rows[0].current_user}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
};

// Initialize tables function
const initializeTables = async () => {
  if (!connectionString) {
    console.log('❌ Cannot initialize tables: POSTGRES_URL not set');
    return false;
  }

  let client;
  try {
    console.log('🗄️ Initializing database tables...');
    client = await pgPool.connect();

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

    console.log('🎉 All tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Table initialization failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
  }
};

// MongoDB connection (optional)
const connectMongo = async () => {
  const mongoUrl = process.env.MONGODB_URL;
  
  if (!mongoUrl || mongoUrl.includes('your_mongodb')) {
    console.log('📊 MongoDB not configured - using mock data');
    return;
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log('❌ MongoDB connection failed - using mock data');
  }
};

// Main database connection function
const connectDB = async () => {
  try {
    if (!connectionString) {
      console.log('⚠️  PostgreSQL not configured - some features may not work');
      return;
    }

    // Test PostgreSQL connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('PostgreSQL connection failed');
    }

    // Initialize tables
    await initializeTables();

    // Connect MongoDB
    await connectMongo();

    console.log('🎉 All database systems ready!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

module.exports = connectDB;
module.exports.pgPool = pgPool;
module.exports.testConnection = testConnection;
module.exports.initializeTables = initializeTables;
