import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ownsPathname, RECORDING_MAX_BYTES } from "@/lib/recordingBlob";

// Issues short-lived tokens so the browser can upload a recording straight to
// Vercel Blob (no serverless body-size limit). Only signed-in users, only into
// their own recordings/<userId>/ folder, only audio, max 50 MB.
// The recording's metadata is saved afterwards via POST /api/recordings.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
        if (!ownsPathname(userId, pathname)) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ["audio/*"],
          maximumSizeInBytes: RECORDING_MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}
