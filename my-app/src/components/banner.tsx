"use client";

import { removeDocument, restoreDocument } from "@/app/services/documentServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import ConfirmModal from "./modals/confirm-modal";

interface BannerProps {
    documentId: string
}

export default function Banner({documentId}: BannerProps) {

    const router = useRouter();
    const queryClient = useQueryClient();

    const removeDocumentMutate = useMutation({
        mutationFn: removeDocument,
        onError: () => {
            toast.error("Failed to delete note.")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Deleted note.");
        }
    });

    const restoreDocumentMutate = useMutation({
        mutationFn: restoreDocument,
        onError: () => {
            toast.error("Failed to restore note.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            queryClient.invalidateQueries({ queryKey: ["document", "detail", documentId] });
            toast.success("Restored notes");
        }
    });

    const onRemove = (documentId: string) => {
        removeDocumentMutate.mutate({ id: documentId });   

        router.push("/documents");
    }

    const onRestore = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        documentId: string) => {
        event.stopPropagation();
        restoreDocumentMutate.mutate({ id: documentId });
    }


    return (
        <div className="w-full bg-rose-500 text-center text-sm p-2 text-white flex items-center gap-x-2 justify-center">
            <p>
                This page is in the Trash.
            </p>
            <Button
                size="sm"
                onClick={(e) => onRestore(e, documentId)}
                variant="outline"
                className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
            >
                Restore page
            </Button>
            <ConfirmModal onConfirm={() => onRemove(documentId)}>
                <Button
                    size="sm"
                    variant="outline"
                    className="border-white bg-transparent hover:bg-primary/5 text-white hover:text-white p-1 px-2 h-auto font-normal"
                >
                    Delete forever
                </Button>
            </ConfirmModal>
        </div>
    )
}