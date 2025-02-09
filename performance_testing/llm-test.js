import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:5050';

let authorizationToken = '';
let refreshToken = '';
let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
let email = `${name}@gmail.com`;
let password = 'password';

const testImage = open("./llm_files/test_image.jpg", "b");
const testVideo = open("./llm_files/test_video.mp4", "b");
const testPDF = open("./llm_files/test_pdf.pdf", "b");

export const options = {
    scenarios: {
        // Setup Scenarios
        register_setup: {
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

        // Test Scenarios
        summarize_document_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testSummarizeDocument',
            maxDuration: '30s',
            startTime: '4s',
            gracefulStop: '0s'
        },

        summarize_fact_check_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testSummarizeFactCheck',
            maxDuration: '120s',
            startTime: '34s',
            gracefulStop: '0s'
        },

        question_answer_with_rag_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testQuestionAnswerWithRag',
            maxDuration: '30s',
            startTime: '154s',
            gracefulStop: '0s'
        },

        question_answer_with_notes_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testQuestionAnswerWithNotes',
            maxDuration: '30s',
            startTime: '184s',
            gracefulStop: '0s'
        },

        chat_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testChat',
            maxDuration: '30s',
            startTime: '214s',
            gracefulStop: '0s'
        },

        chat_upload_picture_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testChatUploadPicture',
            maxDuration: '30s',
            startTime: '244s',
            gracefulStop: '0s'
        },

        chat_upload_pdf_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testChatUploadPDF',
            maxDuration: '30s',
            startTime: '274s',
            gracefulStop: '0s'
        },

        chat_upload_video_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testChatUploadVideo',
            maxDuration: '30s',
            startTime: '304s',
            gracefulStop: '0s'
        },

        elaborate_document_scenario: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'testElaborateDocument',
            maxDuration: '30s',
            startTime: '334s',
            gracefulStop: '0s'
        },

        // Tear Down Scenarios
        delete_user_setup: {
            executor: 'shared-iterations',

            vus: 1,
            iterations: 1,
            exec: 'deleteUser',
            maxDuration: '2s',
            startTime: '364s',
            gracefulStop: '0s'
        }
    }
}

// export default function () {
//     // INIT Functions
//     registerUser();
//     loginUser();

//     // Scenario Test Functions
//     // testChatUploadPDF();
//     // testChatUploadVideo();
//     // testElaborateDocument();

//     // Tear Down Functions
//     deleteUser();
//     sleep(1);
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

export function testSummarizeDocument() {
    const url = `${BASE_URL}/llm/summarize`;

    const payload = JSON.stringify({
        'content': 'This is a test content'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /summarize status is 200': (r) => r.status === 200,
        'POST /summarize response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testSummarizeFactCheck() {
    const url = `${BASE_URL}/llm/summarize-fact-check`;

    const payload = JSON.stringify({
        content: 'This is a test content'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /summarize-fact-check status is 200': (r) => r.status === 200,
        'POST /summarize-fact-check response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testQuestionAnswerWithRag() {
    const url = `${BASE_URL}/llm/question-answer-with-rag`;

    const payload = JSON.stringify({
        content: 'What is a dog ?'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /question-answer-rag status is 200': (r) => r.status === 200,
        'POST /question-answer-rag response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testQuestionAnswerWithNotes() {
    // Create document with specific content
    const createDocumentRes = http.post(`${BASE_URL}/documents`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    check(createDocumentRes, {
        'POST / status is 200': (r) => r.status === 200
    });

    let documentId = JSON.parse(createDocumentRes.body)._id;

    const updateDocumentRes = http.put(`${BASE_URL}/documents/document/${documentId}`, JSON.stringify({
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
            'Authorization': authorizationToken
        }
    });

    check(updateDocumentRes, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Test Document With RAG',
        'Check updated document content': (r) => JSON.parse(r.body).content !== '',
    });

    const url = `${BASE_URL}/llm/question-answer-with-notes`;

    const payload = JSON.stringify({
        question: 'What is my name?',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /question-answer-with-notes status is 200': (r) => r.status === 200,
        'POST /question-answer-with-notes response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testChat() {
    const url = `${BASE_URL}/llm/chat`;

    const payload = {
        messages: JSON.stringify({
            role: 'user',
            content: 'Hello'
        }),
    };

    const params = {
        headers: {
            'Authorization': authorizationToken
        }
    }

    let res = http.post(url, payload, params);

    check(res, {
        'POST /chat status is 200': (r) => r.status === 200,
        'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
    })
}

export function testChatUploadPicture() {
    const url = `${BASE_URL}/llm/chat`;

    let formData = {
        file: http.file(testImage, 'test_image.jpg', 'image/jpg'),
        messages: JSON.stringify({
            role: 'user',
            content: 'What animal is this ?'
        })
    };

    const params = {
        headers: {
            'Authorization': authorizationToken,
        }
    }

    let res = http.post(url, formData, params);

    check(res, {
        'POST /chat status is 200': (r) => r.status === 200,
        'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testChatUploadPDF() {
    const url = `${BASE_URL}/llm/chat`;

    let formData = {
        file: http.file(testPDF, 'test_pdf.pdf', 'application/pdf'),
        messages: JSON.stringify({
            role: 'user',
            content: 'What is this document about ?'
        })
    };

    const params = {
        headers: {
            'Authorization': authorizationToken,
        }
    };

    let res = http.post(url, formData, params);

    check(res, {
        'POST /chat status is 200': (r) => r.status === 200,
        'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testChatUploadVideo() {
    const url = `${BASE_URL}/llm/chat`;

    let formData = {
        file: http.file(testVideo, 'test_video.mp4', 'video/mp4'),
        messages: JSON.stringify({
            role: 'user',
            content: 'What is this video about ?'
        })
    };

    const params = {
        headers: {
            'Authorization': authorizationToken,
        }
    };

    let res = http.post(url, formData, params);

    check(res, {
        'POST /chat status is 200': (r) => r.status === 200,
        'POST /chat response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}

export function testElaborateDocument() {
    const url = `${BASE_URL}/llm/elaborate`;

    const payload = JSON.stringify({
        content: 'This is a test content'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /elaborate status is 200': (r) => r.status === 200,
        'POST /elaborate response is not empty': (r) => JSON.parse(r.body).data !== null
    });
}