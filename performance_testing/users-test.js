import http from "k6/http";
import { check, sleep } from "k6";

// export let options = {
//     vus: 10, // 10 virtual users
//     duration: '30s',
// };

const BASE_URL = "http://localhost:5050";

export default function () {
    testGetUser();
    sleep(1); // Simulate users thinking time
}

let cookies = {};

function testLogin() {
    const url = `${BASE_URL}/users/login`;
    
    const payload = JSON.stringify({
        email: 'testing12345@gmail.com',
        password: 'password'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let res = http.post(url, payload, params);

    check(res, {
        'POST /login status is 200': (r) => r.status === 200
    });
}

function testRegister() {
    const url =`${BASE_URL}/users/register`;

    let name = `test_user_${Math.random().toString(36).substring(2, 5)}`;
    let email = `${name}@gmail.com`;
    let password = 'password';
    
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

    check (res, {
        'POST /register status is 200': (r) => r.status === 200
    });
}

function testRefreshToken() {
    const loginUrl = `${BASE_URL}/users/login`;
    const refreshUrl =`${BASE_URL}/users/refresh`;

    const loginPayload = JSON.stringify({
        email: 'testing12345@gmail.com',
        password: 'password'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let loginRes = http.post(loginUrl, loginPayload, params);

    let setCookiesHeader = loginRes.headers['Set-Cookie'];
    if (setCookiesHeader) {
        let cookieMatch = setCookiesHeader.match(/refreshToken=([^;]+)/);
        if (cookieMatch) {
            cookies['refreshToken'] = cookieMatch[1];
        }
    }

    let refreshRes = http.post(refreshUrl, null, {
        headers: {
            'Cookie': `refreshToken=${cookies['refreshToken']}`
        }
    });

    check(refreshRes, {
        'POST /refresh status is 200': (r) => r.status === 200
    });
}

function testGetUser() {
    const loginUrl = `${BASE_URL}/users/login`;
    const url =`${BASE_URL}/users`;

    const loginPayload = JSON.stringify({
        email: 'testing12345@gmail.com',
        password: 'password'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let loginRes = http.post(loginUrl, loginPayload, params);
    let authorizationToken = loginRes.headers['Authorization'];

    let res = http.get(url, {
        headers: {
            'Authorization': authorizationToken
        }
    });

    check(res, {
        'GET /users status is 200': (r) => r.status === 200
    });
}