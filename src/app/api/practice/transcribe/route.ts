import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { computeMetrics, type TimedWord, type TokenLogprob } from "@/lib/speechMetrics";

// Transcribes a recording and measures how it was delivered.
// Two passes run in parallel:
//  - gpt-4o-transcribe (with token logprobs): the accurate transcript, plus
//    per-word recognition confidence, used as a clarity/pronunciation signal
//  - whisper-1 (verbose_json, word timestamps): timing for pace, pauses and
//    hesitations. Prompted so it keeps fillers ("um", "uh") instead of cleaning them up.
// Either measurement pass may fail; the transcript is all that's required.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    const clientDuration = Number(formData.get("duration")) || null;

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "No audio recorded. Please try again." }, { status: 400 });
    }

    // Whisper requires a filename with a supported extension.
    const ext = audio.type.includes("mp4") || audio.type.includes("m4a") ? "m4a"
      : audio.type.includes("ogg") ? "ogg"
      : audio.type.includes("wav") ? "wav"
      : "webm";
    const bytes = await audio.arrayBuffer();
    const makeFile = () => new File([bytes], `recording.${ext}`, { type: audio.type || "audio/webm" });

    const [main, timing] = await Promise.allSettled([
      openai.audio.transcriptions.create({
        file: makeFile(),
        model: "gpt-4o-transcribe",
        response_format: "json",
        include: ["logprobs"],
      }),
      openai.audio.transcriptions.create({
        file: makeFile(),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
        prompt: "Umm, let me think like, hmm... Okay, uh, here's what I, I mean.",
      }),
    ]);

    if (main.status === "rejected") {
      // Fall back to whisper's transcript if the main pass failed.
      if (timing.status === "rejected") throw main.reason;
      console.error("gpt-4o-transcribe failed, using whisper transcript:", main.reason);
    }
    if (timing.status === "rejected") console.error("Word timing pass failed:", timing.reason);

    const mainVal = main.status === "fulfilled" ? (main.value as { text?: string; logprobs?: TokenLogprob[] }) : null;
    const timingVal = timing.status === "fulfilled"
      ? (timing.value as { text?: string; duration?: number; words?: TimedWord[] })
      : null;

    const transcript = (mainVal?.text ?? timingVal?.text ?? "").trim();
    const metrics = transcript
      ? computeMetrics({
          transcript,
          timedWords: timingVal?.words ?? null,
          durationSec: Number(timingVal?.duration) || clientDuration,
          tokenLogprobs: mainVal?.logprobs ?? null,
        })
      : null;

    return NextResponse.json({ transcript, metrics });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("Transcription error:", message);
    return NextResponse.json({ error: `Transcription failed: ${message}` }, { status: 500 });
  }
}
