import { NextResponse } from "next/server";
import { dispatchBasket, scenarioMetrics, stockConfidence, stockDecision } from "@/lib/engine";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stock = body.stock ?? {
      onHand: 4,
      ageHours: 7,
      syncIntervalHours: 8,
      recentFulfilled: 24,
      recentFailed: 2
    };
    const confidence = stockConfidence(stock);
    const decision = stockDecision(confidence, stock.onHand);
    const stores = body.stores ?? [
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
    const assignment = dispatchBasket(
      body.basket ?? [
        { sku: "milk-1l", qty: 1 },
        { sku: "bread", qty: 1 },
        { sku: "notebook", qty: 1 }
      ],
      stores
    );

    return NextResponse.json(
      {
        confidence,
        decision,
        assignment,
        scenario: scenarioMetrics(
          body.cancellationRate ?? 0.06,
          body.repeatRate ?? 0.36,
          body.promoSpendLakh ?? 14
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