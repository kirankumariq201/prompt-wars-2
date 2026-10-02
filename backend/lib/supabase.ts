const url = process.env.NOVA_SUPABASE_URL;
const key = process.env.NOVA_SUPABASE_PUBLISHABLE_KEY;

export async function supabaseFetch(path: string, init: RequestInit = {}) {
  if (!url || !key) {
    throw new Error("Database service is not configured");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase request failed:", response.status, detail.slice(0, 1000));
    throw new Error("Database request failed");
  }

  return response;
}
