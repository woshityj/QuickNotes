"use client";

import PrimaryButton from "@/components/primary_button";
import { PlusCircle } from "lucide-react";
import Image from "next/image";

export default function DocumentPage() {
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
			<PrimaryButton value={"Create a note"}>
				<PlusCircle className="h-4 w-4 mr-2" />
			</PrimaryButton>
		</div>
	);
}
