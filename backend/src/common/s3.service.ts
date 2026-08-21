import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Wraps the S3 layout from the high-level design (Section 5.6):
//   punches/YYYY/MM/DD/*.json, production/YYYY/MM/DD/*.json,
//   payroll-reports/YYYY/MM/*.pdf, backups/db-snapshots/*.sql.gz
//
// Archival to S3 is supplementary to the primary Postgres write (LLD 5.1: "Writes raw
// event to S3 (immutable audit log)... Writes structured row to Postgres for fast
// querying" — the DB row is what the app actually operates on). When no AWS credentials
// are configured (e.g. local dev without a real bucket/MinIO), this degrades to a logged
// no-op instead of failing the request that triggered it. With real credentials configured
// it behaves exactly as before.
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client;
  private bucket: string;
  private enabled: boolean;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>("S3_ENDPOINT");
    const accessKeyId = this.config.get<string>("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("AWS_SECRET_ACCESS_KEY");
    this.enabled = !!(accessKeyId && secretAccessKey);

    this.client = new S3Client({
      region: this.config.get<string>("AWS_REGION"),
      ...(this.enabled ? { credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! } } : {}),
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    });
    this.bucket = this.config.get<string>("S3_BUCKET") ?? "punchcloud-dev";

    if (!this.enabled) {
      this.logger.warn(
        "AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY not set — S3 archival is disabled and will no-op. Set them (or S3_ENDPOINT for a local MinIO) to enable real uploads.",
      );
    }
  }

  async putJson(key: string, body: unknown): Promise<string> {
    if (!this.enabled) {
      this.logger.warn(`S3 disabled — skipped putJson(${key})`);
      return key;
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: JSON.stringify(body),
        ContentType: "application/json",
      }),
    );
    return key;
  }

  async putBuffer(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.enabled) {
      this.logger.warn(`S3 disabled — skipped putBuffer(${key})`);
      return key;
    }
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return key;
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string | null> {
    if (!this.enabled) {
      this.logger.warn(`S3 disabled — no download URL available for ${key}`);
      return null;
    }
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
