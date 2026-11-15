/**
 * Localization & 11-Language Workflow Specification & Verification Suite
 *
 * Verifies:
 * - 11 supported Indian languages metadata consistency (FRD 17.3)
 * - RTL direction for Urdu and LTR for other 10 languages
 * - Speech-to-Text & Text-to-Speech locale tag mapping with fallback
 * - Safe fallback to English for missing dictionary keys
 * - Medical safety framing preservation across all languages
 */

import {
	SUPPORTED_LANGUAGES,
	LANGUAGE_METADATA,
	CHAT_LANGUAGES,
	isSupportedLanguage,
	getLanguageInfo,
	getSpeechRecognitionLocale,
	getLanguageDirection,
	isRTL,
	type SupportedLanguage,
} from "../languages";

import { t, TRANSLATIONS, type TranslationKey } from "../i18n";

function assert(condition: boolean, message: string): void {
	if (!condition) {
		throw new Error(`Localization Specification Failure: ${message}`);
	}
}

export const EXPECTED_LANGUAGES: readonly SupportedLanguage[] = [
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

export function verifyLanguageMetadata(): void {
	// 1. Should support exactly 11 Indian languages mandated by FRD 17.3
	assert(
		SUPPORTED_LANGUAGES.length === 11,
		`Expected 11 languages, got ${SUPPORTED_LANGUAGES.length}`,
	);
	assert(CHAT_LANGUAGES.length === 11, "CHAT_LANGUAGES must contain 11 entries");
	const enInfo = getLanguageInfo("en");
	assert(enInfo.code === "en" && enInfo.dir === "ltr", "getLanguageInfo('en') must be valid");
	for (const code of EXPECTED_LANGUAGES) {
		assert(SUPPORTED_LANGUAGES.includes(code), `Missing supported language code: ${code}`);
		assert(isSupportedLanguage(code), `isSupportedLanguage returned false for valid code: ${code}`);
		assert(LANGUAGE_METADATA[code] !== undefined, `Missing metadata for ${code}`);
		assert(LANGUAGE_METADATA[code].code === code, `Metadata code mismatch for ${code}`);
	}

	// 2. Reject unsupported languages safely
	assert(!isSupportedLanguage("fr"), "Should reject 'fr'");
	assert(!isSupportedLanguage("es"), "Should reject 'es'");
	assert(!isSupportedLanguage(""), "Should reject empty string");
	assert(!isSupportedLanguage(null), "Should reject null");
	assert(!isSupportedLanguage(undefined), "Should reject undefined");

	// 3. Directionality: Urdu is RTL, others are LTR
	assert(getLanguageDirection("ur") === "rtl", "Urdu must be RTL");
	assert(isRTL("ur") === true, "isRTL('ur') must be true");

	const ltrLanguages: SupportedLanguage[] = [
		"en",
		"hi",
		"bn",
		"te",
		"mr",
		"ta",
		"gu",
		"kn",
		"ml",
		"pa",
	];
	for (const lang of ltrLanguages) {
		assert(getLanguageDirection(lang) === "ltr", `${lang} must be LTR`);
		assert(isRTL(lang) === false, `isRTL('${lang}') must be false`);
	}

	// 4. Speech locale tags & safe fallback to en-US
	assert(getSpeechRecognitionLocale("en") === "en-US", "en should map to en-US");
	assert(getSpeechRecognitionLocale("hi") === "hi-IN", "hi should map to hi-IN");
	assert(getSpeechRecognitionLocale("bn") === "bn-IN", "bn should map to bn-IN");
	assert(getSpeechRecognitionLocale("te") === "te-IN", "te should map to te-IN");
	assert(getSpeechRecognitionLocale("mr") === "mr-IN", "mr should map to mr-IN");
	assert(getSpeechRecognitionLocale("ta") === "ta-IN", "ta should map to ta-IN");
	assert(getSpeechRecognitionLocale("ur") === "ur-IN", "ur should map to ur-IN");
	assert(getSpeechRecognitionLocale("gu") === "gu-IN", "gu should map to gu-IN");
	assert(getSpeechRecognitionLocale("kn") === "kn-IN", "kn should map to kn-IN");
	assert(getSpeechRecognitionLocale("ml") === "ml-IN", "ml should map to ml-IN");
	assert(getSpeechRecognitionLocale("pa") === "pa-IN", "pa should map to pa-IN");
	assert(getSpeechRecognitionLocale("unsupported") === "en-US", "unsupported must fall back to en-US");
	assert(getSpeechRecognitionLocale(null) === "en-US", "null must fall back to en-US");

	// 5. Translations & fallback
	const hiDoctor = t("common.consultDoctor", "hi");
	assert(hiDoctor === "हमेशा डॉक्टर से सलाह लें", `Unexpected translation for hi: ${hiDoctor}`);

	const fallbackEn = t("common.consultDoctor", "en");
	assert(fallbackEn === "Always consult a doctor", `Unexpected translation for en: ${fallbackEn}`);

	const missingKey = "nonexistent.key" as TranslationKey;
	assert(t(missingKey, "hi") === "nonexistent.key", "Missing key should safely return key name");

	// 6. Medical safety disclaimers across all 11 languages
	for (const lang of EXPECTED_LANGUAGES) {
		const dict = TRANSLATIONS[lang];
		assert(dict !== undefined, `Dictionary missing for ${lang}`);
		assert(
			Boolean(dict?.["common.medicalDisclaimer"]),
			`Medical disclaimer missing for ${lang}`,
		);
		assert(Boolean(dict?.["common.emergencyAlert"]), `Emergency alert missing for ${lang}`);
		assert(
			dict?.["common.emergencyAlert"]?.includes("112") === true,
			`Emergency alert for ${lang} must include emergency number 112`,
		);
	}
}

// Self-executing verification on build
verifyLanguageMetadata();
