import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase";
import { corsHeaders } from "@/lib/cors";
import { isRecord, validEvent } from "@/lib/validation";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const [m, i, s] = await Promise.all([
      supabaseFetch("merchants?select=id,name,city,reliability,is_online&order=name"),
      supabaseFetch("merchant_skus?select=merchant_id,sku_id,merchant_name,on_hand,confidence,last_synced_at,sync_interval_hours,recent_fulfilled,recent_failed"),
      supabaseFetch("merchant_sla_profiles?select=merchant_id,prep_p90,courier_p90,buffer_minutes")
    ]);
    const [merchants, inventory, sla] = await Promise.all([m.json(), i.json(), s.json()]);
    return NextResponse.json(
      { merchants, inventory, sla, generatedAt: new Date().toISOString() },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Network data unavailable" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "A JSON object is required" }, { status: 400, headers: corsHeaders() });
    }
    const event = validEvent(body);
    if (!event.merchantId || !event.eventType || !event.quantityValid) {
      return NextResponse.json({ error: "Valid merchant_id, event_type and quantity are required" }, { status: 400, headers: corsHeaders() });
    }

    const response = await supabaseFetch("inventory_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        merchant_id: event.merchantId,
        sku_id: event.skuId,
        event_type: event.eventType,
        quantity: event.quantity,
        source: "merchant_pwa"
      })
    });

    return new NextResponse(null, { status: response.status, headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record event" },
      { status: 500, headers: corsHeaders() }
    );
  }
}