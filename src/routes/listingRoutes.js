import express from "express";
import {
  createListing,
  getMyListings,
  searchListings
} from "../controllers/listingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createListing);
router.get("/mine", protect, getMyListings);
router.get("/search", searchListings);

export default router;
