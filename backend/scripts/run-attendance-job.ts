// Standalone entrypoint for the nightly attendance job — same handler the in-process
// @Cron job calls, but invocable directly (e.g. as a Lambda/ECS scheduled task
// entrypoint per the deployment mapping, LLD Section 7) without running the HTTP server.
// Usage: pnpm --filter backend job:attendance -- --date=2026-08-19 (defaults to yesterday)
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { AttendanceService } from "../src/modules/attendance/attendance.service";
import { addDaysToDateKey, todayDateKey } from "../src/common/utils/wall-clock.util";

async function main() {
  const dateArg = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1];
  // Yesterday in the COMPANY timezone — see wall-clock.util.todayDateKey.
  const date = dateArg ?? addDaysToDateKey(todayDateKey(), -1);

  const app = await NestFactory.createApplicationContext(AppModule);
  const attendanceService = app.get(AttendanceService);
  console.log(`Computing attendance for all active employees on ${date}...`);
  await attendanceService.computeForAllEmployees(date);
  console.log("Done.");
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
