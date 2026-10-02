'use client';

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  dispatchBasket,
  scenarioMetrics,
  stockConfidence,
  stockDecision,
  type StoreCandidate,
} from "../lib/engine";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

const stores: StoreCandidate[] = [
  {
    storeId: "S01",
    storeName: "Sri Lakshmi Stores",
    inventory: { "milk-1l": 5, bread: 8 },
    confidence: { "milk-1l": 0.91, bread: 0.84 },
    prepP90: 8,
    courierP90: 11,
    reliability: 0.92,
  },
  {
    storeId: "S02",
    storeName: "City Mart",
    inventory: { notebook: 10, "milk-1l": 2 },
    confidence: { notebook: 0.95, "milk-1l": 0.62 },
    prepP90: 7,
    courierP90: 13,
    reliability: 0.88,
  },
  {
    storeId: "S03",
    storeName: "Fresh Corner",
    inventory: { bread: 12, "milk-1l": 1 },
    confidence: { bread: 0.71, "milk-1l": 0.28 },
    prepP90: 10,
    courierP90: 9,
    reliability: 0.81,
  },
];

export default function Home() {
  const [tab, setTab] = useState("control");
  const [age, setAge] = useState(7);
  const [stock, setStock] = useState(4);
  const [repeat, setRepeat] = useState(36);
  const [cancel, setCancel] = useState(6);
  const [promo, setPromo] = useState(14);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<{
    merchants: number;
    inventory: number;
  } | null>(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    if (!API) return;

    fetch(API + "/api/network")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setLive({
            merchants: d.merchants.length,
            inventory: d.inventory.length,
          });
        }
      })
      .catch(() => {});
  }, []);

  const confidence = useMemo(
    () =>
      stockConfidence({
        onHand: stock,
        ageHours: age,
        syncIntervalHours: 8,
        recentFulfilled: 24,
        recentFailed: 2,
      }),
    [stock, age],
  );

  const decision = stockDecision(confidence, stock);

  const assignment = useMemo(
    () =>
      dispatchBasket(
        [
          { sku: "milk-1l", qty: 1 },
          { sku: "bread", qty: 1 },
          { sku: "notebook", qty: 1 },
        ],
        stores,
      ),
    [],
  );

  const scenario = scenarioMetrics(cancel / 100, repeat / 100, promo);

  async function getOpsInsight() {
    if (!API) {
      setInsight("Connect the backend API to enable Google Gemini Ops Copilot.");
      return;
    }
    setInsightLoading(true);
    try {
      const response = await fetch(API + "/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `NOVA CART currently has 27% repeat rate, 11% cancellation, 37-minute delivery, 5.9k monthly support tickets and ₹17L monthly promo spend. The current scenario sliders are repeat ${repeat}%, cancellation ${cancel}%, and promo ₹${promo}L. Explain the highest-priority operational signal and one measurable next action.`,
        }),
      });
      const data = await response.json();
      setInsight(data.insight || data.error || "No insight available.");
    } catch {
      setInsight("AI insight is temporarily unavailable; deterministic controls remain fully operational.");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <main>
      <header>
        <div className="brand">
          <b>NP</b>
          <span>
            <strong>NOVA PLUS</strong>
            <small>Marketplace reliability control plane</small>
          </span>
        </div>
        <label className="live">
          ●{" "}
          {live
            ? `LIVE • ${live.merchants} STORES • ${live.inventory} SKU SIGNALS`
            : "LIVE SIMULATION"}
        </label>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">NOVA CART • BUSINESS RESCUE</p>
          <h1>
            Make 620 local stores behave like{" "}
            <em>one reliable marketplace.</em>
          </h1>
          <p>
            Inventory confidence, smart basket routing and honest delivery
            SLAs in one operational control loop.
          </p>
        </div>
        <aside>
          <span>MONTHLY GMV AT RISK</span>
          <b>₹20.58L</b>
          <small>4,235 cancellations × ₹486 AOV</small>
        </aside>
      </section>

      <nav aria-label="Primary product views">
        {[
          ["control", "Control Tower"],
          ["merchant", "Merchant Micro-App"],
          ["basket", "Smart Basket"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? "sel" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "control" && (
        <section className="grid">
          <Card wide title="Reliability cockpit" kicker="NETWORK HEALTH">
            <div className="metrics">
              <Metric l="Repeat rate" v="27%" d="−14 pp" />
              <Metric l="Cancellation" v="11%" d="+83%" />
              <Metric l="Delivery" v="37m" d="+28%" />
              <Metric l="Support load" v="5.9k" d="+90%" />
            </div>
            <div className="causal">
              <span>
                DEMAND
                <br />
                <i>Promo spend ₹17L</i>
              </span>
              →
              <span>
                RELIABILITY
                <br />
                <i>Inventory + SLA</i>
              </span>
              →
              <span>
                RETENTION
                <br />
                <i>27% repeat</i>
              </span>
            </div>
          </Card>

          <Card title="Pause the 30% spend increase" kicker="MARGINAL ECONOMICS">
            <div className="big">₹0.57</div>
            <p>
              reported revenue per incremental ₹1 promo spend from the
              six-month change.
            </p>
            <div className="bar">
              +₹5.1L spend <b>≈ +₹2.92L revenue</b>
            </div>
            <small>Directional stress test; not a causal CAC calculation.</small>
          </Card>

          <Card title="Ops Copilot" kicker="GOOGLE AI ASSIST"><p>Use Gemini to explain the current reliability signal without changing the deterministic decision engine.</p><button className="accept" onClick={getOpsInsight} disabled={insightLoading}>{insightLoading ? "ANALYZING…" : "EXPLAIN WITH GOOGLE AI"}</button>{insight && <p className="reason" role="status">{insight}</p>}</Card><Card title="Predictive throttling" kicker="INVENTORY CONFIDENCE">
            <label>
              Stock <output>{stock}</output>
              <input
                type="range"
                min="0"
                max="12"
                value={stock}
                onChange={(e) => setStock(+e.target.value)}
              />
            </label>
            <label>
              Hours since sync <output>{age}h</output>
              <input
                type="range"
                min="0"
                max="48"
                value={age}
                onChange={(e) => setAge(+e.target.value)}
              />
            </label>
            <div className="confidence">
              <b>{Math.round(confidence * 100)}%</b>
              <strong className={decision.toLowerCase()}>{decision}</strong>
            </div>
          </Card>

          <Card wide title="Turn reliability into repeat" kicker="SCENARIO MODEL">
            <div className="controls">
              <label>
                Repeat <b>{repeat}%</b>
                <input
                  type="range"
                  min="27"
                  max="45"
                  value={repeat}
                  onChange={(e) => setRepeat(+e.target.value)}
                />
              </label>
              <label>
                Cancellation <b>{cancel}%</b>
                <input
                  type="range"
                  min="4"
                  max="11"
                  value={cancel}
                  onChange={(e) => setCancel(+e.target.value)}
                />
              </label>
              <label>
                Promo <b>₹{promo}L</b>
                <input
                  type="range"
                  min="8"
                  max="17"
                  value={promo}
                  onChange={(e) => setPromo(+e.target.value)}
                />
              </label>
            </div>
            <div className="metrics three">
              <Metric
                l="Recovered orders"
                v={scenario.recovered.toLocaleString()}
                d="vs current"
              />
              <Metric
                l="Modeled revenue"
                v={"₹" + scenario.modeledRevenue.toFixed(1) + "L"}
                d="scenario"
              />
              <Metric
                l="Promo saving"
                v={"₹" + scenario.promoDelta.toFixed(1) + "L"}
                d="monthly"
              />
            </div>
          </Card>
        </section>
      )}

      {tab === "merchant" && (
        <section className="merchant">
          <div className="phone">
            <small>9:41 •••</small>
            <h3>🏪 Sri Lakshmi Stores</h3>
            <span>Online • 92% reliable</span>
            <div className="order">
              NEW ORDER
              <br />
              <b>#NC-1048</b>
              <small>3 items • ₹612</small>
            </div>
            {["Milk 1L", "Bread 400g", "Eggs 6-pack"].map((x, i) => (
              <div className="item" key={x}>
                {x}
                <button onClick={() => setBusy(true)}>
                  {busy && i === 2 ? "OUT" : "✓"}
                </button>
              </div>
            ))}
            <button className="accept" onClick={() => setBusy(true)}>
              {busy ? "ORDER UPDATED ✓" : "ACCEPT ORDER"}
            </button>
            <button className="pause" onClick={() => setBusy(!busy)}>
              {busy ? "RESUME" : "PAUSE 15 MIN"}
            </button>
            <small className="offline">● Offline-safe queue enabled</small>
          </div>

          <div>
            <p className="eyebrow">MERCHANT MICRO-APP</p>
            <h2>Zero catalog maintenance.</h2>
            <p className="copy">
              Merchants only handle exceptions: accept, report unavailable,
              substitute or pause. Every tap becomes a reliability signal.
            </p>
            <div className="flow">
              ONE TAP → EVENT → CONFIDENCE UPDATE → ROUTING CHANGE
            </div>
          </div>
        </section>
      )}

      {tab === "basket" && (
        <section className="basket">
          <Card title="Smart Basket" kicker="CUSTOMER INPUT">
            {["🥛 Milk 1L", "🍞 Bread 400g", "📓 Notebook"].map((x) => (
              <div className="basketItem" key={x}>
                {x}
                <b>1</b>
              </div>
            ))}
            <button className="accept" onClick={() => setBusy(!busy)}>
              {busy ? "ROUTE REFRESHED ✓" : "OPTIMIZE FULFILLMENT"}
            </button>
          </Card>

          <Card
            title={assignment.etaMinutes + " min realistic SLA"}
            kicker="ENGINE OUTPUT"
          >
            {assignment.stores.map((s) => (
              <div className="route" key={s.storeId}>
                <div>
                  <b>{s.storeName}</b>
                  <small>{s.items.map((i) => i.sku).join(" • ")}</small>
                </div>
                <i>READY</i>
              </div>
            ))}
            <div className="reason">
              {assignment.explanation.map((x) => (
                <p key={x}>✓ {x}</p>
              ))}
            </div>
          </Card>
        </section>
      )}

      <footer>
        INPUT → PROCESSING → DECISION → ACTION{" "}
        <span>NOVA PLUS MVP • deterministic engine • no LLM required</span>
      </footer>
    </main>
  );
}

function Card({
  children,
  title,
  kicker,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  kicker: string;
  wide?: boolean;
}) {
  return (
    <article className={"card " + (wide ? "wide" : "")}>
      <p className="eyebrow">{kicker}</p>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function Metric({ l, v, d }: { l: string; v: string; d: string }) {
  return (
    <div className="metric">
      <span>{l}</span>
      <b>{v}</b>
      <small>{d}</small>
    </div>
  );
}
