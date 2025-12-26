
const HelpArticle = require("../models/HelpArticle");

exports.createArticle = async (req, res) => {
  try {
    const article = await HelpArticle.create(req.body);
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const articles = await HelpArticle.findAll();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
