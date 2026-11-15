"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { API_ROUTES } from "@/lib/api-routes";
import { swrFetcher, apiClient } from "@/lib/api";
import {
	DEFAULT_LANGUAGE,
	type SupportedLanguage,
	isSupportedLanguage,
	getLanguageInfo,
} from "@/lib/languages";
import type { ProfileResponse } from "@/types/health";

const STORAGE_KEY = "ng:language_preference";

function getCachedLanguage(): SupportedLanguage {
	if (typeof window === "undefined") return DEFAULT_LANGUAGE;
	try {
		const cached = localStorage.getItem(STORAGE_KEY);
		if (cached && isSupportedLanguage(cached)) {
			return cached;
		}
	} catch {
		// Ignore storage errors
	}
	return DEFAULT_LANGUAGE;
}

export function useLanguagePreference() {
	const { data: profileData } = useSWR<ProfileResponse>(API_ROUTES.PROFILE, swrFetcher, {
		revalidateOnFocus: false,
	});

	// Explicit user override in current session, if any
	const [overrideLanguage, setOverrideLanguage] = useState<SupportedLanguage | null>(null);

	// Derive language: override > profile preference > localStorage cache > default
	const profilePref = profileData?.user?.languagePreference;
	const resolvedLanguage: SupportedLanguage =
		overrideLanguage ??
		(profilePref && isSupportedLanguage(profilePref) ? profilePref : getCachedLanguage());

	const setLanguagePreference = useCallback(async (newLang: SupportedLanguage) => {
		if (!isSupportedLanguage(newLang)) return;

		setOverrideLanguage(newLang);
		try {
			localStorage.setItem(STORAGE_KEY, newLang);
		} catch {
			// Ignore storage quota errors
		}

		// Persist to backend user profile if authenticated
		try {
			await apiClient(API_ROUTES.PROFILE, {
				method: "PUT",
				body: { languagePreference: newLang },
			});
			await mutate(API_ROUTES.PROFILE);
		} catch {
			// Backend persistence will retry on next explicit profile save
		}
	}, []);

	const info = getLanguageInfo(resolvedLanguage);

	return {
		language: resolvedLanguage,
		setLanguagePreference,
		languageInfo: info,
		dir: info.dir,
		isRtl: info.dir === "rtl",
	};
}
