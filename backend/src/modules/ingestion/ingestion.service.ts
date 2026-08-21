import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { S3Service } from "../../common/s3.service";
import { AttendanceService } from "../attendance/attendance.service";
import { PunchEventDto } from "./dto/punch-event.dto";
import { dateKey, parseWallClockTimestamp } from "../../common/utils/wall-clock.util";

const DEDUPE_WINDOW_MS = 60_000;

export interface PunchIngestResult {
  punchId: string;
  status: "accepted" | "duplicate_ignored";
}

// LLD 3.x sequence flow: Ingestion API -> validate employee_device_id -> write to
// punch_log + S3 -> (real-time) trigger the attendance engine for that employee/day.
@Injectable()
export class IngestionService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private attendanceService: AttendanceService,
  ) {}

  async ingestPunch(deviceId: number, dto: PunchEventDto): Promise<PunchIngestResult> {
    const employee = await this.prisma.employee.findUnique({
      where: { deviceEnrollmentId: dto.employee_device_id },
    });
    if (!employee) {
      throw new NotFoundException(
        `No employee enrolled with device_enrollment_id '${dto.employee_device_id}'`,
      );
    }

    const timestamp = parseWallClockTimestamp(dto.timestamp);

    // Application-level dedupe window, on top of the UNIQUE(employee_id, punch_timestamp)
    // DB constraint (LLD Section 5, error handling table).
    const windowStart = new Date(timestamp.getTime() - DEDUPE_WINDOW_MS);
    const windowEnd = new Date(timestamp.getTime() + DEDUPE_WINDOW_MS);
    const nearDuplicate = await this.prisma.punchLog.findFirst({
      where: {
        employeeId: employee.employeeId,
        punchTimestamp: { gte: windowStart, lte: windowEnd },
      },
    });
    if (nearDuplicate) {
      return { punchId: nearDuplicate.punchId.toString(), status: "duplicate_ignored" };
    }

    const [yyyy, mm, dd] = dateKey(timestamp).split("-");
    const s3Key = `punches/${yyyy}/${mm}/${dd}/${employee.employeeId}-${timestamp.getTime()}.json`;
    await this.s3.putJson(s3Key, {
      employee_device_id: dto.employee_device_id,
      employee_id: employee.employeeId,
      device_id: deviceId,
      timestamp: dto.timestamp,
      direction: dto.direction ?? null,
    });

    let punch;
    try {
      punch = await this.prisma.punchLog.create({
        data: {
          employeeId: employee.employeeId,
          deviceId,
          punchTimestamp: timestamp,
          direction: dto.direction,
          rawPayloadS3Key: s3Key,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        // UNIQUE(employee_id, punch_timestamp) safety net caught a race the app-level check missed.
        throw new ConflictException("duplicate_ignored");
      }
      throw err;
    }

    // Real-time incremental recompute for just this employee/day (LLD 3.1).
    await this.attendanceService.computeAttendance(employee.employeeId, dateKey(timestamp));

    return { punchId: punch.punchId.toString(), status: "accepted" };
  }

  async ingestBatch(deviceId: number, events: PunchEventDto[]): Promise<PunchIngestResult[]> {
    const results: PunchIngestResult[] = [];
    for (const event of events) {
      results.push(await this.ingestPunch(deviceId, event));
    }
    return results;
  }
}
