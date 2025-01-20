"use client";

import { Document, removeDocumentIcon, updateDocument } from "@/app/services/documentServices";
import IconPicker from "./icon-picker";
import { Button } from "./ui/button";
import { ImageIcon, Smile, X } from "lucide-react";
import { ElementRef, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TextareaAutoSize from "react-textarea-autosize";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useCookies } from "next-client-cookies";

interface ToolbarProps {
    initialData: Document,
    preview?: boolean,
};

export default function Toolbar({ initialData, preview }: ToolbarProps) {

    const inputRef = useRef<ElementRef<"textarea">>(null);
    const [isEditting, setIsEditting] = useState(false);
    const [value, setValue] = useState(initialData?.title);

    const coverImage = useCoverImage();

    const queryClient = useQueryClient();

    const cookies = useCookies();

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", initialData._id] });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
    });

    const removeDocumentIconMutate = useMutation({
        mutationFn: removeDocumentIcon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", initialData._id] });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
    })

    const enableInput = () => {
        if (preview) return;

        setIsEditting(true);
        setTimeout(() => {
            setValue(initialData.title);
            inputRef.current?.focus();
        }, 0);
    };

    const disableInput = () => setIsEditting(false);

    const onInput = (value: string) => {
        setValue(value);
        updateDocumentMutate.mutate({
            _id: initialData._id,
            title: value || "Untitled",
            authorizationToken: cookies.get("AuthorizationToken")
        });
    };
    
    const onKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            disableInput();
        }
    };

    const onIconSelect = (icon: string) => {
        updateDocumentMutate.mutate({
            _id: initialData._id,
            icon: icon,
            authorizationToken: cookies.get("AuthorizationToken")
        })
    };

    const onIconDelete = () => {
        removeDocumentIconMutate.mutate({
            _id: initialData._id,
            authorizationToken: cookies.get("AuthorizationToken")
        });
    };

    return (
        <div className="pl-[54px] group relative">
            {!!initialData?.icon && !preview && (
                <div className="flex items-center gap-x-2 group/icon pt-6">
                    <IconPicker onChange={onIconSelect}>
                        <p className="text-6xl hover:opacity-75 transition">
                            {initialData.icon}
                        </p>
                    </IconPicker>
                    <Button
                        onClick={onIconDelete}
                        className="rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs"
                        variant="outline"
                        size="icon"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {!!initialData?.icon && preview && (
                <p className="text-6xl pt-6">
                    {initialData?.icon}
                </p>
            )}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4">
                {!initialData?.icon && !preview && (
                    <IconPicker asChild onChange={onIconSelect}>
                        <Button 
                            className="text-muted-foreground text-xs"
                            variant="outline"
                            size="sm"
                        >
                            <Smile className="h-4 w-4 mr-2" />
                            Add icon
                        </Button>
                    </IconPicker>
                )}
                {!initialData?.coverImage && !preview && (
                    <Button
                        onClick={coverImage.onOpen}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add cover
                    </Button>
                )}
            </div>
            {isEditting && !preview ? (
                <TextareaAutoSize 
                    ref={inputRef}
                    onBlur={disableInput}
                    onKeyDown={onKeyDown}
                    value={value}
                    onChange={(e) => onInput(e.target.value)}
                    className="text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none"
                />
            ) : (
                <div
                    onClick={enableInput}
                    className="pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]"
                >
                    {initialData?.title}
                </div>
            )}
        </div>
    )
}