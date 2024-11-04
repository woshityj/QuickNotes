"use client";

import { getDocument } from "@/app/services/documentServices";
import Cover from "@/components/cover";
import Toolbar from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface DocumentIdPageProps {
    params: {
        documentId: string
    }
}

export default function DocumentIdPage({ params }: DocumentIdPageProps) {

    const getDocumentMutate = useQuery({
        queryKey: ["document", "detail", params.documentId],
        queryFn: () => getDocument(params.documentId),
    });

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
            </div>
        </div>
    );
}