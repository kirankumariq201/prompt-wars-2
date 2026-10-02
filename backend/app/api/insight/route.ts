import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { isRecord } from "@/lib/validation";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    priority: {
      type: "STRING",
      description: "The single highest-priority operational signal.",
    },
    evidence: {
      type: "STRING",
      description: "One concise evidence-based explanation using only supplied metrics.",
    },
    nextAction: {
      type: "STRING",
      description: "One measurable operational next action.",
    },
  },
  required: ["priority", "evidence", "nextAction"],
};

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
      return NextResponse.json(
        { error: "A JSON object is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 4000) {
      return NextResponse.json(
        { error: "prompt must contain 1–4000 characters" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  "You are NOVA PLUS Ops Copilot. Explain operational evidence conservatively. Never invent metrics, stores, inventory, costs, or causal claims. Separate observed facts from recommendations. Return only the requested JSON fields.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return NextResponse.json(
        { error: "AI insight service temporarily unavailable", configured: true },
        { status: 502, headers: corsHeaders() },
      );
    }

    const data: unknown = await response.json();
    if (!isRecord(data)) {
      return NextResponse.json(
        { error: "AI returned an invalid response", configured: true },
        { status: 502, headers: corsHeaders() },
      );
    }

    const candidates = data.candidates;
    const firstCandidate =
      Array.isArray(candidates) && isRecord(candidates[0])
        ? candidates[0]
        : null;
    const content =
      firstCandidate && isRecord(firstCandidate.content)
        ? firstCandidate.content
        : null;
    const parts = content?.parts;
    const rawText =
      Array.isArray(parts) && isRecord(parts[0])
        ? typeof parts[0].text === "string"
          ? parts[0].text.trim()
          : ""
        : "";

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned no insight", configured: true },
        { status: 502, headers: corsHeaders() },
      );
    }

    let insight: { priority: string; evidence: string; nextAction: string };
    try {
      const parsed: unknown = JSON.parse(rawText);
      if (
        !isRecord(parsed) ||
        typeof parsed.priority !== "string" ||
        typeof parsed.evidence !== "string" ||
        typeof parsed.nextAction !== "string"
      ) {
        throw new Error("Invalid structured insight");
      }
      insight = {
        priority: parsed.priority.trim(),
        evidence: parsed.evidence.trim(),
        nextAction: parsed.nextAction.trim(),
      };
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid structured insight", configured: true },
        { status: 502, headers: corsHeaders() },
      );
    }

    const text = `Priority: ${insight.priority}\nEvidence: ${insight.evidence}\nNext action: ${insight.nextAction}`;

    return NextResponse.json(
      { insight: text, structured: insight, model: MODEL, provider: "Google Gemini" },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("AI insight error:", error);
    return NextResponse.json(
      { error: "Invalid AI insight request", configured: true },
      { status: 400, headers: corsHeaders() },
    );
  }
}
