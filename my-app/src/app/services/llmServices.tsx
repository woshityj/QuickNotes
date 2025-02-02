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

export async function elaborateText({content}: {content: string}) {
    try {
        const response = await fetch(`${backendURL}/llm/elaborate`, {
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

export async function summarizeContentWithFactCheck({content}: {content: string}) {
    try {
        const response = await fetch(`${backendURL}/llm/summarize-fact-check`, {
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

export async function questionAnswerWithRag({content}: {content: string}) {
    try {
        const response = await fetch(`${backendURL}/llm/question-answer-with-rag`, {
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

export async function questionAnswerWithNotes({content, authorizationToken}: {content: string, authorizationToken?: string}) {
    try {
        const response = await fetch(`${backendURL}/llm/question-answer-with-notes`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": authorizationToken || "",
            },
            body: JSON.stringify({ question: content }),
            credentials: 'include',
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}