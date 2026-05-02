const Team = require("../models/Team");

exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create({
      name: req.body.name,
      ownerId: req.user.id,
    });

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTeamsForUser = async (req, res) => {
  try {
    const teams = await Team.findByUser(req.user.id);
    res.json

