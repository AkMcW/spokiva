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

// ── Cloud storage (Neon via /api/recordings) ────────────────────────────────

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

// Uploads a recording to the signed-in user's account. Throws on failure.
export async function uploadRecording(record: Omit<SavedRecord, "id">): Promise<number> {
  const form = new FormData();
  form.append("audio", record.audioBlob, "recording");
  form.append("mimeType", record.mimeType || record.audioBlob.type || "audio/webm");
  form.append("scenario", record.scenario);
  form.append("transcript", record.transcript);
  form.append("duration", String(record.duration));
  form.append("wpm", String(record.wpm));
  form.append("overallScore", String(record.overallScore));
  form.append("createdAt", record.createdAt);
  const res = await fetch("/api/recordings", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
  return data.id as number;
}

// Saves to the account, falling back to this browser if the upload fails
// (offline, too large, signed out) so a recording is never lost.
export async function saveRecordingPreferCloud(record: Omit<SavedRecord, "id">): Promise<"cloud" | "local"> {
  try {
    await uploadRecording(record);
    return "cloud";
  } catch {
    await saveRecording(record);
    return "local";
  }
}
