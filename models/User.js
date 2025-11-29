const { pgPool } = require('../config/database');

class User {
  static async create(userData) {
    const { email, password_hash, name, role = 'student' } = userData;
    const query = `
      INSERT INTO users (email, password_hash, name, role, created_at) 
      VALUES ($1, $2, $3, $4, NOW()) 
      RETURNING id, email, name, role, created_at
    `;
    const values = [email, password_hash, name, role];
    
    const result = await pgPool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pgPool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, name, role, created_at FROM users WHERE id = $1';
    const result = await pgPool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
