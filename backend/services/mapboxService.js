const axios = require("axios");

module.exports = {
  async geocode(address) {
    const { data } = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json`,
      { params: { access_token: process.env.MAPBOX_KEY } }
    );
    return data.features[0];
  },
};

