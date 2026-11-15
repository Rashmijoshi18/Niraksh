import { z } from "zod";
import { languageEnum } from "../constants/languages";

export const symptomDiagnosisSchema = z.object({
	symptoms: z.array(z.string()).min(1, "At least one symptom is required"),
	language: languageEnum.optional().default("en"),
});

export const chatSummarySchema = z.object({
	chatId: z.string().min(1, "Chat ID is required"),
});

export const symptomRelationshipSchema = z.object({
	input: z.string().trim().max(2000, "Input must be 2000 characters or fewer").optional().default(""),
	language: languageEnum.optional().default("en"),
});
