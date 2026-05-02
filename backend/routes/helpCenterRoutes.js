const express = require("express");
const router = express.Router();
const helpCenterController = require("../controllers/helpCenterController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.post("/", auth, role(["Admin"]), helpCenterController.createArticle);
router.get("/", helpCenterController.getArticles);

module.exports = router;

