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