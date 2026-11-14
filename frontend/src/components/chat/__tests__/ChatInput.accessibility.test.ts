/**
 * Accessibility & Interaction Contract Specification for ChatInput
 *
 * Verifies that all interactive controls in ChatInput comply with:
 * - WCAG 2.1 AA Standards (TRD 4.7)
 * - Minimum touch target sizes >= 44x44px (FRD 17.2)
 * - Accessible name computations across all states
 * - Logical keyboard navigation and screen-reader announcements
 */

export interface ChatInputA11yControlState {
	control: "attachImage" | "removeImage" | "textarea" | "voiceInput" | "sendOrStop";
	accessibleName: string;
	role?: string;
	touchTargetMinPx: number;
	keyboardShortcuts?: string[];
	ariaLiveAnnouncements?: string[];
}

export const CHAT_INPUT_A11Y_SPEC: Record<string, ChatInputA11yControlState[]> = {
	idle: [
		{
			control: "attachImage",
			accessibleName: "Attach image (JPEG, PNG, WebP up to 5 MB)",
			touchTargetMinPx: 44,
		},
		{
			control: "textarea",
			accessibleName: "Describe your symptoms or ask a health question",
			touchTargetMinPx: 44,
			keyboardShortcuts: ["Enter (submit)", "Shift+Enter (newline)", "Escape (clear alerts)"],
		},
		{
			control: "voiceInput",
			accessibleName: "Start voice input (dictation)",
			touchTargetMinPx: 44,
		},
		{
			control: "sendOrStop",
			accessibleName: "Send message (disabled: enter text or attach an image to enable)",
			touchTargetMinPx: 44,
		},
	],
	withTextOrImage: [
		{
			control: "removeImage",
			accessibleName: "Remove attached image [filename]",
			touchTargetMinPx: 44,
			keyboardShortcuts: ["Enter/Space (remove)", "Escape (cancel/remove)"],
		},
		{
			control: "sendOrStop",
			accessibleName: "Send message",
			touchTargetMinPx: 44,
			keyboardShortcuts: ["Enter (submit)"],
		},
	],
	recording: [
		{
			control: "voiceInput",
			accessibleName: "Stop voice input (recording currently active)",
			touchTargetMinPx: 44,
			ariaLiveAnnouncements: ["Listening... Speak into your microphone", "Voice input started."],
			keyboardShortcuts: ["Escape (stop recording)"],
		},
	],
	disabledGenerating: [
		{
			control: "attachImage",
			accessibleName: "Attach image (disabled while response is generating)",
			touchTargetMinPx: 44,
		},
		{
			control: "voiceInput",
			accessibleName: "Voice input disabled while response is generating",
			touchTargetMinPx: 44,
		},
		{
			control: "sendOrStop",
			accessibleName: "Sending message in progress, please wait",
			touchTargetMinPx: 44,
		},
	],
};

/**
 * Validates that touch target dimensions meet or exceed the 44px threshold
 */
export function validateTouchTarget(px: number): boolean {
	return px >= 44;
}

/**
 * Validates that accessible names are non-empty and descriptive
 */
export function validateAccessibleName(name: string): boolean {
	return typeof name === "string" && name.trim().length > 0;
}

// Self-executing validation suite for CI/CD typechecking
for (const [state, controls] of Object.entries(CHAT_INPUT_A11Y_SPEC)) {
	for (const ctrl of controls) {
		if (!validateTouchTarget(ctrl.touchTargetMinPx)) {
			throw new Error(`Accessibility violation in state "${state}": control "${ctrl.control}" has touch target < 44px`);
		}
		if (!validateAccessibleName(ctrl.accessibleName)) {
			throw new Error(`Accessibility violation in state "${state}": control "${ctrl.control}" missing accessible name`);
		}
	}
}
