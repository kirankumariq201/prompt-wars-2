import { NextResponse } from "next/server";
import { supabaseFetch } from "@/lib/supabase";
import { corsHeaders } from "@/lib/cors";

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
    const body = await request.json();
    const allowed = ["SYNC", "SOLD_OUT", "RESTOCK", "VERIFY"];

    if (!body.merchant_id || !allowed.includes(body.event_type)) {
      return NextResponse.json(
        { error: "merchant_id and a valid event_type are required" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const response = await supabaseFetch("inventory_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        merchant_id: body.merchant_id,
        sku_id: body.sku_id ?? null,
        event_type: body.event_type,
        quantity: body.quantity ?? null,
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