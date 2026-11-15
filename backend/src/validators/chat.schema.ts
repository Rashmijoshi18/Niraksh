import { z } from "zod";
import { languageEnum } from "../constants/languages";

export const createChatSchema = z.object({
	title: z.string().min(1, "Title is required").max(100, "Title is too long"),
	language: languageEnum.optional().default("en"), // Multi-language support
});

export const sendMessageSchema = z.object({
	content: z.string().min(1, "Message content is required"),
	language: languageEnum.optional(), // Optional override for specific message
});

export const updateChatSchema = z.object({
	title: z.string().min(1).max(100).optional(),
});
