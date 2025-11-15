import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { notFound, errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import helpCenterRoutes from "./routes/helpCenterRoutes.js";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Listo Qasa API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/help-center", helpCenterRoutes);

app.use(notFound);
app.use(errorHandler);
