require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pgPool } = require('../src/config/database');

async function generateTokens() {
  console.log('🔐 Generating JWT Tokens for Demo Accounts\n');
  
  const JWT_SECRET = process.env.JWT_SECRET;
  
  if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in environment variables');
    return;
  }

  try {
    // Connect to database to get user IDs
    const client = await pgPool.connect();
    
    // Get instructor
    const instructorResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['instructor@sebastopol.academy']
    );
    
    // Get student
    const studentResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['student@sebastopol.academy']
    );
    
    client.release();

    if (instructorResult.rows.length === 0 || studentResult.rows.length === 0) {
      console.error('❌ Demo accounts not found in database. Run npm run seed first.');
      return;
    }

    const instructor = instructorResult.rows[0];
    const student = studentResult.rows[0];

    // Generate tokens
    const instructorToken = jwt.sign(
      {
        userId: instructor.id,
        email: instructor.email,
        role: instructor.role,
        name: instructor.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const studentToken = jwt.sign(
      {
        userId: student.id,
        email: student.email,
        role: student.role,
        name: student.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎯 DEMO ACCOUNT JWT TOKENS');
    console.log('=' .repeat(60));
    
    console.log('\n👨‍🏫 INSTRUCTOR ACCOUNT:');
    console.log('Email: instructor@sebastopol.academy');
    console.log('Password: instructor123');
    console.log('Role: instructor');
    console.log('\n🔐 JWT TOKEN:');
    console.log(instructorToken);
    
    console.log('\n' + '=' .repeat(60));
    
    console.log('\n👨‍🎓 STUDENT ACCOUNT:');
    console.log('Email: student@sebastopol.academy');
    console.log('Password: student123');
    console.log('Role: student');
    console.log('\n🔐 JWT TOKEN:');
    console.log(studentToken);
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n📋 HOW TO USE THESE TOKENS:');
    console.log('Add to HTTP headers: "Authorization: Bearer YOUR_TOKEN_HERE"');
    console.log('Test with: curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/auth/me');
    
  } catch (error) {
    console.error('❌ Error generating tokens:', error.message);
  }
}

generateTokens();
