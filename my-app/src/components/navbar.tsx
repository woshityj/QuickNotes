"use client"

import Link from "next/link";
import { useCookies } from "next-client-cookies";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NavBar() 
{
    const router = useRouter();
    const cookies = useCookies();
    const [authorizationToken, setAuthorizationToken] = useState("");

    useEffect(() => {
        if(localStorage.getItem('AuthorizationToken') != null) {
            setAuthorizationToken(localStorage.getItem('AuthorizationToken') || "");
        }
    }, [authorizationToken]);


    const handleLogout = (e: React.ChangeEvent<any>) => {
        e.preventDefault();

        if (!localStorage.getItem('AuthorizationToken') != null) {
            localStorage.removeItem('AuthorizationToken');
        }

        if (cookies.get('refreshToken') != null) {
            cookies.remove('refreshToken');
        }

        toast.success("Successfully logged out");
        const logoutRedirectTimeout = setTimeout(() => {
            location.reload();
            router.push('/');
        }, 2000);

        return () => clearTimeout(logoutRedirectTimeout);
    }


    return (
        <nav className="bg-white px-40">
            <div className="mx-auto px-4 py-[0.938rem]">
                <div className="relative">
                    <div className="flex justify-between items-center">
                        <div className="flex">
                            <div className="flex">
                                <div className="mr-6 flex items-center justify-center">
                                    <Link href="/" className="text-black font-inter font-semibold text-[15px] leading-[15px]">QuickNotes</Link>
                                </div>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <a href="#" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Product</a>
                                </div>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <a href="#" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Teams</a>
                                </div>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <a href="#" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Individuals</a>
                                </div>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <a href="#" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Pricing</a>
                                </div>
                            </div>
                        </div>
                        <div className="flex">
                            {
                                !authorizationToken
                                &&
                                <>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <Link href="/login" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Login</Link>
                                </div>
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <Link href="/signup" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Sign up</Link>
                                </div>
                                </>
                            }

                            {
                                authorizationToken 
                                &&
                                <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                    <a onClick={handleLogout} className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Logout</a>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}