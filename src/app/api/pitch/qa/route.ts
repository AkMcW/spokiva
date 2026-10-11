import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }
  try {
    const { transcript, pitchType, audience, ask, mode } = await req.json();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const questionerRole = audience || (pitchType === "investor" ? "skeptical investor" : "tough decision-maker");
    const tone = mode === "pressure" ? "very tough and skeptical" : mode === "beginner" ? "curious but fair" : "challenging but fair";

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(500),
      messages: [
        {
          role: "system",
          content: `You are a ${tone} ${questionerRole} who just heard a ${pitchType || "pitch"}.
The speaker's ask was: "${ask || "not specified"}".
Generate exactly 3 challenging follow-up questions that probe the weakest parts of the pitch.
Return JSON: { "questions": [{ "q": "<question>", "hint": "<what a strong answer should address>" }] }`,
        },
        {
          role: "user",
          content: `Pitch transcript:\n${transcript}`,
        },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Pitch Q&A error:", err);
    return NextResponse.json({ error: "Q&A generation failed" }, { status: 500 });
  }
}
