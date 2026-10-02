# NOVA PLUS — Prompt Wars 2

NOVA PLUS is NOVA CART's **Marketplace Reliability Control Plane**: a reliability-first intervention for decentralized local commerce.

## Competition thesis

NOVA CART grew acquisition, but fulfillment reliability deteriorated:

- 11% cancellation rate → **4,235 cancelled orders/month**.
- At ₹486 AOV, that exposes about **₹20.58L monthly GMV** to cancellation.
- Repeat purchase fell from 41% to 27% while delivery time rose from 29m to 37m.
- 39% of partner stores say inventory maintenance is too much effort; 23% reject orders during busy periods.
- 61% of churned users had previously rated NOVA CART 4★+, pointing to a reliability problem rather than only an acquisition problem.

NOVA PLUS turns unreliable inventory and delivery signals into an operational control loop:

**INPUT → PROCESSING → DECISION → ACTION**

1. Capture merchant/inventory signals.
2. Score inventory confidence from freshness, fulfillment history and availability.
3. ACTIVE / DEPRIORITIZE / DELIST unreliable inventory.
4. Route baskets across reliable stores with explicit P90 SLA estimates.
5. Feed merchant exceptions back into the reliability signal.
6. Use Google Gemini as an optional **Ops Copilot** for evidence-grounded explanation; critical decisions remain deterministic and auditable.

## Functional MVP

- Reliability Control Tower
- Predictive inventory throttling
- Smart Basket multi-store assignment
- P90 preparation + courier SLA calculation
- Merchant Micro-App simulation
- Scenario model for cancellation, repeat rate and promotion spend
- Google Gemini Ops Copilot endpoint with server-side key handling
- Supabase-backed network status and merchant inventory events
- Responsive, keyboard-friendly interface

## Engineering quality

- **TypeScript + strict typing**
- Deterministic business engine separated from UI
- Bounded API inputs and explicit event allow-list
- Explicit production CORS origin; no wildcard fallback
- Supabase credentials stay server-side
- Google API key stays server-side
- Generic external-service errors; provider details are not exposed to clients
- Automated Vitest coverage for confidence, routing, SLA edge cases and scenario math
- Accessible navigation labels, range labels and live AI status
- No LLM dependency for core fulfillment decisions

## Architecture

`frontend/` → Next.js customer/ops UI

`backend/` → Next.js API

`backend/app/api/network` → Supabase network data + merchant inventory events

`backend/app/api/simulate` → deterministic simulation API

`backend/app/api/insight` → optional Google Gemini Ops Copilot

`frontend/lib/engine.ts` → deterministic reliability/routing engine

## Run

Frontend:

```bash
cd frontend
npm install
npm run dev
npm test
```

Backend:

```bash
cd backend
npm install
npm run dev
```

### Production environment

Backend only:

- `NOVA_SUPABASE_URL`
- `NOVA_SUPABASE_PUBLISHABLE_KEY`
- `FRONTEND_ORIGIN`
- `GOOGLE_GEMINI_API_KEY` (optional)
- `GEMINI_MODEL` (optional)

The frontend receives only `NEXT_PUBLIC_API_URL`. Never expose Supabase or Google credentials in frontend environment variables.

## Business model

The prototype does not claim causal ROI from the challenge data. Its scenario model is explicitly directional. The measurable six-month experiment is:

- cancellation rate
- repeat purchase rate
- delivery P90
- inventory mismatch rate
- support tickets/order
- merchant rejection rate
- promo spend per retained customer

The goal is to improve reliability first, then measure retention and unit economics against a controlled baseline.

## Google AI

Google Gemini is an optional explanatory layer, not the source of truth for operational decisions. The API is called server-side through `/api/insight`, with bounded prompt length and low temperature. If Gemini is unavailable, the deterministic control plane continues to work.

Google documentation: https://ai.google.dev/gemini-api/docs
