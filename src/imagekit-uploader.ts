/**
 * ImageKit Uploader - Uploads reports directly to ImageKit from CLI
 */

import ImageKit from 'imagekit';

let imagekitClient: ImageKit | null = null;

function getImageKitClient(): ImageKit {
  if (!imagekitClient) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error('ImageKit credentials not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env');
    }

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
