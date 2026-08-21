import { SetMetadata } from "@nestjs/common";

// Marks a route as device-facing: authenticated via a per-device API key
// (LLD Section 2.1 / Section 6), not a user JWT.
export const IS_DEVICE_ROUTE_KEY = "isDeviceRoute";
export const DeviceAuth = () => SetMetadata(IS_DEVICE_ROUTE_KEY, true);
