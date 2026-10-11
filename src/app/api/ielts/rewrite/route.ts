import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { transcript, part, prompt } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "No answer to rewrite." }, { status: 400 });
    }

    const system = `You are an experienced IELTS Speaking examiner and coach. A candidate answered ${part || "an IELTS Speaking question"}.

The question/cue card was:
"""${prompt || "(not provided)"}"""

The candidate's spoken answer (transcribed) was:
"""${transcript}"""

Rewrite their answer into a Band 8.5–9 MODEL ANSWER that:
- KEEPS the candidate's own ideas and personal details where possible — improve them, don't replace the person.
- Has a clear, correct structure appropriate to the part (Part 1: direct answer + reason + example; Part 2: intro → who/what/where/when → details → why it matters → reflection; Part 3: position → reasons → example → balanced view).
- Uses natural linking phrases (e.g. "to begin with", "what's more", "having said that", "the main reason being").
- Upgrades weak vocabulary to precise, idiomatic, topic-appropriate language and fixes grammar.
- Sounds spoken and natural, not written or robotic.

Return ONLY valid JSON:
{
  "rewrite": "<the full improved model answer, ready to read aloud>",
  "tips": [<exactly 3 short structure/flow tips specific to this answer>]
}`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(1400),
      messages: [{ role: "system", content: system }],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("IELTS rewrite error:", err);
    return NextResponse.json({ error: "Rewrite failed. Please try again." }, { status: 500 });
  }
}
