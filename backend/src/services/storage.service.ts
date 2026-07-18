import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

export class StorageService {
  private s3Client: S3Client | null = null;

  constructor() {
    if (config.r2AccountId && config.r2AccessKeyId && config.r2SecretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.r2AccessKeyId,
          secretAccessKey: config.r2SecretAccessKey,
        },
      });
    }
  }

  /**
   * Uploads a file directly to Cloudflare R2
   */
  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.s3Client || !config.r2BucketName) {
      throw new Error('Cloudflare R2 is not configured.');
    }

    const command = new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    if (config.r2PublicUrl) {
      return `${config.r2PublicUrl}/${key}`;
    }

    // Fallback if no public URL configured, returns a presigned URL valid for 1 hour
    return this.getPresignedDownloadUrl(key);
  }

  /**
   * Generates a pre-signed URL for the frontend to upload a file directly to R2
   */
  async generatePresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client || !config.r2BucketName) {
      throw new Error('Cloudflare R2 is not configured.');
    }

    const command = new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a pre-signed URL to download/view a private file
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client || !config.r2BucketName) {
      throw new Error('Cloudflare R2 is not configured.');
    }

    const command = new GetObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

export const storageService = new StorageService();
