const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const TrialUser = require("../models/TrialUser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authMiddleware, authController.me);

router.post("/start-trial", async (req, res) => {
    try {
        const { name, email, phone , password} = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new TrialUser({ name, email, phone, password: hashedPassword });
        await user.save();

        return res.json({
            success: true,
            userId: user._id,
            user: user,
        });

    } catch (err) {
        console.error("ERROR:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

router.get("/user/:id", async (req, res) => {
    try {
        const user = await TrialUser.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.json({
            success: true,
            user,
        });

    } catch (err) {
        console.error("GET USER ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

router.post("/save-onboarding", async (req, res) => {
  try {
    const { userId, businessType, leadSources, mainGoal } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    if (!businessType || !mainGoal) {
      return res.status(400).json({
        success: false,
        message: "Business type and main goal are required",
      });
    }

    const user = await TrialUser.findByIdAndUpdate(
      userId,
      {
        businessType,
        leadSources: leadSources || [],
        mainGoal,
        onboardingCompleted: true,
        firstDashboardVisit: true,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Onboarding saved",
      user,
      token,
    });

  } catch (err) {
    console.error("SAVE ONBOARDING ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

router.post("/dashboard-visited", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID required",
            });
        }

        await TrialUser.findByIdAndUpdate(userId, {
            firstDashboardVisit: false,
        });

        return res.json({
            success: true,
            message: "Dashboard visit saved",
        });

    } catch (err) {
        console.error("DASHBOARD VISIT ERROR:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

router.post("/login-by-id", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await TrialUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      accessToken: token,
      user,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;

