"use client";

import { archiveDocument, getDocument } from "@/app/services/documentServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem  } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { LayoutTemplate, MoreHorizontal, Trash } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { createTemplate } from "@/app/services/templateServices";

interface MenuProps {
    documentId: string
}

export default function Menu({documentId}: MenuProps) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const archiveDocumentMutate = useMutation({
        mutationFn: archiveDocument,
        onError: () => {
            toast.error("Failed to archive note.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            queryClient.invalidateQueries({ queryKey: ["document", "detail", documentId] });
            toast.success("Archived document.");
        },
    });

    const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        
        archiveDocumentMutate.mutate({ id: documentId });
        router.push("/documents");
    }

    const saveTemplateMutate = useMutation({
        mutationFn: createTemplate,
        onError: () => {
            toast.error("Failed to save document as template.");
        },
        onSuccess: () => {
            toast.success("Saved document as template.");
        }
    });

    const onSaveTemplate =  async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();

        let document = await getDocument(documentId);
        saveTemplateMutate.mutate({ title: document.title, content: document.content });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" alignOffset={8} forceMount>
                <DropdownMenuItem onClick={onArchive}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveTemplate}>
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    Save as Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="text-xs text-muted-foreground p-2">
                    Last editted by: user
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

Menu.Skeleton = function MenuSkeleton() {
    return (
        <Skeleton className="h-10 w-10" />
    )
}