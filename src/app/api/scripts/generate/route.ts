import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

const NOTATION_SYSTEM = `You are an expert speech writer and communication coach. You write polished, natural-sounding speaking scripts that people can actually deliver confidently. Scripts should sound spoken, not written — use contractions, short punchy sentences, and natural transitions.

IMPORTANT: Embed speaking notation markers throughout the script to guide delivery:

PAUSES (use at natural breath points, after key statements, before transitions):
  /   = short pause (brief beat)
  //  = medium pause (half second)
  /// = long pause (full second — use before big reveals or after powerful statements)

EMPHASIS (wrap 1–3 key words per paragraph that must be stressed):
  **word** = stress this word with weight and clarity

PACE & VOICE:
  [SLOW]   = slow down here for impact
  [FAST]   = pick up energy here
  [QUIET]  = drop to a softer, more intimate tone
  [STRONG] = project with authority and confidence

PHYSICAL CUES (use 2–4 times per script):
  [SMILE]        = smile — warmth and connection
  [STEP FORWARD] = step forward for emphasis
  [LOOK LEFT]    = make eye contact left
  [LOOK RIGHT]   = make eye contact right

Rules:
- Place pause markers inline within sentences, not at line breaks
- Wrap only the most important 1–3 words per section in **emphasis**
- The script must still read naturally when all markers are ignored`;

const DURATION_MAP: Record<string, string> = {
  "30s": "30 seconds (about 75 words)",
  "1min": "1 minute (about 150 words)",
  "2min": "2 minutes (about 300 words)",
  "3min": "3 minutes (about 450 words)",
  "5min": "5 minutes (about 750 words)",
  "10min": "10 minutes (about 1500 words)",
  "15min": "15 minutes (about 2250 words)",
  "30min": "30 minutes (about 4500 words)",
};

// Approx words for each duration, used to size the model's output budget so
// longer scripts are never truncated mid-sentence (~1.4 tokens per word + headroom).
const DURATION_WORDS: Record<string, number> = {
  "30s": 75, "1min": 150, "2min": 300, "3min": 450,
  "5min": 750, "10min": 1500, "15min": 2250, "30min": 4500,
};

function maxTokensForDuration(duration: string, rich: boolean): number {
  const words = DURATION_WORDS[duration] ?? 300;
  // 1.5 tokens/word + 600 token buffer; rich output adds JSON scaffolding.
  const base = Math.ceil(words * 1.5) + 600 + (rich ? 900 : 0);
  return Math.min(Math.max(base, 1500), 16000); // gpt-4o supports up to 16k completion tokens
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const {
      // Original fields
      scenario, goal, audience, tone, duration, style, language,
      // New fields from Script Generator menu
      sourceContent, promptTemplate, platform, scriptStructure,
      outputMode, // "standard" | "rich" (rich = include hook, CTA, hashtags, b-roll ideas)
    } = await req.json();

    const durationStr = DURATION_MAP[duration] || "2 minutes (about 300 words)";
    const styleInstruction = style
      ? `\n\nIMPORTANT: Write this script in the speaking style of ${style}. Capture their signature communication patterns, sentence structure, rhetorical devices, and tone.`
      : "";

    // ── Mode 1: Source-based generation (Script Generator menu) ──
    if (sourceContent && promptTemplate) {
      const structureStr = scriptStructure?.length
        ? `\n\nFollow this script structure: ${scriptStructure.join(" → ")}`
        : "";

      const systemPrompt = `${NOTATION_SYSTEM}${styleInstruction}`;

      const userPrompt = `${promptTemplate
        .replace("{content}", sourceContent)
        .replace("{tone}", tone || "professional")
        .replace("{length}", durationStr)
        .replace("{audience}", audience || "general audience")
        .replace("{platform}", platform || "general")}${structureStr}

Target length: ${durationStr}
Tone: ${tone || "professional"}
Audience: ${audience || "general audience"}
Platform: ${platform || "general"}

${outputMode === "rich" ? `Return a JSON object with these fields:
{
  "title": "catchy script title",
  "hook": "opening hook line (1-2 sentences)",
  "script": "the full spoken script with notation markers",
  "deliveryNotes": ["3-5 delivery tips as strings"],
  "cta": "the call-to-action line",
  "caption": "suggested social media caption",
  "hashtags": ["5-8 relevant hashtags"],
  "brollIdeas": ["3-5 B-roll or visual suggestions"],
  "thumbnailIdeas": ["2-3 thumbnail/title ideas"]
}` : "Write the full spoken script only. Include notation markers. No titles or headers."}`;

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: budget(maxTokensForDuration(duration, outputMode === "rich")),
        response_format: outputMode === "rich" ? { type: "json_object" } : undefined,
      });

      const content = completion.choices[0]?.message?.content ?? "";

      if (outputMode === "rich") {
        try {
          const parsed = JSON.parse(content);
          return NextResponse.json({ rich: parsed, script: parsed.script });
        } catch {
          return NextResponse.json({ script: content });
        }
      }

      return NextResponse.json({ script: content });
    }

    // ── Mode 2: Standard script generation (original flow) ──
    const systemPrompt = `${NOTATION_SYSTEM}${styleInstruction}`;

    const userPrompt = `Write a ${durationStr} speaking script for the following:

Scenario: ${scenario}
Speaking Goal: ${goal || "Communicate clearly and professionally"}
Audience: ${audience}
Tone: ${tone}
Duration: ${durationStr}
${language && language !== "English" ? `Language: ${language}` : ""}

Requirements:
- Write in first person, ready to speak aloud
- Include a strong opening hook
- Clear structure with smooth transitions
- Powerful closing statement
- Natural, conversational language appropriate for the tone
- Embed speaking notation markers throughout
- Just the script text itself — no titles, headers, or explanations

Write the script now:`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: budget(maxTokensForDuration(duration, false)),
    });

    return NextResponse.json({ script: completion.choices[0]?.message?.content ?? "" });

  } catch (err) {
    console.error("Script generation error:", err);
    return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
  }
}
