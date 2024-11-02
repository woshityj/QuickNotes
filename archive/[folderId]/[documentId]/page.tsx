"use client";

import Editor from "@/components/editor";
import { Clock, MessageSquareText, Star, Ellipsis } from "lucide-react";
import dynamic from "next/dynamic";
import foldersData from "../../../../../../../public/static/json/folder.json";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/lib/utils";

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
};


export default function DocumentMain({ params } : {params: { folderId: string, documentId: string }}) {

    const Editor = dynamic(() => import("../../../../../../components/editor"), { ssr: false });

    const onChange = (content: string) => {

    };

    const [folderName, setFolderName] = useState("");

    const [documentName, setDocumentName] = useState("");
    const [documentContent, setDocumentContent] = useState(""); 

    useEffect(() => {
        foldersData.map((data, index) => {
            if (params.folderId == data._id) {
                setFolderName(data.name);
                for (let i = 0; i < data.documents.length; i ++) {
                    if (params.documentId == data.documents[i].id) {
                        setDocumentName(data.documents[i].name);
                        setDocumentContent(data.documents[i].content);
                    }
                }
            }
        });
    }, []);

    return (
        <div>
            <div className="flex justify-between px-3 py-3">
                <div>
                    <p className="font-inter font-medium text-sm leading-[1.313rem]">{folderName} / {documentName}</p>
                </div>

                <div className="flex items-center">
                    <span className="text-sm leading-4 font-medium text-[#37352F] opacity-50 font-inter mr-[1.125rem]">Last Edited just now</span>

                    <a className="font-medium text-sm leading-4 font-inter text-[#37352F] mr-[1.125rem]">Share</a>

                    <MessageSquareText className="h-5 w-5 mr-[1.125rem]" />
                    <Clock className="h-5 w-5 mr-[1.125rem]" />
                    <Star className="h-5 w-5 mr-[1.125rem]" />
                    <Ellipsis className="h-5 w-5" />
                </div>
            </div>

            <div className="px-[15.938rem] mt-6">
                <h1 className="px-[3.375rem] text-[#37352F] opacity-50 text-[2.5rem] leading-[3rem] font-bold">{documentName}</h1>
                <Editor onChange={onChange} initialContent={documentContent} />
            </div>
        </div>
    );
}