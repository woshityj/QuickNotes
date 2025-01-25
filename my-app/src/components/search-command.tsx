"use client";

import { useEffect, useState } from "react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    CommandDialog,
    CommandInput,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList
} from "@/components/ui/command";

import { useSearch } from "@/hooks/use-search";
import { useQuery } from "@tanstack/react-query";
import { Document, searchDocuments } from "@/app/services/documentServices";
import { useCookies } from "next-client-cookies";

export default function SearchCommand() {
    const router = useRouter();
    const cookies = useCookies();

    const { data, status } = useQuery({
        queryKey: ["documents", cookies.get("AuthorizationToken")],
        queryFn: () => searchDocuments(cookies.get("AuthorizationToken")),
    })

    const [isMounted, setIsMounted] = useState(false);

    const toggle = useSearch((store) => store.toggle);
    const isOpen = useSearch((store) => store.isOpen);
    const onClose = useSearch((store) => store.onClose);


    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggle();
            }
        }

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [toggle]);

    const onSelect = (value: string) => {
        const id = value.split("-")[0];
        
        router.push(`/documents/${id}`);
        onClose();
    }

    if (!isMounted) {
        return null;
    }

    return (
        <CommandDialog open={isOpen} onOpenChange={onClose}>
            <CommandInput placeholder={`Search user's QuickNotes...`} />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Documents">
                    {data?.map((document: Document) => (
                        <CommandItem
                            key={document._id}
                            value={`${document._id}-${document.title}`}
                            title={document.title}
                            onSelect={onSelect}
                        >
                            {document.icon ? (
                                <p className="mr-2 text-[18px]">
                                    {document.icon}
                                </p>
                            ) : (
                                <File className="mr-2 h-4 w-4" />
                            )}
                            <span>
                                {document.title}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}