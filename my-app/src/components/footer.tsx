"use client"

import Image from "next/image";

export default function Footer()
{
    return (
        <footer>
            <div className="flex justify-between">

                <div className="">
                    <h5 className=" mb-9 font-inter font-bold text-2xl leading-[1.5rem]">QuickNotes</h5>

                    <div className="flex flex-row mb-[2.188rem]">
                        <div className="p-1.5">
                            <Image width={18} height={18} src="/static/images/instagram_logo.png" alt="Instagram Logo"></Image>
                        </div>

                        <div className="p-1.5">
                            <Image width={18} height={18} src="/static/images/twitterx_logo.png" alt="TwitterX Logo"></Image>
                        </div>

                        <div className="p-1.5">
                            <Image width={18} height={18} src="/static/images/linkedin_logo.png" alt="LinkedIn Logo"></Image>
                        </div>

                        <div className="p-1.5">
                            <Image width={18} height={18} src="/static/images/facebook_logo.png" alt="Facebook Logo"></Image>
                        </div>

                        <div className="p-1.5">
                            <Image width={18} height={18} src="/static/images/youtube_logo.png" alt="Youtube Logo"></Image>
                        </div>
                    </div>

                    <p className="font-inter text-[0.844rem] leading-[1.188rem] mb-1">We do not sell or share your personal information</p>
                    <span className="font-inter text-[#050505] text-[0.844rem] leading-[1.188rem]">© 2024 QuickNotes, Inc.</span>
                </div>

                <div className="flex">
                    <div className="mr-20">
                        <ul className="list-none">
                            <li className="mb-1.5 font-semibold font-inter text-[#121212] text-[0.938rem] leading-[1.375rem]">
                                Company
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">About us</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Careers</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Security</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Status</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Terms & privacy</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <ul className="list-none">
                            <li className="mb-1.5 font-semibold font-inter text-[#121212] text-[0.938rem] leading-[1.375rem]">
                                Resources
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Help center</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Pricing</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Blog</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Community</a>
                            </li>
                            <li className="mb-1.5">
                                <a className="font-inter text-[#333333] text-[0.938rem] leading-[1.375rem] hover:decoration-[#0a85d1] hover:underline hover:underline-offset-2 hover:decoration-1 hover:cursor-pointer">Templates</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}