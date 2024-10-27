import { jwtDecode } from "jwt-decode";
import { backendURL } from "./constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function isTokenExpired(token?: string | null): boolean {
    if (!token) return true;

    try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp != null) return decodedToken.exp < currentTime;
        return true;
    } catch (err) {
        console.log('Error decoding token: ', err);
        return true;
    }
}

async function refreshToken() {
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
            let authorizationToken = response.headers.get('Authorization') || "";
            localStorage.setItem('AuthorizationToken', authorizationToken);
        }

    } catch (err) {
        console.log(err);
    }
}

export async function reAuthenticateUser() {

    const router = useRouter();
    console.log("testing");

    if (localStorage.getItem('AuthorizationToken')) {
        const token = localStorage.getItem('AuthorizationToken');
        if (isTokenExpired(token)) {
            localStorage.removeItem('AuthorizationToken');
            await refreshToken();

            if (localStorage.getItem('AuthorizationToken') == null) {
                toast.warning("Login has expired, please login again.");
                router.push("/login");
            }
        }
    } else {
        toast.warning("Login has expired, please login again.");
        router.push("/login");
    }
}