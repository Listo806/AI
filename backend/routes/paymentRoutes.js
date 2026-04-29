const express = require("express");
const router = express.Router();
const TrialUser = require("../models/TrialUser");

router.post("/create-checkout", async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    // MARK USER AS PENDING PAYMENT
    await TrialUser.findByIdAndUpdate(userId, {
      paymentStatus: "pending",
    });

    // TEMP REDIRECT (SIMULATED PAYMENT SUCCESS)
    return res.json({
      success: true,
      checkoutUrl: `/payment-success?userId=${userId}`,
    });

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;