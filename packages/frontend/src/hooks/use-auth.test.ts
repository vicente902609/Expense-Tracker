import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_EXPIRED_EVENT } from "@/api/client";
import { AUTH_STORAGE_KEYS } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

const logoutApiMock = vi.fn();

vi.mock("@/api/auth", () => ({
  logout: (...args: unknown[]) => logoutApiMock(...args),
}));

const userFixture = {
  userId: "user-1",
  email: "test@example.com",
  name: "Test User",
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-01T10:00:00.000Z",
};

describe("useAuth", () => {
  beforeEach(() => {
    logoutApiMock.mockReset();
    window.localStorage.clear();
  });

  it("reads authenticated session from storage on mount", () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.access, "access-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refresh, "refresh-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(userFixture));

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe("access-1");
    expect(result.current.user?.email).toBe("test@example.com");
  });

  it("logs out in current tab when session-expired event is dispatched", async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.access, "access-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refresh, "refresh-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(userFixture));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("clears local session even when logout API fails", async () => {
    logoutApiMock.mockRejectedValue(new Error("network"));
    window.localStorage.setItem(AUTH_STORAGE_KEYS.access, "access-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refresh, "refresh-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(userFixture));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.access)).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.refresh)).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.user)).toBeNull();
  });

  it("syncs session from storage events", async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.access, "access-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refresh, "refresh-1");
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(userFixture));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.access);
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.refresh);
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.user);
      window.dispatchEvent(new StorageEvent("storage", { key: AUTH_STORAGE_KEYS.access }));
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
