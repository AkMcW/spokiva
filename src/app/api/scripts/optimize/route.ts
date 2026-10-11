import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { script, instruction } = await req.json();

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            `You are an expert speech writer. Rewrite or improve the provided speaking script based on the instruction. Keep it natural and speakable. Return only the improved script — no commentary.

The script may contain speaking notation markers — preserve and improve them as needed:
/ = short pause, // = medium pause, /// = long pause
**word** = emphasis (stress this word)
[SLOW] [FAST] [QUIET] [STRONG] = pace/voice cues
[SMILE] [STEP FORWARD] [LOOK LEFT] [LOOK RIGHT] = physical cues
If the original has no notation, add appropriate markers throughout the rewritten script.`,
        },
        {
          role: "user",
          content: `Instruction: ${instruction}\n\nOriginal script:\n${script}\n\nRewritten script:`,
        },
      ],
      max_completion_tokens: budget(1500),
    });

    const optimized = completion.choices[0]?.message?.content ?? script;
    return NextResponse.json({ script: optimized });
  } catch (err) {
    console.error("Optimize error:", err);
    return NextResponse.json({ error: "Failed to optimize" }, { status: 500 });
  }
}
