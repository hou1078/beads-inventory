"use client";
import TopNav from "@/components/TopNav";

import { useEffect, useState } from "react";

type AlertItem = {
  id: number;
  colorCode: string;
  name: string | null;
  quantity: number;
  threshold: number;
  shortage: number;
};

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [err, setErr] = useState("");

  const refresh = async () => {
    setErr("");
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      const data = (await res.json()) as AlertItem[];
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  const restock = async (id: number, delta: number) => {
    setErr("");
    try {
      const res = await fetch(`/api/beads/${id}/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, note: "restock from alerts" }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <TopNav />

      <button onClick={refresh} style={btnStyle}>Refresh</button>
      {err ? <div style={{ marginTop: 10, color: "crimson" }}>{err}</div> : null}

      <div style={{ marginTop: 16 }}>
        {items.length === 0 ? (
          <div style={{ opacity: 0.8 }}>✅ No low-stock items.</div>
        ) : (
          items.map((b) => (
            <div
              key={b.id}
              style={{
                marginBottom: 10,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 10,
                background: "#fff3f3",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {b.colorCode} {b.name ? `- ${b.name}` : ""}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Qty: <b>{b.quantity}</b> | Threshold: {b.threshold} | Need: <b>{b.shortage}</b>{" "}
                    <span style={{ color: "red" }}>LOW</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => restock(b.id, +200)} style={btnStyle}>+200</button>
                  <button onClick={() => restock(b.id, +500)} style={btnStyle}>+500</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  cursor: "pointer",
};

const linkStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #ddd",
  borderRadius: 8,
  textDecoration: "none",
};
