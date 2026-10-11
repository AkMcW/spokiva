import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { head, del } from "@vercel/blob";
import { getSql, ensureRecordingsTable } from "@/lib/db";
import { ownsPathname } from "@/lib/recordingBlob";

function int(v: unknown): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// GET — list the user's recordings (metadata only; audio is fetched per id)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      SELECT id, scenario, transcript, duration, wpm, overall_score, mime_type, size_bytes, created_at
      FROM recordings
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return NextResponse.json({ recordings: rows });
  } catch (err) {
    console.error("GET /api/recordings:", err);
    return NextResponse.json({ error: "Failed to load recordings" }, { status: 500 });
  }
}

// POST — save metadata for a recording the browser already uploaded to Blob
// (via /api/recordings/upload). Body: { pathname, mimeType, scenario, transcript,
// duration, wpm, overallScore, createdAt }.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    if (!ownsPathname(userId, b.pathname)) {
      return NextResponse.json({ error: "Invalid recording path" }, { status: 400 });
    }
    // Confirm the file really exists in Blob and take its size from there.
    const blob = await head(b.pathname).catch(() => null);
    if (!blob) return NextResponse.json({ error: "Uploaded file not found" }, { status: 400 });

    const created = b.createdAt ? new Date(String(b.createdAt)) : new Date();
    const createdAt = isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString();
    const mimeType = String(b.mimeType || blob.contentType || "audio/webm").slice(0, 100);

    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      INSERT INTO recordings (user_id, scenario, transcript, duration, wpm, overall_score, mime_type, size_bytes, blob_pathname, created_at)
      VALUES (
        ${userId}, ${String(b.scenario ?? "").slice(0, 300)}, ${String(b.transcript ?? "")},
        ${int(b.duration)}, ${int(b.wpm)}, ${int(b.overallScore)},
        ${mimeType}, ${blob.size}, ${b.pathname}, ${createdAt}
      )
      RETURNING id, created_at
    `;
    return NextResponse.json({ id: rows[0].id, createdAt: rows[0].created_at }, { status: 201 });
  } catch (err) {
    console.error("POST /api/recordings:", err);
    return NextResponse.json({ error: "Failed to save recording" }, { status: 500 });
  }
}

// DELETE — remove a recording (?id=): its Blob file and its row.
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      DELETE FROM recordings WHERE id = ${id} AND user_id = ${userId}
      RETURNING blob_pathname
    `;
    const pathname = rows[0]?.blob_pathname as string | null | undefined;
    if (pathname) await del(pathname).catch((e) => console.error("Blob delete failed:", e));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recordings:", err);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}
