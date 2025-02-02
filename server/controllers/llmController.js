import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { getUserId } from "./userController.js";
import DocumentItem from "../models/document.model.js";

// const llmAPIEndpoint = process.env.llmAPIEndpoint || "http://localhost:8000/";
const llmAPIEndpoint = "http://localhost:8000/";

export async function summarizeDocument(req, res) {
    try {
        const content = req.body['content'];
        
        const summarizedContent = await axios.post(`${llmAPIEndpoint}summarize`, {content: content});

        res.status(200).send(summarizedContent.data);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function elaborateDocument(req, res) {
    try {
        const content = req.body['content'];

        const elaboratedContent = await axios.post(`${llmAPIEndpoint}elaborate`, {content: content});

        res.status(200).send(elaboratedContent.data);
        
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function chat(req, res) {
    try {
        const file = req.file
        const formData = new FormData();
        
        formData.append('messages', req.body.messages);

        if (file !== undefined) {
            console.log(file);
            const fileStream = fs.createReadStream(file.path);
            formData.append('file', fileStream, {
                filename: file.originalname,
                contentType: file.mimetype
            });
        }

        const newMessages = await axios.post(`${llmAPIEndpoint}chat`, formData, {
            headers: {
                ...formData.getHeaders()
            },
        }
        );

        if (req.file?.path) {
            fs.unlinkSync(file.path);
        }

        // console.log(newMessages.data);

        res.status(200).send(newMessages.data);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}

export async function summarizeDocumentWithFactCheck(req, res) {
    try {
        const content = req.body['content'];

        const summarizedContentWithFactCheck = await axios.post(`${llmAPIEndpoint}summarize-fact-check`, {content: content});

        res.status(200).send(summarizedContentWithFactCheck.data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function questionAnswerWithRag(req, res) {
    try {
        const question = req.body['content'];

        const answer = await axios.post(`${llmAPIEndpoint}question-answer-with-rag`, {content: question});

        res.status(200).send(answer.data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function questionAnswerWithNotes(req, res) {

    if (!req.headers['authorization']) {
        return res.status(401).send("Unauthorized User");
    }

    const userId = await getUserId(req.headers['authorization']);

    let documents = await DocumentItem.find({ userId: userId, isArchived: false });
    documents = JSON.parse(JSON.stringify(documents));

    let documentsContent = documents.map(document => extractTextContent(document));
    
    try {

        const question = req.body['question'];

        const answer = await axios.post(`${llmAPIEndpoint}question-answer-with-notes`, {question: question, notes: documentsContent});
        
        return res.status(200).send(answer.data);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Server Error');
    }
}

function extractTextContent(nodes) {

    if (!nodes.content) {
        return "";
    }
    nodes = JSON.parse(nodes.content);

    let texts = [];
    
    console.log(nodes);

    nodes.forEach(node => {
        if (node.content) {
            console.log(node.content);
            console.log("\n");
            if (Array.isArray(node.content)) {
                node.content.forEach(contentItem => {
                    if (contentItem.type === "text" && contentItem.text) {
                        texts.push(contentItem.text);
                    }
                });
            }
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
            texts.push(extractTextContent(node.children));
        }
    });

    return texts.join("\n");
}