"use client";

import { Document, updateDocument } from "@/app/services/documentServices";
import {
    PopoverTrigger,
    Popover,
    PopoverContent
} from "@/components/ui/popover";
import { useOrigin } from "@/hooks/use-origin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Check, Copy, Globe } from "lucide-react";
import { useCookies } from "next-client-cookies";

interface PublishProps {
    initialData: Document
}

export default function Publish({initialData}: PublishProps) {

    const queryClient = useQueryClient();
    const origin = useOrigin();
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cookies = useCookies();

    const url = `${origin}/preview/${initialData._id}`;

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onError: () => {
            toast.error("Failed to publish note.");
        },
        onSuccess: () => {
            setIsSubmitting(false);
            initialData.isPublished ? toast.success("Note unpublished.") : toast.success("Note published.");
            queryClient.invalidateQueries({ queryKey: ["document", "detail", initialData._id] });
        }
    });

    const onPublish = () => {
        setIsSubmitting(true);

        updateDocumentMutate.mutate({
            _id: initialData._id,
            isPublished: true,
            authorizationToken: cookies.get("AuthorizationToken")
        });
    }

    const onUnPublish = () => {
        setIsSubmitting(true);

        updateDocumentMutate.mutate({
            _id: initialData._id,
            isPublished: false,
            authorizationToken: cookies.get("AuthorizationToken")
        });
    }

    const onCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);

        setTimeout(() => {
            setCopied(false);
        }, 1000);
    }


    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="sm" variant="ghost">
                    Publish
                    {initialData.isPublished && (
                    <Globe 
                        className="text-sky-500 w-4 h-4 ml-2"
                    />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-72"
                align="end"
                alignOffset={8}
                forceMount
            >
                {initialData.isPublished ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-x-2">
                            <Globe className="text-sky-500 animate-pulse h-4 w-4" />
                            <p className="text-xs font-medium text-sky-500">
                                This note is live on web.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <input 
                                className="flex-1 px-2 text-xs border rounded-l-md h-8 bg-muted truncate"
                                value={url}
                                disabled
                            />
                            <Button
                                onClick={onCopy}
                                disabled={copied}
                                className="h-8 rounded-l-none"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            className="w-full text-xs"
                            disabled={isSubmitting}
                            onClick={onUnPublish}
                        >
                            Unpublish
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <Globe
                            className="h-8 w-8 text-muted-foreground mb-2"
                        />
                        <p className="text-sm font-medium mb-2">
                            Publish this note
                        </p>
                        <span className="text-xs text-muted-foreground mb-4">
                            Share your work with others.
                        </span>
                        <Button
                            disabled={isSubmitting}
                            onClick={onPublish}
                            className="w-full text-xs"
                            size="sm"
                        >
                            Publish
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}