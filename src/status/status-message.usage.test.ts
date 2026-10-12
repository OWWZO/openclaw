import { afterEach, expect, it, vi } from "vitest";
import { buildStatusMessage, statusModelRefs } from "./status-message.test-support.js";

const { readUsage } = vi.hoisted(() => ({ readUsage: vi.fn() }));
// mock-isolation: The renderer consumes prepared transcript facts without opening storage.
vi.mock("../gateway/session-transcript-usage.js", () => ({
  readRecentSessionUsageFromTranscript: readUsage,
}));
afterEach(() => readUsage.mockReset());

it("keeps measured zero counters instead of hydrating historical transcript totals", () => {
  readUsage.mockReturnValue({
    inputTokens: 9000,
    outputTokens: 100,
    totalTokens: 9000,
    totalTokensFresh: true,
  });
  const text = buildStatusMessage({
    agent: { model: "ollama/llama3.2" },
    modelRefs: statusModelRefs({ provider: "ollama", model: "llama3.2" }),
    includeTranscriptUsage: true,
    sessionEntry: {
      sessionId: "measured-zero",
      updatedAt: 0,
      usageReport: { state: "available" },
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      totalTokensFresh: true,
      totalTokensVersion: 1,
    },
  });
  expect(text).toContain("Tokens: 0 in / 0 out");
  expect(text).toContain("Context: 0/");
});

it("shows interrupted usage as unavailable instead of reusing prior counters or price", () => {
  const text = buildStatusMessage({
    agent: { model: "ollama/llama3.2" },
    modelRefs: statusModelRefs({ provider: "ollama", model: "llama3.2" }),
    sessionEntry: {
      sessionId: "status",
      updatedAt: 0,
      usageReport: { state: "unavailable" },
      inputTokens: 123,
      outputTokens: 45,
      estimatedCostUsd: 0.5,
      totalTokensFresh: false,
    },
  });
  expect(text).toContain("Tokens: unavailable (incomplete response)");
  expect(text).not.toContain("123 in / 45 out");
  expect(text).not.toContain("Cost:");
});
