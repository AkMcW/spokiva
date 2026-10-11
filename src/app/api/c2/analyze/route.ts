import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { transcript, scenario, prompt, challenge } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "No speech detected. Please record again and speak clearly." }, { status: 400 });
    }

    const system = `You are an elite C2-level English fluency coach (CEFR). You assess advanced non-native speakers who already speak "good English" and want to reach C2 — natural, precise, confident, expressive, native-like rhythm — WITHOUT erasing their accent.

Be honest and demanding but constructive. C2 is rare: reserve 90+ for genuinely native-like, effortless, idiomatic delivery. Most strong non-native speakers land B2+/C1. Judge SPOKEN fluency (phrasing, rhythm, naturalness, precision), not just grammatical correctness.

Speaking scenario: ${scenario || "general advanced speaking"}.
${prompt ? `The speaker was responding to: "${prompt}".` : ""}
${challenge ? `This was a focused CHALLENGE drill: ${challenge}. Weight your scoring and feedback heavily toward how well the speaker met this specific challenge, and reference it explicitly in "keepsBelowC2" and "didWell".` : ""}

Return ONLY valid JSON with this exact structure:
{
  "currentLevel": "<one of: B1, B2, B2+, C1, C1+, C2>",
  "targetLevel": "C2",
  "c2Readiness": <0-100 — overall readiness toward C2>,
  "scores": {
    "fluency": <0-100>,
    "precision": <0-100>,
    "complexity": <0-100>,
    "naturalness": <0-100>,
    "pronunciationClarity": <0-100>,
    "intonation": <0-100>,
    "rhythm": <0-100>,
    "vocabularyRange": <0-100>,
    "idiomaticControl": <0-100>,
    "discourseControl": <0-100>,
    "confidence": <0-100>,
    "culturalAppropriateness": <0-100>
  },
  "fillerWords": { "count": <number>, "words": [<exact fillers used, e.g. "um", "like", "you know">] },
  "wpm": <estimated words per minute>,
  "nativeRewrite": {
    "original": "<a representative 1-3 sentence excerpt of what the user actually said>",
    "c2Version": "<the same idea rewritten at natural C2 level — precise, confident, well-structured>",
    "whyBetter": [<3-4 short reasons this version is stronger>]
  },
  "vocabularyUpgrades": [
    { "basic": "<weak/basic phrase the user used or would use>", "upgrade": "<advanced natural alternative>", "note": "<when/why to use it>" }
  ],
  "collocationFixes": [
    { "instead": "<unnatural word combo>", "use": "<the natural collocation>", "note": "<short explanation>" }
  ],
  "fluencyGaps": [<2-5 specific reasons the speaker does not yet sound fully fluent — hesitation, translation from L1, flat intonation, safe vocabulary, weak sentence endings, etc., each citing evidence from the transcript>],
  "intonationCoaching": "<2-3 sentences on stress, melody, emphasis, and rhythm — name specific words to stress>",
  "pronunciationFeedback": "<2-3 sentences on clarity of sounds/stress; remember the goal is clarity, NOT accent removal>",
  "didWell": [<3 specific strengths citing the transcript>],
  "keepsBelowC2": [<3 specific things holding them below C2>],
  "practiceAssignment": "<one concrete drill, e.g. 'Repeat the upgraded version 3 times, stressing X, Y, Z'>",
  "shadowingSentence": "<one polished C2 sentence based on the user's topic that they should shadow/repeat to internalize rhythm>"
}

Rules:
- vocabularyUpgrades: include 4-6 items grounded in what the user said (target overused words like "important", "good", "very", "many people", "I think").
- collocationFixes: include 2-4 items. If the speaker's collocations were all natural, return realistic upgrades relevant to their topic and note they already used natural combinations.
- Cite real words/phrases from the transcript wherever possible. Do not invent errors the user didn't make.`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(2800),
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Here is the spoken transcript to assess:\n\n"""\n${transcript}\n"""` },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("C2 analyze error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
