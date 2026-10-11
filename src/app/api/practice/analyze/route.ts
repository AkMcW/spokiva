import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";
import {
  scoreFromMetrics, paceScore, overallScore, toBand, toScore, compareToScript,
  tokenizeWords, MIN_WORDS, type SpeechMetrics,
} from "@/lib/speechMetrics";

// Scoring model:
//  - pace, fluency, confidence, pronunciation are MEASURED from the audio
//    (word timings + recognition confidence, computed in /api/practice/transcribe)
//  - structure and vocabulary are judged by the AI from the transcript
//  - script accuracy is an exact word alignment, not an AI estimate
//  - overall is a weighted average of whatever was actually available
// A dimension that couldn't be measured is null (shown as "—"), never 0.

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { transcript, script, scenario, metrics: rawMetrics, durationSeconds } = await req.json();
    const metrics: SpeechMetrics | null = rawMetrics && typeof rawMetrics === "object" ? rawMetrics : null;

    if (!transcript || !transcript.trim()) {
      return NextResponse.json({ error: "No speech detected. Please check your microphone and try again." }, { status: 400 });
    }

    const hasScript = script && script.trim();
    const measured = scoreFromMetrics(metrics);
    // No audio metrics (older client): at least pace can come from the recording length.
    const wordCount = tokenizeWords(transcript).length;
    const dur = Number(durationSeconds);
    if (measured.pace == null && !metrics && dur > 0 && wordCount >= MIN_WORDS) {
      measured.pace = paceScore(Math.round(wordCount / (dur / 60)));
    }
    const wpm = metrics?.wpm ?? (dur > 0 && wordCount ? Math.round(wordCount / (dur / 60)) : null);
    const scriptComparison = hasScript ? compareToScript(script, transcript) : null;

    const deliveryFacts = metrics ? `MEASURED DELIVERY (from the audio — treat as facts, do not re-score these):
- Words: ${metrics.wordCount}; speaking time: ${metrics.speakingSec ?? metrics.durationSec ?? "unknown"} s; pace: ${metrics.wpm ?? "unknown"} wpm
- Pauses ≥0.4 s: ${metrics.pauseCount ?? "unknown"}; long pauses ≥1.2 s: ${metrics.longPauseCount ?? "unknown"}; longest: ${metrics.longestPauseSec ?? "unknown"} s
- Hesitation fillers: ${metrics.fillerCount}${metrics.fillerWords.length ? ` (${metrics.fillerWords.join(", ")})` : ""}; stutter repeats: ${metrics.repetitionCount}
- Recognition clarity: ${metrics.clarity != null ? Math.round(metrics.clarity * 100) + "%" : "unknown"}${metrics.unclearWords.length ? `; words the recogniser found hard to understand (likely mispronounced): ${metrics.unclearWords.join(", ")}` : ""}

` : "";

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

${deliveryFacts}Pronunciation, fluency, confidence and pace are scored separately from audio measurements. You score ONLY these two, from the transcript:
- Structure: Whether ideas were delivered in a logical spoken order${hasScript ? " (reading a script: judge how faithfully and coherently it was delivered)" : ""}
- Vocabulary: Accuracy and range of words used in speech
Use the measured delivery facts above when writing feedback about pace, pauses, fillers and pronunciation.

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
    "structure": <0-100>,
    "vocabulary": <0-100>
  },
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
  ]
}

SCORING GUIDE for structure and vocabulary — be strict:
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

    const ai = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const scores = {
      pronunciation: measured.pronunciation,
      fluency: measured.fluency,
      confidence: measured.confidence,
      pace: measured.pace,
      structure: toScore(ai.scores?.structure),
      vocabulary: toScore(ai.scores?.vocabulary),
      overall: null as number | null,
    };
    scores.overall = overallScore(scores);

    return NextResponse.json({
      scores,
      scoreBasis: {
        pronunciation: "measured", fluency: "measured", confidence: "measured", pace: "measured",
        structure: "ai", vocabulary: "ai", overall: "weighted",
      },
      metrics,
      fillerWords: { count: metrics?.fillerCount ?? 0, words: metrics?.fillerWords ?? [] },
      wpm,
      strengths: Array.isArray(ai.strengths) ? ai.strengths : [],
      improvements: Array.isArray(ai.improvements) ? ai.improvements : [],
      aiFeedback: typeof ai.aiFeedback === "string" ? ai.aiFeedback : "",
      nativeTip: typeof ai.nativeTip === "string" ? ai.nativeTip : "",
      wordErrors: Array.isArray(ai.wordErrors) ? ai.wordErrors : [],
      pronunciationNotes: Array.isArray(ai.pronunciationNotes) ? ai.pronunciationNotes : [],
      scriptComparison,
      bandScore: toBand(scores.overall),
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
