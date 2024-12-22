"use client";

import {
	ChatBubble,
	ChatBubbleAction,
	ChatBubbleAvatar,
	ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
	ExpandableChat,
	ExpandableChatHeader,
	ExpandableChatBody,
	ExpandableChatFooter,
} from "@/components/ui/chat/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "./ui/button";
import { CopyIcon, CornerDownLeft, Mic, Paperclip, RefreshCcw, Send, Volume2, X } from "lucide-react";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeDisplayBlock from "./code-display-block";
import { backendURL } from "@/app/utils/constants";
import { toast } from "sonner";


const ChatAiIcons = [
	{
	  icon: CopyIcon,
	  label: "Copy",
	},
	{
	  icon: RefreshCcw,
	  label: "Refresh",
	},
	{
	  icon: Volume2,
	  label: "Volume",
	},
];

interface Message {
	role: 'user' | 'assistant';
	content: string
}

export default function ChatSupport() {

	const [authorizationToken, setAuthorizationToken] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedImage, setSelectedImage] = useState<any>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [base64, setBase64] = useState<string | null>(null);
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const imageInputRef = useRef<HTMLInputElement>(null);
	const messagesRef = useRef<HTMLDivElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		const authorizationTokenValue = localStorage.getItem("AuthorizationToken");
		setAuthorizationToken(authorizationTokenValue);
	}, []);

	const resetChatBotState = () => {
		setSelectedImage(null);
		setPreview(null);
		setBase64(null);

		setIsLoading(false);
		setIsGenerating(false);
	}

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();

		const newMessages = [...messages, { role: 'user' as 'user', content: input }];
		setMessages(newMessages);
		setInput('');
		setIsLoading(true);
		setIsGenerating(true);

		try {
			const response = await fetch(`${backendURL}/llm/chat`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ messages: newMessages, file: base64 }),
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();

			setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: data } ]);

		} catch (error) {
			console.log("Error sending message:", error);

			setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: 'Sorry, I could not process your request at this time. Please try again later.'} ]);

		} finally {
			resetChatBotState();
		}
	}

	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	const handleActionClick = async (action: string, messageIndex: number) => {
		console.log("Action clicked: ", action, "Message Index: ", messageIndex);
		if (action === "Copy") {
			const message = messages[messageIndex];
			if (message && message.role == "assistant") {
				navigator.clipboard.writeText(message.content);
				toast.success("Copied to clipboard");
			}
		}
	}

	const handleImageUploadButtonClick = () => {
		imageInputRef.current?.click();
	}

	const handleImageUpload = async (event: React.FormEvent) => {
		event.preventDefault();
		const target= event.target as HTMLInputElement;
		if (!target.files) return;
		const file = target.files[0];
		
		const imageUrl = URL.createObjectURL(file);
		setPreview(imageUrl);
		setSelectedImage(file);

		const reader = new FileReader();
		
		reader.readAsDataURL(file);

		reader.onloadend = () => {
			const base64String = reader.result as string;
			const plainBase64 = base64String.split(',')[1];
			setBase64(plainBase64);
		}
	}

	return (
		<ExpandableChat size="sm" position="bottom-right">
			<ExpandableChatHeader className="flex-col text-center justify-center">
				<h1 className="text-xl font-semibold">Chat with our AI ✨</h1>
				<p>Ask any question for our AI to answer</p>
				<div className="flex gap-2 items-center pt-2">
					<Button variant="secondary">New Chat</Button>
					<Button variant="secondary">See FAQ</Button>
				</div>
			</ExpandableChatHeader>
			<ExpandableChatBody>
				<ChatMessageList ref={messagesRef}>
					{messages && messages.map((message, index) => (
						<ChatBubble
							key={index}
							variant={message.role == "user" ? "sent" : "received"}
						>
							<ChatBubbleAvatar
								src=""
								fallback={message.role == "user" ? "👨🏽" : "🤖"}
							/>
							<ChatBubbleMessage>
								{message.content.split("```").map((part: string, index: number) => {
									if (index % 2 === 0) {
										return (
											<Markdown key={index} remarkPlugins={[remarkGfm]}>
												{part}
											</Markdown>
										);
									} else {
										return (
											<pre className="whitespace-pre-wrap pt-2" key={index}>
												<CodeDisplayBlock code={part} lang="" />
											</pre>
										)
									}
								})}

								{message.role === "assistant" && messages.length - 1 === index && (
									<div className="flex items-center mt-1.5 gap-1">
										{!isGenerating && (
											<>
												{ChatAiIcons.map((icon, iconIndex) => {
													const Icon = icon.icon;

													return (
														<ChatBubbleAction
															variant="outline"
															className="size-5"
															key={iconIndex}
															icon={<Icon className="size-3" />}
															onClick={() => handleActionClick(icon.label, index)}
														/>
													)
												})}
											</>
										)}
									</div>
								)}
							</ChatBubbleMessage>
						</ChatBubble>
					))}

					{isGenerating && (
						<ChatBubble variant="received">
							<ChatBubbleAvatar src="" fallback="🤖" />
							<ChatBubbleMessage isLoading />
						</ChatBubble>
					)}
				</ChatMessageList>
			</ExpandableChatBody>
			<ExpandableChatFooter>
				<div className="w-full px-4">

				{preview && (
						<div className="relative mb-2">
							<img className="w-12 h-12 object-cover rounded-md border" src={preview} alt="Preview Image"></img>
							<Button
								variant="ghost"
								size="icon"
								className="absolute top-1 right-1"
								onClick={() => {
									setPreview(null);
									setSelectedImage(null);
								}}>
								<X className="size-4"></X>
							</Button>
						</div>
				)}
				<form 
					className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
					ref={formRef}
					onSubmit={sendMessage}
				>

					<ChatInput
						value={input}
						onChange={(e) => setInput(e.target.value)}
						disabled={isLoading}
						// onKeyDown={onKeyDown}
						// onChange={handleInputChange}
						placeholder="Type your message here..."
						className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
					/>
						<div className="flex items-center p-3 pt-0">
							<Button type="button" variant="ghost" size="icon" onClick={handleImageUploadButtonClick}>
								<Paperclip className="size-4" />
								<span className="sr-only">Attach file</span>
								<input ref={imageInputRef} className="hidden" type="file" accept="image/*" onChange={handleImageUpload}></input>
							</Button>

							<Button variant="ghost" size="icon">
								<Mic className="size-4" />
								<span className="sr-only">Use Microphone</span>
							</Button>

							<Button
								disabled={!input || isLoading}
								type="submit"
								size="sm"
								className="ml-auto gap-1.5"
							>
								Send Message
								<CornerDownLeft className="size-3.5" />
							</Button>
						</div>
					</form>
				</div>
			</ExpandableChatFooter>
		</ExpandableChat>
	);
}
