export const SUPPORTED_LANGUAGES = [
	"en",
	"hi",
	"bn",
	"te",
	"mr",
	"ta",
	"ur",
	"gu",
	"kn",
	"ml",
	"pa",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export interface LanguageInfo {
	code: SupportedLanguage;
	label: string;
	englishName: string;
	nativeName: string;
	speechLocale: string;
	dir: "ltr" | "rtl";
}

export const LANGUAGE_METADATA: Record<SupportedLanguage, LanguageInfo> = {
	en: {
		code: "en",
		label: "English",
		englishName: "English",
		nativeName: "English",
		speechLocale: "en-US",
		dir: "ltr",
	},
	hi: {
		code: "hi",
		label: "हिन्दी (Hindi)",
		englishName: "Hindi",
		nativeName: "हिन्दी",
		speechLocale: "hi-IN",
		dir: "ltr",
	},
	bn: {
		code: "bn",
		label: "বাংলা (Bengali)",
		englishName: "Bengali",
		nativeName: "বাংলা",
		speechLocale: "bn-IN",
		dir: "ltr",
	},
	te: {
		code: "te",
		label: "తెలుగు (Telugu)",
		englishName: "Telugu",
		nativeName: "తెలుగు",
		speechLocale: "te-IN",
		dir: "ltr",
	},
	mr: {
		code: "mr",
		label: "मराठी (Marathi)",
		englishName: "Marathi",
		nativeName: "मराठी",
		speechLocale: "mr-IN",
		dir: "ltr",
	},
	ta: {
		code: "ta",
		label: "தமிழ் (Tamil)",
		englishName: "Tamil",
		nativeName: "தமிழ்",
		speechLocale: "ta-IN",
		dir: "ltr",
	},
	ur: {
		code: "ur",
		label: "اردو (Urdu)",
		englishName: "Urdu",
		nativeName: "اردو",
		speechLocale: "ur-IN",
		dir: "rtl",
	},
	gu: {
		code: "gu",
		label: "ગુજરાતી (Gujarati)",
		englishName: "Gujarati",
		nativeName: "ગુજરાતી",
		speechLocale: "gu-IN",
		dir: "ltr",
	},
	kn: {
		code: "kn",
		label: "ಕನ್ನಡ (Kannada)",
		englishName: "Kannada",
		nativeName: "ಕನ್ನಡ",
		speechLocale: "kn-IN",
		dir: "ltr",
	},
	ml: {
		code: "ml",
		label: "മലയാളം (Malayalam)",
		englishName: "Malayalam",
		nativeName: "മലയാളം",
		speechLocale: "ml-IN",
		dir: "ltr",
	},
	pa: {
		code: "pa",
		label: "ਪੰਜਾਬੀ (Punjabi)",
		englishName: "Punjabi",
		nativeName: "ਪੰਜਾਬੀ",
		speechLocale: "pa-IN",
		dir: "ltr",
	},
};

/**
 * Array of all supported languages with labels and speech metadata.
 * Backward-compatible drop-in replacement for previous CHAT_LANGUAGES constant.
 */
export const CHAT_LANGUAGES: readonly LanguageInfo[] = SUPPORTED_LANGUAGES.map(
	(code) => LANGUAGE_METADATA[code]
);

export const isSupportedLanguage = (lang: unknown): lang is SupportedLanguage => {
	return typeof lang === "string" && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

export const getLanguageInfo = (lang?: string | null): LanguageInfo => {
	if (lang && isSupportedLanguage(lang)) {
		return LANGUAGE_METADATA[lang];
	}
	return LANGUAGE_METADATA[DEFAULT_LANGUAGE];
};

/**
 * Map language code to standard BCP-47 speech recognition and synthesis locale tag.
 * Falls back safely to 'en-US' for unsupported languages.
 */
export const getSpeechRecognitionLocale = (lang?: string | null): string => {
	if (lang && isSupportedLanguage(lang)) {
		return LANGUAGE_METADATA[lang].speechLocale;
	}
	return "en-US";
};

export const getLanguageDirection = (lang?: string | null): "ltr" | "rtl" => {
	return getLanguageInfo(lang).dir;
};

export const isRTL = (lang?: string | null): boolean => {
	return getLanguageDirection(lang) === "rtl";
};
