import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = 'http://localhost:5050';

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    },
    scenarios: {
        create_document_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createDocument'
        },
        get_documents_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'getDocuments'
        },
        create_and_get_document_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createDocumentAndGetDocument'
        },
        create_and_update_document_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createAndUpdateDocument'
        },
        create_and_archive_and_get_archived_documents_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createAndArchiveAndGetArchivedDocuments'
        },
        create_and_archive_and_search_archived_documents_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createArchiveAndSearchArchivedDocuments'
        },
        create_and_archive_and_restore_document_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createArchiveAndRestoreDocument'
        },
        create_and_archive_and_delete_document_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createArchiveAndDeleteDocument'
        },
        create_and_search_documents_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createAndSearchDocuments'
        },
        create_and_update_icon_and_remove_icon_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createUpdateIconAndRemoveIcon'
        },
        create_and_update_cover_image_and_remove_cover_image_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createUpdateCoverImageAndRemoveCoverImage'
        }
    }
};

export function setup() {
    let authorizationToken = '';
    let refreshToken = '';
    let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
    let email = `${name}@gmail.com`;
    let password = 'password';

    let registerRes = http.post(`${BASE_URL}/users/register`, JSON.stringify({
        name: name,
        email: email,
        password: password
    }), {
        headers: {
            "Content-Type": "application/json"
        }
    });

    let loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: email,
        password: password
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    authorizationToken = loginRes.headers['Authorization'];
    let setCookiesHeader = loginRes.headers['Set-Cookie'];
    if (setCookiesHeader) {
        let cookieMatch = setCookiesHeader.match(/refreshToken=([^;]+)/);
        if (cookieMatch) {
            refreshToken = cookieMatch[1];
        }
    }

    return {
        authorizationToken: authorizationToken,
        refreshToken: refreshToken,
        name: name,
        email: email,
        password: password
    }
}

export function teardown(data) {
    http.del(`${BASE_URL}/users`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': data.authorizationToken
        }
    });
}

export function createDocument(data) {
    group('Create Document', () => {
        const url = `${BASE_URL}/documents`;

        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        };

        let res = http.post(url, null, params);

        check(res, {
            'POST / status is 200': (r) => r.status === 200
        });
    });
}

export function getDocuments(data) {
    group('Get Documents', () => {
        const url = `${BASE_URL}/documents`;

        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        };

        let res = http.get(url, params);

        check(res, {
            'GET / status is 200': (r) => r.status === 200
        });
    });
}

export function createDocumentAndGetDocument(data) {
    group('Create Document and Get Single Document Details', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;
        
        const url = `${BASE_URL}/documents/document/${documentId}`;
        
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        };

        let res = http.get(url, params);

        check(res, {
            'GET /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is retrieved': (r) => JSON.parse(r.body)._id === documentId,
        });
    });
}

export function createAndUpdateDocument(data) {
    group('Create and Update Document', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const url = `${BASE_URL}/documents/document/${documentId}`;

        const payload = JSON.stringify({
            id: documentId,
            title: 'Updated Document',
            content: 'This is an updated document.'
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        };

        let res = http.put(url, payload, params);

        check(res, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Updated Document',
        });
    });
}

export function createAndArchiveAndGetArchivedDocuments(data) {
    group('Create, Archive and Get Archived Documents', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
            id: documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        })

        check(archiveDocumentRes, {
            'PUT /archive/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId,
            'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        });

        const getArchivedDocumentRes = http.get(`${BASE_URL}/documents/archived-documents`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(getArchivedDocumentRes, {
            'GET /archived-documents status is 200': (r) => r.status === 200,
            'Check archived documens are retrieved': (r) => JSON.parse(r.body).length > 0,
            'Check if archived documents contains the archived document': (r) => JSON.parse(r.body).filter(doc => doc._id === documentId).length > 0,
        });
    });
}

export function createArchiveAndSearchArchivedDocuments(data) {
    group('Create, Archive, and Search Archived Documents', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentRes, {
            'POST / status is 200': (r) => r.status === 200
        })
    });
}

export function createArchiveAndRestoreDocument(data) {
    group('Create, Archive, and Restore Document', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;


        const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
            id: documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(archiveDocumentRes, {
            'PUT /:id status is 200': (r) => r.status === 200,
            'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
            'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
        });

        const restoreDocumentRes = http.put(`${BASE_URL}/documents/archived-documents/${documentId}`, JSON.stringify({
            id: documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(restoreDocumentRes, {
            'PUT /archived-documents/:id status is 200': (r) => r.status === 200,
            'Check document is restored': (r) => JSON.parse(r.body).isArchived === false,
            'Check appropriate document is restored': (r) => JSON.parse(r.body)._id === documentId
        });
    });
}

export function createArchiveAndDeleteDocument(data) {
    group('Create, Archive, and Delete Document', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
            id: documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(archiveDocumentRes, {
            'PUT /:id status is 200': (r) => r.status === 200,
            'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
            'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
        });

        const deleteDocumentRes = http.del(`${BASE_URL}/documents/archived-documents/${documentId}`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(deleteDocumentRes, {
            'DELETE /archived-documents/:id status is 200': (r) => r.status === 200,
        });
    });
}

export function createAndSearchDocuments(data) {
    group('Create, and Search Documents', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const searchDocumentRes = http.get(`${BASE_URL}/documents/search`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(searchDocumentRes, {
            'GET /search status is 200': (r) => r.status === 200,
            'Check documents are retrieved': (r) => JSON.parse(r.body).length > 0,
            'Check if documents contains the created document': (r) => JSON.parse(r.body).filter(doc => doc._id === documentId).length > 0,
        });
    });
}

export function createUpdateIconAndRemoveIcon(data) {
    group('Create, Update Document Icon, and Remove Document Icon', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Document with Icon',
            icon: '😍'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Document with Icon',
            'Check updated document icon': (r) => JSON.parse(r.body).icon === '😍'
        });

        const removeDocumentIconRes = http.put(`${BASE_URL}/documents/remove-document-icon/${documentId}`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(removeDocumentIconRes, {
            'PUT /remove-document-icon/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check document icon is removed': (r) => JSON.parse(r.body).icon === '',
        });
    });
}

export function createUpdateCoverImageAndRemoveCoverImage(data) {
    group('Create, Update Document Cover Image, and Remove Document Cover Image', () => {
        const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        const updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Document with Cover Image',
            coverImage: 'https://files.edgestore.dev/z6g0ga6ejtnk778m/publicFiles/_public/1de31520-aece-422e-b68a-2ab86bb7b3d4.jpg'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Document with Cover Image',
            'Check updated document cover image': (r) => JSON.parse(r.body).coverImage !== null,
        });

        const removeDocumentIconRes = http.put(`${BASE_URL}/documents/remove-document-cover-image/${documentId}`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(removeDocumentIconRes, {
            'PUT /remove-document-cover-image/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check document cover image is removed': (r) => JSON.parse(r.body).coverImage === '',
        });
    });
}