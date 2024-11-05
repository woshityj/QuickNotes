"use client";

import { getDocument } from "@/app/services/documentServices";
import { MenuIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Title from "./title";
import { useEffect } from "react";
import Banner from "./banner";
import Menu from "./menu";
import Publish from "./publish";

interface NavbarProps {
    isCollapsed: boolean;
    onResetWidth: () => void;
};

export default function SecondaryNavbar({isCollapsed, onResetWidth}: NavbarProps) {

    const params = useParams();

    const getDocumentMutate = useQuery({
        queryKey: ["document", "detail", params.documentId],
        queryFn: () => getDocument(String(params.documentId)),
    });

    if (getDocumentMutate.isLoading) {
        return (
            <nav className="bg-background dark:bg-[#1F1F1F] px-3 py-2 w-full flex items-center justify-between">
                <Title.Skeleton />
                <div className="flex items-center gap-x-2">
                    <Menu.Skeleton />
                </div>
            </nav>
        )
    }

    if (getDocumentMutate.isError) {
        return null;
    }

    return (
        <>
            <nav className="bg-background dark:bg-[#1F1F1F] px-3 py-2 w-full flex items-center gap-x-4">
                {isCollapsed && (
                    <MenuIcon
                        role="button"
                        onClick={onResetWidth}
                        className="h-6 w-6 text-muted-foreground"
                    />
                )}                    
                <div className="flex items-center justify-between w-full">
                    <Title initialData={getDocumentMutate.data} />
                    <div className="flex items-center gap-x-2">
                        <Publish initialData={getDocumentMutate.data} />
                        <Menu documentId={getDocumentMutate.data._id} />
                    </div>
                </div>
            </nav>
            {getDocumentMutate.data.isArchived && (
                <Banner documentId={getDocumentMutate.data._id} />
            )}
        </>
    )
}