const db = require("../config/db");

class Team {
  static async create({ name, ownerId }) {
    const { rows } = await db.query(
      `INSERT INTO teams (name, owner_id, seat_limit)
       VALUES ($1,$2,1)
       RETURNING *`,
      [name, ownerId]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const { rows } = await db.query(
      `SELECT t.*
       FROM teams t
       JOIN users u ON u.team_id = t.id
       WHERE u.id = $1`,
      [userId]
    );
    return rows;
  }
}

module.exports = Team;

