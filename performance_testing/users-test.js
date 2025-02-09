import http from "k6/http";
import { check, sleep } from "k6";

// export let options = {
//     vus: 10, // 10 virtual users
//     duration: '30s',
// };

let authorizationToken = '';
let refreshToken = '';
let name = `test_user${Math.random().toString(36).substring(2, 5)}`;
let email = `${name}@gmail.com`;
let password = 'password';


export const options = {
    scenarios: {
        register_secnario: {
            executor: 'shared-iterations',

            vus: 10,
            iterations: 10,
            exec: 'testRegister',
            maxDuration: '10s',
            gracefulStop: '0s',
        },
        
        login_scenario: {
            executor: 'shared-iterations',

            vus: 10,
            iterations: 10,
            exec: 'testLogin',
            maxDuration: '10s',
            gracefulStop: '0s',
            startTime: '10s',
        },

        get_user_scenario: {
            executor: 'shared-iterations',

            vus: 10,
            iterations: 10,
            exec: 'testGetUser',
            maxDuration: '10s',
            gracefulStop: '0s',
            startTime: '20s',
        },

        refresh_token_scenario: {
            executor: 'shared-iterations',

            vus: 10,
            iterations: 10,
            exec: 'testRefreshToken',
            maxDuration: '10s',
            gracefulStop: '0s',
            startTime: '30s',
        }
    }
};

const BASE_URL = "http://localhost:5050";

// export default function () {
//     testRegister();
//     testLogin();
//     testRefreshToken();
//     sleep(1); // Simulate users thinking time
// }

let cookies = {};

export function testLogin() {
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

    let res = http.post(url, payload, params);
    authorizationToken = res.headers['Authorization'];

    check(res, {
        'POST /login status is 200': (r) => r.status === 200
    });
}

export function testRegister() {
    const url =`${BASE_URL}/users/register`;
    
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

export function testRefreshToken() {
    const loginUrl = `${BASE_URL}/users/login`;
    const refreshUrl =`${BASE_URL}/users/refresh`;

    const loginPayload = JSON.stringify({
        email: email,
        password: password
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let loginRes = http.post(loginUrl, loginPayload, params);
    authorizationToken = loginRes.headers['Authorization'];

    let setCookiesHeader = loginRes.headers['Set-Cookie'];
    if (setCookiesHeader) {
        let cookieMatch = setCookiesHeader.match(/refreshToken=([^;]+)/);
        if (cookieMatch) {
            refreshToken = cookieMatch[1];
        }
    }

    let refreshRes = http.post(refreshUrl, null, {
        headers: {
            'Cookie': `refreshToken=${refreshToken}`
        }
    });

    check(refreshRes, {
        'POST /refresh status is 200': (r) => r.status === 200,
        'Check authorization token': (r) => r.headers['Authorization'] !== '',
        'Check refresh token': (r) => r.headers['Set-Cookie'] !== ''
    });
}

export function testGetUser() {
    const loginUrl = `${BASE_URL}/users/login`;
    const url =`${BASE_URL}/users`;

    const loginPayload = JSON.stringify({
        email: email,
        password: password
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    let loginRes = http.post(loginUrl, loginPayload, params);
    authorizationToken = loginRes.headers['Authorization'];

    let res = http.get(url, {
        headers: {
            'Authorization': authorizationToken
        }
    });

    check(res, {
        'GET /users status is 200': (r) => r.status === 200
    });
}