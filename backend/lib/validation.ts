export const EVENT_TYPES = ["SYNC", "SOLD_OUT", "RESTOCK", "VERIFY"] as const;
export type InventoryEventType = (typeof EVENT_TYPES)[number];

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function parseInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function validEvent(body: Record<string, unknown>) {
  const merchantId =
    typeof body.merchant_id === "string" ? body.merchant_id.trim() : "";

  const skuId =
    body.sku_id == null
      ? null
      : typeof body.sku_id === "string"
        ? body.sku_id.trim()
        : "";

  const eventType = body.event_type;
  const quantity =
    body.quantity == null
      ? null
      : parseInteger(body.quantity, Number.NaN, 0, 100_000);

  return {
    merchantId:
      merchantId.length > 0 && merchantId.length <= 100 ? merchantId : null,
    skuId:
      skuId === null || (skuId.length > 0 && skuId.length <= 100)
        ? skuId
        : null,
    eventType:
      typeof eventType === "string" &&
      (EVENT_TYPES as readonly string[]).includes(eventType)
        ? (eventType as InventoryEventType)
        : null,
    quantity:
      quantity !== null && Number.isInteger(quantity) ? quantity : null,
    quantityValid:
      quantity === null || Number.isInteger(quantity),
  };
}
