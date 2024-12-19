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
import { CopyIcon, CornerDownLeft, Mic, Paperclip, RefreshCcw, Send, Volume2 } from "lucide-react";
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
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const authorizationTokenValue = localStorage.getItem("AuthorizationToken");
		setAuthorizationToken(authorizationTokenValue);
	}, []);

	const sendMessage = async (e: React.FormEvent) => {
		e.preventDefault();

		const newMessages = [...messages, { role: 'user' as 'user', content: input }];
		setMessages(newMessages);
		setInput('');
		setIsLoading(true);

		try {
			const response = await fetch(`${backendURL}/llm/chat`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ messages: newMessages }),
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
			setIsLoading(false);
		}
	}



	const [isGenerating, setIsGenerating] = useState(false);
	// const { messages, input, handleInputChange, handleSubmit, isLoading, reload, setData } = useChat({
	// 	api: '/api/custom_chat',
	// 	headers: {
	// 		Authorization: authorizationToken || ""
	// 	},
	// 	credentials: 'include',
	// 	onResponse: response => {
	// 		console.log("Response: ", response);
	// 	},
	// 	onError(error) {
	// 		if (error) {
	// 			setIsGenerating(false);
	// 		}
	// 	},
	// 	onFinish: (message) => {
	// 		console.log("Finished generating: ", message);
	// 	}
	// });

	const messagesRef = useRef<HTMLDivElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (messagesRef.current) {
			messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
		}
	}, [messages]);

	// const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
	// 	e.preventDefault();
	// 	setIsGenerating(true);
	// 	handleSubmit(e);
	// }

	// const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
	// 	if (e.key === "Enter" && !e.shiftKey) {
	// 		e.preventDefault();
	// 		if (isGenerating || isLoading || !input) return;
	// 		setIsGenerating(true);
	// 		onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
	// 	}
	// };

	// const handleActionClick = async (action: string, messageIndex: number) => {
	// 	console.log("Action clicked: ", action, "Message Index: ", messageIndex);
	// 	if (action === "Refresh") {
	// 		setIsGenerating(true);
	// 		try {
	// 			await reload();
	// 		} catch (error) {
	// 			console.log("Error reloading: ", error);
	// 		} finally {
	// 			setIsGenerating(false);
	// 		}
	// 	}

	// 	if (action === "Copy") {
	// 		const message = messages[messageIndex];
	// 		if (message && message.role == "assistant") {
	// 			navigator.clipboard.writeText(message.content);
	// 		}
	// 	}
	// };

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
							<Button variant="ghost" size="icon">
								<Paperclip className="size-4" />
								<span className="sr-only">Attach file</span>
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
				
				{/* <div className="flex relative gap-2">
					<ChatInput className="min-h-12 bg-background shadow-none" />
					<Button size="icon" className="absolute top-1/2 right-2 transform size-8 -translate-y-1/2">
						<Send className="size-4" />
					</Button>
				</div> */}
			</ExpandableChatFooter>
		</ExpandableChat>
	);
}
