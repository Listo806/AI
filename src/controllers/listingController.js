import { Listing } from "../models/Listing.js";

export const createListing = async (req, res) => {
  try {
    const listing = await Listing.create({
      ...req.body,
      owner: req.user._id
    });
    res.status(201).json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to create listing" });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch listings" });
  }
};

export const searchListings = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, beds } = req.query;
    const filter = {};
    if (city) filter.city = city;
    if (beds) filter.beds = { $gte: Number(beds) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const listings = await Listing.find(filter).limit(50);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};
