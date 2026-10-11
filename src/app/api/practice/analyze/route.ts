import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { transcript, script, scenario } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No speech detected. Please check your microphone and try again." }, { status: 400 });
    }

    const hasScript = script && script.trim();

    const prompt = `You are a highly experienced native English speech coach and language examiner. Your job is to evaluate speaking SKILL — not the quality of the content or script. Be direct, honest, and specific like a professional accent coach giving one-on-one feedback. Do not soften criticism. The user needs frank, actionable feedback to improve.

${hasScript ? `ORIGINAL SCRIPT (AI-generated — evaluate user's delivery against this):
"""
${script}
"""

` : ""}USER'S SPOKEN TRANSCRIPT (what the user actually said):
"""
${transcript}
"""

Scenario: ${scenario || "General speech practice"}

Evaluate the user's SPEAKING ABILITY across these dimensions:
- Pronunciation: How accurately they produce English sounds, stress, and intonation
- Fluency: Smoothness of speech, absence of unnatural pauses, flow between words
- Confidence: Vocal strength, commitment to the delivery, absence of hesitation
- Structure: Whether ideas were delivered in a logical spoken order
- Vocabulary: Accuracy and range of words used in speech
- Pace: Whether speaking speed was appropriate (ideal: 120–160 wpm for presentations)

${hasScript ? `WORD-BY-WORD COMPARISON INSTRUCTIONS:
Compare the transcript against the original script word by word. Identify:
1. Words the user SKIPPED entirely
2. Words the user SUBSTITUTED with a different word
3. Words the user MISPRONOUNCED (infer from context — e.g. similar-sounding errors)
4. Filler words the user ADDED that weren't in the script (um, uh, like, so, basically, you know, right)
5. Words the user repeated unnecessarily

For each error found, provide the IPA of the correct word, a plain-English explanation of how a native speaker says it, and a short drill tip.

` : ""}Return ONLY valid JSON with this exact structure (no extra text):
{
  "scores": {
    "pronunciation": <0-100>,
    "fluency": <0-100>,
    "confidence": <0-100>,
    "structure": <0-100>,
    "vocabulary": <0-100>,
    "pace": <0-100>,
    "overall": <0-100>
  },
  "fillerWords": {
    "count": <number>,
    "words": [<exact filler words found, e.g. "um", "uh", "like">]
  },
  "wpm": <estimated words per minute as integer>,
  "strengths": [
    "<specific speaking strength — cite the actual word or phrase from the transcript>",
    "<second specific strength>",
    "<third specific strength>"
  ],
  "improvements": [
    "<most critical speaking improvement needed — be direct, cite example from transcript>",
    "<second improvement>",
    "<third improvement>"
  ],
  "aiFeedback": "<3-4 sentences of frank native-speaker coaching. Do NOT compliment unless genuinely deserved. Identify the single biggest thing holding this speaker back and what to do about it.>",
  "nativeTip": "<one specific native-speaker habit or technique they should adopt immediately>",
  "wordErrors": [
    ${hasScript ? `<For each script word error found, include:>
    {
      "word": "<the correct word from the script>",
      "userSaid": "<what the user said instead, or 'skipped' if omitted>",
      "issue": "<one of: skipped | substituted | filler_added | repeated>",
      "ipa": "<IPA of the correct word, e.g. /kwɔːrtərli/>",
      "howToSay": "<plain English: how a native speaker produces this word — mouth position, stress, linking>",
      "drill": "<one-sentence practice drill for this word>"
    }` : "no script provided — return empty array"}
  ],
  "pronunciationNotes": [
    {
      "sound": "<phoneme or sound pattern, e.g. 'th', 'r', 'final consonants'>",
      "exampleWords": [<words from the transcript where this applies>],
      "ipa": "<IPA symbol(s)>",
      "howTo": "<step-by-step articulation: where to place tongue, lips, airflow>",
      "commonMistake": "<what non-native speakers typically do wrong with this sound>",
      "nativeExample": "<how it sounds in connected natural speech>"
    }
  ],
  ${hasScript ? `"scriptComparison": {
    "wordsInScript": <integer>,
    "wordsCovered": <integer — how many script words the user actually said>,
    "accuracyPercent": <0-100>,
    "missedWords": [<important words from script the user skipped>],
    "addedWords": [<words user added that weren't in the script>]
  },` : `"scriptComparison": null,`}
  "bandScore": <IELTS estimated band 1-9 or null>
}

SCORING GUIDE — be strict:
- 90-100: Native-like. Rare. Award only if genuinely impressive.
- 75-89: Strong non-native speaker. Clear, fluent, minor accent only.
- 60-74: Competent but noticeable issues with one or more dimensions.
- 45-59: Significant errors affecting comprehension or confidence.
- Below 45: Major issues requiring fundamental practice.

wordErrors: include ALL errors found, not just a sample. If script has no errors, return [].
pronunciationNotes: identify 2-4 sound patterns to work on. If speech is excellent, identify the subtlest remaining patterns.`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: budget(2500),
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
