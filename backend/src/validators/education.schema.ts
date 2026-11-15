import { z } from "zod";
import { languageEnum } from "../constants/languages";

export const educationSchema = z.object({
	topic: z.string().min(1, "Topic is required"),
	language: languageEnum.optional().default("en"),
	refresh: z
		.string()
		.optional()
		.transform((val) => val === "true"),
});
