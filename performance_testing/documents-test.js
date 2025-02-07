import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:5050";

let authorizationToken = '';
let refreshToken = '';
let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
let email = `${name}@gmail.com`;
let password = 'password';

export default function () {
    // INIT Funnctions
    registerUser();
    loginUser();

    // Scenario Test Functions
    // testCreateDocument();
    // testArchiveDocument();
    testGetArchivedDocuments();

    // Tear Down Functions
    deleteUser();

    sleep(1);
}

// INIT Functions
function registerUser() {
    const url = `${BASE_URL}/users/register`;

    const payload = JSON.stringify({
        name: name,
        email: email,
        password: password 
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /register status is 200': (r) => r.status === 200
    });
}

function loginUser() {
    const url = `${BASE_URL}/users/login`;

    const payload = JSON.stringify({
        email: email,
        password: password
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const res = http.post(url, payload, params);

    check(res, {
        'POST /login status is 200': (r) => r.status === 200
    });

    authorizationToken = res.headers['Authorization'];
    let setCookiesHeader = res.headers['Set-Cookie'];
    if (setCookiesHeader) {
        let cookieMatch = setCookiesHeader.match(/refreshToken=([^;]+)/);
        if (cookieMatch) {
            refreshToken = cookieMatch[1];
        }
    }

    check(res, {
        'Check authorization token': () => authorizationToken !== '',
        'Check refresh token': () => refreshToken !== ''
    });
}

// Tear Down Functions
function deleteUser() {
    const url = `${BASE_URL}/users`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.del(url, null, params);

    check(res, {
        'DELETE / status is 200': (r) => r.status === 200
    })
}

// Scenario Test Functions
function testCreateDocument() {
    const url = `${BASE_URL}/documents`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'authorization': authorizationToken
        }
    };

    let res = http.post(url, null, params);

    check(res, {
        'POST / status is 200': (r) => r.status === 200
    });
}

function testGetDocuments() {
    const url = `${BASE_URL}/documents`;
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.get(url, params);

    check(res, {
        'GET / status is 200': (r) => r.status === 200
    });
}

function testGetDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null,
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;
    
    const url = `${BASE_URL}/documents/document/${documentId}`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.get(url, params);

    check(res, {
        'GET /documents/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is retrieved': (r) => JSON.parse(r.body)._id === documentId,
    });
}

function testUpdateDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
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
            'Authorization': authorizationToken
        }
    };

    let res = http.put(url, payload, params);

    check(res, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Updated Document',
    });
}

function testArchiveDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const archiveDocumentUrl = `${BASE_URL}/documents/${documentId}`;

    const payload = JSON.stringify({
        id: documentId
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let archiveDocumentRes = http.put(archiveDocumentUrl, payload, params);

    check(archiveDocumentRes, {
        'PUT /:id status is 200': (r) => r.status === 200,
        'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
    });
}

function testGetArchivedDocuments() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
        id: documentId
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(archiveDocumentRes, {
        'PUT /:id status is 200': (r) => r.status === 200,
        'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
    });

    const getArchivedDocumentsUrl = `${BASE_URL}/documents/archived-documents`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    const res = http.get(getArchivedDocumentsUrl, params);

    check(res, {
        'GET /archived-documents status is 200': (r) => r.status === 200,
        'Check archived documents are retrieved': (r) => JSON.parse(r.body).length > 0,
        'Check if archived documents contains the archived document': (r) => JSON.parse(r.body).filter(doc => doc._id === documentId).length > 0,
    });
}

function testSearchAndGetArchivedDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
        id: documentId
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(archiveDocumentRes, {
        'PUT /:id status is 200': (r) => r.status === 200,
        'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
    });

    const archivedDocumentTitle = JSON.parse(archiveDocumentRes.body).title;

    const searchAndGetArchivedDocumentUrl = `${BASE_URL}/documents/${archivedDocumentTitle}`;
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    const res = http.get(searchAndGetArchivedDocumentUrl, params);

    check(res, {
        'GET /archived-documents/:search status is 200': (r) => r.status === 200,
        'Check archived document is retrieved': (r) => JSON.parse(r.body).filter(doc => doc._id === documentId).length > 0,
    });
}

function testRestoreDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
        id: documentId
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(archiveDocumentRes, {
        'PUT /:id status is 200': (r) => r.status === 200,
        'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
    });

    const restoreDocumentUrl = `${BASE_URL}/documents/archived-documents/${documentId}`;

    const payload = JSON.stringify({
        id: documentId
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let restoreDocumentRes = http.put(restoreDocumentUrl, payload, params);

    check(restoreDocumentRes, {
        'PUT /archived-documents/:id status is 200': (r) => r.status === 200,
        'Check document is restored': (r) => JSON.parse(r.body).isArchived === false,
        'Check appropriate document is restored': (r) => JSON.parse(r.body)._id === documentId
    });
}

function testRemoveDocument() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    let archiveDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
        id: documentId
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(archiveDocumentRes, {
        'PUT /:id status is 200': (r) => r.status === 200,
        'Check document is archived': (r) => JSON.parse(r.body).isArchived === true,
        'Check appropriate document is archived': (r) => JSON.parse(r.body)._id === documentId
    });

    const removeDocumentUrl = `${BASE_URL}/documents/archived-documents/${documentId}`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let removeDocumentRes = http.del(removeDocumentUrl, null, params);

    check(removeDocumentRes, {
        'DELETE /archived-documents/:id status is 200': (r) => r.status === 200,
    });
}

function testSearchDocuments() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const searchDocumentUrl = `${BASE_URL}/documents/search`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let searchDocumentsRes = http.get(searchDocumentUrl, params);

    check(searchDocumentsRes, {
        'GET /search status is 200': (r) => r.status === 200,
        'Check documents are retrieved': (r) => JSON.parse(r.body).length > 0,
        'Check if documents contains the created document': (r) => JSON.parse(r.body).filter(doc => doc._id === documentId).length > 0,
    });
}

function testRemoveDocumentIcon() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
        id: documentId,
        title: 'Document with Icon',
        icon: '😍'
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(updateDocumentRes, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Document with icon',
        'Check updated document icon': (r) => JSON.parse(r.body).icon === '😍'
    });

    const removeDocumentIconUrl = `${BASE_URL}/documents/remove-document-icon/${documentId}`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let removeDocumentIconRes = http.put(removeDocumentIconUrl, null, params);

    check(removeDocumentIconRes, {
        'PUT /remove-document-icon/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check document icon is removed': (r) => JSON.parse(r.body).icon.length === 0,
    });
}

function testRemoveDocumentCoverImage() {
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': "application/json",
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST /documents status is 200': (r) => r.status === 200,
        'Check document is created': (r) => JSON.parse(r.body)._id !== null
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const updateDocumentRes = http.put(`${BASE_URL}/doucments/document/${documentId}`, JSON.stringify({
        id: documentId,
        title: 'Document with Cover Image',
        coverImage: 'https://files.edgestore.dev/z6g0ga6ejtnk778m/publicFiles/_public/1de31520-aece-422e-b68a-2ab86bb7b3d4.jpg'
    }));

    check(updateDocumentRes, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Document with Cover Image',
        'Check updated document cover image': (r) => JSON.parse(r.body).coverImage !== null,
    });

    let removeDocumentCoverImageUrl = `${BASE_URL}/documents/remove-document-cover-image/${documentId}`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let removeDocumentCoverImageRes = http.put(removeDocumentCoverImageUrl, null, params);

    check(removeDocumentCoverImageRes, {
        'PUT /remove-document-cover-image/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check document cover image is removed': (r) => JSON.parse(r.body).coverImage.length === 0,
    });
}