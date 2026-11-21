import { randomUUID } from "crypto";
import prisma from "../../db/prisma";
import logger from "../../config/logger";
import { ClinicalIntakeStatus, PatientAccessStatus } from "../../generated/prisma/client";
import { deleteFile, deleteImage, extractPublicId } from "../cloudinary/cloudinary";
import type { RetentionJobStats, RetentionOptions, RetentionRunSummary } from "./types";

/**
 * Safely delete an asset from Cloudinary without aborting database operations.
 * Never logs PHI.
 */
const safeDeleteCdnAsset = async (publicId: string | null | undefined, type: "image" | "file"): Promise<boolean> => {
	if (!publicId) return false;
	try {
		if (type === "image") {
			await deleteImage(publicId);
		} else {
			await deleteFile(publicId);
		}
		return true;
	} catch (err: unknown) {
		logger.warn(
			{
				err: err instanceof Error ? err.message : String(err),
				publicId,
				type,
			},
			"Retention: Cloudinary deletion skipped or failed, proceeding with DB deletion"
		);
		return false;
	}
};

/**
 * Job 1: Clean up expired disease information cache entries (30-day TTL).
 */
export const cleanupDiseaseInfoCache = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const now = options?.now ?? new Date();

	const whereClause = {
		expiresAt: { lte: now },
	};

	try {
		const eligibleCount = await prisma.diseaseInfoCache.count({ where: whereClause });

		let deletedCount = 0;
		if (!dryRun && eligibleCount > 0) {
			const result = await prisma.diseaseInfoCache.deleteMany({ where: whereClause });
			deletedCount = result.count;
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupDiseaseInfoCache",
			scannedCount: eligibleCount,
			eligibleCount,
			processedCount: eligibleCount,
			deletedCount,
			failedCount: 0,
			dryRun,
			durationMs: Date.now() - startTime,
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleCount: stats.eligibleCount,
				deletedCount: stats.deletedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Disease info cache cleanup completed"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(
			{ job: "cleanupDiseaseInfoCache", err: errorMessage },
			"Retention: Disease info cache cleanup failed"
		);
		return {
			jobName: "cleanupDiseaseInfoCache",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Job 2: Clean up expired lab report share links (7-day TTL).
 */
export const cleanupExpiredLabShares = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const now = options?.now ?? new Date();

	const whereClause = {
		expiresAt: { lte: now },
	};

	try {
		const eligibleCount = await prisma.labReportShare.count({ where: whereClause });

		let deletedCount = 0;
		if (!dryRun && eligibleCount > 0) {
			const result = await prisma.labReportShare.deleteMany({ where: whereClause });
			deletedCount = result.count;
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupExpiredLabShares",
			scannedCount: eligibleCount,
			eligibleCount,
			processedCount: eligibleCount,
			deletedCount,
			failedCount: 0,
			dryRun,
			durationMs: Date.now() - startTime,
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleCount: stats.eligibleCount,
				deletedCount: stats.deletedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Expired lab report shares cleanup completed"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ job: "cleanupExpiredLabShares", err: errorMessage }, "Retention: Lab shares cleanup failed");
		return {
			jobName: "cleanupExpiredLabShares",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Job 3: Transition expired clinical intake sessions (30-min drafts & 7-day shared sessions) to EXPIRED.
 */
export const cleanupExpiredClinicalIntakes = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const now = options?.now ?? new Date();

	const whereClause = {
		expiresAt: { lte: now },
		status: { not: ClinicalIntakeStatus.EXPIRED },
	};

	try {
		const eligibleCount = await prisma.clinicalIntakeSession.count({ where: whereClause });

		let processedCount = 0;
		if (!dryRun && eligibleCount > 0) {
			const result = await prisma.clinicalIntakeSession.updateMany({
				where: whereClause,
				data: { status: ClinicalIntakeStatus.EXPIRED },
			});
			processedCount = result.count;
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupExpiredClinicalIntakes",
			scannedCount: eligibleCount,
			eligibleCount,
			processedCount,
			deletedCount: processedCount,
			failedCount: 0,
			dryRun,
			durationMs: Date.now() - startTime,
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleCount: stats.eligibleCount,
				processedCount: stats.processedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Expired clinical intake sessions transitioned to EXPIRED"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(
			{ job: "cleanupExpiredClinicalIntakes", err: errorMessage },
			"Retention: Clinical intake cleanup failed"
		);
		return {
			jobName: "cleanupExpiredClinicalIntakes",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Job 4: Transition expired patient-doctor access grants to EXPIRED.
 */
export const cleanupExpiredAccessGrants = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const now = options?.now ?? new Date();

	const whereClause = {
		status: PatientAccessStatus.ACTIVE,
		expiresAt: { lte: now },
	};

	try {
		const eligibleCount = await prisma.patientDoctorAccess.count({ where: whereClause });

		let processedCount = 0;
		if (!dryRun && eligibleCount > 0) {
			const result = await prisma.patientDoctorAccess.updateMany({
				where: whereClause,
				data: { status: PatientAccessStatus.EXPIRED },
			});
			processedCount = result.count;
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupExpiredAccessGrants",
			scannedCount: eligibleCount,
			eligibleCount,
			processedCount,
			deletedCount: processedCount,
			failedCount: 0,
			dryRun,
			durationMs: Date.now() - startTime,
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleCount: stats.eligibleCount,
				processedCount: stats.processedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Expired patient-doctor access grants transitioned to EXPIRED"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(
			{ job: "cleanupExpiredAccessGrants", err: errorMessage },
			"Retention: Access grants cleanup failed"
		);
		return {
			jobName: "cleanupExpiredAccessGrants",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Job 5: Clean up expired / revoked auth tokens (RefreshTokens and PasswordResetTokens).
 */
export const cleanupAuthTokens = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const now = options?.now ?? new Date();

	const refreshWhere = {
		OR: [{ expiresAt: { lte: now } }, { revoked: true }],
	};
	const resetWhere = {
		OR: [{ expiresAt: { lte: now } }, { used: true }],
	};

	try {
		const [eligibleRefresh, eligibleReset] = await Promise.all([
			prisma.refreshToken.count({ where: refreshWhere }),
			prisma.passwordResetToken.count({ where: resetWhere }),
		]);

		const totalEligible = eligibleRefresh + eligibleReset;
		let deletedCount = 0;

		if (!dryRun && totalEligible > 0) {
			const [resRefresh, resReset] = await Promise.all([
				prisma.refreshToken.deleteMany({ where: refreshWhere }),
				prisma.passwordResetToken.deleteMany({ where: resetWhere }),
			]);
			deletedCount = resRefresh.count + resReset.count;
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupAuthTokens",
			scannedCount: totalEligible,
			eligibleCount: totalEligible,
			processedCount: totalEligible,
			deletedCount,
			failedCount: 0,
			dryRun,
			durationMs: Date.now() - startTime,
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleRefresh,
				eligibleReset,
				deletedCount: stats.deletedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Expired and revoked auth tokens cleanup completed"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ job: "cleanupAuthTokens", err: errorMessage }, "Retention: Auth tokens cleanup failed");
		return {
			jobName: "cleanupAuthTokens",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

interface HealthReportGroupResult {
	userId: string;
	_count: {
		id: number;
	};
}

/**
 * Job 6: Enforce maximum 10 health reports per user, pruning oldest records and Cloudinary assets.
 */
export const cleanupOldHealthReports = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const maxPerUser = options?.healthReportMaxPerUser ?? 10;

	try {
		// Group reports by user to find users with surplus reports (> maxPerUser)
		const userCounts = (await prisma.healthReport.groupBy({
			by: ["userId"],
			_count: { id: true },
			having: {
				id: {
					_count: {
						gt: maxPerUser,
					},
				},
			},
		})) as unknown as HealthReportGroupResult[];

		let eligibleCount = 0;
		let deletedCount = 0;
		let failedCount = 0;
		const errors: string[] = [];

		for (const userGroup of userCounts) {
			const surplus = userGroup._count.id - maxPerUser;
			if (surplus <= 0) continue;

			eligibleCount += surplus;

			// Fetch the oldest surplus reports for this user
			const oldestReports = await prisma.healthReport.findMany({
				where: { userId: userGroup.userId },
				orderBy: { createdAt: "asc" },
				take: surplus,
				select: { id: true, publicId: true, reportUrl: true },
			});

			if (!dryRun) {
				for (const report of oldestReports) {
					try {
						const publicId =
							report.publicId || (report.reportUrl ? extractPublicId(report.reportUrl) : null);
						if (publicId) {
							await safeDeleteCdnAsset(publicId, "image");
						}

						await prisma.healthReport.delete({ where: { id: report.id } });
						deletedCount++;
					} catch (err: unknown) {
						failedCount++;
						const msg = err instanceof Error ? err.message : String(err);
						errors.push(msg);
						logger.error({ err: msg }, "Retention: Failed to delete surplus health report");
					}
				}
			}
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupOldHealthReports",
			scannedCount: userCounts.length,
			eligibleCount,
			processedCount: dryRun ? 0 : deletedCount + failedCount,
			deletedCount,
			failedCount,
			dryRun,
			durationMs: Date.now() - startTime,
			...(errors.length > 0 ? { errors } : {}),
		};

		logger.info(
			{
				job: stats.jobName,
				scannedUsersWithSurplus: userCounts.length,
				eligibleCount: stats.eligibleCount,
				deletedCount: stats.deletedCount,
				failedCount: stats.failedCount,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Health reports quota cleanup completed"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(
			{ job: "cleanupOldHealthReports", err: errorMessage },
			"Retention: Health reports quota cleanup failed"
		);
		return {
			jobName: "cleanupOldHealthReports",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Job 7: Clean up lab reports older than configured retention threshold (default 365 days) along with Cloudinary assets.
 */
export const cleanupOldLabReports = async (options?: RetentionOptions): Promise<RetentionJobStats> => {
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);
	const ttlDays = options?.labReportTtlDays ?? 365;
	const now = options?.now ?? new Date();
	const cutoffDate = new Date(now.getTime() - ttlDays * 24 * 60 * 60 * 1000);
	const batchSize = options?.batchSize ?? 500;

	const whereClause = {
		createdAt: { lte: cutoffDate },
	};

	try {
		const eligibleCount = await prisma.labReport.count({ where: whereClause });

		let deletedCount = 0;
		let failedCount = 0;
		const errors: string[] = [];

		if (!dryRun && eligibleCount > 0) {
			const oldReports = await prisma.labReport.findMany({
				where: whereClause,
				select: { id: true, filePublicId: true, fileUrl: true },
				take: batchSize,
			});

			for (const report of oldReports) {
				try {
					const filePublicId =
						report.filePublicId || (report.fileUrl ? extractPublicId(report.fileUrl) : null);
					if (filePublicId) {
						await safeDeleteCdnAsset(filePublicId, "file");
					}

					// Cascade will clean up components, notes, and shares automatically
					await prisma.labReport.delete({ where: { id: report.id } });
					deletedCount++;
				} catch (err: unknown) {
					failedCount++;
					const msg = err instanceof Error ? err.message : String(err);
					errors.push(msg);
					logger.error({ err: msg }, "Retention: Failed to delete expired lab report");
				}
			}
		}

		const stats: RetentionJobStats = {
			jobName: "cleanupOldLabReports",
			scannedCount: eligibleCount,
			eligibleCount,
			processedCount: dryRun ? 0 : deletedCount + failedCount,
			deletedCount,
			failedCount,
			dryRun,
			durationMs: Date.now() - startTime,
			...(errors.length > 0 ? { errors } : {}),
		};

		logger.info(
			{
				job: stats.jobName,
				eligibleCount: stats.eligibleCount,
				deletedCount: stats.deletedCount,
				failedCount: stats.failedCount,
				retentionDays: ttlDays,
				dryRun,
				durationMs: stats.durationMs,
			},
			"Retention: Lab reports retention cleanup completed"
		);

		return stats;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error(
			{ job: "cleanupOldLabReports", err: errorMessage },
			"Retention: Lab reports retention cleanup failed"
		);
		return {
			jobName: "cleanupOldLabReports",
			scannedCount: 0,
			eligibleCount: 0,
			processedCount: 0,
			deletedCount: 0,
			failedCount: 1,
			dryRun,
			durationMs: Date.now() - startTime,
			errors: [errorMessage],
		};
	}
};

/**
 * Coordinated execution of all retention and deletion jobs.
 */
export const runAllRetentionJobs = async (options?: RetentionOptions): Promise<RetentionRunSummary> => {
	const runId = randomUUID();
	const startedAt = new Date().toISOString();
	const startTime = Date.now();
	const dryRun = Boolean(options?.dryRun);

	logger.info({ runId, dryRun, startedAt }, "Retention: Starting all data retention jobs");

	const jobs: Record<string, RetentionJobStats> = {};

	// Execute jobs sequentially to manage DB/CDN load
	jobs.diseaseInfoCache = await cleanupDiseaseInfoCache(options);
	jobs.labReportShares = await cleanupExpiredLabShares(options);
	jobs.clinicalIntakes = await cleanupExpiredClinicalIntakes(options);
	jobs.accessGrants = await cleanupExpiredAccessGrants(options);
	jobs.authTokens = await cleanupAuthTokens(options);
	jobs.healthReports = await cleanupOldHealthReports(options);
	jobs.labReports = await cleanupOldLabReports(options);

	const completedAt = new Date().toISOString();
	const totalDurationMs = Date.now() - startTime;
	const hasFailures = Object.values(jobs).some((job) => job.failedCount > 0);

	const summary: RetentionRunSummary = {
		runId,
		startedAt,
		completedAt,
		totalDurationMs,
		dryRun,
		jobs,
		success: !hasFailures,
	};

	logger.info(
		{
			runId,
			dryRun,
			totalDurationMs,
			success: summary.success,
			jobCounts: Object.fromEntries(
				Object.entries(jobs).map(([k, v]) => [k, { eligible: v.eligibleCount, deleted: v.deletedCount }])
			),
		},
		"Retention: Completed all data retention jobs"
	);

	return summary;
};
