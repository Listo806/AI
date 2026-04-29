const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const TrialUser = require("../models/TrialUser");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authMiddleware, authController.me);

router.post("/start-trial", async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const user = new TrialUser({ name, email, phone });
        await user.save();

        return res.json({
            success: true,
            userId: user._id,
        });

    } catch (err) {
        console.error("ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

module.exports = router;

