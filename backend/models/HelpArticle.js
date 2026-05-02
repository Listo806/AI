const db = require("../config/db");

class HelpArticle {
  static async create({ title, content }) {
    const { rows } = await db.query(
      `INSERT INTO help_articles (title, content)
       VALUES ($1,$2)
       RETURNING *`,
      [title, content]
    );
    return rows[0];
  }

  static async findAll() {
    const { rows } = await db.query(
      `SELECT * FROM help_articles ORDER BY created_at DESC`
    );
    return rows;
  }
}

module.exports = HelpArticle;

