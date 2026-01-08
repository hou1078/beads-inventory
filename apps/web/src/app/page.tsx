
"use client";
import TopNav from "@/components/TopNav";

import { useEffect, useState } from "react";

type Bead = {
  id: number;
  colorCode: string;
  name: string | null;
  quantity: number;
  threshold: number;
};

export default function Home() {
  const [beads, setBeads] = useState<Bead[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // 新增表单
  const [colorCode, setColorCode] = useState("P01");
  const [name, setName] = useState("White");
  const [quantity, setQuantity] = useState(1000);
  const [threshold, setThreshold] = useState(200);

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/beads");
      const data = (await res.json()) as Bead[];
      setBeads(data);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  const addBead = async () => {
    setErr("");
    try {
      const res = await fetch("/api/beads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorCode, name, quantity, threshold }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  const changeQty = async (id: number, delta: number) => {
    setErr("");
    try {
      const res = await fetch(`/api/beads/${id}/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
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
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Beads Inventory</h1>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Add a bead</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={colorCode} onChange={(e) => setColorCode(e.target.value)} placeholder="Color code" style={inputStyle} />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={inputStyle} />
          <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Qty" style={inputStyle} />
          <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} placeholder="Threshold" style={inputStyle} />
          <button onClick={addBead} style={btnStyle}>Add</button>
          <button onClick={refresh} style={btnStyle}>{loading ? "Loading..." : "Refresh"}</button>
        </div>
        {err ? <div style={{ marginTop: 10, color: "crimson" }}>{err}</div> : null}
      </section>

      <section style={{ marginTop: 16 }}>
        {beads.map((b) => {
          const low = b.quantity < b.threshold;
          return (
            <div
              key={b.id}
              style={{
                marginBottom: 10,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 10,
                background: low ? "#fff3f3" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {b.colorCode} {b.name ? `- ${b.name}` : ""}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Qty: <b>{b.quantity}</b> | Threshold: {b.threshold}{" "}
                    {low ? <span style={{ color: "red" }}>LOW</span> : null}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => changeQty(b.id, -10)} style={btnStyle}>-10</button>
                  <button onClick={() => changeQty(b.id, -50)} style={btnStyle}>-50</button>
                  <button onClick={() => changeQty(b.id, +50)} style={btnStyle}>+50</button>
                  <button onClick={() => changeQty(b.id, +200)} style={btnStyle}>+200</button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 8,
};

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  cursor: "pointer",
};
