import { backendURL } from "../utils/constants";


export type Template = {
    _id: string,
    title: string,
    userId: string,
    content: string,
    isPublic: boolean
}

export async function createTemplate({title, content}: {title: string, content: string}) {
    try {
        const response = await fetch(`${backendURL}/templates/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            body: JSON.stringify({title: title, content: content}),
            credentials: 'include'
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}

export async function getTemplates() {
    try {
        const response = await fetch(`${backendURL}/templates`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include'
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}