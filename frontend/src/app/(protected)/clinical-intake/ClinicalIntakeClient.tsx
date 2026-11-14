"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, Clock3, FileClock, LockKeyhole, RefreshCw, Save, ShieldCheck, Siren, Sparkles } from "lucide-react";
import { apiClient, swrFetcher } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { useToast } from "@/contexts/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CareJourney } from "@/components/care/CareJourney";
import { cn } from "@/lib/utils";
import type { Appointment, DoctorAppointmentResponse } from "@/types/appointments";
import type { ClinicalIntakeResponse, ClinicalTimelineResponse, HpiForm, RosForm } from "@/types/clinicalIntake";

const emptyHpi: HpiForm = { onset: "", duration: "", severity: "", location: "", character: "", aggravatingFactors: "", relievingFactors: "", associatedSymptoms: "", previousTreatment: "" };
const emptyRos: RosForm = { general: "", respiratory: "", cardiac: "", gastrointestinal: "", neurological: "", endocrine: "", other: "" };
const activeStatuses = ["REQUESTED", "CONFIRMED", "RESCHEDULED"];

const formatDateTime = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(value));

function Field({ id, label, value, onChange, placeholder, rows = 1, required = false }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number; required?: boolean }) {
	return <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label} {required && <span className="text-destructive">*</span>}{rows > 1 ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} className="mt-2 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /> : <input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />}</label>;
}

function TriageBanner({ level, reasons, message }: { level: string; reasons: string[]; message: string | null }) {
	if (level === "ROUTINE") return null;
	const emergency = level === "EMERGENCY";
	return <div role="alert" className={cn("rounded-2xl border p-5", emergency ? "border-red-300 bg-red-50 text-red-950" : "border-amber-300 bg-amber-50 text-amber-950")}><div className="flex items-start gap-3">{emergency ? <Siren className="mt-0.5 size-6 shrink-0" /> : <AlertTriangle className="mt-0.5 size-6 shrink-0" />}<div><p className="font-heading font-bold">{emergency ? "Emergency symptoms may need immediate care" : "Prompt clinical review recommended"}</p><p className="mt-1 text-sm">{message}</p>{reasons.length > 0 && <p className="mt-3 text-sm font-semibold">Detected concern: {reasons.join("; ")}</p>}{emergency && <p className="mt-3 text-sm font-bold">Call local emergency services or go to the nearest emergency department now.</p>}</div></div></div>;
}

function TimelinePreview({ timeline }: { timeline: ClinicalTimelineResponse["timeline"] }) {
	return <details className="rounded-xl border border-border bg-background p-4"><summary className="cursor-pointer list-none text-sm font-semibold text-foreground"><span className="flex items-center gap-2"><FileClock className="size-4 text-primary" /> Health timeline already attached</span></summary><p className="mt-2 text-xs leading-5 text-muted">Your reports, prescriptions, medicine checks, and earlier symptom analyses are available to build the doctor-facing context. Nothing needs to be typed again.</p>{timeline.length > 0 && <ul className="mt-4 space-y-2 border-l-2 border-primary/20 pl-4">{timeline.slice(0, 5).map((entry) => <li key={`${entry.sourceType}-${entry.sourceId ?? entry.eventDate}`}><p className="text-xs font-semibold text-foreground">{entry.title}</p><p className="text-xs text-muted">{formatDate(entry.eventDate)}{entry.summary ? ` · ${entry.summary}` : ""}</p></li>)}</ul>}</details>;
}

function VisitPicker({ appointments }: { appointments: Appointment[] }) {
	return <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"><CareJourney active="booking" /><div><p className="text-sm font-semibold text-primary">Before your consultation</p><h1 className="font-heading text-2xl font-bold text-foreground">Prepare the right visit</h1><p className="mt-1 text-sm text-muted">Choose a booked appointment. We will use its doctor and visit reason so you only answer what is missing.</p></div>{appointments.length === 0 ? <section className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-card"><CalendarDays className="mx-auto size-9 text-primary" /><h2 className="mt-3 font-heading text-lg font-bold text-foreground">Book a doctor first</h2><p className="mt-2 text-sm text-muted">Your visit history is private to one appointment and one selected doctor.</p><Link href="/symptom-analysis" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">Find a doctor</Link></section> : <div className="space-y-3">{appointments.map((appointment) => <Link key={appointment.id} href={`/clinical-intake?appointmentId=${encodeURIComponent(appointment.id)}`} className="block rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:border-primary/40 hover:shadow-card-hover"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-foreground">{appointment.doctor?.name ?? "Doctor"}</p><p className="mt-1 text-sm text-muted">{appointment.doctor?.specialization} · {formatDateTime(appointment.scheduledAt)}</p>{appointment.reason && <p className="mt-3 text-sm text-foreground">{appointment.reason}</p>}</div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Prepare visit</span></div></Link>)}</div>}</div>;
}

