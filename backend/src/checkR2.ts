import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';

async function list() {
  const res = await s3Client.send(new ListObjectsV2Command({ Bucket }));
  console.log(res.Contents?.map(o => o.Key));
}
list().catch(console.error);
