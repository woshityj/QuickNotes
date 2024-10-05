import express from "express";
import { addNewDocument } from "../controllers/documentController.js";

const router = express.Router();

router.route("/")
    .get((req, res) => res.send("GET request successful"))
    .post(addNewDocument);

export default router;