import { NextResponse } from "next/server";
import {
  dispatchBasket,
  scenarioMetrics,
  stockConfidence,
  stockDecision,
  type BasketItem,
  type StockSignal,
  type StoreCandidate
} from "@/lib/engine";
import { corsHeaders } from "@/lib/cors";
import { isRecord, parseNumber } from "@/lib/validation";

const DEFAULT_STOCK: StockSignal = {
  onHand: 4,
  ageHours: 7,
  syncIntervalHours: 8,
  recentFulfilled: 24,
  recentFailed: 2
};

const DEFAULT_STORES: StoreCandidate[] = [
  {
    storeId: "S01",
    storeName: "Sri Lakshmi Stores",
    inventory: { "milk-1l": 5, bread: 8 },
    confidence: { "milk-1l": 0.91, bread: 0.84 },
    prepP90: 8,
    courierP90: 11,
    reliability: 0.92
  },
  {
    storeId: "S02",
    storeName: "City Mart",
    inventory: { notebook: 10, "milk-1l": 2 },
    confidence: { notebook: 0.95, "milk-1l": 0.62 },
    prepP90: 7,
    courierP90: 13,
    reliability: 0.88
  }
];

const DEFAULT_BASKET: BasketItem[] = [
  { sku: "milk-1l", qty: 1 },
  { sku: "bread", qty: 1 },
  { sku: "notebook", qty: 1 }
];

function parseStock(value: unknown): StockSignal {
  if (!isRecord(value)) return DEFAULT_STOCK;
  return {
    onHand: parseNumber(value.onHand, DEFAULT_STOCK.onHand, 0, 100000),
    ageHours: parseNumber(value.ageHours, DEFAULT_STOCK.ageHours, 0, 720),
    syncIntervalHours: parseNumber(
      value.syncIntervalHours,
      DEFAULT_STOCK.syncIntervalHours,
      1,
      720
    ),
    recentFulfilled: parseNumber(
      value.recentFulfilled,
      DEFAULT_STOCK.recentFulfilled,
      0,
      100000
    ),
    recentFailed: parseNumber(
      value.recentFailed,
      DEFAULT_STOCK.recentFailed,
      0,
      100000
    )
  };
}

function parseBasket(value: unknown): BasketItem[] {
  if (!Array.isArray(value)) return DEFAULT_BASKET;
  const basket = value.flatMap((item): BasketItem[] => {
    if (!isRecord(item) || typeof item.sku !== "string") return [];
    const sku = item.sku.trim().slice(0, 100);
    const qty = parseNumber(item.qty, 1, 1, 1000);
    return sku ? [{ sku, qty }] : [];
  });
  return basket.length ? basket.slice(0, 100) : DEFAULT_BASKET;
}

function parseStores(value: unknown): StoreCandidate[] {
  if (!Array.isArray(value)) return DEFAULT_STORES;
  const stores = value.flatMap((item): StoreCandidate[] => {
    if (!isRecord(item)) return [];
    if (typeof item.storeId !== "string" || typeof item.storeName !== "string") return [];
    if (!isRecord(item.inventory) || !isRecord(item.confidence)) return [];

    const inventory: Record<string, number> = {};
    const confidence: Record<string, number> = {};

    for (const [sku, quantity] of Object.entries(item.inventory)) {
      if (typeof quantity === "number" && Number.isFinite(quantity)) {
        inventory[sku.slice(0, 100)] = parseNumber(quantity, 0, 0, 100000);
      }
    }
    for (const [sku, value] of Object.entries(item.confidence)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        confidence[sku.slice(0, 100)] = parseNumber(value, 0, 0, 1);
      }
    }

    return [{
      storeId: item.storeId.trim().slice(0, 100),
      storeName: item.storeName.trim().slice(0, 150),
      inventory,
      confidence,
      prepP90: parseNumber(item.prepP90, 10, 0, 240),
      courierP90: parseNumber(item.courierP90, 15, 0, 240),
      reliability: parseNumber(item.reliability, 0.8, 0, 1)
    }];
  });

  return stores.length ? stores.slice(0, 100) : DEFAULT_STORES;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    if (!isRecord(raw)) {
      return NextResponse.json(
        { error: "A JSON object is required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const stock = parseStock(raw.stock);
    const confidence = stockConfidence(stock);
    const decision = stockDecision(confidence, stock.onHand);
    const stores = parseStores(raw.stores);
    const basket = parseBasket(raw.basket);
    const assignment = dispatchBasket(basket, stores);

    return NextResponse.json(
      {
        confidence,
        decision,
        assignment,
        scenario: scenarioMetrics(
          parseNumber(raw.cancellationRate, 0.06, 0, 1),
          parseNumber(raw.repeatRate, 0.36, 0, 1),
          parseNumber(raw.promoSpendLakh, 14, 0, 1000)
        )
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid simulation request" },
      { status: 400, headers: corsHeaders() }
    );
  }
}
