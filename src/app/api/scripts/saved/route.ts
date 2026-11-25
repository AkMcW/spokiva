import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, ensureScriptsTable } from "@/lib/db";
import { scripts } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// GET — list all scripts for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureScriptsTable();
    const rows = await db
      .select()
      .from(scripts)
      .where(eq(scripts.userId, userId))
      .orderBy(desc(scripts.createdAt));

    return NextResponse.json({ scripts: rows });
  } catch (err) {
    console.error("GET /api/scripts/saved:", err);
    return NextResponse.json({ error: "Failed to load scripts" }, { status: 500 });
  }
}

// POST — save a new script
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, scenario, content, wordCount, duration } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    await ensureScriptsTable();
    const [row] = await db
      .insert(scripts)
      .values({
        userId,
        title: title || scenario || "Untitled Script",
        scenario: scenario || "General",
        content,
        wordCount: wordCount ?? 0,
        duration: duration ?? "",
      })
      .returning();

    return NextResponse.json({ script: row }, { status: 201 });
  } catch (err) {
    console.error("POST /api/scripts/saved:", err);
    return NextResponse.json({ error: "Failed to save script" }, { status: 500 });
  }
}

// DELETE — remove a script by id (query param)
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await ensureScriptsTable();
    await db.delete(scripts).where(and(eq(scripts.id, id), eq(scripts.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/scripts/saved:", err);
    return NextResponse.json({ error: "Failed to delete script" }, { status: 500 });
  }
}

// PATCH — update script content/title
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title: rawTitle, content, wordCount } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const title = rawTitle === undefined ? undefined : String(rawTitle).trim().slice(0, 120);
    if (title !== undefined && !title) return NextResponse.json({ error: "The name can't be empty" }, { status: 400 });

    await ensureScriptsTable();

    const [row] = await db
      .update(scripts)
      .set({
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content, wordCount: wordCount ?? 0 }),
        updatedAt: new Date(),
      })
      .where(and(eq(scripts.id, id), eq(scripts.userId, userId)))
      .returning();
    if (!row) return NextResponse.json({ error: "Script not found" }, { status: 404 });

    return NextResponse.json({ script: row });
  } catch (err) {
    console.error("PATCH /api/scripts/saved:", err);
    return NextResponse.json({ error: "Failed to update script" }, { status: 500 });
  }
}
