import FolderItem from "../models/folder.model.js";

import db from "../db/connection.js";

export async function getFolders(req, res) {
    let collection = await db.collection("folders");
    let results = await collection.find({}).toArray();

    res.send(results).status(200);
}

export const addNewFolder = async (req, res) => {
    let newFolder = new FolderItem({
        userId: req.body.userId,
        name: req.body.name,
        parentFolder: req.body.parentFolder,
        documents: req.body.documents,
    });

    try {
        let collection = await db.collection("folders");
        let result = await collection.insertOne(newFolder);

        res.status(201).json(result);
    } catch (err) {
        res.status(409).json({ message: err.message });
    }
}