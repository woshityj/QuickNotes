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

export default function () {
    // INIT Functions
    registerUser();
    loginUser();

    // Scenario Test Functions
    // testChatUploadPDF();
    // testChatUploadVideo();
    // testElaborateDocument();

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

function testSummarizeDocument() {
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

function testSummarizeFactCheck() {
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

function testQuestionAnswerWithRag() {
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

function testQuestionAnswerWithNotes() {
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

    const updateDocumentRes = http.put(`${BASE_URL}/documents/${documentId}`, JSON.stringify({
        id: documentId,
        title: 'Test Document With RAG',
        content: 'My name is Yu Jie',
    }));

    check(updateDocumentRes, {
        'PUT /document/:id status is 200': (r) => r.status === 200,
        'Check appropriate document is updated': (r) => JSON.parse(r.body)._id === documentId,
        'Check updated document title': (r) => JSON.parse(r.body).title === 'Test Document with RAG',
        'Check updated document content': (r) => JSON.parse(r.body).content === 'My name is Yu Jie'
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

function testChat() {
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

function testChatUploadPicture() {
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

function testChatUploadPDF() {
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

function testChatUploadVideo() {
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

function testElaborateDocument() {
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