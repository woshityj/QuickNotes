import express from "express";
import { summarizeDocument } from "../controllers/llmController.js";

const router = express.Router();

router.post('/summarize', summarizeDocument);

export default router;