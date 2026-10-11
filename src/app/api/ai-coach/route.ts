import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }
  // ElevenLabs is optional — text-only responses still work without it

  try {
    const { messages, voiceId, systemOverride } = await req.json();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Get AI text response
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      reasoning_effort: "low",
      messages: [
        {
          role: "system",
          content: systemOverride ?? `You are an expert speech coach and communication trainer named "Coach Alex".
You help users improve their speaking skills through conversation practice.
Keep responses concise (2-4 sentences max) and conversational — you are speaking, not writing.
Ask follow-up questions to keep the conversation flowing.
Give specific, actionable feedback when the user shares a speech or asks for help.
Be encouraging, warm, and professional.`,
        },
        ...messages,
      ],
      max_completion_tokens: budget(200, "low"),
    });

    const replyText = completion.choices[0]?.message?.content ?? "I didn't catch that. Could you try again?";

    // ── Text-to-speech so the coach can actually talk back ──
    // Prefer ElevenLabs when configured; otherwise fall back to OpenAI TTS
    // (always available since OPENAI_API_KEY is required). Either way the
    // coach speaks — we only return audio: null if both engines fail.
    let base64: string | null = null;

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const voice = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel — warm, professional
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: replyText,
            model_id: "eleven_turbo_v2_5",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        });
        if (ttsRes.ok) {
          base64 = Buffer.from(await ttsRes.arrayBuffer()).toString("base64");
        } else {
          console.error("ElevenLabs error:", await ttsRes.text());
        }
      } catch (e) {
        console.error("ElevenLabs request failed:", e);
      }
    }

    // Fallback to OpenAI TTS if ElevenLabs is absent or failed
    if (!base64) {
      try {
        const speech = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova", // warm, friendly female voice
          input: replyText,
        });
        base64 = Buffer.from(await speech.arrayBuffer()).toString("base64");
      } catch (e) {
        console.error("OpenAI TTS failed:", e);
      }
    }

    return NextResponse.json({ text: replyText, audio: base64 });
  } catch (err) {
    console.error("AI Coach error:", err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
