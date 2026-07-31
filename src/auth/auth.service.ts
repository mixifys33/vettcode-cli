import ora from 'ora';
import chalk from 'chalk';
import * as readline from 'readline';
import open from 'open';
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
      // Step 1: Initiate device authentication
      spinner.start('Initializing authentication...');
      const deviceAuth = await this.api.initiateDeviceAuth();
      spinner.succeed('Authentication initialized');

      // Step 2: Display code and instructions
      console.log('');
      console.log(chalk.bold.white('  Please complete authentication in your browser'));
      console.log('');
      console.log(chalk.gray('  ┌─────────────────────────────────────────┐'));
      console.log(chalk.gray('  │') + chalk.bold.cyan('  Your verification code:               ') + chalk.gray('│'));
      console.log(chalk.gray('  │                                         │'));
      console.log(chalk.gray('  │         ') + chalk.bold.yellow(deviceAuth.userCode) + chalk.gray('                    │'));
      console.log(chalk.gray('  │                                         │'));
      console.log(chalk.gray('  └─────────────────────────────────────────┘'));
      console.log('');
      console.log(chalk.gray('  Opening browser for authentication...'));
      console.log(chalk.gray(`  If browser doesn't open, visit: ${chalk.cyan(deviceAuth.verificationUrl)}`));
      console.log('');

      // Step 3: Open browser
      try {
        await open(deviceAuth.verificationUrl);
      } catch (error) {
        console.log(chalk.yellow('  Could not open browser automatically.'));
        console.log(chalk.white('  Please open this URL manually:'));
        console.log(chalk.cyan(`  ${deviceAuth.verificationUrl}`));
        console.log('');
      }

      // Step 4: Poll for authentication
      spinner.start('Waiting for authentication...');
      
      const pollInterval = deviceAuth.interval * 1000; // Convert to milliseconds
      const maxAttempts = Math.floor((deviceAuth.expiresIn / deviceAuth.interval));
      let attempts = 0;

      const poll = async (): Promise<boolean> => {
        attempts++;
        
        try {
          const result = await this.api.pollDeviceAuth(deviceAuth.deviceCode);
          
          if (result.status === 'approved') {
            // Authentication successful!
            await this.tokenManager.setToken(result.token, result.developer);
            spinner.succeed(chalk.green('Authentication successful! 🎉'));
            
            console.log('');
            console.log(chalk.white(`  Welcome, ${chalk.bold.cyan(result.developer.name)}!`));
            console.log(chalk.gray(`  Email: ${result.developer.email}`));
            console.log(chalk.gray(`  Plan: ${result.developer.subscription?.plan || 'free'}`));
            console.log('');
            
            return true;
          }
          
          if (result.status === 'expired') {
            spinner.fail('Code expired');
            throw new Error('Authentication code expired. Please try again.');
          }
          
          if (result.status === 'rejected') {
            spinner.fail('Authentication rejected');
            throw new Error('Authentication was rejected in browser.');
          }
          
          // Still pending, continue polling
          if (attempts >= maxAttempts) {
            spinner.fail('Timeout');
            throw new Error('Authentication timeout. Please try again.');
          }
          
          // Update spinner with time remaining
          const timeLeft = Math.floor((deviceAuth.expiresIn - (attempts * deviceAuth.interval)));
          spinner.text = `Waiting for authentication... (${timeLeft}s remaining)`;
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return poll();
          
        } catch (error: any) {
          if (error.message && (error.message.includes('expired') || error.message.includes('rejected') || error.message.includes('timeout'))) {
            throw error;
          }
          
          // Network error or other issue, retry
          if (attempts >= maxAttempts) {
            spinner.fail('Timeout');
            throw new Error('Authentication timeout. Please try again.');
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return poll();
        }
      };

      await poll();

    } catch (error: any) {
      spinner.fail('Login failed');
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(chalk.red(`  Error: ${msg}`));
      console.log('');
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
      // Step 1: Initiate device authentication
      spinner.start('Initializing signup...');
      const deviceAuth = await this.api.initiateDeviceAuth();
      spinner.succeed('Signup initialized');

      // Step 2: Display code and instructions
      console.log('');
      console.log(chalk.bold.white('  Complete signup in your browser'));
      console.log('');
      console.log(chalk.gray('  ┌─────────────────────────────────────────┐'));
      console.log(chalk.gray('  │') + chalk.bold.cyan('  Your verification code:               ') + chalk.gray('│'));
      console.log(chalk.gray('  │                                         │'));
      console.log(chalk.gray('  │         ') + chalk.bold.yellow(deviceAuth.userCode) + chalk.gray('                    │'));
      console.log(chalk.gray('  │                                         │'));
      console.log(chalk.gray('  └─────────────────────────────────────────┘'));
      console.log('');
      console.log(chalk.gray('  Opening browser to create account...'));
      
      // Modify URL to go to signup page with redirect
      const signupUrl = deviceAuth.verificationUrl.replace('/cli-auth', '/signup');
      const finalUrl = `${signupUrl}&redirect=${encodeURIComponent('/cli-auth?code=' + deviceAuth.userCode)}`;
      
      console.log(chalk.gray(`  If browser doesn't open, visit: ${chalk.cyan(signupUrl)}`));
      console.log(chalk.gray(`  Then return to: ${chalk.cyan(deviceAuth.verificationUrl)}`));
      console.log('');

      // Step 3: Open browser to signup page
      try {
        await open(finalUrl);
      } catch (error) {
        console.log(chalk.yellow('  Could not open browser automatically.'));
        console.log(chalk.white('  Please:'));
        console.log(chalk.cyan(`  1. Create account at: ${signupUrl.split('?')[0]}`));
        console.log(chalk.cyan(`  2. Then visit: ${deviceAuth.verificationUrl}`));
        console.log('');
      }

      // Step 4: Poll for authentication (same as login)
      spinner.start('Waiting for signup and authorization...');
      
      const pollInterval = deviceAuth.interval * 1000;
      const maxAttempts = Math.floor((deviceAuth.expiresIn / deviceAuth.interval));
      let attempts = 0;

      const poll = async (): Promise<boolean> => {
        attempts++;
        
        try {
          const result = await this.api.pollDeviceAuth(deviceAuth.deviceCode);
          
          if (result.status === 'approved') {
            await this.tokenManager.setToken(result.token, result.developer);
            spinner.succeed(chalk.green('Account created and authenticated! 🎉'));
            
            console.log('');
            console.log(chalk.white(`  Welcome to VettCode, ${chalk.bold.cyan(result.developer.name)}!`));
            console.log(chalk.gray(`  Email: ${result.developer.email}`));
            console.log(chalk.gray(`  Plan: ${result.developer.subscription?.plan || 'free'}`));
            console.log('');
            console.log(chalk.gray('  You can now start scanning your code!'));
            console.log(chalk.white('  Try: ') + chalk.cyan('vettcode .'));
            console.log('');
            
            return true;
          }
          
          if (result.status === 'expired') {
            spinner.fail('Code expired');
            throw new Error('Verification code expired. Please try again.');
          }
          
          if (result.status === 'rejected') {
            spinner.fail('Authorization rejected');
            throw new Error('Authorization was rejected in browser.');
          }
          
          if (attempts >= maxAttempts) {
            spinner.fail('Timeout');
            throw new Error('Signup timeout. Please try again.');
          }
          
          const timeLeft = Math.floor((deviceAuth.expiresIn - (attempts * deviceAuth.interval)));
          spinner.text = `Waiting for signup and authorization... (${timeLeft}s remaining)`;
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return poll();
          
        } catch (error: any) {
          if (error.message && (error.message.includes('expired') || error.message.includes('rejected') || error.message.includes('timeout'))) {
            throw error;
          }
          
          if (attempts >= maxAttempts) {
            spinner.fail('Timeout');
            throw new Error('Signup timeout. Please try again.');
          }
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return poll();
        }
      };

      await poll();

    } catch (error: any) {
      spinner.fail('Signup failed');
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(chalk.red(`  Error: ${msg}`));
      console.log('');
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
