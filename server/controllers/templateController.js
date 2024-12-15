import TemplateItem from "../models/template.model.js";
import { getUserId } from "./userController.js";

export async function createTemplate(req, res) {
    try {
        const title = req.body['title'];
        const content = req.body['content'];
        
        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);

            if (!userId) {
                return res.status(401).send("Unauthorized");
            }

            let template = new TemplateItem({ title: title, userId: userId, content: content });

            await template.save();

            return res.status(200).send(template);
        }

        res.status(401).send("Unauthorized");

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function getTemplates(req, res) {
    try {
        if (req.headers['authorization']) {
            const userId = await getUserId(req.headers['authorization']);

            let templates = await TemplateItem.find({});

            return res.status(200).send(templates);
        }

        res.status(401).send("Unauthorized");
    } catch (err) {
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