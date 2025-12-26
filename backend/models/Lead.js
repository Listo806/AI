const db = require("../config/db");

class Lead {
  static async create(data) {
    const { name, email, status, createdBy } = data;

    const { rows } = await db.query(
      `INSERT INTO leads (name, email, status, created_by)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name, email, status, createdBy]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const { rows } = await db.query(
      `SELECT * FROM leads WHERE created_by=$1`,
      [userId]
    );
    return rows;
  }
}

module.exports = Lead;

