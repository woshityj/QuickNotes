import mongoose from "mongoose";
import { DocumentSchema } from "../models/document.model.js";

const Document = mongoose.model('Documents', DocumentSchema);

export function addNewDocument(req, res) {
    let newDocument = new Document(req.body);
    newDocument.save((err, document) => {
        if (err) {
            res.send(err);
        }
        res.json(document);
    })
}