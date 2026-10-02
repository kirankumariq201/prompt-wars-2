import { describe, expect, it } from "vitest";
import { dispatchBasket, scenarioMetrics, stockConfidence, stockDecision } from "../lib/engine";

describe("NOVA PLUS reliability engine", () => {
  it("reduces confidence as inventory becomes stale", () => {
    const fresh = stockConfidence({ onHand: 4, ageHours: 1, syncIntervalHours: 8, recentFulfilled: 24, recentFailed: 2 });
    const stale = stockConfidence({ onHand: 4, ageHours: 24, syncIntervalHours: 8, recentFulfilled: 24, recentFailed: 2 });
    expect(fresh).toBeGreaterThan(stale);
    expect(stockDecision(stale, 4)).toBe("DEPRIORITIZE");
  });

  it("delists unavailable inventory", () => {
    expect(stockDecision(0.9, 0)).toBe("DELIST");
    expect(stockDecision(0.2, 3)).toBe("DELIST");
  });

  it("routes a basket across reliable stores and calculates an SLA", () => {
    const result = dispatchBasket(
      [
        { sku: "milk", qty: 1 },
        { sku: "bread", qty: 1 },
      ],
      [
        {
          storeId: "A",
          storeName: "Store A",
          inventory: { milk: 1, bread: 1 },
          confidence: { milk: 0.9, bread: 0.9 },
          prepP90: 8,
          courierP90: 10,
          reliability: 0.95,
        },
      ],
    );
    expect(result.stores).toHaveLength(1);
    expect(result.etaMinutes).toBe(22);
  });

  it("does not invent an SLA when nothing can fulfill the basket", () => {
    const result = dispatchBasket(
      [{ sku: "missing", qty: 1 }],
      [{ storeId: "A", storeName: "Store A", inventory: {}, confidence: {}, prepP90: 8, courierP90: 10, reliability: 0.95 }],
    );
    expect(result.stores).toHaveLength(0);
    expect(result.etaMinutes).toBe(0);
    expect(result.explanation[0]).toContain("No reliable store");
  });

  it("models only the requested scenario deltas", () => {
    const baseline = scenarioMetrics(0.11, 0.27, 17);
    const improved = scenarioMetrics(0.06, 0.36, 14);
    expect(baseline.recovered).toBe(0);
    expect(improved.recovered).toBe(1925);
    expect(improved.promoDelta).toBe(3);
    expect(improved.modeledRevenue).toBeGreaterThan(26.1);
  });
});
