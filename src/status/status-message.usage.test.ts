import { expect, it } from "vitest";
import { buildStatusMessage, statusModelRefs } from "./status-message.test-support.js";

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
