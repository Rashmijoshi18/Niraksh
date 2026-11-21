export interface RetentionJobStats {
	jobName: string;
	scannedCount: number;
	eligibleCount: number;
	processedCount: number;
	deletedCount: number;
	failedCount: number;
	dryRun: boolean;
	durationMs: number;
	errors?: string[];
}

export interface RetentionRunSummary {
	runId: string;
	startedAt: string;
	completedAt: string;
	totalDurationMs: number;
	dryRun: boolean;
	jobs: Record<string, RetentionJobStats>;
	success: boolean;
}

export interface RetentionOptions {
	dryRun?: boolean;
	diseaseCacheTtlDays?: number; // default: 30
	labReportTtlDays?: number; // default: 365
	healthReportMaxPerUser?: number; // default: 10
	labShareTtlDays?: number; // default: 7
	batchSize?: number; // default: 500
	now?: Date;
}
