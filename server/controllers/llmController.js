import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

export async function summarizeDocument(req, res) {
    try {
        const content = req.body['content'];
        
        const summarizedContent = await axios.post('http://localhost:8000/summarize', {content: content});

        res.status(200).send(summarizedContent.data);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function elaborateDocument(req, res) {
    try {
        const content = req.body['content'];

        const elaboratedContent = await axios.post('http://localhost:8000/elaborate', {content: content});

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

        const newMessages = await axios.post('http://127.0.0.1:8000/chat', formData, {
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

        const summarizedContentWithFactCheck = await axios.post('http://localhost:8000/summarize-fact-check', {content: content});

        res.status(200).send(summarizedContentWithFactCheck.data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}

export async function questionAnswerWithRag(req, res) {
    try {
        const question = req.body['content'];

        const answer = await axios.post('http://127.0.0.1:8000/question-answer-with-rag', {content: question});

        res.status(200).send(answer.data);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
}