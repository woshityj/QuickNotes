import { Document, getArchivedDocuments, removeDocument, restoreDocument } from "@/app/services/documentServices";
import { useParams, useRouter } from "next/navigation"
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "./ui/spinner";
import { Search, Trash, Undo } from "lucide-react";
import { Input } from "./ui/input";
import ConfirmModal from "./modals/confirm-modal";
import { useDebounce } from "@uidotdev/usehooks";
import { useCookies } from "next-client-cookies";

export default function TrashBox () {
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();

    const cookies = useCookies();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);

    const { data, status } = useQuery({
        queryKey: ["documents", debouncedSearch, cookies.get("AuthorizationToken")],
        queryFn: () => getArchivedDocuments(debouncedSearch, cookies.get("AuthorizationToken")),
    })

    const restoreDocumentMutate = useMutation({
        mutationFn: restoreDocument,
        onError: () => {
            toast.error("Failed to restore note.")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Restored notes.");
        },
    });

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

    const onClick = (documentId: string) => {
        router.push(`/documents/${documentId}`);
    }

    const onRestore = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        documentId: string
    ) => {
        event.stopPropagation();

        restoreDocumentMutate.mutate({ id: documentId, authorizationToken: cookies.get("AuthorizationToken") });
    }

    const onRemove = (
        documentId: string
    ) => {

        removeDocumentMutate.mutate({ id: documentId, authorizationToken: cookies.get("AuthorizationToken") });

        // If user is currently viewing the deleted document, redirect
        // the user back to the documents page.
        if (params.documentId === documentId) {
            router.push("/documents");
        }
    };

    if (data === undefined) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Spinner size="lg" />
            </div>
        )   
    }

    return (
        <div className="text-sm dark:bg-[#1F1F1F]">
            <div className="flex items-center gap-x-1 p-2">
                <Search className="h-4 w-4" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
                    placeholder="Filter by page title..."
                />
            </div>
            <div className="mt-2 px-1 pb-1">
                <p className="hidden last:block text-xs text-center text-muted-foreground p-2">
                    No documents found.
                </p>
                {data?.map((document: Document) => (
                    <div
                        key={document._id}
                        role="button"
                        onClick={() => onClick(document._id)}
                        className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
                        >
                            <span className="truncate pl-2">
                                {document.title}
                            </span>
                            <div className="flex items-center">
                                <div
                                    onClick={(e) => onRestore(e, document._id)}
                                    role="button"
                                    className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    <Undo className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <ConfirmModal onConfirm={() => onRemove(document._id)}>
                                <div
                                    role="button"
                                    className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    <Trash className="h-4 w-4 text-muted-foreground" />
                                </div>
                                </ConfirmModal>
                            </div>
                    </div>
                ))}
            </div>
        </div>
    )
}