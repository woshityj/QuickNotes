import { isTokenExpired, refreshToken } from "@/app/utils/authentication";
import { useCookies } from "next-client-cookies";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendURL } from "./app/utils/constants";
import { toast } from "sonner";

const protectedRoutes = ['/documents'];
const publicRoutes = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
    const cookiesStore = await cookies();
    const token = cookiesStore.get('AuthorizationToken');
    const refToken = cookiesStore.get('refreshToken');
    // console.log(token);

    // If user is logged in
    if (cookiesStore.has('AuthorizationToken')) {
        if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        // If token is expired, refresh the token
        if (isTokenExpired(token?.value)) {
            const response = await refreshToken(refToken?.value);

            console.log(response.headers.get('Authorization'));
            if (response.ok) {
                const res = NextResponse.next();
                res.cookies.set('AuthorizationToken', response.headers.get('Authorization') || "");
                // cookiesStore.set('AuthorizationToken', response.headers.get('Authorization') || "");
                return res;
            }
            // If token is not able to refresh, redirect to login page
            else {
                const res = NextResponse.redirect(new URL('/login', request.url));
                res.cookies.delete('AuthorizationToken');
                res.cookies.delete('refreshToken');
                return res;
            }

            // console.log("New Authorization Token");
            // console.log(response.headers.get('Authorization'));
            // // If token is able to refresh, continue to next request
            // if (cookiesStore.has('AuthorizationToken')) {
            //     return NextResponse.next();
            // }
            // // Else redirect to login page
            // else {
            //     return NextResponse.redirect(new URL('/login', request.url));
            // }
        }
    }

    if (protectedRoutes.includes(request.nextUrl.pathname))
    {
        console.log("Test");
        if (isTokenExpired(token?.value)) {
            console.log("Expired");
            return NextResponse.redirect(new URL('/login', request.url));
        } else {
            return NextResponse.next();
        }
    }

    // console.log("Test");
    // if (isTokenExpired(token)) {
    //     console.log("User is not authenticated, redirecting to login page");
    //     return NextResponse.redirect(new URL('/login', request.url));
    // }
    // else if (!isTokenExpired(token) && request.nextUrl.pathname.startsWith('/documents')) {
    //     console.log("User is authenticated, redirecting to documents page");
    //     return NextResponse.redirect(new URL('/documents', request.url));
    // }
    // else if (!isTokenExpired(token) && request.nextUrl.pathname.startsWith('/login')) {
    //     return NextResponse.redirect(new URL('/documents', request.url));
    // }

    return NextResponse.next();

    // if (request.nextUrl.pathname.startsWith('/signup')) {
    //     return NextResponse.redirect(new URL('/login', request.url));
    // }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  }