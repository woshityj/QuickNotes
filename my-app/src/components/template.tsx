"use client";

import { deleteTemplate, Template, updateTemplate, updateTemplatePublicity } from "@/app/services/templateServices";
import { Skeleton } from "./ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDocumentFromTemplate } from "@/app/services/documentServices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useCookies } from "next-client-cookies";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Circle, MoreHorizontal, NotebookIcon, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, User } from "@/app/services/userServices";

export const TemplateItem = ({_id, userId, title, coverImage, isPublic, createdBy}: {_id: string, userId: string, title: string, coverImage: string, isPublic: Boolean, createdBy: string}) => {

    const queryClient = useQueryClient();

    const router = useRouter();

    const cookies = useCookies();

    const [authorizationToken, setAuthorizationToken] = useState(cookies.get("AuthorizationToken") || "");

    const [currentUser, setCurrentUser] = useState<User>({
        id: '',
        name: '',
        email: ''
    });

    const createDocumentFromTemplateMutate = useMutation({
        mutationFn: createDocumentFromTemplate,
        onError: () => {
            toast.error("Failed to create note from template.");
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Created note from template.");
            router.push(`/documents/${data._id}`);
        },
    });

    const deleteTemplateMutate = useMutation({
        mutationFn: deleteTemplate,
        onError: () => {
            toast.error("Failed to delete template.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Deleted template.");
        },
    })

    const toggleTemplatePublicity = useMutation({
        mutationFn: updateTemplatePublicity,
        onError: () => {
            toast.error("Failed to update template.");
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Updated template.");
        },
    })

    function onToggleTemplatePublicity() {
        toggleTemplatePublicity.mutate({_id: _id, isPublic: !isPublic, authorizationToken: cookies.get("AuthorizationToken")});
    }

    const onDeleteTemplate = () => {
        deleteTemplateMutate.mutate({_id: _id, authorizationToken: cookies.get("AuthorizationToken")});
    }

    function handleCreateDocumentFromTemplate(e: FormEvent) {
        e.preventDefault();

        createDocumentFromTemplateMutate.mutate({_id: _id, authorizationToken: cookies.get("AuthorizationToken")});
    }

    useEffect(() => {
        const getCurrentUserDetails = async () => {
            const response = await getCurrentUser(authorizationToken);

            if (response.ok) {
                const user = await response.json();
                setCurrentUser({ id: user._id, name: user.name, email: user.email });
            }
        }
        
        getCurrentUserDetails();
    }, [authorizationToken]);

    return (
        <div className="col-span-1 flex flex-col">
            {
                coverImage ? (
                    <img className="w-80 h-52 object-cover rounded-md" src={coverImage} onClick={handleCreateDocumentFromTemplate} />
                ) : (
                    <img className="w-80 h-52 object-cover rounded-md" src="/static/images/template_img_1.jpeg" onClick={handleCreateDocumentFromTemplate} />
                )
            }
            <div className="flex content-center mt-2.5">
                <p className="text-sm font-medium leading-5">
                    {title}
                </p>
                <DropdownMenu>
                    <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    asChild
                    >
                        <div className="flex items-center group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-60 dark:bg-[#1F1F1F] z-[99999]"
                        align="start"
                        side="right"
                        forceMount
                    >
                        <DropdownMenuItem
                            onClick={handleCreateDocumentFromTemplate}
                        >
                            <NotebookIcon className="h-4 w-4 mr-2 border-none"></NotebookIcon>
                            Create Note from Template
                        </DropdownMenuItem>
                        { userId === currentUser.id && (
                        <>
                            <DropdownMenuItem onClick={onDeleteTemplate}>
                                <Trash className="h-4 w-4 mr-2"></Trash>
                                Delete Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onToggleTemplatePublicity}>
                                <Circle className={cn("h-4 w-4 mr-2 border-none stroke-none",
                                    isPublic ? "fill-green-500" : "fill-red-500"
                                )}></Circle>
                                { isPublic ? "Make Template Private" : "Make Template Public" }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                        )}

                        <div className="text-xs text-muted-foreground p-2">
                            Template Created By: {createdBy}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

TemplateItem.Skeleton = function TemplateSkeleton() {
    return (
        <div className="flex flex-col">
            <Skeleton className="h-56 w-80" />
            <Skeleton className="h-4 w-[120px] mt-2.5" />
        </div>
    )
}