import { backendURL } from "@/app/utils/constants";
import { convertToCoreMessages } from "ai";

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
        body: JSON.stringify({ messages: convertToCoreMessages(messages) }),
    });

    if (response.ok) {
        return Response.json(response);
    }
    return Response.error();
}