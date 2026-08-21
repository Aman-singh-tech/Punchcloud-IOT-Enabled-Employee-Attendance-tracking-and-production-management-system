import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaService } from "../../common/prisma.service";
import { CreateDeviceDto } from "./dto/create-device.dto";

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  // Returns the plaintext API key exactly once — only the bcrypt hash is persisted,
  // matching the DeviceApiKeyGuard's bcrypt.compare check.
  async create(dto: CreateDeviceDto): Promise<{ device: unknown; apiKey: string }> {
    const apiKey = randomBytes(24).toString("hex");
    const apiKeyHash = await bcrypt.hash(apiKey, 10);
    const device = await this.prisma.device.create({
      data: {
        deviceName: dto.deviceName,
        locationId: dto.locationId,
        ipAddress: dto.ipAddress,
        apiKeyHash,
      },
    });
    return { device, apiKey };
  }

  findAll() {
    return this.prisma.device.findMany({
      select: {
        deviceId: true,
        deviceName: true,
        locationId: true,
        ipAddress: true,
        lastSyncAt: true,
      },
      orderBy: { deviceId: "asc" },
    });
  }
}
