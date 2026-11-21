# 🛡️ Health Data Retention, Expiry, and Deletion Runbook

This document defines the health data lifecycle, retention rules, scheduled cleanup jobs, operational CLI commands, and automated enforcement mechanisms implemented in **Niraksh Guardian**.

---

## 1. Overview & Policy Matrix

In compliance with healthcare data minimization, patient consent lifecycle standards (TRD Sections 7.5, 10.4, 17.2), and storage quotas, data in Niraksh Guardian is subject to strict, automated retention and deletion schedules.

| Data Domain | Database Entity | Default Retention / TTL | Cleanup Action | Associated Storage (Cloudinary) |
|---|---|---|---|---|
| **Disease Info Cache** | `DiseaseInfoCache` | 30 days (`expires_at <= now`) | Hard delete from DB | None |
| **Lab Report Share Links** | `LabReportShare` | 7 days (`expires_at <= now`) | Hard delete token from DB | None |
| **Clinical Intake Sessions** | `ClinicalIntakeSession` | 30 min (Draft), 7 days (Submitted/Reviewed) | Transition status to `EXPIRED` | None |
| **Patient-Doctor Access** | `PatientDoctorAccess` | Appointment window (`expires_at <= now`) | Transition status to `EXPIRED` | None |
| **Authentication Tokens** | `RefreshToken`, `PasswordResetToken` | On expiry (`expires_at <= now`) or when revoked/used | Hard delete from DB | None |
| **Unified Health Reports** | `HealthReport` | Max 10 reports per user (TRD 10.4) | Delete oldest surplus reports | Coordinated deletion from Cloudinary (`niraksh_reports/`) |
| **Lab Reports & Components** | `LabReport`, `LabReportComponent`, `LabReportNote` | 365 days (configurable) | Cascade hard delete | Coordinated deletion from Cloudinary (`niraksh_labs/`) |

---

## 2. Retention Jobs Architecture

The retention subsystem is located in `backend/src/services/retention/` and exposed via modular functions:

```
backend/src/services/retention/
├── index.ts              # Service export hub
├── types.ts              # Data contracts, stats, and options
└── retention.service.ts  # Idempotent retention execution algorithms
```

### Job Descriptions

1. **`cleanupDiseaseInfoCache`**:
   - Queries `disease_info_cache` records where `expiresAt <= now`.
   - Removes stale Gemini disease query responses to ensure updated medical intelligence.

2. **`cleanupExpiredLabShares`**:
   - Queries `lab_report_shares` where `expiresAt <= now`.
   - Prevents stale token access to sensitive diagnostic laboratory records.

3. **`cleanupExpiredClinicalIntakes`**:
   - Transitions expired intake drafts (TTL: 30 minutes) and submitted shared intakes (TTL: 7 days) to `ClinicalIntakeStatus.EXPIRED`.
   - Preserves clinical audit history while ensuring expired drafts and sessions cannot be edited or submitted.

4. **`cleanupExpiredAccessGrants`**:
   - Identifies `patient_doctor_access` records with `status = 'ACTIVE'` where `expiresAt <= now`.
   - Marks them `PatientAccessStatus.EXPIRED`, revoking doctor portal access to patient health history.

5. **`cleanupAuthTokens`**:
   - Deletes `refresh_tokens` where `expiresAt <= now` or `revoked = true`.
   - Deletes `password_reset_tokens` where `expiresAt <= now` or `used = true`.
   - Keeps token tables lean and secure.

6. **`cleanupOldHealthReports`**:
   - Identifies users possessing more than 10 `health_reports`.
   - Identifies surplus oldest reports (`count - 10`).
   - Safely deletes corresponding PDF files in Cloudinary before deleting records from the database.

7. **`cleanupOldLabReports`**:
   - Identifies lab reports older than the configured threshold (default 365 days).
   - Deletes associated PDF or raw files from Cloudinary.
   - Deletes `lab_reports` with cascading deletion to `lab_report_components`, `lab_report_notes`, and `lab_report_shares`.

