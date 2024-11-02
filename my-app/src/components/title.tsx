"use client";

import { Document, getDocument, updateDocument } from "@/app/services/documentServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "./ui/spinner";
import { useDebounce } from "@uidotdev/usehooks";

interface TitleProps {
    initialData: Document
}

export default function Title({initialData}: TitleProps) {

    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    
    const [title, setTitle] = useState(initialData.title);
    const [isEditting, setIsEditting] = useState(false);

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", initialData._id] });
        }
    })

    // const updateDocumentMutate = useMutation({
    //     mutationFn: updateDocument,
        // onMutate: async (newDocument) => {
        //     // Cancel any outgoing refetches
        //     await queryClient.cancelQueries(["documentDetail", initialData._id]);

        //     // Snapshot the previous value
        //     const previousDocument = queryClient.getQueryData<Document>(["documentDetail", initialData._id]);

        //     // Optimistically update to the new value
        //     queryClient.setQueryData(["documentDetail", initialData._id], {
        //         ...previousDocument,
        //         title: newDocument.title // Update the title optimistically
        //     });
        //     console.log(queryClient.getQueryData(["documentDetail", initialData._id]));

        //     return { previousDocument }; // Return context for onError
        // },
        // onSuccess: () => {
            // const previousDocument = queryClient.getQueryData<Document>(["documents", "detail", initialData._id]);

            // queryClient.setQueryData(["documents", "detail", initialData._id], {
            //     ...previousDocument,
            //     title: title // Update the title optimistically
            // });
            // queryClient.invalidateQueries(["documentDetail", initialData._id]);
            // queryClient.setQueryData(["documentDetail", initialData._id], data);
            // queryClient.removeQueries(["documentDetail", initialData._id]);

            // queryClient.invalidateQueries(["documentDetail", initialData._id]);
            // console.log(queryClient.getQueryCache().getAll());
    //     }
    // })

    const enableInput = () => {
        setIsEditting(true);
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
        }, 0)
    };

    const disableInput = () => {
        setIsEditting(false);

        updateDocumentMutate.mutate({
            _id: initialData._id,
            title: title,
            content: initialData.content,
            coverImage: initialData.coverImage,
            icon: initialData.icon,
            isPublished: initialData.isPublished
        });
    };

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
    }

    const onKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            disableInput();
        }
    }
    
    return (
        <div className="flex items-center gap-x-1">
            {!!initialData?.icon && <p>{initialData?.icon}</p>}
            {isEditting ? (
                <Input
                    ref={inputRef}
                    onClick={enableInput}
                    onBlur={disableInput}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    value={title}
                    className="h-7 px-2 focus-visible::ring-transparent"
                />
            ) : (
                <Button
                    onClick={enableInput}
                    variant="ghost"
                    size="sm"
                    className="font-normal h-auto p-1"
                >
                    <span className="truncate">
                        {title}
                    </span>
                </Button>
            )}
        </div>
    )
}