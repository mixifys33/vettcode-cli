#!/usr/bin/env node

/**
 * VettCode CLI - Terminal-based code security scanner
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { collectFiles } from "./file-collector";
import { runSmartScan } from "./cli-scan-orchestrator";
import type { VettReport } from "./types";
import * as dotenv from "dotenv";

const program = new Command();

program
  .name("vettcode")
  .description("AI-powered codebase security and quality scanner")
  .version("1.0.0");

program
  .argument("<directory>", "Directory to scan")
  .option("-o, --output <file>", "Output report to JSON file")
  .option("-i, --ignore <patterns>", "Comma-separated ignore patterns")
  .option("--json", "Output JSON format")
  .option("--mode <mode>", "Scan mode: quick or deep (default: quick)")
  .option("--no-ai", "Disable AI analysis (static only)")
  .action(async (directory: string, options) => {
    try {
      // Load environment variables
      dotenv.config();

      console.log(chalk.bold.cyan("\n🔍 VettCode CLI - Security Scanner\n"));

      // Validate directory
      const resolvedPath = path.resolve(directory);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`❌ Error: Directory not found: ${directory}`));
        process.exit(1);
      }

      // Parse ignore patterns
      const ignorePatterns = options.ignore 
        ? options.ignore.split(",").map((p: string) => p.trim())
        : undefined;

      // Collect files
      const collectSpinner = ora("Collecting files...").start();
      const files = collectFiles(resolvedPath, ignorePatterns);
      collectSpinner.succeed(`Collected ${files.length} files`);

      if (files.length === 0) {
        console.warn(chalk.yellow("⚠️  No code files found to scan"));
        process.exit(0);
      }

      const projectName = path.basename(resolvedPath);
      const scanMode = (options.mode === "deep" ? "deep" : "quick") as "quick" | "deep";

      // Run smart scan
      const scanSpinner = ora("Running smart scan...").start();
      
      const { report, stats } = await runSmartScan(
        projectName,
        files,
        0,
        (phase, pct, detail) => {
          scanSpinner.text = `${phase} (${pct}%)${detail ? ` - ${detail}` : ''}`;
        },
        scanMode
      );

      scanSpinner.succeed(`Scan complete: ${stats.verifiedFindings} verified issues found`);

      // Display results
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        displayReport(report, stats);
      }

      // Save to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(chalk.green(`\n📄 Report saved to: ${outputPath}`));
      }

      // Exit with error code if critical issues found
      const criticalCount = report.findings.filter(f => f.severity === "critical").length;
      if (criticalCount > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();

function displayReport(report: VettReport, stats?: any): void {
  // Score header
  console.log("\n" + chalk.bold("═".repeat(60)));
  console.log(chalk.bold("SCAN RESULTS".padStart(60 - "SCAN RESULTS".length / 2).padEnd(60)));
  console.log(chalk.bold("═".repeat(60)));

  // Score with color
  const scoreColor = report.score >= 80 ? "green" : report.score >= 60 ? "yellow" : "red";
  console.log(`\n${chalk.bold("Score:")} ${chalk[scoreColor].bold(report.score + "/100")} ${chalk.bold(`(${report.grade})`)}`);
  
  // Summary
  console.log(chalk.gray(`\n${report.summary}`));
  
  // Executive verdict
  console.log(chalk.bold.cyan(`\n📋 Executive Verdict:`));
  console.log(chalk.white(report.executiveVerdict));

  // Findings by severity
  const findingsBySeverity = {
    critical: report.findings.filter(f => f.severity === "critical"),
    high: report.findings.filter(f => f.severity === "high"),
    medium: report.findings.filter(f => f.severity === "medium"),
    low: report.findings.filter(f => f.severity === "low"),
    info: report.findings.filter(f => f.severity === "info"),
  };

  console.log(chalk.bold.cyan(`\n🔍 Findings by Severity:`));
  console.log(`  ${chalk.red.bold(findingsBySeverity.critical.length)} Critical`);
  console.log(`  ${chalk.red(findingsBySeverity.high.length)} High`);
  console.log(`  ${chalk.yellow(findingsBySeverity.medium.length)} Medium`);
  console.log(`  ${chalk.gray(findingsBySeverity.low.length)} Low`);
  console.log(`  ${chalk.gray(findingsBySeverity.info.length)} Info`);

  // Critical blockers
  if (report.criticalBlockers.length > 0) {
    console.log(chalk.bold.red(`\n🚨 Critical Blockers:`));
    report.criticalBlockers.forEach(blocker => {
      console.log(chalk.red(`  • ${blocker}`));
    });
  }

  // Strengths
  if (report.strengths.length > 0) {
    console.log(chalk.bold.green(`\n✅ Strengths:`));
    report.strengths.forEach(strength => {
      console.log(chalk.green(`  • ${strength}`));
    });
  }

  // Detailed findings table
  if (report.findings.length > 0) {
    console.log(chalk.bold.cyan(`\n📝 Detailed Findings:`));
    
    const table = new Table({
      head: [
        chalk.bold("Severity"),
        chalk.bold("Category"),
        chalk.bold("Title"),
        chalk.bold("File"),
        chalk.bold("Line")
      ],
      colWidths: [10, 15, 30, 25, 6],
      wordWrap: true,
    });

    for (const finding of report.findings.slice(0, 20)) { // Limit to first 20
      const severityColor = finding.severity === "critical" ? "red" 
        : finding.severity === "high" ? "red"
        : finding.severity === "medium" ? "yellow"
        : "gray";
      
      table.push([
        chalk[severityColor](finding.severity.toUpperCase()),
        finding.category,
        finding.title.substring(0, 28),
        finding.file?.substring(0, 23) || "",
        finding.line?.toString() || ""
      ]);
    }

    console.log(table.toString());

    if (report.findings.length > 20) {
      console.log(chalk.gray(`\n... and ${report.findings.length - 20} more findings`));
    }
  }

  // Metadata
  console.log(chalk.bold.gray(`\n📊 Scan Metadata:`));
  console.log(chalk.gray(`  Project: ${report.metadata?.projectName}`));
  console.log(chalk.gray(`  Files Scanned: ${stats?.filesScanned || report.metadata?.filesScanned}`));
  console.log(chalk.gray(`  Lines Scanned: ${stats?.linesScanned || report.metadata?.linesScanned}`));
  console.log(chalk.gray(`  Static Findings: ${stats?.staticFindings || report.metadata?.staticFindings}`));
  console.log(chalk.gray(`  AI Findings: ${stats?.aiFindings || report.metadata?.aiFindings}`));
  console.log(chalk.gray(`  Verified Findings: ${stats?.verifiedFindings || report.findings.length}`));
  console.log(chalk.gray(`  False Positives Removed: ${stats?.falsePositives || "N/A"}`));
  if (stats?.tokensSaved) {
    console.log(chalk.gray(`  Tokens Saved: ${stats.tokensSaved}`));
  }
  console.log(chalk.gray(`  Report Confidence: ${report.metadata?.reportConfidence}% (${report.metadata?.reportConfidenceGrade})`));
  console.log(chalk.gray(`  Scanned At: ${report.metadata?.scannedAt}`));

  console.log(chalk.bold("═".repeat(60) + "\n"));
}
