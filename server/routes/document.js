import express from "express";
import { archiveDocument, createDocument, getDocuments, getUserDocuments } from "../controllers/documentController.js";

const router = express.Router();

// router.get('/', getDocuments);
// router.get('/:id', getDocument);
router.post('/', createDocument);
router.get('/:parentDocumentId?', getDocuments);
router.put('/:id', archiveDocument);

export default router;