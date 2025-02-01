"use client";

import Image from "next/image"
import NavBar from "../../components/navbar";
import { useCookies } from "next-client-cookies";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { backendURL } from "../utils/constants";
import { cookies } from "next/headers";
import { login } from "../services/userServices";

export default function Login() {

    const router = useRouter();
    const cookies = useCookies();

    const [loginData, setLoginData] = useState({
        email: "",
        password: ""
    });


    const handleInput = (e: React.ChangeEvent<any>) => {
        setLoginData({ ...loginData, [`${e.target.name}`] : e.target.value });
    };

    const handleLogin = async (e: React.ChangeEvent<any>) => {
        e.preventDefault();

        if (loginData.email.length == 0 || loginData.password.length == 0) {
            toast.error("Form is incomplete");
            return null
        }

        try {
            // const response = await fetch(`${backendURL}/users/login`, {
            //     method: "POST",
            //     body: JSON.stringify(loginData),
            //     headers: {
            //         Accept: "application/json",
            //         "Content-Type": "application/json",
            //     },
            //     credentials: 'include'
            // });

            const response = await login(loginData);

            if (response.ok) {
                toast.success("Successfully logged in");
                const authorizationToken = response.headers.get('Authorization') || "";
                cookies.set('AuthorizationToken', authorizationToken);
                console.log(response.headers.get('set-cookie'));
                console.log(cookies.get('refreshToken'));
                // let authorizationToken = response.headers.get('Authorization') || "";
                // localStorage.setItem('AuthorizationToken', authorizationToken);

                const loginRedirectTimer = setTimeout(() => {
                    router.push("/");
                    router.refresh();
                }, 2000);

                return () => clearTimeout(loginRedirectTimer);
            }

            if (response.status == 400) {
                toast.error("Invalid Email or Password. Please try again!");
            }
        } catch (err) {
            toast.error("Server failed to login");
            console.log(err);
        }
    }

    return (
        <div className="flex flex-col h-screen dark:bg-white">
            <NavBar />
            <div className="flex flex-col flex-grow flex-1 mx-auto my-auto w-[23.125rem] justify-center">
                <div className="mb-[1.438rem]">
                    <span className="font-inter font-semibold text-primary-black leading-[1.625rem] text-[1.375rem]">Think it. Make it</span>
                    <h2 className="font-inter text-[#ACABA9] font-semibold leading-[1.625rem] text-[1.375rem]">Log in to your QuickNotes account</h2>
                </div>
                <div className="mb-5">
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={"/static/images/google_icon.png"} height={12} width={12} alt="Google Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Continue with Google</span>
                    </button>
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={"/static/images/apple_logo.png"} height={12} width={12} alt="Apple Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Continue with Apple</span>
                    </button>
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={"/static/images/key_logo.png"} height={12} width={12} alt="Key Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Single sign-on (SSO)</span>
                    </button>
                </div>

                <hr className="border-[#e3e2e080]"></hr>

                <div className="mt-5">
                    <form>
                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Email</label>
                            <input name="email" value={loginData.email} onChange={handleInput} type="text" className="bg-white text-black w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB] dark:autofill:bg-white" placeholder="Enter your email address..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Password</label>
                            <input name="password" value={loginData.password} onChange={handleInput} type="password" className="bg-white text-black w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your password..."></input>
                        </div>

                        <button onClick={handleLogin} className="w-full font-inter text-[0.875rem] min-h-9 leading-[0.875rem] text-white font-medium bg-[#0582FF] py-[0.406rem] px-[0.75rem] rounded-md">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}