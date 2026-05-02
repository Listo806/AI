const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TrialUser = require("../models/TrialUser");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ message: "Missing token" });

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    let user = await User.findById(decoded.id);
    if (!user) {
      user = await TrialUser.findById(decoded.id);
    }

    if (!user)
      return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


