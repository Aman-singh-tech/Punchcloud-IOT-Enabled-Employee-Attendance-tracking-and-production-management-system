import { randomBytes } from "crypto";

// Used for both initial employee login creation and HR-initiated password resets.
// Returned in the API response exactly once — never stored or logged in plaintext,
// only the bcrypt hash is persisted (see EmployeesService).
export function generateTempPassword(): string {
  return randomBytes(9).toString("base64url"); // 12 chars, ~72 bits of entropy
}
