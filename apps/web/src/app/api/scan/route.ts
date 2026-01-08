export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const image = form.get("image"); // File | null
    const summaryText = form.get("summaryText"); // string | null

    const fwd = new FormData();
    if (image instanceof File) fwd.append("image", image, image.name);
    if (typeof summaryText === "string" && summaryText.trim()) {
      fwd.append("summary_text", summaryText);
    }

    const res = await fetch("http://127.0.0.1:8000/parse", {
      method: "POST",
      body: fwd,
    });

    const contentType = res.headers.get("content-type") ?? "application/json";
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { "Content-Type": contentType } });
  } catch (e: any) {
    return new Response(`Vision service not reachable: ${e?.message ?? String(e)}`, { status: 502 });
  }
}
