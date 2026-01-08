import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // 兼容 Next 的 async params
) {
  const { id } = await params;
  const beadId = Number(id);
  if (!Number.isInteger(beadId)) return new Response("invalid id", { status: 400 });

  // 先删历史记录，再删 bead（避免外键/关联约束报错）
  await prisma.$transaction([
    prisma.stockChange.deleteMany({ where: { beadId } }),
    prisma.bead.delete({ where: { id: beadId } }),
  ]);

  return new Response(null, { status: 204 });
}
