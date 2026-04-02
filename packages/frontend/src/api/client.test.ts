import { beforeEach, describe, expect, it, vi } from "vitest";

const getAccessTokenMock = vi.fn<() => string | null>();
const getRefreshTokenMock = vi.fn<() => string | null>();
const setTokensMock = vi.fn<(accessToken: string, refreshToken: string) => void>();
const clearSessionMock = vi.fn<() => void>();

vi.mock("@/lib/env", () => ({
  env: { apiBaseUrl: "https://api.test" },
}));

vi.mock("@/lib/storage", () => ({
  authStorage: {
    getAccessToken: () => getAccessTokenMock(),
    getRefreshToken: () => getRefreshTokenMock(),
    setTokens: (accessToken: string, refreshToken: string) => setTokensMock(accessToken, refreshToken),
    clearSession: () => clearSessionMock(),
  },
}));

import { SESSION_EXPIRED_EVENT, apiGetAllow404, apiRequest } from "@/api/client";

type MockResponse = {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
};

const makeResponse = (status: number, body: unknown): MockResponse => ({
  status,
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(body),
});

describe("api client auth flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getAccessTokenMock.mockReset();
    getRefreshTokenMock.mockReset();
    setTokensMock.mockReset();
    clearSessionMock.mockReset();
  });

  it("refreshes token and retries once after 401", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    getAccessTokenMock.mockReturnValueOnce("expired-access").mockReturnValue("new-access");
    getRefreshTokenMock.mockReturnValue("refresh-1");

    fetchMock
      .mockResolvedValueOnce(
        makeResponse(401, { message: "Unauthorized" }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        makeResponse(200, {
          success: true,
          data: { tokens: { accessToken: "new-access", refreshToken: "new-refresh" } },
        }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        makeResponse(200, { success: true, data: { value: 123 } }) as unknown as Response,
      );

    const result = await apiRequest<{ value: number }>("/expenses");

    expect(result).toEqual({ value: 123 });
    expect(setTokensMock).toHaveBeenCalledWith("new-access", "new-refresh");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.test/auth/refresh",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.test/expenses",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer new-access",
        }),
      }),
    );
  });

  it("clears session and dispatches session-expired event when refresh fails", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    getAccessTokenMock.mockReturnValue("expired-access");
    getRefreshTokenMock.mockReturnValue("expired-refresh");

    fetchMock
      .mockResolvedValueOnce(
        makeResponse(401, { message: "Unauthorized" }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        makeResponse(401, { message: "Refresh failed" }) as unknown as Response,
      );

    const sessionExpiredListener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, sessionExpiredListener);

    await expect(apiRequest("/expenses")).rejects.toThrow("Session expired. Please sign in again.");

    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);

    window.removeEventListener(SESSION_EXPIRED_EVENT, sessionExpiredListener);
  });

  it("does not trigger refresh flow for public auth endpoints", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    getAccessTokenMock.mockReturnValue(null);
    getRefreshTokenMock.mockReturnValue("refresh-1");

    fetchMock.mockResolvedValueOnce(
      makeResponse(401, { success: false, message: "Invalid credentials" }) as unknown as Response,
    );

    await expect(apiRequest("/auth/login", { method: "POST", body: { email: "a", password: "b" } })).rejects.toThrow(
      "Invalid credentials",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it("returns null for 404 in apiGetAllow404", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    getAccessTokenMock.mockReturnValue("access");
    getRefreshTokenMock.mockReturnValue("refresh");

    fetchMock.mockResolvedValueOnce(makeResponse(404, { message: "Not found" }) as unknown as Response);

    const result = await apiGetAllow404("/goals");

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses first validation error from API error envelope", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    getAccessTokenMock.mockReturnValue("access");
    getRefreshTokenMock.mockReturnValue("refresh");

    fetchMock.mockResolvedValueOnce(
      makeResponse(400, {
        success: false,
        errors: {
          amount: ["Amount must be positive"],
        },
      }) as unknown as Response,
    );

    await expect(apiRequest("/expenses", { method: "POST", body: { amount: -1 } })).rejects.toThrow(
      "Amount must be positive",
    );
  });
});
