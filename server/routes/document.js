import express from "express";
import { createDocument, getDocuments, getUserDocuments } from "../controllers/documentController.js";

const router = express.Router();

// router.get('/', getDocuments);
// router.get('/:id', getDocument);
router.post('/', createDocument);
router.get('/', getDocuments);

export default router;