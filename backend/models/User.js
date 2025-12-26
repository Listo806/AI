
const db = require("../config/db");

class User {
  static async create({ email, password, role, teamId }) {
    const { rows } = await db.query(
      `INSERT INTO users (email, password, role, team_id, is_active)
       VALUES ($1,$2,$3,$4,true)
       RETURNING *`,
      [email, password, role, teamId]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE id=$1`,
      [id]
    );
    return rows[0];
  }
}

module.exports = User;
