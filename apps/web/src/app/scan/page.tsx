"use client";
import TopNav from "@/components/TopNav";
import { useEffect, useMemo, useState } from "react";

type Parsed = { colorCode: string; count: number };
type Bead = { id: number; colorCode: string; name: string | null; quantity: number; threshold: number };

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [items, setItems] = useState<Parsed[]>([]);
  const [beads, setBeads] = useState<Bead[]>([]);
  const [msg, setMsg] = useState("");

  const beadsByCode = useMemo(() => {
    const m = new Map<string, Bead>();
    for (const b of beads) m.set(b.colorCode.toUpperCase(), b);
    return m;
  }, [beads]);

  const refreshInventory = async () => {
    const res = await fetch("/api/beads", { cache: "no-store" });
    const data = (await res.json()) as Bead[];
    setBeads(data);
  };

  useEffect(() => {
    refreshInventory();
  }, []);

  const parse = async () => {
    setMsg("Parsing...");
    const fd = new FormData();
    if (file) fd.append("image", file);
    if (summaryText.trim()) fd.append("summaryText", summaryText);

    const res = await fetch("/api/scan", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setMsg(`Error: ${JSON.stringify(data)}`);
      return;
    }

    setItems((data.items ?? []) as Parsed[]);
    setMsg(`OK (mode=${data.mode})`);
    await refreshInventory();
  };

  const missingCodes = useMemo(() => {
    const miss: string[] = [];
    for (const it of items) {
      const code = it.colorCode.toUpperCase();
      if (!beadsByCode.has(code)) miss.push(code);
    }
    return Array.from(new Set(miss)).sort();
  }, [items, beadsByCode]);

  const insufficientCodes = useMemo(() => {
    const bad: { code: string; need: number; have: number; beadId: number }[] = [];
    for (const it of items) {
      const code = it.colorCode.toUpperCase();
      const bead = beadsByCode.get(code);
      if (!bead) continue;
      if (bead.quantity < it.count) bad.push({ code, need: it.count, have: bead.quantity, beadId: bead.id });
    }
    return bad;
  }, [items, beadsByCode]);

  const canApply = items.length > 0 && missingCodes.length === 0 && insufficientCodes.length === 0;

  const createMissing = async () => {
    setMsg("Creating missing beads...");
    try {
      for (const code of missingCodes) {
        await fetch("/api/beads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 新创建：quantity=0, threshold=200（你也可以后面在库存页改）
          body: JSON.stringify({ colorCode: code, name: null, quantity: 0, threshold: 200 }),
        });
      }
      await refreshInventory();
      setMsg("✅ Missing beads created (qty=0). You can restock here and then Apply.");
    } catch (e: any) {
      setMsg(`Create failed: ${e?.message ?? String(e)}`);
    }
  };

  const restock = async (beadId: number, delta: number) => {
    setMsg("Restocking...");
    const res = await fetch(`/api/beads/${beadId}/change`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, note: `restock from scan +${delta}` }),
    });
    if (!res.ok) {
      setMsg(`Restock failed: ${await res.text()}`);
      return;
    }
    await refreshInventory();
    setMsg("✅ Restocked");
  };

  const apply = async () => {
    setMsg("Applying...");
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "scan apply", items }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(`Apply failed: ${JSON.stringify(data)}`);
      return;
    }

    setMsg("✅ Applied! Go check /history");
    await refreshInventory();
  };

  const updateCount = (idx: number, v: number) => {
    setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, count: v } : x)));
  };

  return (
    <main style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
        <TopNav />

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Paste summary text (recommended)</div>

        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value)}
          placeholder="Example: P01 120  /  P02:300  /  P10x50"
          style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 90 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={parse} style={btnStyle}>Parse</button>

          <button onClick={createMissing} style={btnStyle} disabled={missingCodes.length === 0}>
            Create Missing ({missingCodes.length})
          </button>

          <button onClick={apply} style={btnStyle} disabled={!canApply}>
            Apply (deduct)
          </button>
        </div>

        <div style={{ marginTop: 8, opacity: 0.9 }}>{msg}</div>

        {missingCodes.length > 0 ? (
          <div style={{ marginTop: 10, color: "crimson" }}>
            Missing in inventory: <b>{missingCodes.join(", ")}</b> (click “Create Missing”)
          </div>
        ) : null}

        {insufficientCodes.length > 0 ? (
          <div style={{ marginTop: 10, color: "crimson" }}>
            Insufficient stock:
            <ul>
              {insufficientCodes.map((x) => (
                <li key={x.code}>
                  {x.code} need {x.need}, have {x.have}{" "}
                  <button onClick={() => restock(x.beadId, 500)} style={smallBtn}>+500</button>{" "}
                  <button onClick={() => restock(x.beadId, 1000)} style={smallBtn}>+1000</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16 }}>
        {items.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No parsed items yet.</div>
        ) : (
          items.map((it, idx) => {
            const code = it.colorCode.toUpperCase();
            const bead = beadsByCode.get(code);
            const have = bead ? bead.quantity : null;
            const after = bead ? bead.quantity - it.count : null;

            const status =
              !bead ? "MISSING" :
              bead.quantity < it.count ? "INSUFFICIENT" :
              after !== null && after < bead.threshold ? "LOW_AFTER_APPLY" :
              "OK";

            return (
              <div key={`${code}-${idx}`} style={{ padding: 10, border: "1px solid #eee", borderRadius: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>
                    {code} {bead?.name ? `- ${bead.name}` : ""}
                    <span style={{ marginLeft: 10, fontWeight: 700, color: status === "OK" ? "green" : "crimson" }}>
                      {status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div>Need</div>
                    <input
                      type="number"
                      value={it.count}
                      onChange={(e) => updateCount(idx, Number(e.target.value))}
                      style={{ width: 120, padding: "6px 8px", border: "1px solid #ccc", borderRadius: 8 }}
                    />

                    <div style={{ opacity: 0.9 }}>
                      Have: <b>{have === null ? "—" : have}</b> | After: <b>{after === null ? "—" : after}</b>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
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

const smallBtn: React.CSSProperties = {
  marginLeft: 6,
  padding: "4px 8px",
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