export function ClinicalIntakeClient() {
	const searchParams = useSearchParams();
	const { addToast } = useToast();
	const appointmentId = searchParams.get("appointmentId") ?? "";
	const [step, setStep] = useState(1);
	const [chiefComplaint, setChiefComplaint] = useState("");
	const [hpi, setHpi] = useState<HpiForm>(emptyHpi);
	const [ros, setRos] = useState<RosForm>(emptyRos);
	const [medicationNotes, setMedicationNotes] = useState("");
	const [allergyNotes, setAllergyNotes] = useState("");
	const [consentGiven, setConsentGiven] = useState(false);
	const [saving, setSaving] = useState(false);
	const hydrationKey = useRef<string | null>(null);

	const { data: appointmentData, error: appointmentsError, isLoading: appointmentsLoading, mutate: mutateAppointments } = useSWR<DoctorAppointmentResponse>(API_ROUTES.MY_APPOINTMENTS, swrFetcher, { revalidateOnFocus: false });
	const { data: intakeData, error: intakeError, isLoading: intakeLoading, mutate: mutateIntake } = useSWR<ClinicalIntakeResponse>(appointmentId ? `${API_ROUTES.CLINICAL_INTAKE}?appointmentId=${encodeURIComponent(appointmentId)}` : null, swrFetcher, { revalidateOnFocus: false });
	const { data: timelineData } = useSWR<ClinicalTimelineResponse>(appointmentId ? API_ROUTES.CLINICAL_INTAKE_TIMELINE : null, swrFetcher, { revalidateOnFocus: false });

	const appointments = useMemo(() => (appointmentData?.appointments ?? []).filter((appointment) => activeStatuses.includes(appointment.status)), [appointmentData?.appointments]);
	const appointment = appointments.find((item) => item.id === appointmentId);
	const activeIntake = intakeData?.intake ?? null;
	const doctorName = appointment?.doctor?.name ?? "your doctor";

	useEffect(() => {
		if (!appointmentId || !appointment) return;
		const key = `${appointmentId}:${activeIntake?.id ?? "new"}`;
		if (hydrationKey.current === key) return;
		hydrationKey.current = key;
		if (activeIntake) {
			setChiefComplaint(activeIntake.chiefComplaint ?? "");
			setHpi({ ...emptyHpi, ...(activeIntake.hpi ?? {}) });
			setRos({ ...emptyRos, ...(activeIntake.ros ?? {}) });
			setMedicationNotes(activeIntake.medicationNotes ?? "");
			setAllergyNotes(activeIntake.allergyNotes ?? "");
			setConsentGiven(Boolean(activeIntake.consentGrantedAt && !activeIntake.consentRevokedAt));
			if (["SUBMITTED", "REVIEWED"].includes(activeIntake.status)) setStep(3);
			return;
		}
		const reason = appointment.reason?.trim() ?? "";
		let storedSymptoms = "";
		try { storedSymptoms = (JSON.parse(window.sessionStorage.getItem("ng:appointment-context") ?? "{}") as { symptoms?: string }).symptoms?.trim() ?? ""; } catch { /* Ignore invalid browser-only context. */ }
		setChiefComplaint(reason || storedSymptoms);
		setHpi((current) => ({ ...current, associatedSymptoms: current.associatedSymptoms || storedSymptoms }));
	}, [activeIntake, appointment, appointmentId]);

	const updateHpi = (key: keyof HpiForm, value: string) => setHpi((current) => ({ ...current, [key]: value }));
	const updateRos = (key: keyof RosForm, value: string) => setRos((current) => ({ ...current, [key]: value }));

	const save = async (submit: boolean) => {
		if (!chiefComplaint.trim()) return addToast("error", "Tell us your main health concern first");
		if (submit && !consentGiven) return addToast("error", "Please provide consent before sharing this visit history");
		setSaving(true);
		try {
			await apiClient(API_ROUTES.CLINICAL_INTAKE, { method: "POST", body: { appointmentId, chiefComplaint, hpi, ros, medicationNotes, allergyNotes, consentGiven, submit } });
			await mutateIntake();
			if (submit) { setStep(3); addToast("success", "Visit history shared securely"); } else addToast("success", "Draft saved securely");
		} catch (error) { addToast("error", error instanceof Error ? error.message : "Could not save visit history"); } finally { setSaving(false); }
	};

	const revokeConsent = async () => {
		if (!activeIntake) return;
		try { await apiClient(API_ROUTES.CLINICAL_INTAKE_REVOKE(activeIntake.id), { method: "POST" }); await mutateIntake(); setConsentGiven(false); addToast("success", "Doctor sharing consent revoked"); } catch (error) { addToast("error", error instanceof Error ? error.message : "Could not revoke consent"); }
	};

	if (appointmentsLoading || (appointmentId && intakeLoading)) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" className="text-primary" /></div>;
	if (appointmentsError || intakeError) return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-card"><AlertTriangle className="mx-auto size-9 text-amber-600" /><h1 className="mt-3 font-heading text-xl font-bold text-foreground">{intakeError && !appointmentsError ? "Visit preparation needs setup" : "Appointments could not be loaded"}</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{intakeError && !appointmentsError ? "Your appointment is still saved. The clinical-intake database migration needs to be applied before visit preparation can open." : "The appointment service is unavailable, so we are not showing an incorrect empty state. Start the backend, then try again."}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => { void mutateAppointments(); if (appointmentId) void mutateIntake(); }} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-110"><RefreshCw className="size-4" /> Try again</button>{intakeError && !appointmentsError && <Link href="/appointments" className="inline-flex h-10 items-center rounded-full border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-primary/10">View appointments</Link>}</div></section></div>;
	if (!appointmentId) return <VisitPicker appointments={appointments} />;
	if (!appointment) return <div className="mx-auto max-w-xl px-4 py-12 text-center"><p className="font-semibold text-foreground">This appointment is not available for visit preparation.</p><Link href="/appointments" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Return to appointments</Link></div>;

	const shared = Boolean(activeIntake && ["SUBMITTED", "REVIEWED"].includes(activeIntake.status) && activeIntake.consentGrantedAt && !activeIntake.consentRevokedAt && new Date(activeIntake.expiresAt).getTime() > Date.now());

	return <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><CareJourney active="prepare" /><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">Step 4 of 4 · Prepare visit</p><h1 className="font-heading text-2xl font-bold text-foreground">Help {doctorName} arrive prepared</h1><p className="mt-1 text-sm text-muted">{appointment.doctor?.specialization} · {formatDateTime(appointment.scheduledAt)}</p></div><Link href="/appointments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ChevronLeft className="size-4" /> My appointments</Link></div>

		<TriageBanner level={activeIntake?.triageLevel ?? "ROUTINE"} reasons={activeIntake?.triageReasons ?? []} message={activeIntake?.triageMessage ?? null} />

		{shared ? <section className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-card"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600" /><div><p className="font-heading text-lg font-bold text-foreground">Your visit history is ready</p><p className="mt-1 text-sm leading-6 text-muted">{doctorName} can review this context only after confirming this appointment. Access expires on {formatDate(activeIntake!.expiresAt)} or you can revoke it anytime.</p></div></div>{(activeIntake?.summaryEdited || activeIntake?.summaryDraft) && <div className="mt-5 rounded-xl border border-green-200 bg-white/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-green-700">Clinical summary</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">{activeIntake?.summaryEdited || activeIntake?.summaryDraft}</p></div>}<div className="mt-5 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => void revokeConsent()}>Revoke sharing consent</Button><Link href="/appointments" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white">View appointment</Link></div></section> : <><div className="grid grid-cols-3 gap-2" aria-label={`Visit preparation step ${step} of 3`}>{["Main concern", "Quick context", "Review & share"].map((label, index) => <div key={label} className={cn("rounded-xl border p-3 text-center text-xs font-semibold", step === index + 1 ? "border-primary bg-primary/10 text-primary" : step > index + 1 ? "border-green-200 bg-green-50 text-green-700" : "border-border bg-surface text-muted")}><span className="mr-1">{index + 1}.</span>{label}</div>)}</div>
			<section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">{step === 1 && <><div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">What brings you in?</h2><p className="mt-1 text-sm text-muted">We started this from your booking. Check it and add only what matters.</p></div></div><div className="mt-5 space-y-4"><Field id="chief-complaint" label="Main concern" value={chiefComplaint} onChange={setChiefComplaint} placeholder="Example: Fatigue and sugar fluctuations for 3 months" rows={3} required /><div className="grid gap-4 sm:grid-cols-2"><Field id="hpi-duration" label="How long has this been happening?" value={hpi.duration} onChange={(value) => updateHpi("duration", value)} placeholder="Example: 3 months" /><Field id="hpi-severity" label="How severe is it today?" value={hpi.severity} onChange={(value) => updateHpi("severity", value)} placeholder="Mild, moderate, severe, or 0–10" /></div></div><div className="mt-6 flex justify-end"><Button type="button" onClick={() => { if (!chiefComplaint.trim()) return addToast("error", "Tell us your main health concern first"); setStep(2); }}>Continue</Button></div></>}</section>
			{step === 2 && <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"><div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><ShieldCheck className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">A little more context</h2><p className="mt-1 text-sm text-muted">These are optional. Add only details that could change the doctor’s decision.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field id="hpi-associated" label="Other symptoms" value={hpi.associatedSymptoms} onChange={(value) => updateHpi("associatedSymptoms", value)} placeholder="Example: thirst, frequent urination" rows={3} /><Field id="hpi-treatment" label="What have you tried?" value={hpi.previousTreatment} onChange={(value) => updateHpi("previousTreatment", value)} placeholder="Medicines, tests, or home remedies" rows={3} /><Field id="medicines" label="Current medicines" value={medicationNotes} onChange={setMedicationNotes} placeholder="Name and dose, if known" rows={3} /><Field id="allergies" label="Allergies or reactions" value={allergyNotes} onChange={setAllergyNotes} placeholder="Medicine, food, or other allergies" rows={3} /></div><details className="mt-5 rounded-xl border border-border bg-background p-4"><summary className="cursor-pointer text-sm font-semibold text-foreground">Add more clinical detail (optional)</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field id="hpi-onset" label="How did it start?" value={hpi.onset} onChange={(value) => updateHpi("onset", value)} placeholder="Sudden or gradual" /><Field id="hpi-location" label="Where do you feel it?" value={hpi.location} onChange={(value) => updateHpi("location", value)} placeholder="Body location, if relevant" /><Field id="hpi-character" label="What does it feel like?" value={hpi.character} onChange={(value) => updateHpi("character", value)} placeholder="Burning, dull, sharp, etc." /><Field id="ros-general" label="Anything else important?" value={ros.other} onChange={(value) => updateRos("other", value)} placeholder="Other relevant symptoms" /></div></details><div className="mt-6 flex items-center justify-between gap-3"><Button type="button" variant="outline" onClick={() => setStep(1)}><ChevronLeft className="size-4" /> Back</Button><Button type="button" onClick={() => setStep(3)}>Review</Button></div></section>}
			{step === 3 && <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"><div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="size-5" /></div><div><h2 className="font-heading text-lg font-bold text-foreground">Review and share</h2><p className="mt-1 text-sm text-muted">We create a doctor-editable clinical summary from this visit context, your timeline, and your answers.</p></div></div><div className="mt-5 rounded-xl bg-background p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Main concern</p><p className="mt-1 text-sm font-semibold text-foreground">{chiefComplaint}</p>{hpi.duration && <p className="mt-2 text-sm text-muted">Duration: {hpi.duration}</p>}{hpi.severity && <p className="mt-1 text-sm text-muted">Severity: {hpi.severity}</p>}</div><div className="mt-4"><TimelinePreview timeline={timelineData?.timeline ?? []} /></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><input type="checkbox" checked={consentGiven} onChange={(event) => setConsentGiven(event.target.checked)} className="mt-1 size-4 accent-primary" /><span className="text-sm leading-6 text-foreground">I consent to share this visit history, including relevant reports and health context, with {doctorName} for this appointment. Access expires automatically after 7 days.</span></label><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-muted"><Clock3 className="size-4" /> Drafts expire after 30 minutes of inactivity.</p><div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="outline" onClick={() => void save(false)} loading={saving}><Save className="size-4" /> Save draft</Button><Button type="button" onClick={() => void save(true)} loading={saving} disabled={!consentGiven}>Share with doctor</Button></div></div></section>}</>}</div>;
}
