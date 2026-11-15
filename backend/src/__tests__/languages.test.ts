/**
 * Unit & Integration Specification for Backend Language Centralization
 *
 * Verifies:
 * - 11 Indian languages centralized metadata
 * - Zod schema validation across chat, symptom, disease, and profile
 * - Rejection of invalid / unsupported language codes
 * - AI language instruction generation with medical safety framing
 */

import {
	SUPPORTED_LANGUAGES,
	LANGUAGE_METADATA,
	isValidLanguage,
	getAILanguageInstruction,
	type SupportedLanguage,
} from "../constants/languages";
import { createChatSchema } from "../validators/chat.schema";
import { educationSchema } from "../validators/education.schema";
import { symptomDiagnosisSchema } from "../validators/symptom.schema";
import { updateProfileSchema } from "../validators/profile.schema";

function assert(condition: boolean, message: string): void {
	if (!condition) {
		throw new Error(`Backend Language Verification Failure: ${message}`);
	}
}

export function verifyBackendLanguages(): void {
	const EXPECTED_LANGUAGES: SupportedLanguage[] = ["en", "hi", "bn", "te", "mr", "ta", "ur", "gu", "kn", "ml", "pa"];

	// 1. Exactly 11 languages
	assert(SUPPORTED_LANGUAGES.length === 11, `Expected 11 languages, got ${SUPPORTED_LANGUAGES.length}`);
	for (const lang of EXPECTED_LANGUAGES) {
		assert(SUPPORTED_LANGUAGES.includes(lang), `Missing language code: ${lang}`);
		assert(isValidLanguage(lang), `isValidLanguage returned false for ${lang}`);
		assert(LANGUAGE_METADATA[lang] !== undefined, `Missing metadata for ${lang}`);
		assert(LANGUAGE_METADATA[lang].code === lang, `Code mismatch for ${lang}`);
	}

	// 2. Reject unsupported
	assert(!isValidLanguage("fr"), "Should reject 'fr'");
	assert(!isValidLanguage("es"), "Should reject 'es'");
	assert(!isValidLanguage(""), "Should reject empty");
	assert(!isValidLanguage(null), "Should reject null");
	assert(!isValidLanguage(undefined), "Should reject undefined");

	// 3. Schema validations
	const validChat = createChatSchema.safeParse({ title: "Health query", language: "hi" });
	assert(validChat.success, "createChatSchema should accept valid language 'hi'");

	const invalidChat = createChatSchema.safeParse({ title: "Health query", language: "fr" });
	assert(!invalidChat.success, "createChatSchema should reject invalid language 'fr'");

	const validEdu = educationSchema.safeParse({ topic: "diabetes", language: "ta" });
	assert(validEdu.success, "educationSchema should accept valid language 'ta'");

	const invalidEdu = educationSchema.safeParse({ topic: "diabetes", language: "es" });
	assert(!invalidEdu.success, "educationSchema should reject invalid language 'es'");

	const validSymptom = symptomDiagnosisSchema.safeParse({ symptoms: ["headache"], language: "bn" });
	assert(validSymptom.success, "symptomDiagnosisSchema should accept valid language 'bn'");

	const invalidSymptom = symptomDiagnosisSchema.safeParse({
		symptoms: ["headache"],
		language: "de",
	});
	assert(!invalidSymptom.success, "symptomDiagnosisSchema should reject invalid language 'de'");

	const validProfile = updateProfileSchema.safeParse({ languagePreference: "ur" });
	assert(validProfile.success, "updateProfileSchema should accept valid languagePreference 'ur'");

	const validProfileNull = updateProfileSchema.safeParse({ languagePreference: null });
	assert(validProfileNull.success, "updateProfileSchema should accept null languagePreference");

	const validProfileEmpty = updateProfileSchema.safeParse({ languagePreference: "" });
	assert(validProfileEmpty.success, "updateProfileSchema should accept empty languagePreference");

	const invalidProfile = updateProfileSchema.safeParse({ languagePreference: "invalid" });
	assert(!invalidProfile.success, "updateProfileSchema should reject invalid languagePreference");

	// 4. AI instructions with medical safety
	const hiInstruction = getAILanguageInstruction("hi");
	assert(hiInstruction.includes("Hindi"), "Hindi instruction must mention Hindi");
	assert(hiInstruction.includes("हिन्दी"), "Hindi instruction must mention हिन्दी");
	assert(hiInstruction.includes("MEDICAL SAFETY REQUIREMENT"), "Must contain medical safety requirement");
	assert(hiInstruction.includes("112"), "Must mention emergency number 112");

	const urInstruction = getAILanguageInstruction("ur");
	assert(urInstruction.includes("Urdu"), "Urdu instruction must mention Urdu");
	assert(urInstruction.includes("اردو"), "Urdu instruction must mention اردو");
	assert(urInstruction.includes("right-to-left"), "Urdu instruction must mention right-to-left");
	assert(urInstruction.includes("MEDICAL SAFETY REQUIREMENT"), "Must contain medical safety requirement");

	const enInstruction = getAILanguageInstruction("en");
	assert(enInstruction === "", "English instruction should be empty");
}

// Self-executing verification
verifyBackendLanguages();
