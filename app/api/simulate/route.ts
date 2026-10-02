import {NextResponse} from "next/server";
import {dispatchBasket,scenarioMetrics,stockConfidence,stockDecision} from "@/lib/engine";
export async function POST(req:Request){
 const body=await req.json();
 const stock=body.stock??{onHand:4,ageHours:7,syncIntervalHours:8,recentFulfilled:24,recentFailed:2};
 const confidence=stockConfidence(stock);
 const decision=stockDecision(confidence,stock.onHand);
 const stores=body.stores??[
  {storeId:"S01",storeName:"Sri Lakshmi Stores",inventory:{"milk-1l":5,bread:8},confidence:{"milk-1l":.91,bread:.84},prepP90:8,courierP90:11,reliability:.92},
  {storeId:"S02",storeName:"City Mart",inventory:{notebook:10,"milk-1l":2},confidence:{notebook:.95,"milk-1l":.62},prepP90:7,courierP90:13,reliability:.88}
 ];
 const assignment=dispatchBasket(body.basket??[{sku:"milk-1l",qty:1},{sku:"bread",qty:1},{sku:"notebook",qty:1}],stores);
 return NextResponse.json({confidence,decision,assignment,scenario:scenarioMetrics(body.cancellationRate??.06,body.repeatRate??.36,body.promoSpendLakh??14)});
}