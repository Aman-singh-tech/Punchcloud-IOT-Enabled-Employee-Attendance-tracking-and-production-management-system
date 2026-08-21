import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// Application-layer encryption for at-rest PII (LLD Section 6: "salary details encrypted
// at rest"). Used only by SalaryStructureRepository for monthly_base_salary/per_record_rate.
// Ciphertext layout: [12-byte IV][16-byte auth tag][ciphertext].
@Injectable()
export class CryptoService implements OnModuleInit {
  private key!: Buffer;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const b64 = this.config.get<string>("SALARY_ENCRYPTION_KEY");
    if (!b64) {
      throw new Error("SALARY_ENCRYPTION_KEY is not set");
    }
    const key = Buffer.from(b64, "base64");
    if (key.length !== 32) {
      throw new Error("SALARY_ENCRYPTION_KEY must decode to exactly 32 bytes");
    }
    this.key = key;
  }

  encryptDecimal(value: string): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]);
  }

  decryptDecimal(payload: Buffer): string {
    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
    const ciphertext = payload.subarray(IV_LENGTH + 16);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }
}
