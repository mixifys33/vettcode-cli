/**
 * ImageKit Uploader - Uploads reports directly to ImageKit from CLI
 */

import ImageKit from 'imagekit';
import { DEFAULT_CONFIG } from './config';

let imagekitClient: ImageKit | null = null;

function getImageKitClient(): ImageKit {
  if (!imagekitClient) {
    // Use environment variables if provided, otherwise use defaults
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || DEFAULT_CONFIG.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || DEFAULT_CONFIG.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || DEFAULT_CONFIG.IMAGEKIT_URL_ENDPOINT;

    imagekitClient = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return imagekitClient;
}

export interface UploadResult {
  reportId: string;
  imageKitUrl: string;
  fileName: string;
}

/**
 * Upload a report to ImageKit
 */
export async function uploadReportToImageKit(reportData: any, reportId: string): Promise<UploadResult> {
  try {
    const imagekit = getImageKitClient();
    const fileName = `${reportId}.json`;
    const fileContent = JSON.stringify(reportData, null, 2);
    
    // ImageKit expects base64 string for file uploads
    const base64Content = Buffer.from(fileContent, 'utf-8').toString('base64');
    
    const uploadResponse = await imagekit.upload({
      file: base64Content,
      fileName: fileName,
      folder: '/vettcode-reports',
      useUniqueFileName: false,
      tags: ['report', 'vettcode', 'cli'],
    });

    return {
      reportId,
      imageKitUrl: uploadResponse.url,
      fileName: uploadResponse.name,
    };
  } catch (error) {
    // PRODUCTION: Show minimal error info
    const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
    throw new Error(`Failed to upload report to ImageKit: ${errorMsg}`);
  }
}
