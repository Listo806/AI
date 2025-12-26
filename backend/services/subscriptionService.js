const db = require("../config/db");

module.exports = {
  async updateSubscription(teamId, payload) {
    const { status, seat_limit } = payload;

    await db.query(
      `UPDATE teams SET subscription_status=$1, seat_limit=$2 WHERE id=$3`,
      [status, seat_limit, teamId]
    );
  },
};

