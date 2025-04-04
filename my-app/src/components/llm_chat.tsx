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
import { CopyIcon, CornerDownLeft, Globe, Mic, NotebookPen, Paperclip, RefreshCcw, Send, Volume2, X } from "lucide-react";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeDisplayBlock from "./code-display-block";
import { backendURL } from "@/app/utils/constants";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { Toggle } from "./ui/toggle";
import { questionAnswerWithNotes, questionAnswerWithRag } from "@/app/services/llmServices";
import { useCookies } from "next-client-cookies";


const ChatAiIcons = [
	{
	  icon: CopyIcon,
	  label: "Copy",
	},
	// {
	//   icon: RefreshCcw,
	//   label: "Refresh",
	// },
	// {
	//   icon: Volume2,
	//   label: "Volume",
	// },
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
	
	const [ragEnabled, setRagEnabled] = useState(false);
	const [notesRAGEnabled, setNotesRAGEnabled] = useState(false);

	const imageInputRef = useRef<HTMLInputElement>(null);
	const messagesRef = useRef<HTMLDivElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const cookies = useCookies();

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
		const userMessage = input;
		setMessages(newMessages);
		setInput('');
		setIsLoading(true);
		setPreview(null);
		setIsGenerating(true);

		try {
			// If RAG is enabled, only send the message to the RAG model
			if (ragEnabled && !notesRAGEnabled) {
				const questionAnswerWithRagResult = await questionAnswerWithRag({ content: userMessage });
				
				if (questionAnswerWithRagResult.data) {
					setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: questionAnswerWithRagResult.data } ]);
				} else {
					setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: "Sorry, I could not process your request at this time. Please try again later." } ]);
				}
			}
			else if (notesRAGEnabled && !ragEnabled) {
				const questionAnswerWithNotesResult = await questionAnswerWithNotes({ content: userMessage, authorizationToken: cookies.get("AuthorizationToken") });

				if (questionAnswerWithNotesResult.data) {
					setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: questionAnswerWithNotesResult.data } ]);
				} else {
					setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: "Sorry, I could not process your request at this time. Please try again later." } ]);
				}
			}
			// If RAG is not enabled, send the messages and file to the LLM model
			else {
				const formData = new FormData();
				formData.append("messages", JSON.stringify(newMessages));
				formData.append("file", selectedImage);

				const response = await fetch(`${backendURL}/llm/chat`, {
					method: "POST",
					body: formData
				});

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();

				setMessages(prevMessages => [...prevMessages, { role: 'assistant' as 'assistant', content: data} ]);
			}
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
		
		if (file.type.split("/")[0] === "image") {
			const imageUrl = URL.createObjectURL(file);
			setPreview(imageUrl);
		} else if (file.type.split("/")[0] === "video") {
			setPreview("/static/images/video_png.png");
		} else {
			setPreview("/static/images/pdf_icon.png");
		}
		// const imageUrl = URL.createObjectURL(file);
		// setPreview(imageUrl);
		setSelectedImage(file);

		const reader = new FileReader();
		
		reader.readAsDataURL(file);

		reader.onloadend = () => {
			const base64String = reader.result as string;
			const plainBase64 = base64String.split(',')[1];
			setBase64(plainBase64);
		}
	}

	const handleClearImage = () => {
		if (preview) {
			URL.revokeObjectURL(preview);
		}
		setPreview(null);
		setSelectedImage(null);
		setBase64(null);

		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	}

	return (
		<ExpandableChat size="md" position="bottom-right">
			<ExpandableChatHeader className="flex-col text-center justify-center">
				<h1 className="text-xl font-semibold">Chat with our AI ✨</h1>
				<p>Ask any question for our AI to answer</p>
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
															className="size-5 dark:bg-[#262626]"
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
							<img className="w-12 h-12 object-contain rounded-md border" src={preview} alt="Preview Image"></img>
							<Button
								variant="ghost"
								size="icon"
								className="absolute top-1 right-1"
								onClick={handleClearImage}>
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
								<input ref={imageInputRef} className="hidden" type="file" accept="image/*, application/pdf, video/mp4" onChange={handleImageUpload}></input>
							</Button>

							<Button variant="ghost" size="icon" onClick={(event) => event.preventDefault()}>
								<Mic className="size-4" />
								<span className="sr-only">Use Microphone</span>
							</Button>

							<Toggle aria-label="Toggle RAG" pressed = {ragEnabled} onPressedChange={() => {
								setRagEnabled(!ragEnabled);
								setNotesRAGEnabled(false);	
							}}>
								<Globe className="h-4 w-4" />
							</Toggle>

							<Toggle aria-label="Toggle Notes RAG" pressed = {notesRAGEnabled} onPressedChange={() => {
								setNotesRAGEnabled(!notesRAGEnabled);
								setRagEnabled(false);
							}}>
								<NotebookPen className="h-4 w-4" />
							</Toggle>

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
