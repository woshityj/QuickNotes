import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = 'http://localhost:5050';

const testImage = open("../llm_files/test_image.jpg", "b");
const testVideo = open("../llm_files/test_video.mp4", "b");
const testPDF = open("../llm_files/test_pdf.pdf", "b");

export const options = {
    scenarios: {
        llm_scenario: {
            executor: 'constant-arrival-rate',
            duration: '600s',
            preAllocatedVUs: 2,

            rate: 4,
            timeUnit: '120s',
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

export default function (data) {
    group('Create, and Summarize Document', () => {
        let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentRes, {
            'POST /documents status is 200': (r) => r.status === 200
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        let updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Updated Document',
            content: `
            [
                {
                    "id": "dd2d0e74-e039-4423-a0b6-e0a4dc9c3f27",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [
                    {
                        "type": "text",
                        "text": "This is a test document",
                        "styles": {}
                    }
                    ],
                    "children": []
                },
                {
                    "id": "b74e38ca-ac89-46c2-9c8b-10f8fdc95de6",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [],
                    "children": []
                }
            ]`
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Updated Document',
        });

        let summarizeDocumentRes = http.post(`${BASE_URL}/llm/summarize`, JSON.stringify({
            content: JSON.parse(updateDocumentRes.body).content
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(summarizeDocumentRes, {
            'POST /summarize-fact-check status is 200': (r) => r.status === 200,
            'POST /summarize-fact-check response is not empty': (r) => JSON.parse(r.body).data !== null
        })
    });

    group('Create, and Elaborate Document', () => {
        let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentRes, {
            'POST /documents status is 200': (r) => r.status === 200
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        let updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Updated Document',
            content: `
            [
                {
                    "id": "dd2d0e74-e039-4423-a0b6-e0a4dc9c3f27",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [
                    {
                        "type": "text",
                        "text": "This is a test content",
                        "styles": {}
                    }
                    ],
                    "children": []
                },
                {
                    "id": "b74e38ca-ac89-46c2-9c8b-10f8fdc95de6",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [],
                    "children": []
                }
            ]`
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Updated Document',
        });

        let elaborateDocumentRes = http.post(`${BASE_URL}/llm/elaborate`, JSON.stringify({
            content: JSON.parse(updateDocumentRes.body).content
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(elaborateDocumentRes, {
            'POST /elaborate status is 200': (r) => r.status === 200,
            'POST /elaborate response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });

    group('Create, Summarize, and Fact Check Document', () => {
        let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentRes, {
            'POST /documents status is 200': (r) => r.status === 200
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        let updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Updated Document',
            content: `
            [
                {
                    "id": "dd2d0e74-e039-4423-a0b6-e0a4dc9c3f27",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [
                    {
                        "type": "text",
                        "text": "This is a test document",
                        "styles": {}
                    }
                    ],
                    "children": []
                },
                {
                    "id": "b74e38ca-ac89-46c2-9c8b-10f8fdc95de6",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [],
                    "children": []
                }
            ]`
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Updated Document',
        });

        let summarizeAndFactCheckDocumentRes = http.post(`${BASE_URL}/llm/summarize-fact-check`, JSON.stringify({
            content: JSON.parse(updateDocumentRes.body).content
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(summarizeAndFactCheckDocumentRes, {
            'POST /summarize-fact-check status is 200': (r) => r.status === 200,
            'POST /summarize-fact-check response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });

    group('Chat Question and Answer with RAG', () => {
        let chatQuestionAndAnswerWithRagRes = http.post(`${BASE_URL}/llm/question-answer-with-rag`, JSON.stringify({
            content: 'What is the capital of France ?'
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(chatQuestionAndAnswerWithRagRes, {
            'POST /question-answer-rag status is 200': (r) => r.status === 200,
            'POST /question-answer-rag response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });


    group('Chat Question And Answer with Notes RAG', () => {
        let createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(createDocumentRes, {
            'POST /documents status is 200': (r) => r.status === 200
        });

        let documentId = JSON.parse(createDocumentRes.body)._id;

        let updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
            id: documentId,
            title: 'Test Document With RAG',
            content: `
            [
                {
                    "id": "dd2d0e74-e039-4423-a0b6-e0a4dc9c3f27",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [
                    {
                        "type": "text",
                        "text": "My name is Yu Jie",
                        "styles": {}
                    }
                    ],
                    "children": []
                },
                {
                    "id": "b74e38ca-ac89-46c2-9c8b-10f8fdc95de6",
                    "type": "paragraph",
                    "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                    },
                    "content": [],
                    "children": []
                }
            ]`,
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(updateDocumentRes, {
            'PUT /document/:id status is 200': (r) => r.status === 200,
            'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
            'Check updated document title': (r) => JSON.parse(r.body).title === 'Test Document With RAG',
            'Check updated document content': (r) => JSON.parse(r.body).content !== '',
        });

        let chatQuestionAndAnswerWithNotesRagRes = http.post(`${BASE_URL}/llm/question-answer-with-notes`, JSON.stringify({
            question: 'What is my name ?',
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': data.authorizationToken
            }
        });

        check(chatQuestionAndAnswerWithNotesRagRes, {
            'POST /question-answer-with-notes status is 200': (r) => r.status === 200,
            'POST /question-answer-with-notes response is not empty': (r) => JSON.parse(r.body).data !== null
        });

    });

    group('Chat with LLM', () => {
        let chatRes = http.post(`${BASE_URL}/llm/chat`, {
            messages: JSON.stringify({
                role: 'user',
                content: 'Hello'
            })
        }, {
            headers: {
                'Authorization': data.authorizationToken
            }
        });

        check(chatRes, {
            'POST /chat status is 200': (r) => r.status === 200,
            'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
        })
    });

    group('Chat with LLM and Upload Picture', () => {
        let chatWithUploadPictureRes = http.post(`${BASE_URL}/llm/chat`, {
            file: http.file(testImage, 'test_image.jpg', 'image/jpg'),
            messages: JSON.stringify({
                role: 'user',
                content: 'What animal is this ?'
            })
        }, {
            headers: {
                'Authorization': data.authorizationToken
            }
        });

        check(chatWithUploadPictureRes, {
            'POST /chat status is 200': (r) => r.status === 200,
            'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });

    group('Chat with LLM and Upload PDF', () => {
        let chatWithUploadPdfRes = http.post(`${BASE_URL}/llm/chat`, {
            file: http.file(testPDF, 'test_pdf.pdf', 'application/pdf'),
            messages: JSON.stringify({
                role: 'user',
                content: 'What is this document about ?'
            })
        }, {
            headers: {
                'Authorization': data.authorizationToken
            }
        });

        check(chatWithUploadPdfRes, {
            'POST /chat status is 200': (r) => r.status === 200,
            'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });

    group('Chat with LLM and Upload Video', () => {
        let chatWithUploadVideoRes = http.post(`${BASE_URL}/llm/chat`, {
            file: http.file(testVideo, 'test_video.mp4', 'video/mp4'),
            messages: JSON.stringify({
                role: 'user',
                content: 'What is this video about ?'
            })
        }, {
            headers: {
                'Authorization': data.authorizationToken 
            }
        });

        check(chatWithUploadVideoRes, {
            'POST /chat status is 200': (r) => r.status === 200,
            'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
        });
    });
}