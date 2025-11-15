import express from "express";
import {
  listArticles,
  getArticle
} from "../controllers/helpCenterController.js";

const router = express.Router();

router.get("/", listArticles);
router.get("/:slug", getArticle);

export default router;
