const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role(["Owner"]), teamController.createTeam);
router.get("/", auth, teamController.getMyTeam);

module.exports = router;

