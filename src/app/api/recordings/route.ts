import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSql, ensureRecordingsTable } from "@/lib/db";

// Vercel caps serverless request bodies at ~4.5 MB; keep uploads under that.
const MAX_BYTES = 4 * 1024 * 1024;

function int(v: FormDataEntryValue | null): number {
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

// POST — upload one recording (multipart: audio file + metadata fields)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }
    if (audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "Recording is too large to store (max 4 MB)." }, { status: 413 });
    }
    const mimeType = String(form.get("mimeType") || audio.type || "audio/webm").slice(0, 100);
    const createdAtRaw = form.get("createdAt");
    const created = createdAtRaw ? new Date(String(createdAtRaw)) : new Date();
    const createdAt = isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString();
    const b64 = Buffer.from(await audio.arrayBuffer()).toString("base64");

    await ensureRecordingsTable();
    const s = getSql();
    const rows = await s`
      INSERT INTO recordings (user_id, scenario, transcript, duration, wpm, overall_score, mime_type, size_bytes, audio, created_at)
      VALUES (
        ${userId}, ${String(form.get("scenario") ?? "").slice(0, 300)}, ${String(form.get("transcript") ?? "")},
        ${int(form.get("duration"))}, ${int(form.get("wpm"))}, ${int(form.get("overallScore"))},
        ${mimeType}, ${audio.size}, decode(${b64}, 'base64'), ${createdAt}
      )
      RETURNING id, created_at
    `;
    return NextResponse.json({ id: rows[0].id, createdAt: rows[0].created_at }, { status: 201 });
  } catch (err) {
    console.error("POST /api/recordings:", err);
    return NextResponse.json({ error: "Failed to save recording" }, { status: 500 });
  }
}

// DELETE — remove a recording by id (?id=)
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await ensureRecordingsTable();
    const s = getSql();
    await s`DELETE FROM recordings WHERE id = ${id} AND user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/recordings:", err);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}
