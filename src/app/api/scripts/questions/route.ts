import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

// Wizard step 3: ask the user 3 short, plain-language questions so the script
// is about THEIR situation instead of a generic template.
export interface GuideQuestion { question: string; example: string }

const FALLBACK: GuideQuestion[] = [
  { question: "What is the main thing you want your listeners to remember?", example: "Our project is on track and we need one more designer." },
  { question: "What facts, names or numbers should be included?", example: "We finished 8 of 10 tasks; launch date is 14 March." },
  { question: "What do you want people to do or feel at the end?", example: "Approve the budget / feel confident about the plan." },
];

export async function POST(req: NextRequest) {
  const { scenario, audience } = await req.json().catch(() => ({}));
  if (!process.env.OPENAI_API_KEY || !scenario) return NextResponse.json({ questions: FALLBACK, fallback: true });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      max_completion_tokens: budget(400, "low"),
      messages: [
        {
          role: "system",
          content: `You help non-native English speakers prepare a spoken script. Ask exactly 3 short questions that collect the personal details needed to write a great script for this situation. Use simple, everyday English (max 15 words per question), no jargon. Give each a short realistic example answer.
Return JSON: {"questions":[{"question":"...","example":"..."}]}`,
        },
        { role: "user", content: `Situation: ${scenario}\nListeners: ${audience || "not specified"}` },
      ],
    });
    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const questions: GuideQuestion[] = Array.isArray(data.questions)
      ? data.questions
          .filter((q: GuideQuestion) => typeof q?.question === "string" && q.question.trim())
          .slice(0, 3)
          .map((q: GuideQuestion) => ({ question: q.question.trim(), example: String(q.example ?? "").trim() }))
      : [];
    return NextResponse.json({ questions: questions.length === 3 ? questions : FALLBACK, fallback: questions.length !== 3 });
  } catch (err) {
    console.error("Script questions error:", err);
    return NextResponse.json({ questions: FALLBACK, fallback: true });
  }
}
