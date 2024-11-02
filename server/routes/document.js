import express from "express";
import { archiveDocument, createDocument, getArchivedDocuments, getDocument, getDocuments, getUserDocuments, removeDocument, restoreDocument, searchDocuments, updateDocument } from "../controllers/documentController.js";

const router = express.Router();

// router.get('/', getDocuments);
// router.get('/:id', getDocument);

router.get('/archived-documents/:search?', getArchivedDocuments);
router.put('/archived-documents/:id', restoreDocument);
router.delete('/archived-documents/:id', removeDocument);

router.get('/search', searchDocuments);
router.get('/document/:id', getDocument);
router.put('/document/:id', updateDocument);

router.post('/', createDocument);
router.get('/:parentDocumentId?', getDocuments);
router.put('/:id', archiveDocument);



export default router;