# NOVA PULSE — Prompt Wars 2

NOVA PULSE is NOVA CART's Marketplace Reliability Control Plane.

## Functional MVP

**INPUT → PROCESSING → DECISION → ACTION**

- Inventory confidence scoring using freshness, fulfillment history and on-hand quantity.
- Predictive throttling: ACTIVE / DEPRIORITIZE / DELIST.
- Smart Basket multi-store assignment with reliability and split penalties.
- Dynamic SLA calculation using P90 preparation/courier estimates.
- Merchant Micro-App simulation with one-tap order handling and pause mode.
- Scenario model for cancellation, repeat-rate and promotion changes.
- Responsive Next.js interface designed for the Prompt Wars demo.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

- Next.js 15 + React 19 + TypeScript
- Deterministic business logic in `lib/engine.ts`
- API-ready architecture for PostgreSQL/Supabase integration
- No paid LLM or AI API required for core decisions

## Business thesis

NOVA CART's structural bottleneck is unreliable fulfillment across 620 decentralized merchants. NOVA PULSE turns stale inventory and delivery uncertainty into explicit confidence signals, then uses those signals to control inventory visibility, basket routing and customer SLAs.

## Evidence used

- 38,500 monthly orders × 11% cancellation = 4,235 cancellations/month.
- 4,235 × ₹486 AOV ≈ ₹20.58L GMV exposed to cancellation.
- Promo spend rose ₹7.5L while reported revenue rose ₹4.3L, a directional incremental ratio of about ₹0.57 reported revenue per additional ₹1 promo spend.
- A further 30% promotion increase is therefore not supported as the first intervention.
