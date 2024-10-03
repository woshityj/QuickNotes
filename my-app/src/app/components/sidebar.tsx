import Image from "next/image";

import aiIcon from "../../public/static/images/ai_icon.png";
import createIcon from "../../public/static/images/create_icon.png";
import profileIcon from "../../public/static/images/profile_icon.png";
import homeIcon from "../../public/static/images/home_icon.png";
import inboxIcon from "../../public/static/images/inbox_icon.png";
import searchIcon from "../../public/static/images/search_icon.png";

import downArrow from "../../public/static/images/down_arrow.png";

export default function SideBar() {
    return (
        <aside className="h-screen">
            <div className="h-full max-w-64 px-4 py-4 bg-[#F7F7F5]">
                <div className="flex justify-between mb-1.5">
                    <div className="flex items-center">
                        <Image className="mr-[0.438rem] rounded-md" src={profileIcon} alt="Profile Picture Icon"></Image>
                        <span className="font-inter font-medium text-sm leading-5 text-[#37352F] mr-[0.438rem]">New Space</span>
                        <Image src={downArrow} alt="Down Arrow Icon"></Image>
                    </div>
                    <div>
                        <Image src={createIcon} alt="Create New Note Icon"></Image>
                    </div>
                </div>

                <div className="mb-4">
                    <ul>
                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Search</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">QuickNotes AI</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Home</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={inboxIcon} alt="Inbox Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Index</a>
                        </li>
                    </ul>
                </div>

                <div className="mb-7">
                    <span className="font-inter text-[#91918E] text-xs leading-3 font-medium py-[0.563rem]">Favourites</span>
                    <ul>
                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Search</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">QuickNotes AI</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Home</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={inboxIcon} alt="Inbox Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Index</a>
                        </li>
                    </ul>
                </div>

                <div className="mb-7">
                    <span className="font-inter text-[#91918E] text-xs leading-3 font-medium py-[0.563rem]">Private</span>
                    <ul>
                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Academics</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">New Page</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">More</a>
                        </li>
                    </ul>
                </div>

                <div className="mb-7">
                    <ul>
                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Settings</a>
                        </li>

                        <li className="flex py-1 items-center">
                            <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
                            <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Trash</a>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>
    );
}