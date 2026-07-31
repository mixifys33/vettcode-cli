import ora from 'ora';
import chalk from 'chalk';
import * as readline from 'readline';
import { APIClient } from './api.client';
import { TokenManager } from './token.manager';

export class AuthService {
  private api: APIClient;
  private tokenManager: TokenManager;

  constructor() {
    this.api = new APIClient();
    this.tokenManager = new TokenManager();
  }

  // Prompt helper using Node readline
  private prompt(question: string, hidden = false): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      if (hidden) {
        // Hide password input
        process.stdout.write(question);
        let input = '';
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        const onData = (char: string) => {
          if (char === '\n' || char === '\r' || char === '\u0003') {
            if (char === '\u0003') process.exit(); // Ctrl+C
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            process.stdout.write('\n');
            rl.close();
            resolve(input);
          } else if (char === '\u007F') {
            // Backspace
            if (input.length > 0) input = input.slice(0, -1);
          } else {
            input += char;
            process.stdout.write('*');
          }
        };
        process.stdin.on('data', onData);
      } else {
        rl.question(question, (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      }
    });
  }

  async login(): Promise<void> {
    console.log('');
    console.log(chalk.bold.cyan('  ╔════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('  ║         VettCode CLI - Login           ║'));
    console.log(chalk.bold.cyan('  ╚════════════════════════════════════════╝'));
    console.log('');

    const spinner = ora();

    try {
      const email = await this.prompt(chalk.white('  Email: '));
      const password = await this.prompt(chalk.white('  Password: '), true);

      console.log('');
      spinner.start('Logging in...');

      const result = await this.api.login(email, password);

      await this.tokenManager.setToken(result.token, result.developer);
      spinner.succeed(chalk.green('Login successful!'));

      console.log('');
      console.log(chalk.white(`  Welcome back, ${chalk.bold.cyan(result.developer.name)}!`));
      console.log(chalk.gray(`  Email: ${result.developer.email}`));
      console.log(chalk.gray(`  Plan: ${result.developer.subscription?.plan || 'free'}`));
      console.log('');
    } catch (error: any) {
      spinner.fail('Login failed');
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(chalk.red(`  Error: ${msg}`));
      throw error;
    }
  }

  async signup(): Promise<void> {
    console.log('');
    console.log(chalk.bold.cyan('  ╔════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('  ║        VettCode CLI - Sign Up          ║'));
    console.log(chalk.bold.cyan('  ╚════════════════════════════════════════╝'));
    console.log('');

    const spinner = ora();

    try {
      const name = await this.prompt(chalk.white('  Full Name: '));
      const email = await this.prompt(chalk.white('  Email: '));
      const password = await this.prompt(chalk.white('  Password (min 6 chars): '), true);
      const confirmPassword = await this.prompt(chalk.white('  Confirm Password: '), true);

      console.log('');
      spinner.start('Creating account...');

      const result = await this.api.signup(name, email, password, confirmPassword);

      await this.tokenManager.setToken(result.token, result.developer);
      spinner.succeed(chalk.green('Account created successfully!'));

      console.log('');
      console.log(chalk.white(`  Welcome, ${chalk.bold.cyan(result.developer.name)}!`));
      console.log(chalk.gray(`  Email: ${result.developer.email}`));
      console.log(chalk.gray(`  Plan: ${result.developer.subscription?.plan || 'free'}`));
      console.log('');
      console.log(chalk.gray('  You are now logged in to VettCode CLI'));
      console.log('');
    } catch (error: any) {
      spinner.fail('Signup failed');
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(chalk.red(`  Error: ${msg}`));
      throw error;
    }
  }

  async logout(): Promise<void> {
    const spinner = ora('Logging out...').start();

    try {
      await this.tokenManager.clearToken();
      spinner.succeed('Logged out successfully');
      console.log('');
      console.log(chalk.gray('  Your session has been cleared'));
      console.log(chalk.gray('  Use "vettcode login" to authenticate again'));
      console.log('');
    } catch (error) {
      await this.tokenManager.clearToken();
      spinner.succeed('Logged out locally');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.tokenManager.isAuthenticated();
  }

  async getCurrentDeveloper(): Promise<any | null> {
    return await this.tokenManager.getDeveloper();
  }

  async verifyToken(): Promise<boolean> {
    try {
      const developer = await this.api.getCurrentDeveloper();
      const token = await this.tokenManager.getToken();
      if (token) {
        await this.tokenManager.setToken(token, developer);
      }
      return true;
    } catch {
      await this.tokenManager.clearToken();
      return false;
    }
  }
}
