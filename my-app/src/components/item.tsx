"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, LucideIcon, MoreHorizontal, Plus, Trash } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { archiveDocument, createDocument } from "@/app/services/documentServices";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useCookies } from "next-client-cookies";

interface ItemProps {
    id?: string,
    documentIcon?: string,
    active?: boolean,
    expanded?: boolean,
    isSearch?: boolean,
    level?: number,
    onExpand?: () => void,
    label: string;
    onClick?: () => void;
    icon: LucideIcon;
    lastEditedBy?: string;
};

export const Item = ({id, label, onClick, icon: Icon, active, documentIcon, isSearch, level = 0, onExpand, expanded, lastEditedBy} : ItemProps) => {

    const queryClient = useQueryClient();

    const router = useRouter();

    const cookies = useCookies();

    const handleExpand = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        onExpand?.();
    };

    const createDocumentMutate = useMutation({
        mutationFn: createDocument,
		onError: () => {
			toast.error("Failed to create new note.")
		},
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["documents"]
            });
            toast.success("Created new note.");
            router.push(`/documents/${data._id}`);

        },
    });

    const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        if (!id) return;

        createDocumentMutate.mutate({ parentDocumentId: id, authorizationToken: cookies.get("AuthorizationToken") });
        if (!expanded) {
            onExpand?.();
        }
    }

    const archiveDocumentMutate = useMutation({
        mutationFn: archiveDocument,
        onError: () => {
			toast.error("Failed to archive note.")
		},
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["documents"]
            });
            queryClient.invalidateQueries({ queryKey: ["document", "detail", id] });
            toast.success("Archived document.")
            router.push("/documents");
        },
    })

    const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        if (!id) return;

        archiveDocumentMutate.mutate({ id: id, authorizationToken: cookies.get("AuthorizationToken") });
    }

    const ChevronIcon = expanded ? ChevronDown : ChevronRight;


    return (
        <div 
            onClick={onClick} 
            role="button" 
            style={{ paddingLeft: level ? `${(level * 12) + 12}px` : '12px' }} 
            className={cn(
                "group min-h-[27px] text-sm py-1 pr-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium",
                active && "bg-primary/5 text-primary"
                )}>
            {!!id && (
                <div 
                    role="button" 
                    className="h-full rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
                    onClick={handleExpand}>
                    <ChevronIcon
                        className="h-4 w-4 shrink-0 text-muted-foreground/50"
                    />
                </div>
            )}
            {documentIcon ? (
                <div className="shrink-0 mr-2 text-[18px]">
                    { documentIcon }
                </div>
            ): (
                <Icon className="shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground" />
            )}
            <span className="truncate">
                {label}
            </span>
            {isSearch && (
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">
                    ⌘
                    </span>K
                </kbd>
            )}
            {!!id && (
                <div className="ml-auto flex items-cetner gap-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        asChild>
                            <div
                                role="button"
                                className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-60 dark:bg-[#1F1F1F] z-[99999]"
                            align="start"
                            side="right"
                            forceMount
                        >
                            <DropdownMenuItem onClick={onArchive}>
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="text-xs text-muted-foreground p-2">
                                Last edited by: {lastEditedBy}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div
                        role="button"
                        onClick={onCreate}
                        className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-30 dark:hover:bg-neutral-600">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            )}
        </div>
    )
}

Item.Skeleton = function ItemSkeleton({ level } : { level?: number }) {
    return (
        <div
            style={{
                paddingLeft: level ? `${(level * 12) + 12}px` : '12px'
            }}
            className="flex gap-x-2 py-[3px]"
        >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[30%]" />
        </div>
    )
}