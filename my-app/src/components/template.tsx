"use client";

import { Template } from "@/app/services/templateServices";
import { Skeleton } from "./ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDocumentFromTemplate } from "@/app/services/documentServices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { useCookies } from "next-client-cookies";

export const TemplateItem = ({_id, title}: {_id: string, title: string}) => {

    const queryClient = useQueryClient();

    const router = useRouter();

    const cookies = useCookies();

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

    function handleCreateDocumentFromTemplate(e: FormEvent) {
        e.preventDefault();

        createDocumentFromTemplateMutate.mutate({_id: _id, authorizationToken: cookies.get("AuthorizationToken")});
    }

    return (
        <div className="col-span-1 flex flex-col">
            <img className="w-full h-auto" src="/static/images/template_img_1.jpeg" onClick={handleCreateDocumentFromTemplate} />
            <p className="text-sm font-medium leading-5 mt-2.5">
                {title}
            </p>
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