import { backendURL } from "@/app/utils/constants";
import { createDataStreamResponse } from "ai";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
//     if (req.method === "POST") {
//         console.log("Test");
//         try {
//             const response = await fetch(`${backendURL}/llm/chat`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 }
//             });

//             res.status(200).json(response);
//         } catch (error) {
//             console.log("Error in chat API route: ", error);
//             res.status(500).json({ error: 'Failed to generate response' });
//         }
//     } else {
//         res.setHeader('Allow', ['POST']);
//         res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
// }

export async function POST(req: Request) {
    const { messages } = await req.json();

    const response = await fetch(`${backendURL}/llm/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messages }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let data = '';
    if (reader) {
        const stream = new ReadableStream({
            async start(controller) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    data += decoder.decode(value, { stream: true });
                    controller.enqueue(value);
                }
                controller.close();
            }
        });
        await new Response(stream).text();
    }
    
    console.log(data);

    return new Response(data);

    // const newAssistantMessage = {
    //     id: Date.now().toString(),
    //     role: "assistant",
    //     content: data.content || data.message || JSON.stringify(data)
    // };

    // return Response.json(newAssistantMessage)


    if (response.ok) {
        return Response.json({data});
    }

    return Response.error();
}