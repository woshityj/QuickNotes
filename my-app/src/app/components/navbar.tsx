"use client"

import Link from "next/link";

export default function NavBar() 
{
    return (
        <nav className="bg-white">
            <div className="mx-auto max-w-6xl px-4 py-[0.938rem]">
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
                            <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                <Link href="/login" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Login</Link>
                            </div>
                            <div className="hover:bg-[#0000000a] mr-3.5 px-2.5 rounded-md">
                                <Link href="/signup" className="text-primary-black font-inter font-medium text-[0.938rem] leading-[1.938rem]">Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}