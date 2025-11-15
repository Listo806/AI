import { HelpArticle } from "../models/HelpArticle.js";

export const listArticles = async (req, res) => {
  try {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) filter.$text = { $search: q };
    const articles = await HelpArticle.find(filter).limit(100);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch help articles" });
  }
};

export const getArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await HelpArticle.findOne({ slug });
    if (!article) return res.status(404).json({ message: "Not found" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: "Unable to fetch article" });
  }
};
