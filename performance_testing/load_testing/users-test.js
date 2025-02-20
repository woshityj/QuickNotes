import http from "k6/http";
import { check, group } from "k6";

const BASE_URL = 'http://localhost:5050';

let loginName = `test_user`;
let loginEmail = `${loginName}@gamil.com`;
let loginPassword = 'password';

export const options = {
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    },
    scenarios: {
        register_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s', // total duration
            preAllocatedVUs: 20, // to allocate runtime resources
            
            rate: 20, // number of constant iterations given 'timeUnit'
            timeUnit: '1s', // time unit for rate
            exec: 'registerUser',
        },
        login_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s', // total duration
            preAllocatedVUs: 20, // to allocate runtime resources
            
            rate: 20, // number of constant iterations given 'timeUnit'
            timeUnit: '1s', // time unit for rate
            exec: 'loginUser',
        },
        refresh_token_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s', // total duration
            preAllocatedVUs: 20, // to allocate runtime resources
            
            rate: 20, // number of constant iterations given 'timeUnit'
            timeUnit: '1s', // time unit for rate
            exec: 'refreshToken',
        },
        get_user_scenario: {
            executor: 'constant-arrival-rate',
            duration: '30s', // total duration
            preAllocatedVUs: 20, // to allocate runtime resources
            
            rate: 20, // number of constant iterations given 'timeUnit'
            timeUnit: '1s', // time unit for rate
            exec: 'getUser',
        },
    }
}

export function setup() {
    let authorizationToken = '';
    let refreshToken= '';

    let registerRes = http.post(`${BASE_URL}/users/register`, JSON.stringify({
        name: loginName,
        email: loginEmail,
        password: loginPassword
    }), {
        headers: {
            'Content-Type': 'application/json',
        }
    });

    let loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: loginEmail,
        password: loginPassword
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
        refreshToken: refreshToken
    }
}


export function teardown() {
    let authorizationToken = '';

    let loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify({
        email: loginEmail,
        password: loginPassword
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    authorizationToken = loginRes.headers['Authorization'];

    http.del(`${BASE_URL}/users`, null, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationToken
        }
    });

    return;
}

export function registerUser() {
    let name = `test_user_${__VU}_${__ITER}`;
    let email =`${name}@gmail.com`;
    let password = 'password';

    group('Register User', () => {

        const url = `${BASE_URL}/users/register`;

        const payload = JSON.stringify({
            name: name,
            email: email,
            password: password
        });

        let params = {
            headers: {
                "Content-Type": "application/json",
            }
        };
    
        let res = http.post(url, payload, params);

        if (res.status !== 200) {
            console.log(res.body);
        }
    
        check(res, {
            'POST /register status is 200': (r) => r.status === 200
        });
    });
}

export function loginUser() {
    group('Login User', () => {
        let url = `${BASE_URL}/users/login`;
        
        const payload = JSON.stringify({
            email: loginEmail,
            password: loginPassword
        });

        let params = {
            headers: {
                "Content-Type": "application/json",
            }
        };

        let res = http.post(url, payload, params);

        check(res, {
            'POST /login status is 200': (r) => r.status === 200
        });
    });
}

export function refreshToken() {
    let authorizationToken = '';
    let refreshToken = '';

    group('Login User', () => {
        let url = `${BASE_URL}/users/login`;
        
        const payload = JSON.stringify({
            email: loginEmail,
            password: loginPassword
        });

        let params = {
            headers: {
                "Content-Type": "application/json",
            }
        };

        let loginRes = http.post(url, payload, params);

        check(loginRes, {
            'POST /login status is 200': (r) => r.status === 200
        });

        authorizationToken = loginRes.headers['Authorization'];
        let setCookiesHeader = loginRes.headers['Set-Cookie'];
        if (setCookiesHeader) {
            let cookieMatch = setCookiesHeader.match(/refreshToken=([^;]+)/);
            if (cookieMatch) {
                refreshToken = cookieMatch[1];
            }
        }
    });

    group('Refresh Token', () => {
        let url = `${BASE_URL}/users/refresh`;

        let params = {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `refreshToken=${refreshToken}`
            }
        };

        let res = http.post(url, null, params);

        check(res, {
            'POST /refresh status is 200': (r) => r.status === 200,
            'Check authorization token': (r) => r.headers['Authorization'] !== '',
            'Check refresh token': (r) => r.headers['Set-Cookie'] !== ''
        });
    });
}

export function getUser(data) {
    group('Get User', () => {
        let url = `${BASE_URL}/users`;

        let params = {
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
