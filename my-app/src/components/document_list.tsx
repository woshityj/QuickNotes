"use client";

import { Document, getDocuments } from "@/app/services/documentServices";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "react-query";
import { Item } from "./item";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";

interface DocumentListProps {
    parentDocumentId?: string,
    level?: number,
}

export const DocumentList = ({ parentDocumentId, level = 0}: DocumentListProps) => {
    const paramts = useParams();
    const router = useRouter();

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const onExpand = (documentId: string) => {
        setExpanded(prevExpanded => ({
            ...prevExpanded,
            [documentId]: !prevExpanded[documentId]
        }));
    };

    const { data, status } = useQuery({
        queryKey: ["documents", parentDocumentId],
        queryFn: () => getDocuments(parentDocumentId)
    });
    
    const onRedirect = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    };

    if (data === undefined) {
        return (
            <>
                <Item.Skeleton level={level} />
                {level === 0 && (
                    <>
                        <Item.Skeleton level={level} />
                        <Item.Skeleton level={level} />
                    </>
                )}
            </>
        )
    }

    return (
        <>
            <p
                style={{
                    paddingLeft: level ? `${(level * 12) + 25}px` : undefined
                }}
                className={cn("hidden text-sm font-medium text-muted-foreground/80",
                    expanded && "last:block",
                    level === 0 && "hidden"
                )}
            >
                No pages inside
            </p>
            {data?.map((document: Document) => (
                <div key={document._id}>
                    <Item
                        id={document._id}
                        onClick={() => onRedirect(document._id)}
                        label={document.title}
                        icon={FileIcon}
                        documentIcon={document.icon}
                        active={paramts.documentId === document._id}
                        level={level}
                        onExpand={() => onExpand(document._id)}
                        expanded={expanded[document._id]}
                    />
                    {expanded[document._id] && (
                        <DocumentList
                        parentDocumentId={document._id}
                        level={level + 1}
                        />
                    )}
                </div>
            ))}
        </>

    )
}