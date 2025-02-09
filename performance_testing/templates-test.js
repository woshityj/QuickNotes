import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:5050';

let authorizationToken = '';
let refreshToken = '';
let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
let email = `${name}@gmail.com`;
let password = 'password';

let documentId = '';

export const options = {
    scenarios: {
        // Setup Scenarios
        register: {
            executor: 'shared-iterations',
            
            vus: 1,
            iterations: 1,
            exec: 'registerUser',
            maxDuration: '2s',
            gracefulStop: '0s',
        },
        
        login_setup: {
            executor: 'shared-iterations',
            
            vus: 1,
            iterations: 1,
            exec: 'loginUser',
            maxDuration: '2s',
            startTime: '2s',
            gracefulStop: '0s',
        },

        create_document_setup: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'createDocument',
            maxDuration: '2s',
            startTime: '4s',
            gracefulStop: '0s'
        },

        // Scenario Tests
        create_template_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testCreateTemplate',
            maxDuration: '2s',
            startTime: '6s',
            gracefulStop: '0s'
        },

        get_templates_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testGetTemplates',
            maxDuration: '2s',
            startTime: '8s',
            gracefulStop: '0s'
        },

        create_document_from_template_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testCreateDocumentFromTemplate',
            maxDuration: '2s',
            startTime: '10s',
            gracefulStop: '0s'
        },

        // Tear Down Scenarios
        delete_user_setup: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'deleteUser',
            startTime: '12s',
            maxDuration: '2s',
            gracefulStop: '0s'
        }
    }
}

// export default function () {
//     // INIT Functions
//     registerUser();
//     loginUser();
//     createDocument();

//     // Scenario Test Functions
//     testCreateTemplate();
//     testGetTemplates();
//     testCreateDocumentFromTemplate();

//     // Tear Down Functions
//     deleteUser();
// }

// INIT Functions
export function registerUser() {
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

export function loginUser() {
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

export function createDocument() {

    let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST / status is 200': (r) => r.status === 200
    });

    documentId = JSON.parse(createDocumentRes.body)._id;

    let updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
        id: documentId,
        title: 'Test Template Document',
        content: 'Test Template Document Content'
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(updateDocumentRes, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Test Template Document',
        'Check updated document content': (r) => JSON.parse(r.body).content === 'Test Template Document Content',
    });
}

// Tear Down Functions
export function deleteUser() {
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

export function testCreateTemplate() {
    const url = `${BASE_URL}/templates`;

    const payload = JSON.stringify({
        documentId: documentId
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST / status is 200': (r) => r.status === 200,
        'Check created template title': (r) => JSON.parse(r.body).title === 'Test Template Document',
        'Check created template content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
    });
}

export function testGetTemplates() {
    const url = `${BASE_URL}/templates`;

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

export function testCreateDocumentFromTemplate() {
    let createTemplateRes = http.post(`${BASE_URL}/templates`, JSON.stringify({
        documentId: documentId
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    let templateId = JSON.parse(createTemplateRes.body)._id;

    check(createTemplateRes, {
        'POST / status is 200': (r) => r.status === 200,
        'Check if template id is not empty': (r) => JSON.stringify(r.body)._id !== null,
        'Check created template title': (r) => JSON.parse(r.body).title === 'Test Template Document',
        'Check created template content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
    });

    const url = `${BASE_URL}/documents/create-document-from-template/${templateId}`;

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, null, params);

    check(res, {
        'POST / status is 200': (r) => r.status === 200,
        'Check if document id is not empty': (r) => JSON.stringify(r.body)._id !== null,
        'Check created document title': (r) => JSON.parse(r.body).title === 'Test Template Document',
        'Check created document content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
    });
}