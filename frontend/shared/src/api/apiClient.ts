import axios, { AxiosError } from "axios";
import { tokenStore } from "./tokenStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1",
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const { data } = await axios.post(
    `${apiClient.defaults.baseURL}/auth/refresh`,
    { refreshToken },
  );
  tokenStore.setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient.request(original);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
