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

        console.log("Did it work ?");
        console.log(messages);

        res.status(200).send(messages);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
}