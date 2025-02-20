import DocumentItem from "../models/document.model.js";
import { getTemplate } from "./templateController.js";
import { getUserId } from "./userController.js";

import axios from "axios";
import mongoose from "mongoose";

// const llmAPIEndpoint = process.env.LLM_API_ENDPOINT || "http://localhost:8000/";
const llmAPIEndpoint = "http://localhost:8000/";

export async function createDocument(req, res) {
    try {
        const parentDocument = req.body['parentDocument'];

        const userId = await getUserId(req.headers['authorization']);

        let document = new DocumentItem({ userId: userId, parentDocument: parentDocument, lastEditedBy: userId });
        
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
            .populate("lastEditedBy", "name")
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

        let document = await DocumentItem.findOne({ _id: id }).populate("lastEditedBy", "name");

        // Document is published and not archived (Document is public)
        if (document.isPublished && !document.isArchived) {
            return res.status(200).send(document);
        }

        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);

            if (!userId) {
                return res.status(401).send("Unauthorized");
            }
        } else {
            return res.status(401).send("Unauthorized");
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

        if (!req.headers['authorization']) {
            return res.status(401).send("Unauthorized User");
        }

        const userId = await getUserId(req.headers['authorization']);

        if (!userId) {
            return res.status(401).send("Unauthorized User");
        }
        
        // const existingDocument = await DocumentItem.findOne({ _id: id, userId: userId }).populate("lastEditedBy", "name");

        const document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$set: { title: title, content: content, coverImage: coverImage, icon: icon, isPublished: isPublished, lastEditedBy: userId }}, { new: true }).populate("lastEditedBy", "name");

        if (!document) {
            return res.status(404).send("Document Not Found");
        }

        return res.status(200).send(document);

        // if (req.headers['authorization']) {
        //     const userId = await getUserId(req.headers['authorization']);

        //     if (!userId) {
        //         return res.status(401).send("Unauthorized");
        //     }

        //     const existingDocument = await DocumentItem.findOne({ _id: id, userId: userId }).populate("lastEditedBy", "name");

        //     if (!existingDocument) {
        //         throw new Error("Not found");
        //     }
    
        // } else {
        //     return res.status(401).send("Unauthorized");
        // }
        
        // const document = await DocumentItem.findOneAndUpdate({ _id: id }, {$set: { title: title, content: content, coverImage: coverImage, icon: icon, isPublished: isPublished, lastEditedBy: userId }}).populate("lastEditedBy", "name");

        // res.status(200).send(document);
        
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
            await DocumentItem.updateMany({ userId: userId, parentDocument: documentId }, {$set: { isArchived: true, lastEditedBy: userId }}, { new: true });

            const children = await DocumentItem.find({ userId: userId, parentDocument: documentId });

            for (const child of children) {
                await recursiveArchive(child._id);
            }
        }

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$set: { isArchived: true, lastEditedBy: userId }}, { new : true }).populate("lastEditedBy", "name");

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
        let documents = await DocumentItem.find(finalCondition).populate("lastEditedBy", "name");

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
                await DocumentItem.updateOne({ _id: child._id }, {$set: { isArchived: false, lastEditedBy: userId }});

                await recursiveRestore(child._id);
            }
        }

        if (document.parentDocument) {
            let parent = await DocumentItem.findOne({ _id: document.parentDocument });

            if (parent?.isArchived || parent == null) {
                await DocumentItem.updateOne({ _id: id }, {$unset: { parentDocument: "", lastEditedBy: userId } });
            }
        }

        let updatedDocument = await DocumentItem.findOneAndUpdate({ _id: id }, {$set: {isArchived: false, lastEditedBy: userId}}, { new: true }).populate("lastEditedBy", "name");

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
        let userDocuments = await DocumentItem.find({ userId: userId }).populate("lastEditedBy", "name").exec();

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

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$set: {icon: "", lastEditedBy: userId}}, { new: true }).populate("lastEditedBy", "name");
        
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

        let document = await DocumentItem.findOneAndUpdate({ _id: id, userId: userId }, {$set: {coverImage: "", lastEditedBy: userId}}, { new: true }).populate("lastEditedBy", "name");

        res.status(200).send(document);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function createDocumentFromTemplate(req, res) {
    try {
        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);

            const templateId = req.params.id;

            let template = await getTemplate(templateId);
    
            let document = new DocumentItem({ title: template.title, userId: userId, content: template.content, coverImage: template.coverImage, icon: template.icon, lastEditedBy: userId });

            await document.save();

            return res.status(200).send(document);
        }

        res.status(401).send("Unauthorized");

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

// export async function getDocumentsInMarkdown(req, res) {

//     if (!req.headers['authorization']) {
//         return res.status(401).send("Unauthorized User");
//     }

//     const userId = await getUserId(req.headers['authorization']);

//     let documents = await DocumentItem.find({ userId: userId, isArchived: false });
//     documents = JSON.parse(JSON.stringify(documents));

//     let documentsContent = documents.map(document => extractTextContent(document));

//     try {
//         const question = req.body['question'];

//         const answer = await axios.post(`${llmAPIEndpoint}question-answer-with-notes`, {question: question, notes: documentsContent});

//         return res.status(200).send(answer.data);

//     } catch (err) {
//         return res.status(500).send("Server Error");
//     }
// }

// function extractTextContent(nodes) {

//     if (!nodes.content) {
//         return "";
//     }
//     nodes = JSON.parse(nodes.content);

//     let texts = [];
    
//     console.log(nodes);

//     nodes.forEach(node => {
//         if (node.content) {
//             console.log(node.content);
//             console.log("\n");
//             if (Array.isArray(node.content)) {
//                 node.content.forEach(contentItem => {
//                     if (contentItem.type === "text" && contentItem.text) {
//                         texts.push(contentItem.text);
//                     }
//                 });
//             }
//         }

//         if (Array.isArray(node.children) && node.children.length > 0) {
//             texts.push(extractTextContent(node.children));
//         }
//     });

//     return texts.join("\n");
// }