// Simulates a physical punch device pushing an IN/OUT event, without needing real
// hardware (out of scope per the build brief — see Section "What's explicitly out of
// scope"). Usage:
//   pnpm --filter backend mock:punch -- --device=1 --employee=BIO-0001 --direction=IN
//   pnpm --filter backend mock:punch -- --device=1 --employee=BIO-0001 --direction=OUT --at=2026-08-18T18:05:00

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// A real biometric device at the office reports its own local wall-clock time, not UTC —
// and the backend's wall-clock parser (backend/src/common/utils/wall-clock.util.ts)
// deliberately takes timestamp digits literally as local time, ignoring any offset. Using
// `new Date().toISOString()` here would send UTC digits instead, making every "no --at"
// punch land 5:30 off from the machine's actual clock (Asia/Kolkata, UTC+5:30) — this
// formats the *local* wall-clock time to match what the real device would send.
function nowAsLocalWallClock(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function main() {
  const deviceId = args.device ?? "1";
  const employeeDeviceId = args.employee;
  const direction = (args.direction ?? "IN").toUpperCase();
  const timestamp = args.at ?? nowAsLocalWallClock();
  const apiKey = args.apiKey ?? "dev-device-key-please-change";
  const baseUrl = args.baseUrl ?? "http://localhost:3000/api/v1";

  if (!employeeDeviceId) {
    console.error("Usage: mock-punch --employee=<device_enrollment_id> [--device=1] [--direction=IN|OUT] [--at=ISO8601]");
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/devices/${deviceId}/punches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-api-key": apiKey,
    },
    body: JSON.stringify({
      employee_device_id: employeeDeviceId,
      timestamp,
      direction,
    }),
  });

  const body = await res.json().catch(() => null);
  console.log(res.status, body);
}

main();
