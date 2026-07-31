/**
 * VettCode API Client
 * Routes all AI and storage requests through VettCode backend
 * This keeps API keys secure on the server side
 */

import { getBackendURL } from './config';

const VETTCODE_API_URL = getBackendURL();

export interface AIAnalysisRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  batchIndex: number;
  projectName: string;
}

export interface AIAnalysisResponse {
  findings: any[];
  model: string;
  provider: 'openrouter' | 'groq';
}

/**
 * Send code for AI analysis through VettCode backend
 * Backend handles API key management and provider fallback
 */
export async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const response = await fetch(`${VETTCODE_API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI analysis failed: ${response.status} ${error}`);
  }

  return response.json();
}

export interface ReportUploadRequest {
  reportData: any;
  reportId: string;
  projectName: string;
}

export interface ReportUploadResponse {
  reportId: string;
  url: string;
  webUrl: string;
}

/**
 * Upload report through VettCode backend
 * Backend handles ImageKit credentials securely
 */
export async function uploadReport(request: ReportUploadRequest): Promise<ReportUploadResponse> {
  // Get auth token from config
  const { TokenManager } = await import('./auth/token.manager');
  const tokenManager = new TokenManager();
  const token = await tokenManager.getToken();
  
  if (!token) {
    throw new Error('Not authenticated. Please run "vettcode login" first.');
  }

  const response = await fetch(`${VETTCODE_API_URL}/reports/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Report upload failed: ${response.status} ${error}`);
  }

  return response.json();
}
