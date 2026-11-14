import { CalendarCheck2, ClipboardCheck, Search, Stethoscope, UserRoundCheck } from "lucide-react";

const STEPS = [
	{ number: "01", icon: Stethoscope, title: "Tell us what you feel", description: "Start with plain language symptoms. No medical terms needed." },
	{ number: "02", icon: Search, title: "Choose a doctor", description: "See relevant specialists and select the doctor that feels right." },
	{ number: "03", icon: CalendarCheck2, title: "Book a time", description: "Pick an available consultation slot in a few taps." },
	{ number: "04", icon: ClipboardCheck, title: "Share once", description: "We prefill your visit history from what you already shared and ask only for missing context." },
	{ number: "05", icon: UserRoundCheck, title: "Doctor arrives prepared", description: "With your consent, the doctor sees the relevant timeline before the visit." },
];

export function HowItWorks() {
	return <section id="how-it-works" className="mb-[80px] mt-4 py-12 scroll-mt-24"><div className="mb-12 text-center"><span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">Simple care journey</span><h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">From symptom to a prepared visit</h2><p className="mt-3 text-base text-muted sm:text-lg">One connected flow, without repeating your story at every step.</p></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">{STEPS.map(({ number, icon: Icon, title, description }) => <div key={number} className="relative rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="flex items-center justify-between"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><span className="text-xs font-bold text-primary">{number}</span></div><h3 className="mt-5 font-heading text-base font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></div>)}</div></section>;
}
