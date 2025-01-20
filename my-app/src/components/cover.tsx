"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeDocumentCoverImage } from "@/app/services/documentServices";
import { useParams } from "next/navigation";
import { useEdgeStore } from "@/lib/edgestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useCookies } from "next-client-cookies";

interface CoverImageProps {
    url?: string;
    preview?: boolean;
}

export default function Cover({url, preview}: CoverImageProps) {

    const coverImage = useCoverImage();
    const queryClient = useQueryClient();

    const params = useParams();

    const { edgestore } = useEdgeStore();

    const cookies = useCookies();

    const removeDocumentCoverImageMutate = useMutation({
        mutationFn: removeDocumentCoverImage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document", "detail", String(params.documentId)] });
        }
    });

    const onRemove = async () => {
        if (url) {
            await edgestore.publicFiles.delete({
                url: url
            });
        }

        removeDocumentCoverImageMutate.mutate({
            _id: String(params.documentId),
            authorizationToken: cookies.get("AuthorizationToken"),
        });
    }

    return (
        <div className={cn(
            "relative w-full h-[35vh] group",
            !url && "h-[12vh]",
            url && "bg-muted"
        )}>
            {!!url && (
                <Image
                    src={url}
                    fill
                    alt="Cover"
                    className="object-cover"
                ></Image>
            )}
            {url && !preview && (
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2">
                    <Button
                        onClick={() => coverImage.onReplace(url)}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change cover
                    </Button>
                    <Button
                        onClick={onRemove}
                        className="text-muted-foreground text-xs"
                        variant="outline"
                        size="sm"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                </div>
            )}
        </div>
    );
}

Cover.Skeleton = function CoverSkeleton() {
    return(
        <Skeleton className="w-full h-[12vh]" />
    )
}