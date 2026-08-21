import { SetMetadata } from "@nestjs/common";

// Marks a route as not requiring a JWT (e.g. login). Distinct from device-key routes,
// which use @DeviceAuth() instead.
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
