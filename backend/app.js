const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/help", require("./routes/helpCenterRoutes"));

app.use(errorHandler);

module.exports = app;

