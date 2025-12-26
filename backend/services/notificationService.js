module.exports = {
  async send(type, payload) {
    console.log(`[NOTIFICATION:${type}]`, payload);
  },
};

