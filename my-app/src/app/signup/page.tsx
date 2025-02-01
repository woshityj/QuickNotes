"use client";

import Image from "next/image";
import NavBar from "../../components/navbar";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { backendURL } from "../utils/constants";
import { toast, Toaster } from "sonner";

export default function SignUp() {

    const router = useRouter();

    const handleInput = (e: React.ChangeEvent<any>) => {
        setSignUpData({ ...signUpData, [`${e.target.name}`] : e.target.value });
    };

    const [signUpData, setSignUpData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleSignUp = async (e: React.ChangeEvent<any>) => {
        e.preventDefault();

        // Check if Name, Email, Password, and Confirm Password is not null
        if (signUpData.name.length === 0 || signUpData.email.length === 0 || signUpData.password.length === 0 || signUpData.confirmPassword.length === 0) 
        {
            toast.error("Form is incomplete");
            return null;
        }

        // Check if Password matches Confirm Password
        if (signUpData.password != signUpData.confirmPassword) {
            toast.error("Password and Confirm Password does not match");
            return null;
        }
        

        try {
            const response = await fetch(`${backendURL}/users/register`, {
                method: "POST",
                body: JSON.stringify(signUpData),
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                toast.success("Account has been created.");

                const signupRedirectTimer = setTimeout(() => {
                    router.push("/login");
                }, 2000);

                return () => clearTimeout(signupRedirectTimer);
            // Validation based on if Email exists in the database
            } else {
                const errMessage = await response.json();
                toast.error(errMessage.msg);
            }
        } catch (err) {
            toast.error("Failed to create an account.");
            console.log(err);
        }
    };
    

    return (
        <div className="flex flex-col h-screen bg-white">
            <NavBar />
            <div className="flex flex-col flex-grow flex-1 mx-auto my-auto w-[23.125rem] justify-center">
                <div className="mb-[1.438rem]">
                    <span className="font-inter font-semibold text-primary-black leading-[1.625rem] text-[1.375rem]">Think it. Make it.</span>
                    <h2 className="font-inter text-[#ACABA9] font-semibold leading-[1.625rem] text-[1.375rem]">Create your QuickNotes account</h2>
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
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Name</label>
                            <input name="name" onChange={handleInput} value={signUpData.name} type="text" className="text-black bg-white w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your name..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Email</label>
                            <input name="email" onChange={handleInput} value={signUpData.email} type="text" className="text-black bg-white w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your name..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Password</label>
                            <input name="password" onChange={handleInput} value={signUpData.password} type="password" className="text-black bg-white w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your password..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Confirm Password</label>
                            <input name="confirmPassword" onChange={handleInput} value={signUpData.confirmPassword} type="password" className="text-black bg-white w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Confirm your password..."></input>
                        </div>

                        <button onClick={handleSignUp} className="w-full font-inter text-[0.875rem] min-h-9 leading-[0.875rem] text-white font-medium bg-[#0582FF] py-[0.406rem] px-[0.75rem] rounded-md">
                            Sign up here
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}