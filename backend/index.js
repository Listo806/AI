import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Listo Qasa Backend is Running ✅");
});

// ✅ PayPal route placeholder (we’ll replace this later)
app.get("/api/paypal/subscriptions/:userId", (req, res) => {
  const { userId } = req.params;
  res.json({
    userId,
    active: true,
    tier: "AI CRM Pro Plus",
    status: "ACTIVE",
    nextBillingDate: "2025-12-01T12:00:00Z",
  });
});

// ✅ Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

