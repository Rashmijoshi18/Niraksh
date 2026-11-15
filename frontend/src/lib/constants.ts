export { API_ROUTES } from "@/lib/api-routes";
export type { NavItem } from "@/lib/navigation";
export { NAV_ITEMS } from "@/lib/navigation";

export type { DiseaseCategory, HealthToolCard } from "@/lib/health-content";
export {
	DISEASE_CATEGORIES,
	QUICK_SYMPTOMS,
	HEALTH_TOOL_CARDS,
	CHAT_LANGUAGES,
} from "@/lib/health-content";

export {
	SUPPORTED_LANGUAGES,
	DEFAULT_LANGUAGE,
	LANGUAGE_METADATA,
	type SupportedLanguage,
	type LanguageInfo,
	isSupportedLanguage,
	getLanguageInfo,
	getSpeechRecognitionLocale,
	getLanguageDirection,
	isRTL,
} from "@/lib/languages";

export { t, TRANSLATIONS, type TranslationKey } from "@/lib/i18n";
