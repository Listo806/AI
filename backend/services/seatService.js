const db = require("../config/db");

module.exports = {
  async enforceSeats(teamId) {
    const { rows } = await db.query(
      `SELECT seat_limit FROM teams WHERE id=$1`,
      [teamId]
    );

    const limit = rows[0].seat_limit;

    await db.query(
      `UPDATE users
       SET is_active=false
       WHERE id IN (
         SELECT id FROM users
         WHERE team_id=$1 AND role!='Owner'
         ORDER BY created_at DESC
         OFFSET $2
       )`,
      [teamId, limit - 1]
    );
  },
};

