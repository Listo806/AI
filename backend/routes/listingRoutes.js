const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, listingController.createListing);
router.get("/", auth, listingController.getListings);

module.exports = router;

