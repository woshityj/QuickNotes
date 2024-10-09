"use client";

import Image from "next/image";
import SideBar from "@/components/sidebar";
import PrimaryButton from "@/components/primary_button";
import { PlusCircle } from "lucide-react";
import React from "react";

// import { PlusCircle } from "lucide-react";
// import NavBar from "../../components/navbar";
// import SideBar from "../../components/sidebar";

// import Image from "next/image";
// import PrimaryButton from "../../components/primary_button";
// import Editor from "@/components/editor";


// export default function Main()
// {

//     const onChange = (content: string) => {

//     }

//     return (
//         <div className="h-screen flex">
//             <SideBar />
//             <main className="flex-1 h-full overflow-y-auto">
                
//                 {/* <div className="h-full flex flex-col items-center justify-center space-y-4"> */}
//                     {/* <Image src="/static/images/empty.png" width="300" height="300" alt="Empty" className="" />
//                     <h2 className="font-inter text-lg font-medium">
//                         Welcome to Yu Jie&apos;s QuickNotes
//                     </h2>
//                     <PrimaryButton value={"Create a note"} >
//                         <PlusCircle className="h-4 w-4 mr-2" />
//                     </PrimaryButton> */}

//                 {/* </div> */}
//                 <Editor onChange={() => {}} />

//             </main>
//         </div>
//     );
// }

export default function MainLayout({ children } : { children: React.ReactNode; }) {
    
    return (
        <div className="h-screen flex">
            <SideBar />

            <main className="flex-1 h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}