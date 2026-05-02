const Listing = require("../models/Listing");

exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const listings = await Listing.findByUser(req.user.id);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

