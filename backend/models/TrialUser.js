const mongoose = require("mongoose");

const TrialUserSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true },
phone: { type: String, required: true },
password: { type: String, required: true },
role: { 
    type: String, 
    enum: ["user", "admin", "agent", "owner", "va", "va_uploader"],
    default: "agent" 
  },
createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TrialUser", TrialUserSchema);