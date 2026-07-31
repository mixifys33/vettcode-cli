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
import * as os from "os";
import { AuthService } from "./auth/auth.service";

// Load environment variables from multiple locations
// Priority: CWD .env > Home ~/.vettcode.env > CLI install dir .env
const cwd = process.cwd();
const homeDir = os.homedir();
const cliDir = path.join(__dirname, '..');

// Try to load from current working directory first
dotenv.config({ path: path.join(cwd, '.env') });

// Then try user's home directory
dotenv.config({ path: path.join(homeDir, '.vettcode.env') });

// Finally, CLI installation directory (fallback)
dotenv.config({ path: path.join(cliDir, '.env') });

// Read version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);

const program = new Command();

program
  .name("vettcode")
  .description("AI-powered codebase security and quality scanner")
  .version(packageJson.version);

// Login command
program
  .command("login")
  .description("Authenticate with VettCode CLI")
  .action(async () => {
    try {
      const authService = new AuthService();
      
      if (await authService.isAuthenticated()) {
        const developer = await authService.getCurrentDeveloper();
        console.log(chalk.yellow('\n  You are already logged in'));
        console.log(chalk.gray(`  User: ${developer?.name || 'Unknown'}`));
        console.log(chalk.gray('  Use "vettcode logout" to sign out\n'));
        return;
      }

      await authService.login();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Login failed: ${errorMsg}\n`));
      process.exit(1);
    }
  });

// Signup command
program
  .command("signup")
  .description("Create a new VettCode account")
  .action(async () => {
    try {
      const authService = new AuthService();

      if (await authService.isAuthenticated()) {
        const developer = await authService.getCurrentDeveloper();
        console.log(chalk.yellow('\n  You are already logged in'));
        console.log(chalk.gray(`  User: ${developer?.name || 'Unknown'}`));
        console.log(chalk.gray('  Use "vettcode logout" to sign out first\n'));
        return;
      }

      await authService.signup();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Signup failed: ${errorMsg}\n`));
      process.exit(1);
    }
  });

// Logout command
program
  .command("logout")
  .description("Log out from VettCode CLI")
  .action(async () => {
    try {
      const authService = new AuthService();
      
      if (!(await authService.isAuthenticated())) {
        console.log(chalk.yellow('\n  You are not logged in\n'));
        return;
      }

      await authService.logout();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Logout failed: ${errorMsg}\n`));
      process.exit(1);
    }
  });

// Whoami command
program
  .command("whoami")
  .description("Show current logged-in user")
  .action(async () => {
    try {
      const authService = new AuthService();
      
      if (!(await authService.isAuthenticated())) {
        console.log(chalk.red('\n  Not logged in'));
        console.log(chalk.gray('  Use "vettcode login" to authenticate\n'));
        return;
      }

      // Verify token is still valid
      const isValid = await authService.verifyToken();
      if (!isValid) {
        console.log(chalk.red('\n  Your session has expired'));
        console.log(chalk.gray('  Use "vettcode login" to authenticate again\n'));
        return;
      }

      const developer = await authService.getCurrentDeveloper();

      console.log('');
      console.log(chalk.bold.cyan('═══════════════════════════════════════'));
      console.log(chalk.bold.cyan('  Logged in as:'));
      console.log(chalk.bold.cyan('═══════════════════════════════════════'));
      console.log(chalk.white(`  Name:  ${chalk.bold(developer.name)}`));
      console.log(chalk.white(`  Email: ${developer.email}`));
      console.log(chalk.white(`  Plan:  ${developer.subscription?.plan || 'free'}`));
      console.log(chalk.white(`  Role:  ${developer.role || 'developer'}`));
      if (developer.scanStats) {
        console.log(chalk.gray('\n  Scan Statistics:'));
        console.log(chalk.gray(`  └─ Total Scans: ${developer.scanStats.totalScans || 0}`));
        if (developer.scanStats.lastScanDate) {
          const lastScan = new Date(developer.scanStats.lastScanDate).toLocaleDateString();
          console.log(chalk.gray(`  └─ Last Scan: ${lastScan}`));
        }
      }
      console.log(chalk.bold.cyan('═══════════════════════════════════════'));
      console.log('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n  Failed to fetch user info: ${errorMsg}\n`));
      process.exit(1);
    }
  });

