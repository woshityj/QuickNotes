import { useCookies } from "next-client-cookies";
import { backendURL } from "../utils/constants";

export type User = {
    id: string;
    name: string;
    email: string;
};

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

        if (response.ok) {
            return response;
        }
        throw new Error("Invalid Email or Password. Please try again!");;
    }
    catch (err: any) {
        console.log(err);
        throw new Error(err.message);
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

        if (response.ok) {
            return response;
        }

        throw new Error("Failed to refresh token");
    } catch (err: any) {
        console.log(err);
        throw new Error(err.message);
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
        console.log(err);
        throw(err);
    }
}