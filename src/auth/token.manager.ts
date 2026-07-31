import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class TokenManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.vettcode');
    this.configPath = path.join(this.configDir, 'config.json');
  }

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.access(this.configDir);
    } catch {
      await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 });
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.token || null;
    } catch {
      return null;
    }
  }

  async setToken(token: string, developer?: any): Promise<void> {
    await this.ensureConfigDir();
    const config = { 
      token, 
      developer: developer || null,
      updatedAt: new Date().toISOString() 
    };
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      { mode: 0o600 }
    );
  }

  async getDeveloper(): Promise<any | null> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      return config.developer || null;
    } catch {
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await fs.unlink(this.configPath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
