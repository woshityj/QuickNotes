"use client";

import { ChevronDown, ChevronRight, Ellipsis } from "lucide-react";
import { ElementRef, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import Image from "next/image";
import Link from "next/link";

class Document {
    public id: string;
    public name: string;
    public content: string;
    public isPublished: boolean;

    public constructor(id: string, name: string, content: string, isPublished: boolean) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.isPublished = isPublished;
    }
}

export default function Folder({ folderId, name, documents } : { folderId: string, name: string, documents: Document[] }) {

    const [isExpanded, setIsExpanded] = useState(false);

    return(
        <>
            <div
                className="flex items-center justify-between px-2 py-[0.313rem]"
            >
                <div 
                    role = "button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center"
                >
                    <ChevronRight 
                        className={
                            cn("h-[1.063rem] w-[0.938rem] mr-2 transition-all ease-linear",
                            isExpanded && "rotate-90"
                        )}
                    />
                    <p className="font-medium text-sm text-[#5F5E5B]">{ name }</p>
                </div>
                <Ellipsis className="h-[1.063rem] w-[0.938rem]" />
            </div>

            <div className={`ml-8 overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? "max-h-screen px-2 py-[0.313rem]" : "max-h-0"}`}>
                {documents.map((data, index) => (
                <Link key={index} href={`/documents/${folderId}/${data.id}`}>
                    <div className="flex">
                        <Image className="mr-2" height={20} width={20} src="/static/images/document_icon.png" alt="Document Icon"></Image>
                        <p className="text-sm leading-[1.313rem] font-medium text-[#5F5E5B]">{data.name}</p>
                    </div>
                </Link>
                ))}

            </div>

        </>
    );
}