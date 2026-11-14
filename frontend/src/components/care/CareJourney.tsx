import { CalendarCheck2, ClipboardCheck, Search, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type CareStep = "symptoms" | "doctor" | "booking" | "prepare";

const steps: Array<{ id: CareStep; label: string; icon: typeof Stethoscope }> = [
	{ id: "symptoms", label: "Symptoms", icon: Stethoscope },
	{ id: "doctor", label: "Choose doctor", icon: Search },
	{ id: "booking", label: "Book time", icon: CalendarCheck2 },
	{ id: "prepare", label: "Prepare visit", icon: ClipboardCheck },
];

export function CareJourney({ active }: { active: CareStep }) {
	const activeIndex = steps.findIndex((step) => step.id === active);

	return (
		<nav aria-label="Care journey" className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-card">
			<ol className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
				{steps.map((step, index) => {
					const Icon = step.icon;
					const current = index === activeIndex;
					const complete = index < activeIndex;
					return (
						<li key={step.id} className="flex items-center gap-2">
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full border",
									current || complete
										? "border-primary bg-primary text-white"
										: "border-border bg-background text-muted",
								)}
							>
								<Icon className="size-3.5" aria-hidden="true" />
							</span>
							<span className={cn("text-xs font-semibold", current ? "text-primary" : complete ? "text-foreground" : "text-muted")}>
								{step.label}
							</span>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
