import DocumentItem from "../models/document.model.js";
import { getUserId } from "./userController.js";

import mongoose from "mongoose";

export async function createDocument(req, res) {
    try {
        const parentDocument = req.body['parentDocument'];

        const userId = await getUserId(req.headers['authorization']);

        let document = new DocumentItem({ userId: userId, parentDocument: parentDocument });
        
        await document.save();

        res.status(200).send(document);

    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error');
    }
}

export async function getDocuments(req, res) {
    try {
        let parentDocumentId = req.params.parentDocumentId;

        const userId = await getUserId(req.headers['authorization']);

        let conditions = [];
        if (!!parentDocumentId) {
            conditions.push({ parentDocument: parentDocumentId });
        } else {
            conditions.push({ parentDocument: null })
        }
        conditions.push({ userId: userId });
        conditions.push({ isArchived: false })

        let finalCondition = conditions.length ? { $and: conditions } : {};

        let documents = await DocumentItem
            .find(finalCondition)
            .exec();

        res.status(200).send(documents);
    } catch(err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
}

export async function getDocument(req, res) {
    try {
        const id = req.params.id;
        console.log(id);

        const userId = await getUserId(req.headers['authorization']);

        let document = await DocumentItem.findOne({ _id: id,  userId: userId });

        if (document.isPublished && !document.isArchived) {
            return res.status(200).send(document);
        }
        
        res.status(200).send(document);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function updateDocument(req, res) {
    try {
        const id = req.body['id'];
        const title = req.body['title'];
        const content = req.body['content'];
        const coverImage = req.body['coverImage'];
        const icon = req.body['icon'];
        const isPublished = req.body['isPublished'];

        const userId = await getUserId(req.headers['authorization']);
        
        const existingDocument = await DocumentItem.findOne({ _id: id, userId: userId });

        if (!existingDocument) {
            throw new Error("Not found");
        }

        const document = await DocumentItem.findOneAndUpdate({ _id: id }, {$set: { title: title, content: content, coverImage: coverImage, icon: icon, isPublished: isPublished }});

        res.status(200).send(document);
        
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function archiveDocument(req, res) {
    try {
        const id = req.body['id'];

        const userId = await getUserId(req.headers['authorization']);

        const recursiveArchive = async (documentId) => {
            await DocumentItem.updateMany({ userId: userId, parentDocument: documentId }, {$set: { isArchived: true }});

            const children = await DocumentItem.find({ userId: userId, parentDocument: documentId });

            for (const child of children) {
                await recursiveArchive(child._id);
            }
        }

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$set: { isArchived: true }});

        recursiveArchive(document._id);
        
        res.status(200).send(document);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function getArchivedDocuments(req, res) {

    try {
        const search = req.params.search;

        const userId = await getUserId(req.headers['authorization']);
        
        let conditions = [];
        if (!!search) {
            conditions.push({ title: {$regex: `.*${search}.*` } });
        }
        conditions.push({ userId: userId });
        conditions.push({ isArchived: true });

        let finalCondition = conditions.length ? { $and: conditions } : {};

        // let documents = await DocumentItem.find({ userId: userId, isArchived: true });
        let documents = await DocumentItem.find(finalCondition);

        res.status(200).send(documents);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function restoreDocument(req, res) {
    try {
        const id = req.body['id'];

        const userId = await getUserId(req.headers['authorization']);

        let document = await DocumentItem.findOne({ _id: id, userId: userId });

        const recursiveRestore = async (documentId) => {
            const children = await DocumentItem.find({ parentDocument: documentId, userId: userId });

            for (const child of children) {
                await DocumentItem.updateOne({ _id: child._id }, {$set: { isArchived: false }});

                await recursiveRestore(child._id);
            }
        }

        if (document.parentDocument) {
            let parent = await DocumentItem.findOne({ _id: document.parentDocument });

            if (parent?.isArchived || parent == null) {
                await DocumentItem.updateOne({ _id: id }, {$unset: { parentDocument: "" } });
            }
        }

        let updatedDocument = await DocumentItem.findOneAndUpdate({ _id: id }, {$set: {isArchived: false}});

        recursiveRestore(id);
        
        res.status(200).send(updatedDocument);

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}

export async function removeDocument(req, res) {
    try {
        const id = req.params.id;

        const userId = await getUserId(req.headers['authorization']);

        let document = await DocumentItem.findOneAndDelete({ _id: id, userId: userId });

        res.status(200).send(document);

    } catch (err) {
        console.log(err);
        res.status(500),send(err);
    }
}

export async function getUserDocuments(req, res) {
    const userId = req.body['userId'];

    try {
        let userDocuments = await DocumentItem.find({ userId: userId }).exec();

        res.status(200).send(userDocuments);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
}

export async function searchDocuments(req, res) {
    try {
        const userId = await getUserId(req.headers['authorization']);

        let documents = await DocumentItem.find({ userId: userId, isArchived: false });

        res.status(200).send(documents);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function removeDocumentIcon(req, res) {
    try {
        const id = req.params.id;

        const userId = await getUserId(req.headers['authorization']);

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$unset: {icon: ""}});
        
        res.status(200).send(document);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function removeDocumentCoverImage(req, res) {
    try {
        const id = req.params.id;

        const userId = await getUserId(req.headers['authorization']);

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$unset: {coverImage: ""}});

        res.status(200).send(document);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}