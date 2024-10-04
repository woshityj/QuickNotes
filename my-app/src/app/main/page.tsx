"use client";

import { PlusCircle } from "lucide-react";
import NavBar from "../../components/navbar";
import SideBar from "../../components/sidebar";

import Image from "next/image";
import PrimaryButton from "../../components/primary_button";


export default function Main()
{

    return (
        <div className="h-screen flex">
            <SideBar />
            <main className="flex-1 h-full overflow-y-auto">
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Image src="/static/images/empty.png" width="300" height="300" alt="Empty" className="" />
                    <h2 className="font-inter text-lg font-medium">
                        Welcome to Yu Jie&apos;s QuickNotes
                    </h2>
                    <PrimaryButton value={"Create a note"} >
                        <PlusCircle className="h-4 w-4 mr-2" />
                    </PrimaryButton>


                </div>
            </main>
        </div>
    );
}