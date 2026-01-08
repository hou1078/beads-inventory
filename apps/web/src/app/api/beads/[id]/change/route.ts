import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;            // ✅ 关键：await params
  const beadId = Number(id);

  if (!Number.isInteger(beadId)) {
    return new Response("invalid id", { status: 400 });
  }

  const body = await req.json();
  const delta = Number(body.delta);
  const note = body.note ? String(body.note) : null;

  if (!Number.isInteger(delta) || delta === 0) {
    return new Response("delta must be a non-zero integer", { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const bead = await tx.bead.findUnique({ where: { id: beadId } });
    if (!bead) return { error: "not found" as const };

    const newQty = bead.quantity + delta;
    if (newQty < 0) return { error: "insufficient" as const };

    await tx.stockChange.create({
      data: { beadId, delta, note },
    });

    const updated = await tx.bead.update({
      where: { id: beadId },
      data: { quantity: newQty },
    });

    return { updated };
  });

  if ("error" in result) {
    if (result.error === "not found") return new Response("not found", { status: 404 });
    return new Response("insufficient stock", { status: 400 });
  }

  return Response.json(result.updated);
}
