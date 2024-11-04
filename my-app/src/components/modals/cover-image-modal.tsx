"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader
} from "@/components/ui/dialog";
import { useCoverImage } from "@/hooks/use-cover-image";
import { SingleImageDropzone } from "@/components/single-image-dropzone";
import { useState } from "react";
import { useEdgeStore } from "@/lib/edgestore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDocument } from "@/app/services/documentServices";
import { useParams } from "next/navigation";

export default function CoverImageModal() {
    const params = useParams();
    const [file, setFile] = useState<File>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const coverImage = useCoverImage();

    const { edgestore } = useEdgeStore();

    const queryClient = useQueryClient();

    const updateDocumentMutate = useMutation({
        mutationFn: updateDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", String(params.documentId)] });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        }
    });
    
    const onClose = () => {
        setFile(undefined);
        setIsSubmitting(false);
        coverImage.onClose();
    }

    const onChangeImage = async (file?: File) => {
        if (file) {
            setIsSubmitting(true);
            setFile(file);

            const res = await edgestore.publicFiles.upload({
                file,
                options: {
                    replaceTargetUrl: coverImage.url
                }
            })

            updateDocumentMutate.mutate({
                _id: String(params.documentId),
                coverImage: res.url
            });

            onClose();
        }
    };

    return (
        <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
            <DialogContent>
                <DialogHeader>
                    <h2 className="text-center text-lg font-semibold">
                        Cover Image
                    </h2>
                </DialogHeader>
                <SingleImageDropzone 
                    className="w-full outline-none"
                    disabled={isSubmitting}
                    value={file}
                    onChange={onChangeImage}
                />
            </DialogContent>
        </Dialog>
    )
}