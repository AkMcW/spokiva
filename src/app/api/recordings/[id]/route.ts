import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSql, ensureRecordingsTable } from "@/lib/db";

// GET — stream one recording's audio. Only the owner can fetch it.
// ?download=1 sends it as an attachment instead of inline playback.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  try {
    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      SELECT mime_type, scenario, created_at, encode(audio, 'base64') AS b64
      FROM recordings
      WHERE id = ${id} AND user_id = ${userId}
    `;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { mime_type, scenario, created_at, b64 } = rows[0] as { mime_type: string; scenario: string; created_at: string; b64: string };
    const bytes = Buffer.from(b64, "base64");
    const headers: Record<string, string> = {
      "Content-Type": mime_type || "audio/webm",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    };

    // Byte-range requests: Safari won't play media without them, and they make seeking work.
    const range = req.headers.get("range");
    const m = range?.match(/^bytes=(\d*)-(\d*)$/);
    if (m && (m[1] || m[2])) {
      const size = bytes.length;
      let start = m[1] ? Number(m[1]) : size - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : size - 1;
      start = Math.max(0, start); end = Math.min(end, size - 1);
      if (start > end || start >= size) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      }
      const chunk = bytes.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(chunk.length) },
      });
    }
    headers["Content-Length"] = String(bytes.length);
    if (new URL(req.url).searchParams.get("download")) {
      const ext = mime_type?.includes("mp4") ? "m4a" : mime_type?.includes("ogg") ? "ogg" : mime_type?.includes("wav") ? "wav" : "webm";
      const slug = (scenario || "recording").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 60);
      headers["Content-Disposition"] = `attachment; filename="spokiva-${slug}-${new Date(created_at).toISOString().slice(0, 10)}.${ext}"`;
    }
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch (err) {
    console.error("GET /api/recordings/[id]:", err);
    return NextResponse.json({ error: "Failed to load recording" }, { status: 500 });
  }
}
