// Shared OpenAI chat-model settings for every API route.
//
// GPT-6.1 Sol is a reasoning model: it takes `max_completion_tokens` (not
// `max_tokens`), ignores custom `temperature`, and its hidden reasoning tokens
// count against the completion budget. `budget()` adds that headroom on top of
// the visible output a route needs, so answers aren't cut off.
//
// Override the model per environment with OPENAI_CHAT_MODEL (e.g. in Vercel).
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-6.1-sol";

export type Effort = "low" | "medium";

const REASONING_HEADROOM: Record<Effort, number> = { low: 2000, medium: 6000 };

export function budget(outputTokens: number, effort: Effort = "medium"): number {
  return outputTokens + REASONING_HEADROOM[effort];
}
