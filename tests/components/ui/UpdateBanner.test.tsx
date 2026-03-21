import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as UpdateBannerModule from "../../../src/components/ui/UpdateBanner";

const {
  performSystemUpdateMock,
  restartServerMock,
  persistUpdateFeedbackMock,
  clearStoredUpdateFeedbackMock,
} = vi.hoisted(() => ({
  performSystemUpdateMock: vi.fn(),
  restartServerMock: vi.fn(),
  persistUpdateFeedbackMock: vi.fn(),
  clearStoredUpdateFeedbackMock: vi.fn(),
}));

vi.mock("../../../src/services/update", () => ({
  performSystemUpdate: performSystemUpdateMock,
  restartServer: restartServerMock,
  persistUpdateFeedback: persistUpdateFeedbackMock,
  clearStoredUpdateFeedback: clearStoredUpdateFeedbackMock,
}));

function t(key: string, vars?: Record<string, string | number>) {
  return (key === "update_available" && vars)
    ? `New version available (${vars.local} -> ${vars.remote})`
    : key;
}

describe("UpdateBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    performSystemUpdateMock.mockResolvedValue({
      success: true,
      component: "frontend",
      commit_before: "oldhash1",
      commit_after: "newhash2",
      message: "Frontend updated",
    });
    restartServerMock.mockResolvedValue({ status: "restarting" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reaches the done state after the updated server responds", async () => {
    render(
      <UpdateBannerModule.UpdateBanner
        localCommit="oldhash1"
        remoteCommit="newhash2"
        onDismiss={vi.fn()}
        t={t}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "update_now" }));
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(screen.getByText("update_done")).toBeInTheDocument();
  });

  it("builds a reload URL without dropping the current hash route", () => {
    const url = UpdateBannerModule.buildCacheBustedReloadUrl(
      new URL("http://127.0.0.1:8188/?foo=bar#/editor/server/workflow") as unknown as Location,
      12345,
    );

    expect(url).toContain("__ui_reload=12345");
    expect(url).toContain("foo=bar");
    expect(url.endsWith("#/editor/server/workflow")).toBe(true);
  });
});
