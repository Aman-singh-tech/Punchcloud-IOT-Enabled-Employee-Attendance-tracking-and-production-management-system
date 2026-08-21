// Standalone entrypoint for the monthly payroll job, mirroring run-attendance-job.ts.
// Usage: pnpm --filter backend job:payroll -- --month=8 --year=2026
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { PayrollService } from "../src/modules/payroll/payroll.service";

async function main() {
  const now = new Date();
  const monthArg = process.argv.find((a) => a.startsWith("--month="))?.split("=")[1];
  const yearArg = process.argv.find((a) => a.startsWith("--year="))?.split("=")[1];
  const month = monthArg ? parseInt(monthArg, 10) : now.getUTCMonth() + 1;
  const year = yearArg ? parseInt(yearArg, 10) : now.getUTCFullYear();

  const app = await NestFactory.createApplicationContext(AppModule);
  const payrollService = app.get(PayrollService);
  console.log(`Generating payroll for ${month}/${year}...`);
  const results = await payrollService.generateForAllEmployees(month, year);
  const failed = results.filter((r) => !r.ok);
  console.log(`Done: ${results.length - failed.length} ok, ${failed.length} failed.`);
  if (failed.length) {
    console.log(failed);
  }
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
