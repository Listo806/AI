const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, leadController.createLead);
router.get("/", auth, leadController.getLeads);

module.exports = router;

