import express from "express";
import { summarizeDocument, chat } from "../controllers/llmController.js";

const router = express.Router();

router.post('/summarize', summarizeDocument);
router.post('/chat', chat);

export default router;