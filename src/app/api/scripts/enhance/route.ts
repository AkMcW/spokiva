import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

// Reviews a user's raw script: light grammar/flow correction + speaking
// notation markers + inline IPA for tricky words. Returns the enhanced script.
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { script, addIPA = true, addNotation = true } = await req.json();
    if (!script?.trim()) {
      return NextResponse.json({ error: "No script provided." }, { status: 400 });
    }

    const system = `You are an expert speech coach who prepares raw text for spoken delivery. Take the user's raw script and return a cleaned, delivery-ready version.

Rules:
1. CORRECT grammar, spelling, and awkward phrasing — but PRESERVE the speaker's meaning, voice, and content. Do not add new ideas or change the message. Keep it natural and speakable.
${addNotation ? `2. ADD speaking notation markers throughout:
   / = short pause, // = medium pause, /// = long pause
   **word** = emphasis (stress this word) — use on 1-3 key words per paragraph
   [SLOW] [FAST] [QUIET] [STRONG] = pace/voice cues where they help
   [SMILE] [STEP FORWARD] = physical cues, used sparingly` : "2. Do NOT add notation markers — keep the text clean."}
${addIPA ? `3. For words that are commonly mispronounced by non-native speakers, add the IPA pronunciation in parentheses right after the word, e.g. "entrepreneur (/ˌɒntrəprəˈnɜːr/)". Only annotate genuinely tricky words — aim for 5-15 across the whole script, not every word.` : "3. Do NOT add IPA pronunciations."}

Return ONLY valid JSON:
{
  "enhanced": "<the corrected, delivery-ready script>",
  "changes": [<2-4 short bullet strings describing the main corrections you made>]
}`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(2500),
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Raw script:\n"""\n${script}\n"""` },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Enhance error:", err);
    return NextResponse.json({ error: "Failed to review the script." }, { status: 500 });
  }
}
