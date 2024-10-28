"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, LucideIcon, MoreHorizontal, Plus, Trash } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useMutation, useQueryClient } from "react-query";
import { archiveDocument, createDocument } from "@/app/services/documentServices";
import { toast } from "sonner";
import { 
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuPortal
 } from "@radix-ui/react-dropdown-menu";

interface ItemProps {
    id?: string,
    documentIcon?: string,
    active?: boolean,
    expanded?: boolean,
    isSearch?: boolean,
    level?: number,
    onExpand?: () => void,
    label: string;
    onClick: () => void;
    icon: LucideIcon;
};

export const Item = ({id, label, onClick, icon: Icon, active, documentIcon, isSearch, level = 0, onExpand, expanded} : ItemProps) => {

    const queryClient = useQueryClient();

    const handleExpand = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        onExpand?.();
    };

    const createDocumentMutate = useMutation({
        mutationFn: createDocument,
		onError: () => {
			toast.error("Failed to create new note.")
		},
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["documents"]
            });
            toast.success("Created new note.")
        },
    });

    const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        if (!id) return;

        createDocumentMutate.mutate({ parentDocumentId: id });
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
                queryKey: ["archiveDocument"]
            });
            toast.success("Archived document.")
        },
    })

    const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        if (!id) return;

        archiveDocumentMutate.mutate({ id: id });
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
                    className="h-full rounded-sm hover:bg-neutral-300 dark:bg-neutral-600 mr-1"
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
                <Icon className="shrink-0 h-[18px] mr-2 text-muted-foreground" />
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
                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                className="w-60 bg-white z-[99999]"
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
                                    Last edited by: 
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
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