8. **`runAllRetentionJobs`**:
   - Coordinated orchestrator executing all seven retention jobs sequentially.
   - Collects per-job metrics, logs execution times, and reports overall status.

---

## 3. Privacy Guarantee: Zero PHI Logging

Under HIPAA and privacy design specifications:
- **Zero Protected Health Information (PHI)** is logged during any retention or cleanup execution.
- Log entries record only operational telemetry: `job`, `scannedCount`, `eligibleCount`, `deletedCount`, `failedCount`, `durationMs`, and `dryRun`.
- Patient names, emails, medical text, symptoms, diagnoses, prescription details, and lab values are **strictly excluded** from log payloads.

Sample structured audit log:
```json
{
  "level": "info",
  "job": "cleanupOldHealthReports",
  "scannedUsersWithSurplus": 2,
  "eligibleCount": 4,
  "deletedCount": 4,
  "failedCount": 0,
  "dryRun": false,
  "durationMs": 42,
  "msg": "Retention: Health reports quota cleanup completed"
}
```

---

## 4. Doctor Read & Clinical Timeline Security

In `backend/src/controllers/clinicalIntake.controller.ts`, `buildClinicalTimeline` enforces patient consent and expiry boundaries:
1. Intakes are queried strictly requiring active consent (`consentGrantedAt != null` and `consentRevokedAt == null`).
2. Only unexpired intakes (`expiresAt > now`) are retrieved.
3. Every entry is additionally verified through `isConsentActive` before joining the timeline array.
4. If a patient revokes consent or if the session TTL expires, the intake data is immediately inaccessible to doctor timeline views.

---

## 5. CLI Execution & Operations

Retention jobs can be run manually or as scheduled cron tasks using the dedicated CLI tool in `backend/scripts/run-retention-cleanup.ts`.

### Pre-configured NPM Scripts

```bash
# Execute full cleanup in dry-run mode (safe preview)
pnpm --dir backend retention:dry-run

# Execute full cleanup in active mode
pnpm --dir backend retention:cleanup

# Run comprehensive retention unit test suite
pnpm --dir backend test:retention
```

### Advanced Command-Line Flags

```bash
# Run specific job only
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=health-reports
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=lab-reports
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=disease-cache
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=clinical-intakes
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=access-grants
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=auth-tokens
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --job=lab-shares

# Custom retention thresholds
# e.g., 180-day lab report retention, max 5 health reports per user
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --lab-days=180 --max-reports=5

# JSON output for automation / monitoring ingestion
pnpm --dir backend exec tsx scripts/run-retention-cleanup.ts --dry-run --json
```

---

## 6. Production Scheduling Setup

### Option A: Standard Crontab (Linux / VM)

Run daily at 02:00 AM UTC:
```cron
0 2 * * * cd /var/www/niraksh/backend && /usr/local/bin/pnpm retention:cleanup >> /var/log/niraksh/retention.log 2>&1
```

### Option B: AWS ECS Scheduled Task / EventBridge

1. Create an Amazon EventBridge Rule with a cron expression: `cron(0 2 * * ? *)`.
2. Set the target as the Niraksh backend ECS Task Definition.
3. Set container command overrides to:
   ```json
   ["pnpm", "retention:cleanup"]
   ```

### Option C: Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: niraksh-retention-job
  namespace: niraksh
spec:
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: retention-runner
              image: niraksh-backend:latest
              command: ["pnpm", "retention:cleanup"]
              envFrom:
                - secretRef:
                    name: backend-secrets
```

---

## 7. Cloudinary Resilience & Error Handling

- All Cloudinary deletions (`deleteImage`, `deleteFile`) are wrapped in `safeDeleteCdnAsset`.
- If Cloudinary credentials are missing or the CDN service experiences transient latency/outages:
  1. A warning is recorded in the structured logs (with the public ID, but **no PHI**).
  2. The cleanup process continues with database deletion to prevent orphan state accumulation in Postgres.
  3. When `--dry-run` is specified, zero CDN API calls are made.
