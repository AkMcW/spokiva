import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { get } from "@vercel/blob";
import { getSql, ensureRecordingsTable } from "@/lib/db";
import { signedGetUrl, uploadLegacyAudio, extFor } from "@/lib/recordingBlob";

// GET — one recording's audio. Only the owner can fetch it.
//  - default: redirect to a short-lived signed Blob URL (the CDN handles
//    byte ranges, so seeking and Safari playback work)
//  - ?download=1: stream it back as a file attachment
// Older recordings stored in Neon are moved to Blob on first access.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  try {
    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      SELECT mime_type, scenario, created_at, blob_pathname, (audio IS NOT NULL) AS has_legacy
      FROM recordings
      WHERE id = ${id} AND user_id = ${userId}
    `;
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = rows[0] as { mime_type: string; scenario: string; created_at: string; blob_pathname: string | null; has_legacy: boolean };

    let pathname = row.blob_pathname;
    if (!pathname && row.has_legacy) {
      // One-time migration of an older recording from Neon to Blob
      const legacy = await s`SELECT encode(audio, 'base64') AS b64 FROM recordings WHERE id = ${id} AND user_id = ${userId}`;
      pathname = await uploadLegacyAudio(userId, id, Buffer.from(legacy[0].b64 as string, "base64"), row.mime_type);
      await s`UPDATE recordings SET blob_pathname = ${pathname}, audio = NULL WHERE id = ${id} AND user_id = ${userId}`;
    }
    if (!pathname) return NextResponse.json({ error: "Audio missing" }, { status: 404 });

    if (new URL(req.url).searchParams.get("download")) {
      const file = await get(pathname, { access: "private" });
      if (!file || file.statusCode !== 200) return NextResponse.json({ error: "Audio missing" }, { status: 404 });
      const slug = (row.scenario || "recording").replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 60);
      const date = new Date(row.created_at).toISOString().slice(0, 10);
      return new NextResponse(file.stream, {
        status: 200,
        headers: {
          "Content-Type": file.blob.contentType || row.mime_type || "audio/webm",
          "Content-Length": String(file.blob.size),
          "Content-Disposition": `attachment; filename="spokiva-${slug}-${date}.${extFor(row.mime_type || "")}"`,
          "Cache-Control": "private, no-store",
        },
      });
    }

    const url = await signedGetUrl(pathname);
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("GET /api/recordings/[id]:", err);
    return NextResponse.json({ error: "Failed to load recording" }, { status: 500 });
  }
}
