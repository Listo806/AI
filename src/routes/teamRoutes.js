import express from "express";
import { getTeam, addMember } from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getTeam);
router.post("/add", protect, addMember);

export default router;
