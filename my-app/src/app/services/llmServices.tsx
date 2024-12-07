import { backendURL } from "../utils/constants";

export async function summarizeContent({content}: {content: string}) {
    try {
        const response = await fetch(`${backendURL}/llm/summarize`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("AuthorizationToken") || "",
            },
            body: JSON.stringify({ content }),
            credentials: 'include',
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}