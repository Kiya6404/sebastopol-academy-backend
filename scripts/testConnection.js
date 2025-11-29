require('dotenv').config();
const { testConnection } = require('../src/config/database');

async function test() {
  console.log('🧪 Testing Database Connection...');
  console.log('📋 Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.POSTGRES_URL) {
    // Show first part of connection string for verification
    const parts = process.env.POSTGRES_URL.split('@');
    if (parts.length > 1) {
      console.log(`Connection: postgresql://...@${parts[1]}`);
    }
  }
  
  console.log('');
  const success = await testConnection();
  
  if (success) {
    console.log('🎉 Connection test PASSED!');
    process.exit(0);
  } else {
    console.log('❌ Connection test FAILED!');
    process.exit(1);
  }
}

test();
