"use client";

import SideBar from "@/components/sidebar";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { backendURL } from "../utils/constants";
import { CookiesProvider } from "next-client-cookies/server";

type User = {
    id: string;
    name: string;
    email: string;
};

export default function MainLayout({ children } : { children: React.ReactNode; }) {
    
    const router = useRouter();
    const [authorizationToken, setAuthorizationToken] = useState<string | null>(null);
    
    const [currentUser, setCurrentUser] = useState<User>({
        id: '',
        name: '',
        email: ''
    });

    useEffect(() => {
        const token = localStorage.getItem("AuthorizationToken");
        if (token) {
            setAuthorizationToken(token);
        } else {
            router.push("/login");
        }
    }, []);

    useEffect(() => {
        if (!authorizationToken) return;

        const isUserAuthenticated = async () => {
            if (authorizationToken) {
                try {
                    const decoded = jwtDecode(authorizationToken);
                    const currentTime = Date.now() / 1000;
    
                    // If token has expired
                    if (decoded.exp && (decoded.exp < currentTime || (decoded.exp - currentTime < 300))) {
                        localStorage.removeItem('AuthorizationToken');
                        setAuthorizationToken("");
                        const response = await fetch(`${backendURL}/users/refresh`, {
                            method: "POST",
                            headers: {
                                Accept: "application/json",
                                "Content-Type": "application/json",
                            },
                            credentials: 'include'
                        });
                        console.log(response.headers.get("Authorization"));

                        if (response.ok) {
                            console.log("Testing");
                            const renewedAuthorizationToken = response.headers.get("Authorization") || "";
                            
                            // const newToken = response.headers.get("Authorization");
                            localStorage.setItem('AuthorizationToken', renewedAuthorizationToken);
                            setAuthorizationToken(renewedAuthorizationToken);
                        }
                    }
                } catch (err) {
                    console.log(err);
                    router.push("/login");
                }
            } else {
                router.push("/login");
            }
        }

        const getCurrentUser = async () => {
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

                if (response.ok) {
                    const user = await response.json();
                    setCurrentUser({ id: user._id, name: user.name, email: user.email });
                }

            } catch (err) {
                console.log(err);
            }
        }
        
        isUserAuthenticated();
        getCurrentUser();
    }, [authorizationToken]);

    return (
        <div className="h-screen flex">
            <SideBar currentUser={currentUser} />

            <main className="flex-1 h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}