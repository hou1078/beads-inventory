import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const beadId = url.searchParams.get("beadId");

  const where = beadId ? { beadId: Number(beadId) } : undefined;

  const changes = await prisma.stockChange.findMany({
    where,
    include: { bead: true },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? limit : 50,
  });

  return Response.json(changes);
}
