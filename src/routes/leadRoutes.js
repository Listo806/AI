import express from "express";
import { createLead, getLeads } from "../controllers/leadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", createLead);
router.get("/", protect, requireRole("agent", "developer", "admin"), getLeads);

export default router;
