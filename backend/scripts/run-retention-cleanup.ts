#!/usr/bin/env tsx
/**
 * Niraksh Guardian - Health Data Retention & Deletion CLI Runner
 *
 * Usage:
 *   pnpm --dir backend retention:cleanup
 *   pnpm --dir backend retention:dry-run
 *   tsx scripts/run-retention-cleanup.ts --dry-run
 *   tsx scripts/run-retention-cleanup.ts --job=disease-cache
 *   tsx scripts/run-retention-cleanup.ts --lab-days=180 --max-reports=5
 */

import dotenv from "dotenv";
dotenv.config();

import {
	cleanupDiseaseInfoCache,
	cleanupExpiredLabShares,
	cleanupExpiredClinicalIntakes,
	cleanupExpiredAccessGrants,
	cleanupAuthTokens,
	cleanupOldHealthReports,
	cleanupOldLabReports,
	runAllRetentionJobs,
} from "../src/services/retention/retention.service";
import type { RetentionOptions } from "../src/services/retention/types";
import logger from "../src/config/logger";
import prisma from "../src/db/prisma";

const args = process.argv.slice(2);

const parseArg = (prefix: string): string | undefined => {
	const match = args.find((arg) => arg.startsWith(prefix));
	return match ? match.split("=")[1] : undefined;
};

const hasFlag = (flag: string): boolean => args.includes(flag);

const dryRun = hasFlag("--dry-run");
const asJson = hasFlag("--json");
const jobArg = parseArg("--job") || "all";
const labDaysStr = parseArg("--lab-days");
const maxReportsStr = parseArg("--max-reports");
const batchSizeStr = parseArg("--batch-size");

const options: RetentionOptions = {
	dryRun,
	labReportTtlDays: labDaysStr ? parseInt(labDaysStr, 10) : 365,
	healthReportMaxPerUser: maxReportsStr ? parseInt(maxReportsStr, 10) : 10,
	batchSize: batchSizeStr ? parseInt(batchSizeStr, 10) : 500,
};

async function main() {
	logger.info(
		{
			dryRun,
			job: jobArg,
			labReportTtlDays: options.labReportTtlDays,
			healthReportMaxPerUser: options.healthReportMaxPerUser,
		},
		"Starting Retention Job Execution"
	);

	try {
		let result: unknown;

		switch (jobArg) {
			case "disease-cache":
				result = await cleanupDiseaseInfoCache(options);
				break;
			case "lab-shares":
				result = await cleanupExpiredLabShares(options);
				break;
			case "clinical-intakes":
				result = await cleanupExpiredClinicalIntakes(options);
				break;
			case "access-grants":
				result = await cleanupExpiredAccessGrants(options);
				break;
			case "auth-tokens":
				result = await cleanupAuthTokens(options);
				break;
			case "health-reports":
				result = await cleanupOldHealthReports(options);
				break;
			case "lab-reports":
				result = await cleanupOldLabReports(options);
				break;
			case "all":
			default:
				result = await runAllRetentionJobs(options);
				break;
		}

		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
		} else {
			console.log("\n==========================================");
			console.log(`Retention Run Complete [dry-run: ${dryRun}]`);
			console.log("==========================================");
			console.log(JSON.stringify(result, null, 2));
		}

		await prisma.$disconnect();
		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, "Retention runner encountered an unhandled error");
		console.error("Retention runner failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

main();
