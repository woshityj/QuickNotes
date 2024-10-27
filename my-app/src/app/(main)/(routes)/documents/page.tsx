"use client";

import { reAuthenticateUser } from "@/app/utils/authentication";
import { backendURL } from "@/app/utils/constants";
import PrimaryButton from "@/components/primary_button";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";

type Document = {
    _id: string,
    title: string,
    userId: string,
    isArchived: boolean,
    parentDocument: string,
    content: string,
    coverImage: string,
    icon: string,
    isPublished: boolean
}

const createDocument = async () => {
	try {
		const response = await fetch(`${backendURL}/documents/`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"Authorization": localStorage.getItem("AuthorizationToken") || "",
			},
			credentials: 'include',
		});

		if (response.ok) {
			toast.success("Created new note.");
			return response.json();
		}

	} catch (err) {
		console.log(err);
	}
}

export default function DocumentPage() {

	const queryClient = useQueryClient();

	const { mutate } = useMutation({
		mutationFn: createDocument,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["documents"]
			});
		},
	});

	function handleCreateNewDocument(e: FormEvent) {
		e.preventDefault();
		
		mutate();
	}

	return (
		<div className="h-full flex flex-col items-center justify-center space-y-4">
			<Image
				src="/static/images/empty.png"
				width={300}
				height={300}
				alt="Empty"
			></Image>
			<h2 className="font-inter text-lg font-medium">
				Welcome to YuJie&apos;s QuickNotes
			</h2>
			<PrimaryButton value={"Create a note"} onClickFunction={handleCreateNewDocument}>
				<PlusCircle className="h-4 w-4 mr-2" />
			</PrimaryButton>
		</div>
	);
}
