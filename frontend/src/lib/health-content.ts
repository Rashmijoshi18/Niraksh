import { MessageSquare, Pill, FileText, AlertTriangle, type LucideIcon } from "lucide-react";

export interface DiseaseCategory {
	name: string;
	emoji: string;
	description: string;
	topic: string;
}

export const DISEASE_CATEGORIES: DiseaseCategory[] = [
	{
		name: "Cold & Flu",
		emoji: "🤧",
		description: "Common respiratory infections",
		topic: "cold-and-flu",
	},
	{
		name: "Diabetes",
		emoji: "🩸",
		description: "Blood sugar management",
		topic: "diabetes",
	},
	{
		name: "Heart Disease",
		emoji: "❤️",
		description: "Cardiovascular conditions",
		topic: "heart-disease",
	},
	{
		name: "Mental Health",
		emoji: "🧠",
		description: "Anxiety, depression & more",
		topic: "mental-health",
	},
	{
		name: "COVID-19",
		emoji: "🦠",
		description: "Coronavirus information",
		topic: "covid-19",
	},
	{
		name: "Headache",
		emoji: "🤕",
		description: "Migraines & tension headaches",
		topic: "headache",
	},
	{
		name: "Allergies",
		emoji: "🤥",
		description: "Allergic reactions & management",
		topic: "allergies",
	},
	{
		name: "Skin Conditions",
		emoji: "🧴",
		description: "Dermatological issues",
		topic: "skin-conditions",
	},
];

export const QUICK_SYMPTOMS: string[] = [
	"Headache",
	"Fever",
	"Cough",
	"Sore Throat",
	"Body Pain",
	"Fatigue",
	"Nausea",
	"Stomach Pain",
	"Back Pain",
	"Shortness of Breath",
	"Chest Pain",
	"Dizziness",
];

export interface HealthToolCard {
	title: string;
	description: string;
	icon: LucideIcon;
	href: string;
	cta: string;
}

export const HEALTH_TOOL_CARDS: HealthToolCard[] = [
	{
		title: "Prescription & Lab Analysis",
		description:
			"Upload prescriptions or lab reports and get medicine explanations with marker-level insights.",
		icon: FileText,
		href: "/prescription",
		cta: "Try Now",
	},
	{
		title: "Drug-Drug Interaction",
		description: "Check for potential interactions between your medications.",
		icon: AlertTriangle,
		href: "/drug-interaction",
		cta: "Check Now",
	},
	{
		title: "Medicine Search",
		description: "Look up detailed information about any medicine.",
		icon: Pill,
		href: "/medicine",
		cta: "Search",
	},
	{
		title: "Niraksh AI",
		description: "Chat with our AI assistant about your health concerns.",
		icon: MessageSquare,
		href: "/niraksh-ai",
		cta: "Chat Now",
	},
];

export { CHAT_LANGUAGES, type LanguageInfo } from "@/lib/languages";
