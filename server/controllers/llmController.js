import axios from "axios";

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

export async function chat(req, res) {
    try {
        const messages = req.body['messages'];
        const file = req.body['file'];
        console.log(file);

        const newMessages = await axios.post('http://localhost:8000/chat', {messages: messages, file: file}, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            }
        }
        );

        console.log(newMessages.data);

        res.status(200).send(newMessages.data);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}