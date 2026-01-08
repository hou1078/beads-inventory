import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const beads = await prisma.bead.findMany({
    orderBy: { colorCode: "asc" },
  });

  const low = beads
    .filter((b) => b.quantity < b.threshold)
    .map((b) => ({ ...b, shortage: b.threshold - b.quantity }))
    .sort((a, b) => b.shortage - a.shortage);

  return Response.json(low);
}
