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
  .argument("[directory]", "Directory to scan")
  .option("-o, --output <file>", "Output report to JSON file")
  .option("-i, --ignore <patterns>", "Comma-separated ignore patterns")
  .option("--json", "Output JSON format")
  .option("--mode <mode>", "Scan mode: quick or deep (default: quick)")
  .option("--no-ai", "Disable AI analysis (static only)")
  .action(async (directory: string | undefined, options) => {
    try {
      // Load environment variables
      dotenv.config();

      // If no directory provided, show home screen
      if (!directory) {
        showHomeScreen();
        return;
      }

      console.log(chalk.bold.cyan("\n[+] VettCode CLI - Security Scanner\n"));

      // Validate directory
      const resolvedPath = path.resolve(directory);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`[X] Error: Directory not found: ${directory}`));
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
        console.warn(chalk.yellow("[!] No code files found to scan"));
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
        console.log(chalk.green(`\n[*] Report saved to: ${outputPath}`));
      }

      // Exit with error code if critical issues found
      const criticalCount = report.findings.filter(f => f.severity === "critical").length;
      if (criticalCount > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red(`\n[X] Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program.parse();

function showHomeScreen(): void {
  console.log("\n" + chalk.bold.cyan("═".repeat(70)));
  console.log(chalk.bold.cyan("  VettCode CLI - AI-Powered Code Security Scanner"));
  console.log(chalk.bold.cyan("═".repeat(70)));

  console.log(chalk.bold.white("\n  Scan your codebase for security vulnerabilities and quality issues\n"));

  const table = new Table({
    head: [
      chalk.bold("Feature"),
      chalk.bold("Description")
    ],
    colWidths: [20, 48],
    wordWrap: true,
  });

  table.push([
    chalk.green("[+] Static Analysis"),
    "350+ vulnerability patterns"
  ]);
  table.push([
    chalk.green("[+] AST Extraction"),
    "Intelligent code section extraction"
  ]);
  table.push([
    chalk.green("[+] AI Analysis"),
    "Deep analysis via OpenRouter (optional)"
  ]);
  table.push([
    chalk.green("[+] Verification"),
    "Cross-validation for <3% false positives"
  ]);
  table.push([
    chalk.green("[+] Data Flow"),
    "Track user input to dangerous sinks"
  ]);
  table.push([
    chalk.green("[+] Control Flow"),
    "Identify error handling gaps"
  ]);

  console.log(table.toString());

  console.log(chalk.bold.cyan("\n  Quick Start:\n"));
  console.log(chalk.white("  vettcode <directory>              ") + chalk.gray("# Scan a directory"));
  console.log(chalk.white("  vettcode <directory> --mode deep  ") + chalk.gray("# Deep scan mode"));
  console.log(chalk.white("  vettcode <directory> --no-ai     ") + chalk.gray("# Static analysis only"));
  console.log(chalk.white("  vettcode <directory> -o report.json") + chalk.gray("# Save report to file"));

  console.log(chalk.bold.cyan("\n  All Commands:\n"));
  console.log(chalk.white("  vettcode <directory>              ") + chalk.gray("# Scan a directory"));
  console.log(chalk.white("  vettcode <directory> -o <file>   ") + chalk.gray("# Output report to JSON file"));
  console.log(chalk.white("  vettcode <directory> -i <patterns>") + chalk.gray("# Comma-separated ignore patterns"));
  console.log(chalk.white("  vettcode <directory> --json       ") + chalk.gray("# Output JSON format to stdout"));
  console.log(chalk.white("  vettcode <directory> --mode <mode>") + chalk.gray("# Scan mode: quick or deep"));
  console.log(chalk.white("  vettcode <directory> --no-ai     ") + chalk.gray("# Disable AI analysis"));
  console.log(chalk.white("  vettcode --help                   ") + chalk.gray("# Show help information"));
  console.log(chalk.white("  vettcode --version                ") + chalk.gray("# Show version number"));

  console.log(chalk.bold.cyan("\n  AI Setup (Optional):\n"));
  console.log(chalk.gray("  1. Get API key from https://openrouter.ai/keys"));
  console.log(chalk.gray("  2. Create .env file with OPENROUTER_API_KEY_1=your-key"));
  console.log(chalk.gray("  3. Run vettcode normally for AI-enhanced analysis"));

  console.log(chalk.bold.cyan("\n  Support & Resources:\n"));
  console.log(chalk.white("  GitHub Repository:  ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli"));
  console.log(chalk.white("  npm Package:       ") + chalk.cyan("https://www.npmjs.com/package/vettcode-cli"));
  console.log(chalk.white("  Report Issues:     ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli/issues"));
  console.log(chalk.white("  Documentation:     ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli#readme"));

  console.log(chalk.bold.cyan("\n═".repeat(70) + "\n"));
}

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
  console.log(chalk.bold.cyan(`\n[*] Executive Verdict:`));
  console.log(chalk.white(report.executiveVerdict));

  // Findings by severity
  const findingsBySeverity = {
    critical: report.findings.filter(f => f.severity === "critical"),
    high: report.findings.filter(f => f.severity === "high"),
    medium: report.findings.filter(f => f.severity === "medium"),
    low: report.findings.filter(f => f.severity === "low"),
    info: report.findings.filter(f => f.severity === "info"),
  };

  console.log(chalk.bold.cyan(`\n[*] Findings by Severity:`));
  console.log(`  ${chalk.red.bold(findingsBySeverity.critical.length)} Critical`);
  console.log(`  ${chalk.red(findingsBySeverity.high.length)} High`);
  console.log(`  ${chalk.yellow(findingsBySeverity.medium.length)} Medium`);
  console.log(`  ${chalk.gray(findingsBySeverity.low.length)} Low`);
  console.log(`  ${chalk.gray(findingsBySeverity.info.length)} Info`);

  // Critical blockers
  if (report.criticalBlockers.length > 0) {
    console.log(chalk.bold.red(`\n[!] Critical Blockers:`));
    report.criticalBlockers.forEach(blocker => {
      console.log(chalk.red(`  - ${blocker}`));
    });
  }

  // Strengths
  if (report.strengths.length > 0) {
    console.log(chalk.bold.green(`\n[+] Strengths:`));
    report.strengths.forEach(strength => {
      console.log(chalk.green(`  - ${strength}`));
    });
  }

  // Detailed findings table
  if (report.findings.length > 0) {
    console.log(chalk.bold.cyan(`\n[*] Detailed Findings:`));
    
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
  console.log(chalk.bold.gray(`\n[*] Scan Metadata:`));
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
