import express from "express";
import multer from "multer";
import { summarizeDocument, chat } from "../controllers/llmController.js";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/summarize', summarizeDocument);
router.post('/chat', upload.single("file"), chat);

export default router;