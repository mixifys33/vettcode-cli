/**
 * VettCode CLI Display System
 * Professional, stage-based progressive scanning experience
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';

export type ScanStage = 
  | 'collecting'
  | 'static_analysis'
  | 'deep_analysis'
  | 'validation'
  | 'reporting'
  | 'done';

interface StageConfig {
  title: string;
  messages: string[];
  color: 'cyan' | 'blue' | 'magenta' | 'yellow' | 'green';
}

const STAGE_CONFIGS: Record<ScanStage, StageConfig> = {
  collecting: {
    title: 'Collecting project files',
    messages: ['Scanning directories...', 'Filtering code files...'],
    color: 'cyan',
  },
  static_analysis: {
    title: 'Static analysis',
    messages: [
      'Detecting known vulnerability patterns...',
      'Analyzing code structure...',
      'Checking security configurations...',
    ],
    color: 'blue',
  },
  deep_analysis: {
    title: 'Deep analysis',
    messages: [
      'Inspecting code behavior...',
      'Evaluating input handling...',
      'Tracing execution paths...',
      'Analyzing data flow...',
    ],
    color: 'magenta',
  },
  validation: {
    title: 'Validating findings',
    messages: [
      'Eliminating false positives...',
      'Cross-referencing results...',
      'Calculating confidence scores...',
    ],
    color: 'yellow',
  },
  reporting: {
    title: 'Generating report',
    messages: [
      'Structuring analysis results...',
      'Preparing security summary...',
    ],
    color: 'green',
  },
  done: {
    title: 'Complete',
    messages: [],
    color: 'green',
  },
};

export class ScanDisplay {
  private spinner: Ora | null = null;
  private currentStage: ScanStage | null = null;
  private messageInterval: NodeJS.Timeout | null = null;
  private messageIndex = 0;
  private verboseMode: boolean;

  constructor(verbose: boolean = false) {
    this.verboseMode = verbose;
  }

  /**
   * Start the display with header
   */
  start() {
    console.log(chalk.bold.cyan('\n VettCode CLI') + chalk.gray(' • ') + chalk.white('Security Scanner\n'));
  }

  /**
   * Start a new stage
   */
  startStage(stage: ScanStage, detail?: string) {
    // Complete previous stage
    if (this.currentStage && this.spinner) {
      this.completeStage();
    }

    this.currentStage = stage;
    const config = STAGE_CONFIGS[stage];
    this.messageIndex = 0;

    // Create spinner
    const text = detail || config.messages[0] || config.title;
    this.spinner = ora({
      text: chalk[config.color](text),
      spinner: 'dots',
    }).start();

    // Rotate messages if multiple available
    if (config.messages.length > 1 && !detail) {
      this.messageInterval = setInterval(() => {
        this.rotateMessage();
      }, 2000);
    }
  }

  /**
   * Update current stage with custom message
   */
  updateStage(message: string) {
    if (this.spinner && this.currentStage) {
      const config = STAGE_CONFIGS[this.currentStage];
      this.spinner.text = chalk[config.color](message);
    }
  }

  /**
   * Rotate through stage messages
   */
  private rotateMessage() {
    if (!this.spinner || !this.currentStage) return;

    const config = STAGE_CONFIGS[this.currentStage];
    this.messageIndex = (this.messageIndex + 1) % config.messages.length;
    this.spinner.text = chalk[config.color](config.messages[this.messageIndex]);
  }

  /**
   * Complete current stage
   */
  completeStage(detail?: string) {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }

    if (this.spinner && this.currentStage) {
      const config = STAGE_CONFIGS[this.currentStage];
      const completionText = detail || `${config.title} complete`;
      this.spinner.succeed(chalk[config.color](completionText));
      this.spinner = null;
    }
  }

  /**
   * Log verbose-only message (hidden by default)
   */
  verbose(message: string) {
    if (this.verboseMode) {
      console.log(chalk.gray(`  [verbose] ${message}`));
    }
  }

  /**
   * Log error
   */
  error(message: string) {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
      this.spinner = null;
    } else {
      console.error(chalk.red(`✗ ${message}`));
    }
  }

  /**
   * Log warning
   */
  warn(message: string) {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(message));
      this.spinner = null;
    } else {
      console.warn(chalk.yellow(`⚠ ${message}`));
    }
  }

  /**
   * Display scan results summary
   */
  displayResults(report: any) {
    const width = 70;
    console.log('\n' + chalk.gray('─'.repeat(width)));
    console.log(chalk.bold.cyan('  SCAN RESULTS'));
    console.log(chalk.gray('─'.repeat(width)));

    // Score
    const scoreColor = report.score >= 80 ? 'green' : report.score >= 60 ? 'yellow' : 'red';
    console.log(`\n  ${chalk.bold('Score:')} ${chalk[scoreColor].bold(report.score + '/100')} ${chalk.bold(`(${report.grade})`)}`);
    
    // Findings by severity
    const findingsBySeverity = {
      critical: report.findings.filter((f: any) => f.severity === 'critical').length,
      high: report.findings.filter((f: any) => f.severity === 'high').length,
      medium: report.findings.filter((f: any) => f.severity === 'medium').length,
      low: report.findings.filter((f: any) => f.severity === 'low').length,
    };

    console.log(chalk.bold('\n  Findings by Severity:'));
    console.log(`    ${chalk.red.bold(findingsBySeverity.critical)} Critical  |  ${chalk.red(findingsBySeverity.high)} High  |  ${chalk.yellow(findingsBySeverity.medium)} Medium  |  ${chalk.gray(findingsBySeverity.low)} Low`);

    // Top 3 critical issues
    const topIssues = report.findings.filter((f: any) => f.severity === 'critical' || f.severity === 'high').slice(0, 3);
    if (topIssues.length > 0) {
      console.log(chalk.bold.red('\n  Top Priority Issues:'));
      topIssues.forEach((issue: any, i: number) => {
        const shortFile = issue.file.length > 50 ? '...' + issue.file.slice(-47) : issue.file;
        console.log(chalk.red(`    ${i + 1}. ${issue.title}`));
        console.log(chalk.gray(`       ${shortFile}:${issue.line}`));
      });
    }

    console.log('\n' + chalk.gray('─'.repeat(width)));
  }

  /**
   * Display report saved message
   */
  displayReportSaved(localPath: string) {
    console.log(chalk.green(`✔ Report saved locally`));
    console.log(chalk.gray(`  ${localPath}`));
  }

  /**
   * Display report upload success
   */
  displayReportUploaded(url: string, expiresAt: Date, localPath: string) {
    console.log(chalk.green(`✔ Report available online`));
    
    console.log(chalk.cyan(`\n╔════════════════════════════════════════════════════════════════╗`));
    console.log(chalk.cyan(`║`) + chalk.bold.white(`             📊 ANALYSIS REPORT READY              `) + chalk.cyan(`║`));
    console.log(chalk.cyan(`╚════════════════════════════════════════════════════════════════╝`));
    
    console.log(chalk.cyan.bold(`\n🌐 View interactive report:`));
    console.log(chalk.white(`   ${url}`));
    
    console.log(chalk.cyan.bold(`\n📌 What you can do:`));
    console.log(chalk.gray(`   • Explore vulnerabilities interactively`));
    console.log(chalk.gray(`   • Get AI-guided remediation suggestions`));
    console.log(chalk.gray(`   • Filter and prioritize issues`));
    console.log(chalk.gray(`   • Share results with your team`));
    
    const expiryDate = expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    console.log(chalk.yellow(`\n⏱️  Link expires: ${expiryDate} (4 days)`));
    console.log(chalk.gray(`📁 Local backup: ${localPath}\n`));
  }

  /**
   * Display upload error
   */
  displayUploadError(error: string, localPath: string) {
    console.error(chalk.red(`\n  [X] Error: ${error}`));
    
    console.log(chalk.yellow(`\n  [!] Don't worry - your report is saved locally:`));
    console.log(chalk.cyan(`      ${localPath}`));
    console.log(chalk.gray(`\n  Tips:`));
    console.log(chalk.gray(`  • Check your internet connection`));
    console.log(chalk.gray(`  • Try again later if backend is unavailable`));
    console.log(chalk.gray(`  • Use --no-upload flag to skip web upload`));
    console.log(chalk.gray(`  • View local report: file:///${localPath.replace(/\\/g, '/')}`));
    console.log();
  }

  /**
   * Cleanup on exit
   */
  cleanup() {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
    if (this.spinner) {
      this.spinner.stop();
    }
  }
}
