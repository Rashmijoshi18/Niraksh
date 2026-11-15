import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "hi", "bn", "te", "mr", "ta", "ur", "gu", "kn", "ml", "pa"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export interface LanguageDefinition {
	code: SupportedLanguage;
	name: string;
	nativeName: string;
	speechLocale: string;
	dir: "ltr" | "rtl";
}

export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageDefinition> = {
	en: {
		code: "en",
		name: "English",
		nativeName: "English",
		speechLocale: "en-US",
		dir: "ltr",
	},
	hi: {
		code: "hi",
		name: "Hindi",
		nativeName: "हिन्दी",
		speechLocale: "hi-IN",
		dir: "ltr",
	},
	bn: {
		code: "bn",
		name: "Bengali",
		nativeName: "বাংলা",
		speechLocale: "bn-IN",
		dir: "ltr",
	},
	te: {
		code: "te",
		name: "Telugu",
		nativeName: "తెలుగు",
		speechLocale: "te-IN",
		dir: "ltr",
	},
	mr: {
		code: "mr",
		name: "Marathi",
		nativeName: "मराठी",
		speechLocale: "mr-IN",
		dir: "ltr",
	},
	ta: {
		code: "ta",
		name: "Tamil",
		nativeName: "தமிழ்",
		speechLocale: "ta-IN",
		dir: "ltr",
	},
	ur: {
		code: "ur",
		name: "Urdu",
		nativeName: "اردو",
		speechLocale: "ur-IN",
		dir: "rtl",
	},
	gu: {
		code: "gu",
		name: "Gujarati",
		nativeName: "ગુજરાતી",
		speechLocale: "gu-IN",
		dir: "ltr",
	},
	kn: {
		code: "kn",
		name: "Kannada",
		nativeName: "ಕನ್ನಡ",
		speechLocale: "kn-IN",
		dir: "ltr",
	},
	ml: {
		code: "ml",
		name: "Malayalam",
		nativeName: "മലയാളം",
		speechLocale: "ml-IN",
		dir: "ltr",
	},
	pa: {
		code: "pa",
		name: "Punjabi",
		nativeName: "ਪੰਜਾਬੀ",
		speechLocale: "pa-IN",
		dir: "ltr",
	},
};

export const languageEnum = z.enum(SUPPORTED_LANGUAGES);

export const isValidLanguage = (lang: unknown): lang is SupportedLanguage => {
	return typeof lang === "string" && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

export const getLanguageMetadata = (lang?: string | null): LanguageDefinition => {
	if (lang && isValidLanguage(lang)) {
		return LANGUAGE_METADATA[lang];
	}
	return LANGUAGE_METADATA[DEFAULT_LANGUAGE];
};

/**
 * Generates an explicit prompt instruction to guide LLMs to respond accurately
 * in the selected Indian language while strictly preserving medical safety framing.
 */
export const getAILanguageInstruction = (lang?: string | null): string => {
	const meta = getLanguageMetadata(lang);
	if (meta.code === "en") {
		return "";
	}

	const rtlNote = meta.dir === "rtl" ? " Format the output naturally for right-to-left reading." : "";

	return `IMPORTANT LANGUAGE & SAFETY INSTRUCTION:
- Respond strictly and entirely in ${meta.name} (${meta.nativeName}).${rtlNote}
- Use clear, empathetic, and culturally accessible phrasing in ${meta.name}.
- Keep medical conditions and pharmaceutical names clear (provide common local terms where appropriate).
- MEDICAL SAFETY REQUIREMENT: You MUST include standard non-diagnostic medical safety framing in ${meta.name}, advising the user that this guidance is educational and does not replace consultation with a licensed healthcare professional. For severe or life-threatening symptoms, instruct the user to seek immediate emergency care (call 112).`;
};
