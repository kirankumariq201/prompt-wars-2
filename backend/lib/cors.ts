export function corsHeaders() {
  const origin = process.env.FRONTEND_ORIGIN;
  if (!origin) throw new Error("FRONTEND_ORIGIN must be configured");
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}
