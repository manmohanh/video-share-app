import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { } from "../lib/s3"

export class S3 {
  private client: S3Client;

  constructor(
    private config: {
      region: string
      bucketName: string
    }
  ) {
    this.client = new S3Client({
      region: config.region
    });
  }

  getUploadUrl({ key, expiresIn }: { key: string; expiresIn: number }) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      }),
      {
        expiresIn,
      }
    )
  }

  getDownloadUrl({ key, expiresIn }: { key: string; expiresIn: number }) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      }),
      {
        expiresIn,
      }
    );
  }

  deleteObject(key: string) {
    return this.client.send(new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    }))
  }
}
