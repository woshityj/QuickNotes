"use client";

import { createDocument } from "@/app/services/documentServices";
import PrimaryButton from "@/components/primary_button";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCookies } from "next-client-cookies";
import { Button } from "@/components/ui/button";

export default function DocumentPage() {

	const queryClient = useQueryClient();

	const router = useRouter();

	const cookies = useCookies();

	const createDocumentMutate = useMutation({
		mutationFn: createDocument,
		onError: () => {
			toast.error("Failed to create new note.")
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["documents"] });
			toast.success("Created new note.");
			router.push(`/documents/${data._id}`);

		},
	});

	function handleCreateNewDocument(e: FormEvent) {
		e.preventDefault();
		
		createDocumentMutate.mutate({authorizationToken: cookies.get("AuthorizationToken")});
	}

	return (
		<div className="h-full flex flex-col items-center justify-center space-y-4">
			<Image
				src="/static/images/empty.png"
				width={300}
				height={300}
				alt="Empty"
				className="dark:hidden"
			></Image>
			<Image
				src="/static/images/empty-dark.png"
				width={300}
				height={300}
				alt="Empty"
				className="hidden dark:block"
			>
			</Image>
			<h2 className="font-inter text-lg font-medium">
				Welcome to YuJie&apos;s QuickNotes
			</h2>
			<Button onClick={handleCreateNewDocument} className="font-inter font-semibold text-base leading-[1.438rem]">
				<PlusCircle className="h-4 w-4 mr-2" />
				Create a note
			</Button>
		</div>
	);
}
