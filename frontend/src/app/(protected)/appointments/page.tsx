"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Clock3, RefreshCw, X } from "lucide-react";
import useSWR from "swr";
import { swrFetcher, apiClient } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CareJourney } from "@/components/care/CareJourney";
import { useToast } from "@/contexts/ToastProvider";
import type { Appointment, DoctorAppointmentResponse } from "@/types/appointments";

const activeStatuses = ["REQUESTED", "CONFIRMED", "RESCHEDULED"];

const dateTime = (value: string) =>
	new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));

const statusLabel = (status: Appointment["status"]) =>
	status.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());

const intakeLabel = (appointment: Appointment) => {
	const intake = appointment.clinicalIntake;
	if (!intake) return { label: "Prepare for visit", detail: "Share a short history before the consultation.", ready: false };
	const shared = Boolean(intake.consentGrantedAt && !intake.consentRevokedAt && new Date(intake.expiresAt).getTime() > Date.now() && ["SUBMITTED", "REVIEWED"].includes(intake.status));
	if (shared) return { label: intake.status === "REVIEWED" ? "History reviewed" : "History ready", detail: "Your doctor can review it after confirming the appointment.", ready: true };
	return { label: "Finish visit history", detail: "Your saved draft is waiting for consent.", ready: false };
};

function AppointmentCard({ appointment, onCancel }: { appointment: Appointment; onCancel: (appointment: Appointment) => void }) {
	const active = activeStatuses.includes(appointment.status);
	const intake = intakeLabel(appointment);

	return (
		<article className="rounded-2xl border border-border bg-surface p-5 shadow-card">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></div>
					<div className="min-w-0">
						<h2 className="font-semibold text-foreground">{appointment.doctor?.name ?? "Doctor"}</h2>
						<p className="text-sm text-muted">{appointment.doctor?.specialization} · {dateTime(appointment.scheduledAt)}</p>
						<p className="mt-1 text-xs text-muted">{appointment.mode.replace("_", " ").toLowerCase()} consultation{appointment.reason ? ` · ${appointment.reason}` : ""}</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{statusLabel(appointment.status)}</span>
					{active && <button type="button" onClick={() => onCancel(appointment)} className="inline-flex min-h-10 items-center gap-1 px-2 text-xs font-semibold text-destructive hover:underline"><X className="size-3.5" /> Cancel</button>}
				</div>
			</div>

			{active && <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3">{intake.ready ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" /> : <ClipboardList className="mt-0.5 size-5 shrink-0 text-primary" />}<div><p className="text-sm font-semibold text-foreground">{intake.label}</p><p className="mt-0.5 text-xs text-muted">{intake.detail}</p></div></div><Link href={`/clinical-intake?appointmentId=${encodeURIComponent(appointment.id)}`} className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-primary px-4 text-xs font-semibold text-primary transition hover:bg-primary/10">{intake.ready ? "View history" : intake.label}</Link></div>}
			{appointment.status === "REQUESTED" && <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Clock3 className="size-3.5" /> Waiting for doctor confirmation. You can prepare your history now.</p>}
		</article>
	);
}

function AppointmentSection({ title, description, appointments, onCancel, emptyMessage }: { title: string; description: string; appointments: Appointment[]; onCancel: (appointment: Appointment) => void; emptyMessage: string }) {
	return <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}><div className="mb-3"><h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="font-heading text-lg font-bold text-foreground">{title}</h2><p className="mt-0.5 text-sm text-muted">{description}</p></div>{appointments.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface/60 px-5 py-4 text-sm text-muted">{emptyMessage}</div> : <div className="space-y-3">{appointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onCancel={onCancel} />)}</div>}</section>;
}

export default function AppointmentsPage() {
	const { data, error, isLoading, mutate } = useSWR<DoctorAppointmentResponse>(API_ROUTES.MY_APPOINTMENTS, swrFetcher, { revalidateOnFocus: false });
	const { addToast } = useToast();
	const appointments = data?.appointments ?? [];
	const upcomingAppointments = appointments.filter((appointment) => activeStatuses.includes(appointment.status));
	const pastAppointments = appointments.filter((appointment) => !activeStatuses.includes(appointment.status));

	const cancel = async (appointment: Appointment) => {
		try {
			await apiClient(API_ROUTES.APPOINTMENT(appointment.id) + "/cancel", { method: "PATCH" });
			await mutate();
			addToast("success", "Appointment cancelled");
		} catch (cancelError) {
			addToast("error", cancelError instanceof Error ? cancelError.message : "Could not cancel appointment");
		}
	};

	if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" className="text-primary" /></div>;

	if (error) return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-card"><AlertTriangle className="mx-auto size-9 text-amber-600" /><h1 className="mt-3 font-heading text-xl font-bold text-foreground">Appointments could not be loaded</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">The appointment service is unavailable, so we are not showing an incorrect empty state. Start the backend, then try again.</p><button type="button" onClick={() => void mutate()} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-110"><RefreshCw className="size-4" /> Try again</button></section></div>;

	return <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 lg:px-8"><CareJourney active={upcomingAppointments.length > 0 ? "prepare" : "doctor"} /><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">Your care plan</p><h1 className="font-heading text-2xl font-bold text-foreground">My appointments</h1><p className="mt-1 text-sm text-muted">Upcoming consultations and past visits, all in one place.</p></div><Link href="/symptom-analysis" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-110">Find a doctor</Link></div>{appointments.length === 0 ? <EmptyState icon={CalendarDays} iconClassName="text-primary" title="No appointments booked yet" description="Tell us your symptoms and we will help you choose a doctor first." action={{ label: "Find a doctor", href: "/symptom-analysis" }} variant="dashed" size="lg" className="rounded-2xl p-10" /> : <><AppointmentSection title="Upcoming appointments" description="Requests, confirmed consultations, and visits that still need preparation." appointments={upcomingAppointments} onCancel={cancel} emptyMessage="No upcoming appointments right now." /><AppointmentSection title="Past appointments" description="Completed, cancelled, and missed visits stay here for reference." appointments={pastAppointments} onCancel={cancel} emptyMessage="Past appointments will appear here after a visit is completed or closed." /></>}</main>;
}
