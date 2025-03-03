import { backendURL } from "../utils/constants";


export type Template = {
    _id: string,
    title: string,
    userId: string,
    content: string,
    coverImage: string,
    isPublic: boolean,
    createdBy: {
        name: string
    }
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

export async function updateTemplate(templateId: string, title?: string, content?: string, coverImage?: string, icon?: string, isPublic?: string, authorizationToken?: string) {
    try {
        const response = await fetch(`${backendURL}/templates/${templateId}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": authorizationToken || ""
            },
            body: JSON.stringify({
                title: title,
                content: content,
                coverImage: coverImage,
                icon: icon,
                isPublic: isPublic
            }),
            credentials: 'include'
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function updateTemplatePublicity({_id, isPublic, authorizationToken}: {_id: string, isPublic: boolean, authorizationToken?: string}) {
    try {
        const response = await fetch(`${backendURL}/templates/update-publicity/${_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Authorization": authorizationToken || ""
            },
            body: JSON.stringify({
                isPublic: isPublic
            }),
            credentials: 'include'
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function deleteTemplate({ _id, authorizationToken }: { _id: string, authorizationToken?: string}) {
    try {
        const response = await fetch(`${backendURL}/templates/${_id}`, {
            method: "DELETE",
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