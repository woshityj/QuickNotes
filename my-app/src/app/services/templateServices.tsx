import { backendURL } from "../utils/constants";


export type Template = {
    _id: string,
    title: string,
    userId: string,
    content: string,
    coverImage: string,
    isPublic: boolean
}

export async function createTemplate({documentId, authorizationToken}: {documentId: string, authorizationToken?: string}) {
    try {
        const response = await fetch(`${backendURL}/templates/`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": authorizationToken || ""
            },
            body: JSON.stringify({documentId: documentId}),
            credentials: 'include'
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}

export async function getTemplates(authorizationToken?: string) {
    try {
        const response = await fetch(`${backendURL}/templates`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": authorizationToken || ""
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