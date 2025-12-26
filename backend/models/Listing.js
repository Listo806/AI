const db = require("../config/db");

class Listing {
  static async create(data) {
    const { title, price, type, createdBy } = data;

    const { rows } = await db.query(
      `INSERT INTO listings (title, price, type, created_by)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [title, price, type, createdBy]
    );
    return rows[0];
  }

  static async findByUser(userId) {
    const { rows } = await db.query(
      `SELECT * FROM listings WHERE created_by=$1`,
      [userId]
    );
    return rows;
  }
}

module.exports = Listing;

