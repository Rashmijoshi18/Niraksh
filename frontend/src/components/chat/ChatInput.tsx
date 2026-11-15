"use client";

import {
	useState,
	useRef,
	useCallback,
	forwardRef,
	useImperativeHandle,
	useEffect,
	type FormEvent,
	type KeyboardEvent,
} from "react";
import { Send, ImagePlus, X, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ChatLanguage } from "@/types/chat";
import { getSpeechRecognitionLocale, getLanguageDirection } from "@/lib/constants";

// Web Speech API types (not in default lib.dom)
interface SpeechRecognitionResult {
	[index: number]: { transcript: string };
	length: number;
	isFinal: boolean;
}
interface SpeechRecognitionEvent extends Event {
	results: SpeechRecognitionResult[];
}
interface SpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onend: (() => void) | null;
	onerror: ((event?: Event) => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}
interface SpeechRecognitionConstructor {
	new (): SpeechRecognitionInstance;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
	if (typeof window === "undefined") return undefined;
	return (
		(window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
		(window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor })
			.webkitSpeechRecognition
	);
}

/* ------------------------------------------------------------------ */
/*  ChatInput Props & Ref                                             */
/* ------------------------------------------------------------------ */

interface ChatInputProps {
	onSend: (content: string, image?: File) => void;
	onStop?: () => void;
	disabled?: boolean;
	placeholder?: string;
	inputLanguage?: ChatLanguage;
}

