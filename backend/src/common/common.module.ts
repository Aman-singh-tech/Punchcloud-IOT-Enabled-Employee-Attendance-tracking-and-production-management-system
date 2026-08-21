import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { S3Service } from "./s3.service";
import { CryptoService } from "./crypto.service";
import { AuditService } from "./audit.service";

@Global()
@Module({
  providers: [PrismaService, S3Service, CryptoService, AuditService],
  exports: [PrismaService, S3Service, CryptoService, AuditService],
})
export class CommonModule {}
