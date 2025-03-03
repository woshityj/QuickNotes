import DocumentItem from "../models/document.model.js";
import TemplateItem from "../models/template.model.js";
import { getUserId } from "./userController.js";

export async function createTemplate(req, res) {
    try {
        const documentId = req.body['documentId'];
        console.log(documentId);
        
        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);

            if (!userId) {
                return res.status(401).send("Unauthorized");
            }

            const document = await DocumentItem.findOne({ _id: documentId, userId: userId }).populate("lastEditedBy", "name");

            if (!document) {
                return res.status(401).send("Document not found");
            }

            let template = new TemplateItem({ title: document.title, userId: userId, content: document.content, coverImage: document.coverImage, icon: document.icon, isPublic: true, createdBy: userId });

            await template.save();

            return res.status(200).send(template);
        }

        return res.status(401).send("Unauthorized");

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function getTemplates(req, res) {
    try {
        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);
            
            let templates = await TemplateItem.find({ $or: [{ isPublic: true }, { userId: userId }] }).sort({ title: 1 }).populate("createdBy", "name");

            return res.status(200).send(templates);
        }

        res.status(401).send("Unauthorized");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function updateTemplate(req, res) {
    try {
        const templateId = req.params.id;
        const title = req.body['title'];
        const content = req.body['content'];
        const coverImage = req.body['coverImage'];
        const icon = req.body['icon'];
        const isPublic = req.body['isPublic'];

        const userId = await getUserId(req.headers['authorization']);

        if (!userId) {
            return res.status(401).send("Unauthorized");
        }

        const template = await TemplateItem.findByIdAndUpdate({ _id: templateId, userId: userId}, { $set: { title: title, content: content, coverImage: coverImage, icon: icon, isPublic: isPublic } });

        if (!template) {
            return res.status(404).send("Template Not Found");
        }

        return res.status(200).send(template);

    } catch {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function deleteTemplate(req, res) {
    try {
        const templateId = req.params.id;

        const userId = await getUserId(req.headers['authorization']);

        if (!userId) {
            return res.status(401).send("Unauthorized");
        }

        const template = await TemplateItem.findByIdAndDelete({ _id: templateId, userId: userId });;

        if (!template) {
            return res.status(404).send("Template Not Found");
        }

        return res.status(200).send(template);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function updateTemplatePublicity(req, res) {
    try {
        const templateId = req.params.id;
        const isPublic = req.body['isPublic'];

        const userId = await getUserId(req.headers['authorization']);

        if (!userId) {
            return res.status(401).send("Unauthorized");
        }

        const template = await TemplateItem.findByIdAndUpdate({ _id: templateId, userId: userId}, { $set: { isPublic: isPublic } });

        if (!template) {
            return res.status(404).send("Template Not Found");
        }

        return res.status(200).send(template);

    } catch {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

// export async function getTemplate(req, res) {
//     try {
//         if (req.headers['authorization']) {
//             const templateId = req.params.id;
//             const userId = await getUserId(req.headers['authorization']);

//             let template = await TemplateItem.findOne({ _id: templateId });

//             if (template.isPubic) {
//                 return res.status(200).send(template);
//             }
//         }
//         res.status(401).send("Unauthorized");

//     } catch (err) {
//         console.log(err);
//         res.status(500).send("Server Error");
//     }
// }

export async function getTemplate(templateId) {
    try {
        let template = await TemplateItem.findOne({ _id: templateId });

        return template;
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}