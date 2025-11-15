import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    message: String,
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" }
  },
  { timestamps: true }
);

export const Lead = mongoose.model("Lead", leadSchema);
