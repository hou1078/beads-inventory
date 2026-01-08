import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Body = {
  note?: string;
  items: { colorCode: string; count: number }[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const note = body.note ? String(body.note) : "apply from scan";
  const items = Array.isArray(body.items) ? body.items : [];

  // 校验
  const cleaned = items
    .map((x) => ({
      colorCode: String(x.colorCode ?? "").trim().toUpperCase(),
      count: Number(x.count),
    }))
    .filter((x) => x.colorCode && Number.isInteger(x.count) && x.count > 0);

  if (cleaned.length === 0) return new Response("items is empty", { status: 400 });

  // 合并同色
  const merged = new Map<string, number>();
  for (const x of cleaned) merged.set(x.colorCode, (merged.get(x.colorCode) ?? 0) + x.count);

  const codes = [...merged.keys()];

  // 事务：检查缺失、检查库存是否足够、写入变更
  const result = await prisma.$transaction(async (tx) => {
    const beads = await tx.bead.findMany({ where: { colorCode: { in: codes } } });
    const byCode = new Map(beads.map((b) => [b.colorCode.toUpperCase(), b]));

    const missing = codes.filter((c) => !byCode.has(c));
    if (missing.length) return { error: "missing" as const, missing };

    // 检查是否够扣
    const insufficient: { colorCode: string; need: number; have: number }[] = [];
    for (const c of codes) {
      const bead = byCode.get(c)!;
      const need = merged.get(c)!;
      if (bead.quantity < need) insufficient.push({ colorCode: c, need, have: bead.quantity });
    }
    if (insufficient.length) return { error: "insufficient" as const, insufficient };

    // 扣库存 + 写 StockChange（每个颜色写一条）
    const updated: any[] = [];
    for (const c of codes) {
      const bead = byCode.get(c)!;
      const count = merged.get(c)!;
      const delta = -count;

      await tx.stockChange.create({
        data: { beadId: bead.id, delta, note: `${note} | ${c} ${delta}` },
      });

      const u = await tx.bead.update({
        where: { id: bead.id },
        data: { quantity: bead.quantity + delta },
      });

      updated.push(u);
    }

    return { ok: true as const, updated };
  });

  if ("error" in result) {
    if (result.error === "missing") return Response.json(result, { status: 400 });
    if (result.error === "insufficient") return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
