import express from "express";
import { getFolders, addNewFolder } from "../controllers/folderController.js";

const router = express.Router();

router.get("/", getFolders);
router.post("/", addNewFolder);

export default router;