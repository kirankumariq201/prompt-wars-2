import { describe, expect, it } from "vitest";
import { stockConfidence, stockDecision, dispatchBasket } from "../lib/engine";
import { parseNumber, validEvent } from "../lib/validation";

describe("NOVA PLUS API contracts", () => {
  it("bounds numeric inputs", () => {
    expect(parseNumber(999, 5, 0, 100)).toBe(100);
    expect(parseNumber(-2, 5, 0, 100)).toBe(0);
    expect(parseNumber("5", 7, 0, 100)).toBe(7);
  });

  it("accepts only supported merchant event types", () => {
    const valid = validEvent({
      merchant_id: "merchant-1",
      sku_id: "sku-1",
      event_type: "RESTOCK",
      quantity: 4,
    });
    expect(valid.merchantId).toBe("merchant-1");
    expect(valid.eventType).toBe("RESTOCK");
    expect(valid.quantity).toBe(4);

    const invalid = validEvent({
      merchant_id: "merchant-1",
      event_type: "DROP_TABLE",
      quantity: 4,
    });
    expect(invalid.eventType).toBeNull();

    const decimal = validEvent({
      merchant_id: "merchant-1",
      event_type: "RESTOCK",
      quantity: 1.5,
    });
    expect(decimal.quantityValid).toBe(false);
  });

  it("keeps reliability decisions deterministic", () => {
    const confidence = stockConfidence({
      onHand: 0,
      ageHours: 2,
      syncIntervalHours: 8,
      recentFulfilled: 20,
      recentFailed: 1,
    });
    expect(confidence).toBeLessThan(1);
    expect(stockDecision(confidence, 0)).toBe("DELIST");
  });

  it("never promises an SLA without a reliable fulfillment option", () => {
    const result = dispatchBasket(
      [{ sku: "missing", qty: 1 }],
      [{
        storeId: "A",
        storeName: "Store A",
        inventory: {},
        confidence: {},
        prepP90: 8,
        courierP90: 10,
        reliability: 0.95,
      }],
    );
    expect(result.etaMinutes).toBe(0);
    expect(result.stores).toHaveLength(0);
  });
});
