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
import * as readline from "readline";
import { collectFiles } from "./file-collector";
import { runSmartScan } from "./cli-scan-orchestrator";
import type { VettReport } from "./types";
import * as dotenv from "dotenv";
import { generateHTMLReport } from "./html-report-generator";

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);

const program = new Command();

program
  .name("vettcode")
  .description("AI-powered codebase security and quality scanner")
  .version(packageJson.version);

program
  .argument("[directory]", "Directory to scan")
  .option("-o, --output <file>", "Output report to JSON file")
  .option("-i, --ignore <patterns>", "Comma-separated ignore patterns")
  .option("--json", "Output JSON format")
  .option("--mode <mode>", "Scan mode: quick or deep (default: quick)")
  .option("--no-ai", "Disable AI analysis (static only)")
  .option("--no-upload", "Skip uploading report to web (saves locally only)")
  .addHelpText('after', `

Examples:
  ${chalk.bold.cyan('Basic Usage:')}
  $ vettcode .                              ${chalk.gray('# Scan + upload to web (default)')}
  $ vettcode /path/to/project               ${chalk.gray('# Scan specific directory + upload')}
  $ vettcode . --no-upload                  ${chalk.gray('# Scan without web upload (local only)')}

  ${chalk.bold.cyan('Scan Modes:')}
  $ vettcode . --mode deep                  ${chalk.gray('# Full analysis with AI (2-3 min, most thorough)')}
  $ vettcode . --no-ai                      ${chalk.gray('# Fast static-only scan (30s, no AI)')}
  $ vettcode .                              ${chalk.gray('# Quick scan (default, balanced speed/depth)')}

  ${chalk.bold.cyan('Output Options:')}
  $ vettcode . -o results.json              ${chalk.gray('# Upload + save JSON locally')}
  $ vettcode . --json                       ${chalk.gray('# Upload + print JSON to stdout')}
  $ vettcode . --no-upload                  ${chalk.gray('# Local only (no web upload)')}
  $ vettcode . --no-upload -o report.json   ${chalk.gray('# Local only + save JSON')}
  $ vettcode . --mode deep                  ${chalk.gray('# Deep scan + upload')}

  ${chalk.bold.cyan('Filtering:')}
  $ vettcode . -i "node_modules,dist"       ${chalk.gray('# Ignore specific directories')}
  $ vettcode . -i "*.test.js,*.spec.ts"     ${chalk.gray('# Ignore test files')}

  ${chalk.bold.cyan('Combined Examples:')}
  $ vettcode . --mode deep -o detailed.json ${chalk.gray('# Comprehensive scan + save')}
  $ vettcode . --no-ai -o fast-report.json  ${chalk.gray('# Quick static scan + save')}

  ${chalk.bold.cyan('Testing Scenarios:')}
  ${chalk.gray('• Before deployment:')}        vettcode . --mode deep
  ${chalk.gray('• During development:')}       vettcode . --no-ai
  ${chalk.gray('• CI/CD pipeline:')}           vettcode . -o results.json
  ${chalk.gray('• Quick validation:')}         vettcode .

  ${chalk.bold.cyan('When to Use Each Mode:')}
  ${chalk.bold('Quick Mode')} (default)
    ✓ Balanced speed and coverage
    ✓ Scans priority files (~30 seconds)
    ✓ Best for: Regular development checks
    ${chalk.cyan('Example:')} vettcode .

  ${chalk.bold('Deep Mode')} (--mode deep)
    ✓ Comprehensive analysis of all files
    ✓ Maximum coverage (~2-3 minutes)
    ✓ Best for: Pre-production validation
    ${chalk.cyan('Example:')} vettcode . --mode deep

  ${chalk.bold('Static-Only')} (--no-ai)
    ✓ Fastest scan (~30 seconds)
    ✓ No AI required (offline capable)
    ✓ Best for: CI/CD, quick checks, no API keys
    ${chalk.cyan('Example:')} vettcode . --no-ai

  ${chalk.bold.cyan('Meta Scan (Scan VettCode Itself):')}
  $ cd C:\\Users\\USER\\Desktop\\ALLOUTGADGATS\\Vettcode-engine-cli
  $ vettcode .                              ${chalk.gray('# Scan the scanner!')}

  ${chalk.bold.cyan('Info:')}
  $ vettcode --help                         ${chalk.gray('# Show this help')}
  $ vettcode --version                      ${chalk.gray('# Show version number')}

${chalk.bold.cyan('Interactive TUI Mode:')}
  Run without arguments to launch the interactive terminal UI:
  $ vettcode                                ${chalk.gray('# Launch full-screen TUI with menus')}
`)
  .action(async (directory: string | undefined, options) => {
    try {
      // Load environment variables
      dotenv.config();

      // If no directory provided, launch interactive Ink TUI
      if (!directory) {
        const { spawn } = require('child_process');
        const path = require('path');
        
        // Try to launch Ink TUI
        const tuiPath = path.join(__dirname, 'ink-ui.js');
        if (fs.existsSync(tuiPath)) {
          const child = spawn('node', [tuiPath], { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          
          child.on('exit', (code: number) => {
            process.exit(code || 0);
          });
          return;
        } else {
          // Fallback to showing help
          console.log(chalk.bold.cyan("\n[+] VettCode CLI - Security Scanner\n"));
          console.log(chalk.yellow("Interactive TUI not found. Use: vettcode <directory> to scan.\n"));
          program.help();
          return;
        }
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
      const disableAI = options.ai === false; // --no-ai flag

      // Run smart scan
      const scanSpinner = ora("Running smart scan...").start();
      
      const { report, stats } = await runSmartScan(
        projectName,
        files,
        0,
        (phase, pct, detail) => {
          scanSpinner.text = `${phase} (${pct}%)${detail ? ` - ${detail}` : ''}`;
        },
        scanMode,
        disableAI
      );

      scanSpinner.succeed(`Scan complete: ${stats.verifiedFindings} verified issues found`);

      // Display quick summary in terminal
      displayQuickSummary(report);

      // Generate detailed HTML report (local copy)
      console.log(chalk.cyan('\n  [*] Generating reports...'));
      const reportPath = generateHTMLReport(report, {
        outputDir: resolvedPath,
        openInBrowser: false, // Don't open browser - use web URL instead
        forUpload: false, // Always save locally
        projectName: projectName,
      });
      
      console.log(chalk.green(`  [✓] Local report saved: ${reportPath}`));

      // Always upload to web (unless --no-upload flag is set)
      const shouldUpload = options.upload !== false; // Upload by default
      
      if (shouldUpload) {
        await uploadReportToLandingPage(report, projectName, scanMode, reportPath);
      } else {
        // Only if user explicitly used --no-upload
        console.log(chalk.yellow(`\n  [!] Web upload disabled (--no-upload flag)`));
        console.log(chalk.cyan(`  [→] View local report:`));
        console.log(chalk.blue.underline(`  file:///${reportPath.replace(/\\/g, '/')}`));
        console.log();
      }

      // Display full results if JSON flag
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      }

      // Save to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(chalk.green(`[*] JSON report saved to: ${outputPath}`));
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

function displayQuickSummary(report: VettReport): void {
  const width = 70;
  console.log('\n' + chalk.bold.cyan('─'.repeat(width)));
  console.log(chalk.bold.cyan('  SCAN RESULTS'));
  console.log(chalk.bold.cyan('─'.repeat(width)));

  // Score
  const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : 'red';
  console.log(`\n  ${chalk.bold('Score:')} ${chalk[scoreColor].bold(report.score + '/100')} ${chalk.bold(`(${report.grade})`)}`);
  
  // Findings by severity
  const findingsBySeverity = {
    critical: report.findings.filter(f => f.severity === 'critical').length,
    high: report.findings.filter(f => f.severity === 'high').length,
    medium: report.findings.filter(f => f.severity === 'medium').length,
    low: report.findings.filter(f => f.severity === 'low').length,
  };

  console.log(chalk.bold('\n  Findings by Severity:'));
  console.log(`    ${chalk.red.bold(findingsBySeverity.critical)} Critical  |  ${chalk.red(findingsBySeverity.high)} High  |  ${chalk.yellow(findingsBySeverity.medium)} Medium  |  ${chalk.gray(findingsBySeverity.low)} Low`);

  // Top 3 critical issues
  const topIssues = report.findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 3);
  if (topIssues.length > 0) {
    console.log(chalk.bold.red('\n  Top Priority Issues:'));
    topIssues.forEach((issue, i) => {
      const shortFile = issue.file.length > 50 ? '...' + issue.file.slice(-47) : issue.file;
      console.log(chalk.red(`    ${i + 1}. ${issue.title}`));
      console.log(chalk.gray(`       ${shortFile}:${issue.line}`));
    });
  }

  console.log('\n' + chalk.bold.cyan('─'.repeat(width)));
}

async function showInteractiveHome(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    showHomeScreen();

    console.log(chalk.bold.cyan("\n  Options:\n"));
    console.log(chalk.white("  [1] Scan a directory"));
    console.log(chalk.white("  [2] View all commands"));
    console.log(chalk.white("  [3] Support & Resources"));
    console.log(chalk.white("  [4] Exit"));

    const answer = await new Promise<string>((resolve) => {
      rl.question(chalk.gray("\n  Select an option: "), resolve);
    });

    console.clear();

    switch (answer.trim()) {
      case "1":
        const dirPath = await new Promise<string>((resolve) => {
          rl.question(chalk.gray("  Enter directory path to scan: "), resolve);
        });
        rl.close();
        // Trigger scan with the directory
        process.argv.push(dirPath);
        program.parse(process.argv);
        return;

      case "2":
        showAllCommands();
        await new Promise<void>((resolve) => {
          rl.question(chalk.gray("\n  Press Enter to continue..."), () => resolve());
        });
        break;

      case "3":
        showSupportResources();
        await new Promise<void>((resolve) => {
          rl.question(chalk.gray("\n  Press Enter to continue..."), () => resolve());
        });
        break;

      case "4":
        rl.close();
        console.log(chalk.gray("\n  Goodbye!\n"));
        process.exit(0);

      default:
        console.log(chalk.red("\n  Invalid option. Please try again.\n"));
        await new Promise<void>((resolve) => {
          rl.question(chalk.gray("  Press Enter to continue..."), () => resolve());
        });
    }
  }
}

function showAllCommands(): void {
  console.log(chalk.bold.cyan("\n  All Commands:\n"));
  console.log(chalk.white("  vettcode <directory>              ") + chalk.gray("# Scan a directory"));
  console.log(chalk.white("  vettcode <directory> -o <file>   ") + chalk.gray("# Output report to JSON file"));
  console.log(chalk.white("  vettcode <directory> -i <patterns>") + chalk.gray("# Comma-separated ignore patterns"));
  console.log(chalk.white("  vettcode <directory> --json       ") + chalk.gray("# Output JSON format to stdout"));
  console.log(chalk.white("  vettcode <directory> --mode <mode>") + chalk.gray("# Scan mode: quick or deep"));
  console.log(chalk.white("  vettcode <directory> --no-ai     ") + chalk.gray("# Disable AI analysis"));
  console.log(chalk.white("  vettcode --help                   ") + chalk.gray("# Show help information"));
  console.log(chalk.white("  vettcode --version                ") + chalk.gray("# Show version number"));
}

function showSupportResources(): void {
  console.log(chalk.bold.cyan("\n  Support & Resources:\n"));
  console.log(chalk.white("  GitHub Repository:  ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli"));
  console.log(chalk.white("  npm Package:       ") + chalk.cyan("https://www.npmjs.com/package/vettcode-cli"));
  console.log(chalk.white("  Report Issues:     ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli/issues"));
  console.log(chalk.white("  Documentation:     ") + chalk.cyan("https://github.com/mixifys33/vettcode-cli#readme"));
}

function showHomeScreen(): void {
  console.clear();
  console.log(chalk.bold.cyan("\n  VettCode CLI - Enterprise-Grade Code Security Scanner\n"));
  console.log(chalk.bold.white("  Advanced static analysis powered by state-of-the-art AI models\n"));

  // Hero section with impressive stats
  const heroTable = new Table({
    head: [
      chalk.bold("Capability"),
      chalk.bold("Impact")
    ],
    colWidths: [35, 33],
    wordWrap: true,
  });

  heroTable.push([
    chalk.cyan.bold("350+ Security Patterns"),
    chalk.white("Comprehensive vulnerability detection")
  ]);
  heroTable.push([
    chalk.cyan.bold("AST-Based Analysis"),
    chalk.white("Intelligent code extraction")
  ]);
  heroTable.push([
    chalk.cyan.bold("<3% False Positive Rate"),
    chalk.white("Multi-layer verification system")
  ]);
  heroTable.push([
    chalk.cyan.bold("Data Flow Tracking"),
    chalk.white("End-to-end input analysis")
  ]);
  heroTable.push([
    chalk.cyan.bold("Control Flow Analysis"),
    chalk.white("Error handling validation")
  ]);
  heroTable.push([
    chalk.cyan.bold("Cross-File Reference Graph"),
    chalk.white("Context-aware security checks")
  ]);

  console.log(heroTable.toString());

  console.log(chalk.gray("\n  Quick Start Commands:\n"));
  console.log(chalk.white("  vettcode <directory>              ") + chalk.gray("# Scan a directory"));
  console.log(chalk.white("  vettcode <directory> --mode deep  ") + chalk.gray("# Deep scan mode"));
  console.log(chalk.white("  vettcode <directory> --no-ai     ") + chalk.gray("# Static analysis only"));
  console.log(chalk.white("  vettcode <directory> -o report.json") + chalk.gray("# Save report to file"));

  console.log(chalk.gray("\n  AI Enhancement (Optional):\n"));
  console.log(chalk.gray("  Enable advanced AI analysis by configuring your API key in .env"));
  console.log(chalk.gray("  Uses latest generation AI models for enhanced detection capabilities"));
  console.log(chalk.gray("  Supports custom model configurations for specialized analysis"));

  // Credits at bottom
  console.log(chalk.gray("\n" + "─".repeat(70)));
  console.log(chalk.gray("  Powered by AD-Technologies and AI Enterprises"));
  console.log(chalk.gray("  Special thanks: Masereka Adorable, Hacker X"));
  console.log(chalk.gray("─".repeat(70) + "\n"));
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

/**
 * Upload report to VettCode landing page API
 */
async function uploadReportToLandingPage(
  report: VettReport,
  projectName: string,
  scanMode: "quick" | "deep",
  localReportPath: string
): Promise<void> {
  const uploadSpinner = ora("Uploading report to VettCode...").start();
  
  try {
    // API endpoint
    const apiUrl = process.env.VETTCODE_API_URL || "https://vettcodecli.vercel.app/api/reports/upload";
    
    // Prepare payload
    const payload = {
      report,
      projectName,
      scanMode,
    };

    // Upload report
    uploadSpinner.text = "Uploading to web platform...";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    
    uploadSpinner.succeed("Report uploaded successfully!");
    
    console.log(chalk.green(`\n  ╔════════════════════════════════════════════════════════════════╗`));
    console.log(chalk.green(`  ║`) + chalk.bold.cyan(`             📊 REPORT READY - VIEW ONLINE              `) + chalk.green(`║`));
    console.log(chalk.green(`  ╚════════════════════════════════════════════════════════════════╝`));
    
    console.log(chalk.cyan.bold(`\n  🌐 Shareable URL:`));
    console.log(chalk.white.bold(`     ${data.reportUrl}`));
    
    console.log(chalk.gray(`\n  ✨ Features:`));
    console.log(chalk.gray(`     • Interactive vulnerability viewer`));
    console.log(chalk.gray(`     • AI assistant for security advice`));
    console.log(chalk.gray(`     • Filter & search findings`));
    console.log(chalk.gray(`     • Share with your team`));
    
    console.log(chalk.yellow(`\n  ⏱️  Expires: ${new Date(data.expiresAt).toLocaleDateString()} (7 days)`));
    console.log(chalk.gray(`  📁 Local copy: ${localReportPath}\n`));

  } catch (error) {
    uploadSpinner.fail("Web upload failed");
    console.error(chalk.red(`\n  [X] Error: ${error instanceof Error ? error.message : String(error)}`));
    console.log(chalk.yellow(`\n  [!] Don't worry - your report is saved locally:`));
    console.log(chalk.cyan(`      ${localReportPath}`));
    console.log(chalk.gray(`\n  Tips:`));
    console.log(chalk.gray(`  • Check your internet connection`));
    console.log(chalk.gray(`  • Use --no-upload flag to skip web upload`));
    console.log(chalk.gray(`  • View local report: file:///${localReportPath.replace(/\\/g, '/')}`));
    console.log();
  }
}
