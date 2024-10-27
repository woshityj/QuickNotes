import DocumentItem from "../models/document.model.js";
import { getUserId } from "./userController.js";

export async function createDocument(req, res) {
    try {
        const userId = await getUserId(req.headers['authorization']);

        let document = new DocumentItem({ userId: userId });
        
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