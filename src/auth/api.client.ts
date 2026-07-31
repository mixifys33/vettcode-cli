import axios, { AxiosInstance } from 'axios';
import { TokenManager } from './token.manager';

export class APIClient {
  public client: AxiosInstance;
  private tokenManager: TokenManager;
  private baseURL: string;

  constructor(baseURL: string = 'https://vettcodecli.vercel.app') {
    this.baseURL = baseURL;
    this.tokenManager = new TokenManager();
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async login(email: string, password: string): Promise<{ token: string; developer: any }> {
    const response = await this.client.post('/api/developer-auth/login', { email, password });
    return response.data;
  }

  async signup(name: string, email: string, password: string, confirmPassword: string): Promise<{ token: string; developer: any }> {
    const response = await this.client.post('/api/developer-auth/signup', {
      name,
      email,
      password,
      confirmPassword,
    });
    return response.data;
  }

  async getCurrentDeveloper(): Promise<any> {
    const response = await this.client.get('/api/developer-auth/me');
    return response.data.developer;
  }
}
