export type StockAction = "ACTIVE" | "DEPRIORITIZE" | "DELIST";

export type StockSignal = {
  onHand: number;
  ageHours: number;
  syncIntervalHours: number;
  recentFulfilled: number;
  recentFailed: number;
};

export type StoreCandidate = {
  storeId: string;
  storeName: string;
  inventory: Record<string, number>;
  confidence: Record<string, number>;
  prepP90: number;
  courierP90: number;
  reliability: number;
};

export type BasketItem = {
  sku: string;
  qty: number;
};

const RELIABLE_CONFIDENCE = 0.3;
const DEPRIORITIZE_CONFIDENCE = 0.55;

export function stockConfidence(signal: StockSignal): number {
  const freshness = Math.exp(
    -signal.ageHours / Math.max(signal.syncIntervalHours, 1),
  );
  const totalRecentOrders = signal.recentFulfilled + signal.recentFailed;
  const success = signal.recentFulfilled / Math.max(totalRecentOrders, 1);
  const availability = signal.onHand > 0 ? 1 : 0;

  return Math.max(
    0,
    Math.min(1, 0.5 * freshness + 0.35 * success + 0.15 * availability),
  );
}

export function stockDecision(
  confidence: number,
  onHand: number,
): StockAction {
  if (onHand <= 0 || confidence < 0.3) return "DELIST";
  if (confidence < DEPRIORITIZE_CONFIDENCE) return "DEPRIORITIZE";
  return "ACTIVE";
}

type ChosenStore = {
  storeId: string;
  storeName: string;
  items: BasketItem[];
};

export type BasketAssignment = {
  stores: ChosenStore[];
  etaMinutes: number;
  score: number;
  explanation: string[];
};

export function dispatchBasket(
  basket: BasketItem[],
  stores: StoreCandidate[],
): BasketAssignment {
  const remaining = new Map(
    basket
      .filter((item) => item.qty > 0)
      .map((item) => [item.sku, item.qty]),
  );
  const chosen: ChosenStore[] = [];
  const explanation: string[] = [];
  let score = 0;

  while (remaining.size > 0) {
    let best:
      | { store: StoreCandidate; items: BasketItem[]; gain: number }
      | null = null;

    for (const store of stores) {
      const items = [...remaining.entries()]
        .filter(
          ([sku, qty]) =>
            (store.inventory[sku] ?? 0) >= qty &&
            (store.confidence[sku] ?? 0) >= RELIABLE_CONFIDENCE,
        )
        .map(([sku, qty]) => ({ sku, qty }));

      if (items.length === 0) continue;

      const averageConfidence =
        items.reduce(
          (total, item) => total + (store.confidence[item.sku] ?? 0),
          0,
        ) / items.length;

      const gain =
        items.length * 30 +
        averageConfidence * 25 +
        store.reliability * 20 -
        store.prepP90 * 0.8 -
        store.courierP90 * 0.5;

      if (!best || gain > best.gain) {
        best = { store, items, gain };
      }
    }

    if (!best) break;

    chosen.push({
      storeId: best.store.storeId,
      storeName: best.store.storeName,
      items: best.items,
    });
    score += best.gain;

    for (const item of best.items) {
      remaining.delete(item.sku);
    }
  }

  const storeById = new Map(stores.map((store) => [store.storeId, store]));
  const prep = chosen.reduce(
    (max, assignment) =>
      Math.max(max, storeById.get(assignment.storeId)?.prepP90 ?? 0),
    0,
  );
  const courier = chosen.reduce(
    (total, assignment) =>
      total + (storeById.get(assignment.storeId)?.courierP90 ?? 0),
    0,
  );
  const splitMinutes = Math.max(0, chosen.length - 1) * 5;
  const etaMinutes =
    chosen.length === 0
      ? 0
      : Math.round(prep + courier + splitMinutes + 4);

  if (remaining.size > 0) {
    explanation.push(
      "No reliable store can fulfill the remaining basket items.",
    );
  }

  if (chosen.length === 1) {
    explanation.push("Single-store fulfillment minimizes coordination risk.");
  } else if (chosen.length > 1) {
    explanation.push(
      `${chosen.length}-store basket split trades one extra handoff for higher inventory confidence.`,
    );
  }

  explanation.push(
    `Promised SLA uses P90 preparation + courier time + ${splitMinutes}m coordination buffer.`,
  );

  return {
    stores: chosen,
    etaMinutes,
    score: Math.round(score),
    explanation,
  };
}

export function scenarioMetrics(
  cancellationRate: number,
  repeatRate: number,
  promoSpendLakh: number,
) {
  const orders = 38_500;
  const aov = 486;
  const recovered = Math.max(
    0,
    Math.round(orders * (0.11 - cancellationRate)),
  );
  const recoveredGmv = recovered * aov;
  const revenueRatio = 26.1 / ((orders * aov) / 100_000);
  const cancellationRevenue =
    (recoveredGmv / 100_000) * revenueRatio;
  const repeatLift = Math.max(0, repeatRate - 0.27);
  const incrementalOrders = Math.round(orders * repeatLift * 0.42);
  const retentionRevenue =
    ((incrementalOrders * aov) / 100_000) * revenueRatio;

  return {
    recovered,
    recoveredGmv,
    cancellationRevenue,
    incrementalOrders,
    retentionRevenue,
    modeledRevenue: 26.1 + cancellationRevenue + retentionRevenue,
    promoDelta: 17 - promoSpendLakh,
  };
}
