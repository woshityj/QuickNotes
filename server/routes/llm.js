import express from "express";
import multer from "multer";
import { summarizeDocument, chat, elaborateDocument, summarizeDocumentWithFactCheck, questionAnswerWithRag } from "../controllers/llmController.js";

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/summarize', summarizeDocument);
router.post('/summarize-fact-check', summarizeDocumentWithFactCheck);
router.post('/question-answer-with-rag', questionAnswerWithRag);
router.post('/chat', upload.single("file"), chat);
router.post('/elaborate', elaborateDocument);

export default router;