import { apiClient } from "./apiClient";
import { AuthenticatedUser } from "../types/employee";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),
};
