import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

export const getTeam = async (req, res) => {
  try {
    let team = await Team.findOne({ owner: req.user._id }).populate("members");
    if (!team) {
      team = await Team.create({ owner: req.user._id, members: [] });
    }
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch team" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { email, name, role } = req.body;
    let member = await User.findOne({ email });
    if (!member) {
      member = await User.create({
        name: name || email,
        email,
        password: Math.random().toString(36).slice(2, 10),
        role: role || "agent"
      });
    }
    const team = await Team.findOneAndUpdate(
      { owner: req.user._id },
      { $addToSet: { members: member._id } },
      { new: true, upsert: true }
    ).populate("members");
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Unable to add member" });
  }
};
