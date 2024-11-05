"use client";

import { getDocument, updateDocument } from "@/app/services/documentServices";
import Cover from "@/components/cover";
import Toolbar from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

    const getDocumentMutate = useQuery({
        queryKey: ["document", "detail", params.documentId],
        queryFn: () => getDocument(params.documentId),
    });

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", params.documentId] });
        }
    })

    const onChange = (content: string) => {
        updateDocumentMutate.mutate({
            _id: params.documentId,
            content: content
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
        return <div>Not found</div>
    }

    return (
        <div className="pb-40">
            <Cover preview url={getDocumentMutate.data.coverImage} />                
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar preview initialData={getDocumentMutate.data} />
                {Editor && 
                <Editor
                    editable={false}
                    onChange={onChange}
                    initialContent={getDocumentMutate.data.content}
                />
                }
            </div>
        </div>
    );
}