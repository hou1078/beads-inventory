import { prisma } from "@/lib/prisma";

export async function GET() {
  const beads = await prisma.bead.findMany({
    orderBy: { colorCode: "asc" },
  });
  return Response.json(beads);
}

export async function POST(req: Request) {
  const body = await req.json();

  const colorCode = String(body.colorCode ?? "").trim().toUpperCase();
  const name = body.name ? String(body.name) : null;
  const quantity = Number.isFinite(body.quantity) ? Number(body.quantity) : 0;
  const threshold = Number.isFinite(body.threshold) ? Number(body.threshold) : 200;

  if (!colorCode) return new Response("colorCode is required", { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 0) return new Response("quantity must be a non-negative integer", { status: 400 });
  if (!Number.isInteger(threshold) || threshold < 0) return new Response("threshold must be a non-negative integer", { status: 400 });

  const bead = await prisma.bead.upsert({
    where: { colorCode },
    update: { name, quantity, threshold },
    create: { colorCode, name, quantity, threshold },
  });

  return Response.json(bead);
}
