// Server-only helpers for storing practice recordings in Vercel Blob.
// Recordings use a *private* store: files are never publicly reachable; the app
// checks ownership and hands out short-lived signed URLs.
// Requires BLOB_READ_WRITE_TOKEN (added when a Blob store is connected to the project).
import { put, issueSignedToken, presignUrl } from "@vercel/blob";

export const RECORDING_MAX_BYTES = 50 * 1024 * 1024; // 50 MB per recording

// Every user's files live under their own prefix; uploads outside it are refused.
export function userPrefix(userId: string): string {
  return `recordings/${userId.replace(/[^a-zA-Z0-9_-]/g, "")}/`;
}

export function ownsPathname(userId: string, pathname: unknown): pathname is string {
  return typeof pathname === "string" && pathname.startsWith(userPrefix(userId)) && !pathname.includes("..");
}

export function extFor(mime: string): string {
  return mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
}

// A signed GET URL valid for `ttlMs` (default 1 hour). The Blob CDN serves it
// directly, including byte-range requests for seeking and Safari playback.
export async function signedGetUrl(pathname: string, ttlMs = 60 * 60 * 1000): Promise<string> {
  const validUntil = Date.now() + ttlMs;
  const token = await issueSignedToken({ pathname, operations: ["get"], validUntil });
  const { presignedUrl } = await presignUrl(token, { operation: "get", pathname, access: "private", validUntil });
  return presignedUrl;
}

// Moves an older recording (audio stored in Neon) into Blob; returns its pathname.
export async function uploadLegacyAudio(userId: string, id: number, bytes: Buffer, mime: string): Promise<string> {
  const contentType = (mime || "audio/webm").split(";")[0];
  const blob = await put(`${userPrefix(userId)}${id}.${extFor(contentType)}`, bytes, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });
  return blob.pathname;
}
