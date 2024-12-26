import express from "express";
import multer from "multer";
import { summarizeDocument, chat, elaborateDocument } from "../controllers/llmController.js";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/summarize', summarizeDocument);
router.post('/chat', upload.single("file"), chat);
router.post('/elaborate', elaborateDocument);

export default router;