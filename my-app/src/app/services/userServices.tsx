import { useCookies } from "next-client-cookies";
import { backendURL } from "../utils/constants";

export async function login({email, password}: {email: string, password: string}) {
    try {
        const response = await fetch(`${backendURL}/users/login`, {
            method: "POST",
            body: JSON.stringify({email, password}),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: 'include'
        });

        return response;
    }
    catch (err) {
        throw err;
        console.log(err);
    }
}

export async function refreshToken() {

    try {
        const response = await fetch(`${backendURL}/users/refresh`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            credentials: 'include'
        });

        return response;

    } catch (err) {
        console.log(err);
    }    
}


export async function logout() {
    const cookies = useCookies();

    try {

        if (cookies.get('AuthorizationToken') != null) {
            cookies.remove('AuthorizationToken');
        }

        if (cookies.get('refreshToken') != null) {
            cookies.remove('refreshToken');
        }
    }
    catch (err) {
        console.log(err);
    }
}

export async function getCurrentUser(authorizationToken: string) {
    try {
        const response = await fetch(`${backendURL}/users`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "authorization": authorizationToken
            },
            credentials: 'include'
        });

        return response;
        
    } catch (err) {
        throw(err);
        console.log(err);
    }
}