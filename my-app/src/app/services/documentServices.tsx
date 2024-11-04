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

export async function getArchivedDocuments(search: string) {
    try {
        
        let url = search.length === 0 ? `${backendURL}/documents/archived-documents/` : `${backendURL}/documents/archived-documents/${search}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
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

export async function restoreDocument({id}: {id: string}) {
    try {

        const response = await fetch(`${backendURL}/documents/archived-documents/${id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
            body: JSON.stringify({ id: id })
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function removeDocument({id}: {id: string}) {
    try {

        const response = await fetch(`${backendURL}/documents/archived-documents/${id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
        });

        if (response.ok) {
            return response.json();
        }

    } catch (err) {
        console.log(err);
    }
}

export async function searchDocuments() {
    try {
        const response = await fetch(`${backendURL}/documents/search`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
        });

        if (response.ok) {
            return response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function getDocument(documentId: string) {
    try {
        const response = await fetch(`${backendURL}/documents/document/${documentId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || "",
            },
            credentials: 'include'
        });

        if (response.ok) {
            return await response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function updateDocument({_id, title, content, coverImage, icon, isPublished}: {_id?: string, title?: string, content?: string, coverImage?: string, icon?: string, isPublished?: boolean}) {
    try {
        const response = await fetch(`${backendURL}/documents/document/${_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
            body: JSON.stringify({ id: _id, title: title, content: content, coverImage: coverImage, icon: icon, isPublished: isPublished }),
        });

        if (response.ok) {
            response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function removeDocumentIcon({_id}: {_id: string}) {
    try {
        const response = await fetch(`${backendURL}/documents/remove-document-icon/${_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
        });

        if (response.ok) {
            response.json();
        }
    } catch (err) {
        console.log(err);
    }
}

export async function removeDocumentCoverImage({_id}: {_id: string}) {
    try {
        const response = await fetch(`${backendURL}/documents/remove-document-cover-image/${_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": localStorage.getItem("AuthorizationToken") || ""
            },
            credentials: 'include',
        });

        if (response.ok) {
            response.json();
        }
    } catch (err) {
        console.log(err);
    }
}