program
  .argument("[directory]", "Directory to scan")
  .option("-o, --output <file>", "Output report to JSON file")
  .option("-i, --ignore <patterns>", "Comma-separated ignore patterns")
  .option("--json", "Output JSON format")
  .option("--mode <mode>", "Scan mode: quick or deep (default: quick)")
  .option("--no-ai", "Disable AI analysis (static only)")
  .option("--no-upload", "Skip uploading report to web (saves locally only)")
  .option("--api-url <url>", "Custom API URL for report upload (default: https://vettcodecli.vercel.app/api/reports/upload)")
  .option("--verbose", "Show detailed internal logs (batches, API calls, models)")
  .addHelpText('after', `

${chalk.bold.yellow('Authentication:')}
  ${chalk.bold('vettcode login')}                       ${chalk.gray('# Login via browser (opens automatically)')}
  ${chalk.bold('vettcode signup')}                      ${chalk.gray('# Create account via browser')}
  ${chalk.bold('vettcode logout')}                      ${chalk.gray('# Log out and clear session')}
  ${chalk.bold('vettcode whoami')}                      ${chalk.gray('# Show current logged-in user')}

${chalk.bold.cyan('How Browser Auth Works:')}
  1. Run ${chalk.bold('vettcode login')}
  2. Browser opens automatically with a code
  3. Login/approve in the browser
  4. Return to terminal - you're authenticated!

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
      // ============================================
      // AUTHENTICATION CHECK (ALWAYS FIRST)
      // ============================================
      const authService = new AuthService();
      const isAuthenticated = await authService.isAuthenticated();
      
      if (!isAuthenticated) {
        console.log(chalk.bold.red('\n  🔒 Authentication Required'));
        console.log(chalk.white('  You must be logged in to use VettCode CLI\n'));
        console.log(chalk.cyan('  Quick Start:'));
        console.log(chalk.white('  1. vettcode login   ') + chalk.gray('# Authenticate via browser'));
        console.log(chalk.white('  2. vettcode .       ') + chalk.gray('# Scan current directory'));
        console.log(chalk.white('  3. vettcode whoami  ') + chalk.gray('# Check login status\n'));
        process.exit(1);
      }

      // Verify token is still valid
      const isValid = await authService.verifyToken();
      if (!isValid) {
        console.log(chalk.bold.red('\n  ⚠️  Session Expired'));
        console.log(chalk.white('  Your authentication session has expired\n'));
        console.log(chalk.cyan('  Please log in again:'));
        console.log(chalk.gray('  $ vettcode login\n'));
        process.exit(1);
      }

      // Get developer info for display
      const developer = await authService.getCurrentDeveloper();
      if (developer) {
        console.log(chalk.gray(`\n  👤 Logged in as: ${chalk.cyan(developer.name)}`));
      }

      // Load environment variables from multiple locations
      // 1. Try to load from current working directory
      dotenv.config();
      
      // 2. Also try to load from the CLI installation directory (for global installs)
      const cliEnvPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(cliEnvPath)) {
        dotenv.config({ path: cliEnvPath });
      }
      
      // 3. Also try user home directory for global config
      const homeEnvPath = path.join(require('os').homedir(), '.vettcode.env');
      if (fs.existsSync(homeEnvPath)) {
        dotenv.config({ path: homeEnvPath });
      }

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

      // Import display system
      const { ScanDisplay } = await import('./display');
      const display = new ScanDisplay(options.verbose || false);
      
      display.start();

      // Validate directory
      const resolvedPath = path.resolve(directory);
      if (!fs.existsSync(resolvedPath)) {
        display.error(`Directory not found: ${directory}`);
        process.exit(1);
      }

      // Parse ignore patterns
      const ignorePatterns = options.ignore 
        ? options.ignore.split(",").map((p: string) => p.trim())
        : undefined;

      // Stage 1: Collect files
      display.startStage('collecting');
      const files = collectFiles(resolvedPath, ignorePatterns);
      display.completeStage(`Collected ${files.length} files`);

      if (files.length === 0) {
        display.warn("No code files found to scan");
        process.exit(0);
      }

      const projectName = path.basename(resolvedPath);
      const scanMode = (options.mode === "deep" ? "deep" : "quick") as "quick" | "deep";
      const disableAI = options.ai === false; // --no-ai flag

      // Run smart scan with stage-based progress
      const { report, stats } = await runSmartScan(
        projectName,
        files,
        0,
        (phase, pct, detail) => {
          // Map phases to stages
          if (options.verbose) {
            display.verbose(`${phase} (${pct}%) ${detail || ''}`);
          }
          
          // Update current stage based on phase
          if (phase.includes('Static analysis')) {
            if (!display['currentStage'] || display['currentStage'] !== 'static_analysis') {
              display.startStage('static_analysis');
            }
          } else if (phase.includes('AI review') || phase.includes('Deep analysis') || phase.includes('Enhanced Analysis')) {
            if (!display['currentStage'] || display['currentStage'] !== 'deep_analysis') {
              display.startStage('deep_analysis');
            }
          } else if (phase.includes('Verification')) {
            if (!display['currentStage'] || display['currentStage'] !== 'validation') {
              display.startStage('validation');
            }
          } else if (phase.includes('Report')) {
            if (!display['currentStage'] || display['currentStage'] !== 'reporting') {
              display.startStage('reporting');
            }
          }
        },
        scanMode,
        disableAI
      );

      // Complete final stage
      if (display['currentStage']) {
        display.completeStage();
      }

      // Display results using new display system
      display.displayResults(report);

      // Start reporting stage
      display.startStage('reporting');
      
      // Generate detailed HTML report (local copy)
      const reportPath = generateHTMLReport(report, {
        outputDir: resolvedPath,
        openInBrowser: false,
        forUpload: false,
        projectName: projectName,
      });
      
      display.completeStage('Report generation complete');
      display.displayReportSaved(reportPath);

      // Always upload to web (unless --no-upload flag is set)
      const shouldUpload = options.upload !== false;
      
      if (shouldUpload) {
        await uploadReportToLandingPage(report, projectName, scanMode, reportPath, display);
      } else {
        console.log(chalk.yellow(`\n  [!] Web upload disabled (--no-upload flag)`));
        console.log(chalk.cyan(`  [→] View local report:`));
        console.log(chalk.blue.underline(`  file:///${reportPath.replace(/\\/g, '/')}`));
        console.log();
      }
      
      // Cleanup display
      display.cleanup();

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
      // Use display system if available, otherwise fallback to console
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n[X] Error: ${errorMsg}`));
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
 * Upload report to ImageKit then register with landing page
 */
async function uploadReportToLandingPage(
  report: VettReport,
  projectName: string,
  scanMode: "quick" | "deep",
  localReportPath: string,
  display: any
): Promise<void> {
  const uploadSpinner = ora("Uploading report...").start();
  
  try {
    // Import API client
    const { uploadReport } = await import('./api-client');
    
    // Generate unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set expiration (4 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 4);
    
    const reportData = {
      id: reportId,
      projectName,
      ...report,
      scanMode,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    // Upload through backend API (handles ImageKit securely)
    display.verbose("Uploading to backend API...");
    const uploadResult = await uploadReport({
      reportData,
      reportId,
      projectName,
    });
    
    uploadSpinner.succeed("Report uploaded successfully!");
    
    // Use display system for upload success
    display.displayReportUploaded(uploadResult.webUrl, expiresAt, localReportPath);

  } catch (error) {
    uploadSpinner.fail("Upload failed");
    
    let errorMsg = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name === 'AbortError') {
      errorMsg = 'Upload timeout exceeded';
    } else if (error instanceof TypeError && errorMsg.includes('fetch')) {
      errorMsg = 'Network error - check internet connection or firewall';
    }
    
    // Use display system for upload error
    display.displayUploadError(`Report upload failed: ${errorMsg}`, localReportPath);
  }
}
