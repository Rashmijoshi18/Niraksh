# Niraksh-Guardian Frontend

The frontend for Niraksh-Guardian is a cutting-edge, responsive, and accessible web application designed to deliver our medical insights with zero friction. Built from the ground up for speed and usability, it provides users with an empathetic and interactive healthcare companion.

## 🌟 About the Frontend

When it comes to your health, every second of confusion counts. The frontend of Niraksh-Guardian is built to be an incredibly fast, calming, and professional interface that guides you seamlessly from your initial symptom search to securing a doctor recommendation. We focus on providing a frictionless, highly responsive experience across all devices, ensuring that crucial health information is always accessible and easy to digest right when you need it.

## 🎯 Our Goal

To eliminate the friction and anxiety commonly associated with digital healthcare tools. Users facing medical uncertainties shouldn't have to navigate clunky interfaces, endure slow loading screens, or struggle to understand what to do next. Our goal is to provide a seamless, highly intuitive interface that translates complex AI medical insights into clear, instantly understandable, and actionable steps.

## 🚀 Innovative Features

- **🧭 Symptom Analysis & Doctor Finder:** The app guides users from symptom entry to specialist recommendations with location and fee-aware filtering.
- **📄 Prescription + Lab Report Workspace:** Prescription and lab report analysis now live in a unified experience, making it easier to switch between modes without losing context.
- **🧪 Disease & Medicine Explorers:** Users can browse disease information, search medicines by name or image, and get clearer context on conditions and treatments.
- **💬 Streaming AI Chat:** Niraksh AI supports image attachments, real-time response streaming, and language-aware conversations for more natural health guidance.
- **🕒 Health History & Reports:** The dashboard, history timeline, and report pages give users a centralized view of health activity and downloadable summaries.
- **🩺 Guided Care Journey:** Patients can carry symptom context into doctor discovery, request an available slot, prepare an appointment-linked intake, and choose exactly when to share it.
- **🔒 Consent and Safety UX:** Intake forms show routine/urgent/emergency signals, consent status, expiry, revoke controls, and clear doctor-sharing boundaries.
- **👨‍⚕️ Doctor Workspace:** Approved doctors can manage availability and appointments, review time-limited patient records, edit clinical summaries, open original lab files, and issue safety-checked prescriptions.

## 💻 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS v4
- **State & Data Fetching:** React Context, SWR
- **Forms & Validation:** React Hook Form + Zod
- **Icons & UI:** Lucide React, react-dropzone, next/font, next/image
- **Markdown Rendering:** react-markdown + remark-gfm

## 🏁 Getting Started

### Prerequisites

- Node.js (v20+)
- Backend API running locally or accessible remotely
- pnpm

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   pnpm install
   ```

2. Environment Variables:
   Create a `.env.local` file based on the provided examples:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

   For production, point `NEXT_PUBLIC_API_URL` to your deployed backend API.

3. Start the Development Server:
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

## 📚 Architecture Overview

For a detailed breakdown of our React Server Components boundary strategy, data flow, page architecture, and performance optimizations, please refer to the following documents:

- [Frontend System Design](./SYSTEM_DESIGN.md)
- [Frontend Web Flow](./WEB_FLOW.md)
- [Frontend Data Flow](./DATA_FLOW.md)

## 🛠️ Scripts

- `pnpm dev`: Starts the development server on `http://localhost:3000`
- `pnpm build`: Builds the application for production
- `pnpm start`: Starts the production server
- `pnpm lint`: Runs ESLint checks
- `pnpm clean`: Cleans generated build files and node_modules

## Current route groups

In addition to the public and patient health-tool routes, the App Router includes:

- `/appointments` and `/appointments/book` — patient appointment list and availability-based booking
- `/clinical-intake` — appointment selection, multi-step HPI/ROS intake, triage, consent, submit, and revoke
- `/lab-reports` — patient lab report workspace
- `/doctor/register`, `/doctor/application`, `/doctor/dashboard`, `/doctor/appointments`, `/doctor/availability`, and `/doctor/patients` — doctor onboarding and approved-doctor workspace
- `/admin/doctor-applications` — admin review of doctor applications

Booking context is carried between symptom analysis and appointment preparation in browser session storage under `ng:appointment-context`; it is a convenience prefill only and is not treated as consent.

## ♿ Accessibility & Keyboard Navigation

The chat composer (`ChatInput.tsx`) conforms to WCAG 2.1 AA (TRD section 4.7) and mobile usability guidelines (FRD section 17.2):

- **Touch Targets:** All interactive controls (`Attach image`, `Voice input`, `Send message`, `Remove attachment`) maintain touch targets ≥ 44x44px (`min-h-[44px] min-w-[44px]`).
- **Visible Focus States:** High-contrast `focus-visible:ring-2 focus-visible:ring-primary` indicators on all controls with clear offset spacing.
- **Dynamic Accessible Names:** State-aware `aria-label` attributes across idle, disabled/generating, recording, and attachment states.
- **Screen Reader Announcements:** Dedicated `aria-live="polite"` status regions for voice transcription, file upload validation errors, and attachment events.
- **Visual Status Indicators:** Active voice recording displays a pulsing badge with explicit text ("Listening... Speak into your microphone") and a direct "Stop" action, avoiding color-only state representation.
- **Keyboard Shortcuts:**
  - `Enter`: Send message
  - `Shift + Enter`: Insert new line in textarea
  - `Escape`: Cancel active voice recording or dismiss file upload error
  - `Tab` / `Shift + Tab`: Logical, predictable tab order across all composer controls

