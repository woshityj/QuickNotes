import { toast } from "sonner";
import { backendURL } from "../utils/constants";

export type Document = {
    _id: string,
    title: string,
    userId: string,
    isArchived: boolean,
    parentDocument: string,
    content: string,
    coverImage: string,
    icon: string,
    isPublished: boolean
};

export async function createDocument({parentDocumentId}: {parentDocumentId?: string}) {
	try {
		const response = await fetch(`${backendURL}/documents/`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"Authorization": localStorage.getItem("AuthorizationToken") || "",
			},
            body: JSON.stringify({ parentDocument: parentDocumentId }),
			credentials: 'include',
		});

		if (response.ok) {
			return response.json();
		}

	} catch (err) {
		console.log(err);
	}
}

export async function getDocuments(parentDocumentId?: string) {
    try {
        let url = parentDocumentId !== undefined ? `${backendURL}/documents/${parentDocumentId}` : `${backendURL}/documents/` 

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || "",
            },
            credentials: 'include',
        });

        if (response.ok) {
            // setDocuments(await response.json());
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function archiveDocument({id}: {id: string}) {
    try {
        
        const response = await fetch(`${backendURL}/documents/${id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
            body: JSON.stringify({ id: id }),
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}