export interface ChatInputRef {
	setDraftMessage: (msg: string) => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
	{
		onSend,
		onStop,
		disabled = false,
		placeholder = "Describe your symptoms or ask a health question...",
		inputLanguage,
	},
	ref,
) {
	const [message, setMessage] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [announcement, setAnnouncement] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isListening, setIsListening] = useState(false);
	const [isSpeechSupported] = useState(() => !!getSpeechRecognition());
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

	const announce = useCallback((text: string) => {
		setAnnouncement(text);
	}, []);

	const resizeTextarea = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const SpeechRecognitionCtor = getSpeechRecognition();

		if (!SpeechRecognitionCtor) {
			return;
		}

		const recognition = new SpeechRecognitionCtor();
		recognition.continuous = false;
		recognition.interimResults = false;
		// Match speech recognition language to current chat language (11 Indian languages with fallback)
		const lang = getSpeechRecognitionLocale(inputLanguage);
		recognition.lang = lang;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			const transcript = Array.from(event.results)
				.map((result: SpeechRecognitionResult) => result[0]?.transcript ?? "")
				.join(" ")
				.trim();

			if (!transcript) return;

			setMessage((prev) => {
				const next = prev ? `${prev.trim()} ${transcript}` : transcript;
				return next;
			});

			announce(`Voice text transcribed: ${transcript}`);

			// Resize after React has applied the new value
			setTimeout(() => {
				resizeTextarea();
			}, 0);
		};

		recognition.onend = () => {
			setIsListening(false);
			announce("Voice input stopped.");
		};

		recognition.onerror = (event?: Event) => {
			setIsListening(false);
			const speechError = (event as { error?: string }).error;
			if (speechError === "language-not-supported") {
				announce(
					`Voice recognition in ${inputLanguage || "selected language"} is not supported by your browser. Please type or use English speech.`
				);
			} else {
				announce("Voice input error encountered.");
			}
		};

		recognitionRef.current = recognition;

		return () => {
			if (recognitionRef.current) {
				try {
					recognitionRef.current.abort();
				} catch {
					// Ignore cleanup errors
				}
			}
			recognitionRef.current = null;
		};
	}, [resizeTextarea, inputLanguage, announce]);

	useImperativeHandle(ref, () => ({
		setDraftMessage: (msg: string) => {
			setMessage(msg);
			announce(`Draft message populated: ${msg}`);
			// Auto-resize for the new text
			setTimeout(() => {
				resizeTextarea();
			}, 0);
		},
	}));

	const handleSubmit = useCallback(
		(e?: FormEvent) => {
			e?.preventDefault();
			const content = message.trim();
			if (!content && !image) return;

			if (isListening && recognitionRef.current) {
				try {
					recognitionRef.current.stop();
				} catch {
					// Ignore stop errors
				}
				setIsListening(false);
			}

			onSend(content, image ?? undefined);
			announce("Message sent.");
			setMessage("");
			setImage(null);
			setImagePreview(null);
			setFileError(null);
			// Reset textarea height
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}
		},
		[message, image, onSend, isListening, announce],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			} else if (e.key === "Escape") {
				if (isListening && recognitionRef.current) {
					e.preventDefault();
					try {
						recognitionRef.current.stop();
					} catch {
						// Ignore stop errors
					}
					setIsListening(false);
					announce("Voice input cancelled.");
				} else if (fileError) {
					e.preventDefault();
					setFileError(null);
				}
			}
		},
		[handleSubmit, isListening, fileError, announce],
	);

	const handleImageSelect = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file type
			if (!file.type.startsWith("image/")) {
				const errorMsg = "Selected file is not an image. Please choose a JPEG, PNG, or WebP file.";
				setFileError(errorMsg);
				announce(errorMsg);
				e.target.value = "";
				return;
			}

			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				const errorMsg = "Image exceeds the 5 MB size limit. Please choose a smaller image.";
				setFileError(errorMsg);
				announce(errorMsg);
				e.target.value = "";
				return;
			}

			setFileError(null);
			setImage(file);
			announce(`Image attached: ${file.name}`);

			const reader = new FileReader();
			reader.onload = (ev) => {
				setImagePreview(ev.target?.result as string);
			};
			reader.readAsDataURL(file);

			// Reset input so same file can be selected again
			e.target.value = "";
		},
		[announce],
	);

	const removeImage = useCallback(() => {
		const removedName = image?.name;
		setImage(null);
		setImagePreview(null);
		setFileError(null);
		announce(removedName ? `Attached image ${removedName} removed.` : "Attached image removed.");
	}, [image, announce]);

	// Auto-resize textarea
	const handleTextareaInput = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setMessage(e.target.value);
			resizeTextarea();
		},
		[resizeTextarea],
	);

	const handleToggleListening = useCallback(() => {
		if (!isSpeechSupported || disabled) return;

		if (isListening) {
			// Stop current session
			try {
				recognitionRef.current?.stop();
			} catch {
				// Ignore stop errors
			}
			setIsListening(false);
			announce("Voice input stopped.");
		} else {
			// Create a fresh recognition instance each time to avoid InvalidStateError
			const SpeechRecognitionCtor = getSpeechRecognition();
			if (!SpeechRecognitionCtor) return;

			const recognition = new SpeechRecognitionCtor();
			recognition.continuous = false;
			recognition.interimResults = false;
			recognition.lang = inputLanguage === "hi" ? "hi-IN" : "en-US";

			recognition.onresult = (event: SpeechRecognitionEvent) => {
				const transcript = Array.from(event.results)
					.map((result: SpeechRecognitionResult) => result[0]?.transcript ?? "")
					.join(" ")
					.trim();

				if (!transcript) return;

				setMessage((prev) => {
					const next = prev ? `${prev.trim()} ${transcript}` : transcript;
					return next;
				});

				announce(`Voice text transcribed: ${transcript}`);

				setTimeout(() => {
					resizeTextarea();
				}, 0);
			};

			recognition.onend = () => {
				setIsListening(false);
				announce("Voice input stopped.");
			};

			recognition.onerror = () => {
				setIsListening(false);
				announce("Voice input error encountered.");
			};

			recognitionRef.current = recognition;

			try {
				recognition.start();
				setIsListening(true);
				announce("Voice input started. Speak into your microphone.");
			} catch {
				setIsListening(false);
				announce("Failed to start voice input.");
			}
		}
	}, [disabled, isListening, isSpeechSupported, inputLanguage, resizeTextarea, announce]);

	return (
		<div
			role="region"
			aria-label="Chat message composer"
			className="border-t border-border bg-surface px-4 py-3"
		>
			{/* Screen reader live announcements */}
			<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
				{announcement}
			</div>

			{/* File upload error alert */}
			{fileError && (
				<div
					role="alert"
					aria-live="assertive"
					className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					<span>{fileError}</span>
					<button
						type="button"
						onClick={() => setFileError(null)}
						className="flex size-7 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
						aria-label="Dismiss upload error"
					>
						<X className="size-3.5" aria-hidden="true" />
					</button>
				</div>
			)}

			{/* Active listening status banner (visible indicator beyond color alone) */}
			{isListening && (
				<div
					role="status"
					aria-live="polite"
					className="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
				>
					<span className="relative flex size-2">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-primary" />
					</span>
					<span>Listening... Speak into your microphone</span>
					<button
						type="button"
						onClick={handleToggleListening}
						className="ml-auto rounded px-2 py-1 text-xs font-semibold text-primary underline transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						aria-label="Stop recording voice input"
					>
						Stop
					</button>
				</div>
			)}

			{/* Image preview */}
			{imagePreview && (
				<div className="mb-2 inline-flex items-start gap-2" role="group" aria-label="Attached image">
					<div className="relative size-16 overflow-hidden rounded-lg border border-border">
						<Image
							src={imagePreview}
							alt={image ? `Attachment preview: ${image.name}` : "Attached image preview"}
							fill
							className="object-cover"
						/>
					</div>
					<button
						type="button"
						onClick={removeImage}
						className={cn(
							"flex size-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors",
							"hover:bg-destructive/20 active:bg-destructive/30",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
						)}
						aria-label={image ? `Remove attached image ${image.name}` : "Remove attached image"}
					>
						<X className="size-4" aria-hidden="true" />
					</button>
				</div>
			)}

			{/* Input row */}
			<form onSubmit={handleSubmit} className="flex items-end gap-2" noValidate>
				{/* Image upload button */}
				<button
					type="button"
					onClick={handleImageSelect}
					disabled={disabled}
					className={cn(
						"flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-2.5 text-muted transition-colors",
						"hover:bg-border hover:text-foreground",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					aria-label={
						disabled
							? "Attach image (disabled while response is generating)"
							: image
								? `Replace attached image (currently: ${image.name})`
								: "Attach image (JPEG, PNG, WebP up to 5 MB)"
					}
				>
					<ImagePlus className="size-5" aria-hidden="true" />
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					className="hidden"
					tabIndex={-1}
					aria-hidden="true"
				/>

				{/* Text input */}
				<div className="relative flex-1">
					<span id="chat-input-keyboard-hint" className="sr-only">
						Press Enter to send message, Shift plus Enter for new line.
					</span>
					<textarea
						id="chat-message-input"
						ref={textareaRef}
						value={message}
						onChange={handleTextareaInput}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled}
						rows={1}
						dir={getLanguageDirection(inputLanguage)}
						className={cn(
							"min-h-[44px] max-h-[150px] w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground",
							"placeholder:text-muted",
							"focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
						aria-label="Describe your symptoms or ask a health question"
						aria-describedby="chat-input-keyboard-hint"
					/>
				</div>

				{/* Voice input button */}
				<button
					type="button"
					onClick={handleToggleListening}
					disabled={disabled || !isSpeechSupported}
					className={cn(
						"flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-background p-2.5 text-muted transition-colors",
						"hover:bg-border hover:text-foreground",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
						isListening && "border-primary bg-primary/10 text-primary font-semibold",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					aria-label={
						!isSpeechSupported
							? "Voice input is not supported in this browser"
							: disabled
								? "Voice input disabled while response is generating"
								: isListening
									? "Stop voice input (recording currently active)"
									: "Start voice input (dictation)"
					}
					aria-pressed={isListening}
				>
					<Mic
						className={cn("size-5", isListening && "animate-pulse text-primary")}
						aria-hidden="true"
					/>
				</button>

				{/* Send or Stop button */}
				{onStop && disabled ? (
					<button
						type="button"
						onClick={onStop}
						className={cn(
							"flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-destructive p-2.5 text-white transition-all",
							"hover:brightness-110 active:brightness-95",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
						)}
						aria-label="Stop generating response"
					>
						<Square className="size-4 fill-current" aria-hidden="true" />
					</button>
				) : (
					<button
						type="submit"
						disabled={disabled || (!message.trim() && !image)}
						className={cn(
							"flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary p-2.5 text-white transition-all",
							"hover:brightness-110 active:brightness-95",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
							"disabled:cursor-not-allowed disabled:opacity-50",
						)}
						aria-label={
							disabled
								? "Sending message in progress, please wait"
								: !message.trim() && !image
									? "Send message (disabled: enter text or attach an image to send)"
									: "Send message"
						}
					>
						<Send className="size-5" aria-hidden="true" />
					</button>
				)}
			</form>
		</div>
	);
});
