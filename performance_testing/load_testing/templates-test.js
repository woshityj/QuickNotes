import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = 'http://localhost:5050';

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    },
    scenarios: {
        create_template_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createTemplate'
        },
        create_and_get_templates_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createAndGetTemplates'
        },
        create_document_from_template_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s',
            preAllocatedVUs: 20,

            rate: 20,
            timeUnit: '1s',
            exec: 'createDocumentFromTemplate'
        }
    }
};

export function setup() {
    let authorizationToken = '';
    let refreshToken= '';
    let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
    let email = `${name}@gamil.com`;
    let password = 'password';

    let documentId = '';

    let registerRes = http.post(`${BASE_URL}/users/register`, JSON.stringify({
        name: name,
        email: email,
        password: password
    }), {
        headers: {
            'Content-Type': 'application/json',
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

    let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
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

    return {
        authorizationToken: authorizationToken,
        refreshToken: refreshToken,
        name: name,
        email: email,
        password: password,
        documentId: documentId
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

export function createTemplate(data) {
    group('Create Template', () => {
        const createTemplateRes = http.post(`${BASE_URL}/templates`, JSON.stringify({
            documentId: data.documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createTemplateRes, {
            'POST / status is 200': (r) => r.status === 200,
            'Check if template id is not empty': (r) => JSON.stringify(r.body)._id !== null,
            'Check created template title': (r) => JSON.parse(r.body).title === 'Test Template Document',
            'Check created template content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
        });
    });
}

export function createAndGetTemplates(data) {
    group('Create, and Get Templates', () => {
        const createTemplateRes = http.post(`${BASE_URL}/templates`, JSON.stringify({
            documentId: data.documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createTemplateRes, {
            'POST / status is 200': (r) => r.status === 200,
            'Check if template id is not empty': (r) => JSON.stringify(r.body)._id !== null,
            'Check created template title': (r) => JSON.parse(r.body).title === 'Test Template Document',
            'Check created template content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
        });

        let getTemplatesRes = http.get(`${BASE_URL}/templates`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(getTemplatesRes, {
            'GET / status is 200': (r) => r.status === 200,
        });
    });
}

export function createDocumentFromTemplate(data) {
    group('Create Document from Template', () => {
        let createTemplateRes = http.post(`${BASE_URL}/templates`, JSON.stringify({
            documentId: data.documentId
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createTemplateRes, {
            'POST / status is 200': (r) => r.status === 200,
            'Check if template id is not empty': (r) => JSON.stringify(r.body)._id !== null,
            'Check created template title': (r) => JSON.parse(r.body).title === 'Test Template Document',
            'Check created template content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
        });

        let templateId = JSON.parse(createTemplateRes.body)._id;

        let createDocumentFromTemplateRes = http.post(`${BASE_URL}/documents/create-document-from-template/${templateId}`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentFromTemplateRes, {
            'POST / status is 200': (r) => r.status === 200,
            'Check if document id is not empty': (r) => JSON.stringify(r.body)._id !== null,
            'Check created document title': (r) => JSON.parse(r.body).title === 'Test Template Document',
            'Check created document content': (r) => JSON.parse(r.body).content === 'Test Template Document Content'
        });
    });
}