import { z } from "zod";
import { languageEnum } from "../constants/languages";

const optionalStringOrNull = z.string().trim().optional().nullable();

export const updateProfileSchema = z.object({
	name: optionalStringOrNull,
	gender: optionalStringOrNull,
	languagePreference: z
		.union([languageEnum, z.literal("").transform(() => null)])
		.optional()
		.nullable(),
	bloodGroup: optionalStringOrNull,
	allergies: z.array(z.string().trim()).optional(),
	chronicConditions: z.array(z.string().trim()).optional(),
	emergencyContactName: optionalStringOrNull,
	emergencyContactPhone: optionalStringOrNull,
	emergencyContactEmail: optionalStringOrNull,
	city: optionalStringOrNull,
	state: optionalStringOrNull,
});
