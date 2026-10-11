import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { CHAT_MODEL, budget } from "@/lib/ai";

// Per-exam scoring guidance so the model returns a score in the test's
// native scale plus the criteria that exam actually grades on.
const EXAM_RUBRICS: Record<string, { scale: string; criteria: string[]; guide: string }> = {
  ielts: {
    scale: "IELTS Band (1.0–9.0, in 0.5 steps)",
    criteria: ["Fluency & Coherence", "Lexical Resource", "Grammatical Range & Accuracy", "Pronunciation"],
    guide: "Band 9 = native-like. Band 7 = good operational command. Band 5 = modest. Be realistic; most strong non-natives are 6.0–7.5.",
  },
  toefl: {
    scale: "TOEFL Speaking score (0–30)",
    criteria: ["Delivery", "Language Use", "Topic Development"],
    guide: "26–30 = high. 18–25 = fair/good. 10–17 = limited. Map the four-point task rubric onto the 30-point scale.",
  },
  pte: {
    scale: "PTE score (10–90)",
    criteria: ["Content", "Oral Fluency", "Pronunciation"],
    guide: "85–90 = expert. 65–84 = good. 50–64 = competent. For Read Aloud, weight accuracy to the source text heavily.",
  },
  cambridge: {
    scale: "CEFR level (B2, C1, or C2)",
    criteria: ["Grammar & Vocabulary", "Discourse Management", "Pronunciation", "Interactive Communication"],
    guide: "C2 = fully operational, native-like range. C1 = effective. B2 = good but with noticeable limits. Reserve C2 for genuinely advanced range.",
  },
  toeic: {
    scale: "TOEIC Speaking score (0–200)",
    criteria: ["Pronunciation & Intonation", "Grammar & Vocabulary", "Relevance & Completeness", "Professional Tone"],
    guide: "160–200 = advanced workplace English. 110–150 = effective. 80–100 = limited. Reward clear, professional, solution-oriented delivery.",
  },
  oet: {
    scale: "OET grade (A, B, C+, C, D, or E)",
    criteria: ["Intelligibility", "Empathy & Rapport", "Clarity of Explanation", "Appropriateness of Language"],
    guide: "A = excellent clinical communication. B = very good (common pass for registration). C = adequate. Weight empathy and patient-appropriate, jargon-free language heavily.",
  },
  celpip: {
    scale: "CELPIP level (1–12)",
    criteria: ["Content & Coherence", "Vocabulary", "Listenability", "Task Fulfillment"],
    guide: "10–12 = advanced. 7–9 = good general proficiency. 4–6 = adequate. Reward natural, practical everyday communication.",
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { transcript, examId, examName, taskName, taskType, prompt } = await req.json();
    if (!transcript?.trim()) {
      return NextResponse.json({ error: "No speech detected. Please record again and speak clearly." }, { status: 400 });
    }

    const rubric = EXAM_RUBRICS[examId] ?? EXAM_RUBRICS.ielts;
    const isReadAloud = taskType === "read-aloud";
    const isRepeat = taskType === "repeat-sentence";
    const sourceTask = isReadAloud || isRepeat;

    const system = `You are an official examiner for ${examName || "an English speaking exam"}. Score the candidate's spoken response strictly and fairly using the real exam's criteria.

EXAM: ${examName}
TASK: ${taskName} (${taskType})
${isRepeat ? `The candidate HEARD this sentence once and had to REPEAT it exactly (from memory):\n"""${prompt}"""\nScore primarily on how completely and accurately they reproduced it — every correct word in the right order matters. Also judge fluency and pronunciation.` : isReadAloud ? `The candidate was asked to READ THIS TEXT ALOUD:\n"""${prompt}"""\nJudge accuracy to the source, fluency, and pronunciation. Penalize skipped/changed words.` : `The candidate was responding to this prompt:\n"""${prompt}"""`}

SCORING SCALE: ${rubric.scale}
SCORING GUIDE: ${rubric.guide}

Return ONLY valid JSON:
{
  "nativeScore": "<the score in the native scale, e.g. 'Band 7.0', '24/30', '78/90', 'C1', '160/200', 'Grade B', 'Level 9'>",
  "scoreOutOf100": <0-100 normalized equivalent for a progress ring>,
  "verdict": "<one-sentence examiner judgment>",
  "criteria": [
${rubric.criteria.map((c) => `    { "name": "${c}", "score": <0-100>, "comment": "<specific feedback citing the transcript>" }`).join(",\n")}
  ],
  "strengths": [<2-3 specific strengths citing the transcript>],
  "improvements": [<2-3 specific, actionable improvements>],
  "modelAnswer": "<${sourceTask ? "2-3 short delivery/accuracy tips instead of a rewrite" : "a concise high-scoring model response to the same prompt, 2-4 sentences"}>",
  "examinerTip": "<the single most useful tip to raise the score on this exam>"
}

Be honest and specific. Cite real words/phrases from the transcript. Do not inflate scores.`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_completion_tokens: budget(1800),
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Candidate's spoken transcript:\n"""\n${transcript}\n"""` },
      ],
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json(data);
  } catch (err) {
    console.error("Exam analyze error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
