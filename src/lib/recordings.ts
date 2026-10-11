// IndexedDB wrapper for storing audio recordings

export interface SavedRecord {
  id: number;
  scenario: string;
  transcript: string;
  duration: number; // seconds
  wpm: number;
  overallScore: number;
  audioBlob: Blob;
  mimeType: string;
  createdAt: string;
}

const DB_NAME = "spokiva_db";
const DB_VERSION = 1;
const STORE = "recordings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecording(record: Omit<SavedRecord, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllRecordings(): Promise<SavedRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as SavedRecord[]).reverse());
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Cloud storage (audio in Vercel Blob, details in Neon) ───────────────────

export interface CloudRecording {
  id: number;
  scenario: string;
  transcript: string;
  duration: number;
  wpm: number;
  overall_score: number;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

// Uploads a recording to the signed-in user's account: the audio goes straight
// from the browser to Vercel Blob, then its details are saved. Throws on failure.
export async function uploadRecording(record: Omit<SavedRecord, "id">, userId: string): Promise<number> {
  const { upload } = await import("@vercel/blob/client");
  const mimeType = record.mimeType || record.audioBlob.type || "audio/webm";
  const contentType = mimeType.split(";")[0];
  const ext = contentType.includes("mp4") ? "m4a" : contentType.includes("ogg") ? "ogg" : contentType.includes("wav") ? "wav" : "webm";
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const blob = await upload(`recordings/${safeUser}/${Date.now()}.${ext}`, record.audioBlob, {
    access: "private",
    handleUploadUrl: "/api/recordings/upload",
    contentType,
    multipart: record.audioBlob.size > 8 * 1024 * 1024,
  });
  const res = await fetch("/api/recordings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pathname: blob.pathname,
      mimeType,
      scenario: record.scenario,
      transcript: record.transcript,
      duration: record.duration,
      wpm: record.wpm,
      overallScore: record.overallScore,
      createdAt: record.createdAt,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
  return data.id as number;
}

// Saves to the account, falling back to this browser if the upload fails
// (offline, signed out, storage not configured) so a recording is never lost.
export async function saveRecordingPreferCloud(record: Omit<SavedRecord, "id">, userId: string | null | undefined): Promise<"cloud" | "local"> {
  if (userId) {
    try {
      await uploadRecording(record, userId);
      return "cloud";
    } catch (e) {
      console.warn("Cloud upload failed, keeping recording on this device:", e);
    }
  }
  await saveRecording(record);
  return "local";
}
