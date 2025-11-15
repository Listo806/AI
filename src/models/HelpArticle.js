import mongoose from "mongoose";

const helpArticleSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: String,
    content: String,
    published: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const HelpArticle = mongoose.model("HelpArticle", helpArticleSchema);
