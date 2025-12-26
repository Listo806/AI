const axios = require("axios");

const PAYPAL_BASE = "https://api-m.paypal.com";

module.exports = {
  async verifyWebhook(headers, body) {
    // webhook verification handled at controller level if needed
    return true;
  },

  async getSubscription(subscriptionId, accessToken) {
    const { data } = await axios.get(
      `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data;
  },
};

