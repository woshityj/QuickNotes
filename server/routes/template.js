import express from "express";
import { createTemplate, getTemplate, getTemplates, updateTemplate, updateTemplatePublicity, deleteTemplate } from "../controllers/templateController.js";

const router = express.Router();

router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:id', deleteTemplate);
router.put('/:id', updateTemplate);
router.put('/update-publicity/:id', updateTemplatePublicity);

export default router;