import Image from "next/image";
import NavBar from "../components/navbar";

import googleLogo from "../../public/static/images/google_icon.png";
import appleLogo from "../../public/static/images/apple_logo.png";
import keyLogo from "../../public/static/images/key_logo.png";

export default function SignUp() {
    return (
        <div className="flex flex-col h-screen">
            <NavBar />
            <div className="flex flex-col flex-grow flex-1 mx-auto my-auto w-[23.125rem] justify-center">
                <div className="mb-[1.438rem]">
                    <span className="font-inter font-semibold text-primary-black leading-[1.625rem] text-[1.375rem]">Think it. Make it.</span>
                    <h2 className="font-inter text-[#ACABA9] font-semibold leading-[1.625rem] text-[1.375rem]">Create your QuickNotes account</h2>
                </div>
                <div className="mb-5">
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={googleLogo} height={12} width={12} alt="Google Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Continue with Google</span>
                    </button>
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={appleLogo} height={12} width={12} alt="Apple Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Continue with Apple</span>
                    </button>
                    <button className="flex w-[23.125rem] mb-2 px-3 py-[0.688rem] justify-center border-[#E3E2E0] border-[0.035rem] rounded hover:bg-[#0000000a]">
                        <Image src={keyLogo} height={12} width={12} alt="Key Icon" className="mr-1.5"></Image>
                        <span className="font-inter font-medium text-[#1D1B16] text-sm leading-[0.875rem]">Single sign-on (SSO)</span>
                    </button>
                </div>

                <hr></hr>

                <div className="mt-5">
                    <form method="post">
                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Name</label>
                            <input type="text" className="w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your name..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Name</label>
                            <input type="text" className="w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your name..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Password</label>
                            <input type="password" className="w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Enter your password..."></input>
                        </div>

                        <div className="mb-4">
                            <label className="text-[#787774] text-[0.75rem] leading-[1.125rem] font-inter">Confirm Password</label>
                            <input type="password" className="w-full font-inter rounded-md py-1 pl-[0.625rem] leading-[1.625rem] text-[0.938rem] border-[#D3D1CB] border-[0.063rem] placeholder:text-[#D3D1CB]" placeholder="Confirm your password..."></input>
                        </div>

                        <button className="w-full font-inter text-[0.875rem] min-h-9 leading-[0.875rem] text-white font-medium bg-[#0582FF] py-[0.406rem] px-[0.75rem] rounded-md">
                            Sign up here
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}