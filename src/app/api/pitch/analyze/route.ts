import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";
import { parseMetrics, scoreFromMetrics, deliveryFactsPrompt, toScore } from "@/lib/speechMetrics";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }
  try {
    const { transcript, pitchType, audience, ask, mode, metrics: rawMetrics } = await req.json();
    const metrics = parseMetrics(rawMetrics);
    const measured = scoreFromMetrics(metrics);
    if (!transcript?.trim()) return NextResponse.json({ error: "No transcript provided" }, { status: 400 });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const modeInstructions = mode === "pressure"
      ? "Be strict and demanding. Score harshly. Point out every weakness."
      : mode === "beginner"
      ? "Be encouraging and supportive. Focus on positives while noting key improvements."
      : "Be balanced. Score fairly. Give clear, actionable feedback.";

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(1500),
      messages: [
        {
          role: "system",
          content: `You are an expert pitch coach evaluating a ${pitchType || "pitch"} aimed at ${audience || "a general audience"}.
The speaker's main ask: "${ask || "not specified"}".
Coaching mode: ${mode || "normal"}. ${modeInstructions}

${deliveryFactsPrompt(metrics)}
Analyze the pitch transcript and return JSON with this exact structure:
{
  "scores": {
    "clarity": <0-100>,
    "structure": <0-100>,
    "confidence": <0-100>,
    "timing": <0-100>,
    "persuasiveness": <0-100>,
    "ctaStrength": <0-100>,
    "overall": <0-100>
  },
  "fillerWords": { "count": <number>, "words": [<string>] },
  "wpm": <number — estimate words per minute>,
  "strengths": [<3 specific strengths>],
  "improvements": [<3 specific improvements>],
  "aiFeedback": "<2-3 sentence coaching summary>",
  "practiceAssignment": "<one specific task to do before the next rehearsal>",
  "suggestedRewrite": "<improved version of the weakest section, 1-3 sentences>"
}`,
        },
        {
          role: "user",
          content: `Evaluate this ${pitchType || "pitch"} transcript:\n\n${transcript}`,
        },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    // confidence and timing are measured from the audio when possible; the rest is
    // the coach's judgement. Overall is the average of the six dimensions.
    const ai = data.scores ?? {};
    const scores: Record<string, number | null> = {
      clarity: toScore(ai.clarity),
      structure: toScore(ai.structure),
      confidence: measured.confidence ?? toScore(ai.confidence),
      timing: measured.pace ?? toScore(ai.timing),
      persuasiveness: toScore(ai.persuasiveness),
      ctaStrength: toScore(ai.ctaStrength),
    };
    const vals = Object.values(scores).filter((v): v is number => v != null);
    const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    const measuredKeys = [measured.confidence != null && "confidence", measured.pace != null && "timing"].filter(Boolean);
    return NextResponse.json({
      ...data,
      scores: { ...scores, overall },
      measuredKeys,
      metrics,
      ...(metrics ? { fillerWords: { count: metrics.fillerCount, words: metrics.fillerWords }, wpm: metrics.wpm ?? data.wpm } : {}),
    });
  } catch (err) {
    console.error("Pitch analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
