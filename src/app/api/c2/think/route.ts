import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

// Lightweight, fast feedback for "Think in English" rapid-fire drills.
// Goal: train users to respond immediately and naturally without translating.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { transcript, prompt, responseDelayMs } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "No speech detected. Try again and answer right away." }, { status: 400 });
    }

    const delaySec = typeof responseDelayMs === "number" ? Math.round(responseDelayMs / 100) / 10 : null;

    const system = `You are a fast, sharp C2 English fluency coach running a rapid-fire "Think in English" drill. The user must answer immediately and naturally — no translating from their first language. Keep feedback SHORT and punchy.

The prompt was: "${prompt || "(spontaneous)"}".
${delaySec != null ? `The user took ${delaySec}s to start speaking after seeing the prompt.` : ""}

Return ONLY valid JSON:
{
  "naturalness": <0-100 — how natural and spontaneous the answer sounded>,
  "speed": <0-100 — responsiveness; lower if long hesitation or ${delaySec != null ? `the ${delaySec}s delay was long (>3s)` : "slow start"}>,
  "hesitation": <0-100 — 100 = no hesitation, 0 = very hesitant/choppy>,
  "verdict": "<one short sentence: did they sound like a fluent native-ish speaker or like they were translating?>",
  "betterAnswer": "<a crisp C2-level model answer to the same prompt, 1-2 sentences>",
  "oneFix": "<the single most useful fix, one sentence>"
}`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      max_completion_tokens: budget(500, "low"),
      messages: [
        { role: "system", content: system },
        { role: "user", content: `User's spoken answer:\n"""\n${transcript}\n"""` },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json({ ...data, responseDelaySec: delaySec });
  } catch (err) {
    console.error("C2 think error:", err);
    return NextResponse.json({ error: "Feedback failed. Please try again." }, { status: 500 });
  }
}
