"use client";

import { getDocument, updateDocument } from "@/app/services/documentServices";
import Cover from "@/components/cover";
import Toolbar from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCookies } from "next-client-cookies";
import dynamic from "next/dynamic";
import { useMemo } from "react";

interface DocumentIdPageProps {
    params: {
        documentId: string
    }
}

export default function DocumentIdPage({ params }: DocumentIdPageProps) {

    const Editor = useMemo(() => dynamic(() => import("@/components/editor"), { ssr: false }), []);

    const queryClient = useQueryClient();
    const cookies = useCookies();

    const getDocumentMutate = useQuery({
        queryKey: ["document", "detail", params.documentId, cookies.get("AuthorizationToken")],
        queryFn: () => getDocument(params.documentId, cookies.get("AuthorizationToken")),
    });

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", params.documentId, cookies.get("AuthorizationToken")] });
        }
    })

    const onChange = (content: string) => {
        updateDocumentMutate.mutate({
            _id: params.documentId,
            content: content,
            authorizationToken: cookies.get("AuthorizationToken")
        });
    }

    if (getDocumentMutate.isLoading) {
        return (
        <div>
            <Cover.Skeleton />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
                <div className="space-y-4 pl-8 pt-4">
                    <Skeleton className="h-14 w-[50%]" />
                    <Skeleton className="h-4 w-[80%]" />
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-4 w-[50%]" />
                </div>
            </div>
        </div>
        );
    }

    if (getDocumentMutate.data === null) {
        return <div>Note found</div>
    }

    return (
        <div className="pb-40">
            <Cover url={getDocumentMutate.data.coverImage} />                
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar initialData={getDocumentMutate.data} />
                {Editor && 
                <Editor
                    onChange={onChange}
                    initialContent={getDocumentMutate.data.content}
                />
                }
            </div>
        </div>
    );
}