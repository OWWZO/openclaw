import { createSignal } from "solid-js";
import { expect, it } from "vitest";
import { createEmptyCostUsageTotals } from "../../../../src/infra/session-cost-usage-totals.js";
import { mountSolid } from "../../test-helpers/mount-solid.ts";
import { flush } from "../../test-helpers/solid-settle.ts";
import { buildAggregatesFromSessions } from "./metrics.ts";
import { createUsageProps, usageSession } from "./view.test-support.ts";
import { renderUsage } from "./view.tsx";

it("shows unknown totals after interruption while keeping completed session usage inspectable", () => {
  const base = createUsageProps();
  const interrupted = usageSession("interrupted", "interrupted", "ollama", {
    totalTokens: 0,
    totalCost: 0,
    usageReport: { state: "unavailable" },
  });
  const completeTotals = {
    ...createEmptyCostUsageTotals(),
    totalTokens: 2624,
    totalCost: 0,
  };
  const completed = usageSession("completed", "completed", "ollama", completeTotals);
  const sessions = [interrupted, completed];
  const aggregates = buildAggregatesFromSessions(sessions);
  const container = document.createElement("div");
  const [selection, setSelection] = createSignal<string[]>([]);
  mountSolid(
    () =>
      renderUsage(
        createUsageProps({
          data: {
            ...base.data,
            sessions,
            aggregates,
            totals: { ...completeTotals, usageReport: { state: "unavailable" } },
          },
          filters: { ...base.filters, selectedSessions: selection() },
        }),
      ),
    { container },
  );
  flush();

  expect(
    [...container.querySelectorAll(".usage-metric-badge strong")].map((node) => node.textContent),
  ).toEqual(["unknown", "unknown", "2"]);
  expect(container.querySelector(".usage-trend-section")).toBeNull();
  expect(container.querySelector(".usage-callout")?.textContent).toContain(
    "before final usage arrived",
  );
  expect(container.querySelector('[title="interrupted"] .session-bar-value')?.textContent).toBe(
    "unknown",
  );
  expect(container.querySelector('[title="completed"] .session-bar-value')?.textContent).toBe(
    "2.6K",
  );

  setSelection(["completed"]);
  flush();
  expect(
    [...container.querySelectorAll(".usage-metric-badge strong")].map((node) => node.textContent),
  ).toEqual(["2.6K", "$0.00", "1"]);
  expect(container.querySelector(".usage-trend-section")).not.toBeNull();
});
