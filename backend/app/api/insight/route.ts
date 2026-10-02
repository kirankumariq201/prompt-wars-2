import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { isRecord } from "@/lib/validation";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI insight service is not configured", configured: false },
      { status: 503, headers: corsHeaders() },
    );
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "A JSON object is required" }, { status: 400, headers: corsHeaders() });
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ error: "prompt must contain 1–4000 characters" }, { status: 400, headers: corsHeaders() });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are NOVA PLUS Ops Copilot. Explain operational evidence conservatively. Never invent metrics, stores, inventory, costs, or causal claims. Separate observed facts from recommendations. Keep the answer under 180 words.",
            }],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return NextResponse.json({ error: "AI insight service temporarily unavailable", configured: true }, { status: 502, headers: corsHeaders() });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim() || "";
    if (!text) {
      return NextResponse.json({ error: "AI returned no insight", configured: true }, { status: 502, headers: corsHeaders() });
    }

    return NextResponse.json({ insight: text, model: MODEL, provider: "Google Gemini" }, { headers: corsHeaders() });
  } catch (error) {
    console.error("AI insight error:", error);
    return NextResponse.json({ error: "Invalid AI insight request", configured: true }, { status: 400, headers: corsHeaders() });
  }
}
