"use client";
import TopNav from "@/components/TopNav";

import { useEffect, useState } from "react";

type Change = {
  id: number;
  beadId: number;
  delta: number;
  note: string | null;
  createdAt: string;
  bead: {
    id: number;
    colorCode: string;
    name: string | null;
  };
};

export default function HistoryPage() {
  const [items, setItems] = useState<Change[]>([]);
  const [err, setErr] = useState("");

  const refresh = async () => {
    setErr("");
    try {
      const res = await fetch("/api/changes?limit=100", { cache: "no-store" });
      const data = (await res.json()) as Change[];
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <TopNav />

      <button onClick={refresh} style={btnStyle}>Refresh</button>
      {err ? <div style={{ marginTop: 10, color: "crimson" }}>{err}</div> : null}

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 160px 120px 1fr", fontWeight: 700, padding: 10, borderBottom: "1px solid #eee" }}>
          <div>Time</div>
          <div>Bead</div>
          <div>Delta</div>
          <div>Note</div>
        </div>

        {items.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "180px 160px 120px 1fr",
              padding: 10,
              borderBottom: "1px solid #f2f2f2",
              alignItems: "center",
            }}
          >
            <div style={{ opacity: 0.85 }}>{new Date(c.createdAt).toLocaleString()}</div>
            <div style={{ fontWeight: 600 }}>
              {c.bead.colorCode} {c.bead.name ? `- ${c.bead.name}` : ""}
            </div>
            <div style={{ fontWeight: 700, color: c.delta < 0 ? "crimson" : "green" }}>
              {c.delta > 0 ? `+${c.delta}` : c.delta}
            </div>
            <div style={{ opacity: 0.9 }}>{c.note ?? ""}</div>
          </div>
        ))}

        {items.length === 0 ? <div style={{ padding: 12, opacity: 0.8 }}>No history yet.</div> : null}
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
