// Choices used by the Script Writer (guided wizard and advanced form).
// Labels are written for non-technical users; `value` is what the AI receives.

export interface OccasionGroup {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  scenarios: string[];
  audiences: string[]; // suggested listeners for this kind of occasion
}

export const OCCASION_GROUPS: OccasionGroup[] = [
  {
    id: "work", label: "Work & meetings", emoji: "💼", hint: "Updates, briefings, reviews",
    scenarios: [
      "Business Meeting Update", "Team Briefing", "Project Kickoff", "Quarterly Business Review",
      "Executive Summary Presentation", "Board Room Update", "Budget Proposal", "Risk & Issues Update",
      "Performance Review (Self)", "Difficult Conversation", "Crisis Communication",
    ],
    audiences: ["Colleagues", "Team Members", "Senior Management", "Board of Directors", "Line Manager"],
  },
  {
    id: "career", label: "Job & interviews", emoji: "🎯", hint: "Interviews, promotions, intros",
    scenarios: [
      "Job Interview: Tell Me About Yourself", "Job Interview: Strengths & Weaknesses",
      "Job Interview: STAR Method Answer", "Job Promotion Pitch", "MBA Interview",
      "Scholarship Interview", "University Admission Interview", "LinkedIn Professional Intro",
    ],
    audiences: ["Interview Panel", "Hiring Manager", "MBA Admissions Panel", "Scholarship Panel", "Recruiter"],
  },
  {
    id: "sales", label: "Sales & clients", emoji: "🤝", hint: "Pitches, demos, negotiations",
    scenarios: [
      "Sales Pitch", "Cold Call Introduction", "Product Demo", "Product Launch Announcement",
      "Investor Pitch", "Negotiation Opening", "Customer Complaint Response",
    ],
    audiences: ["Potential Clients", "Existing Clients", "Investors", "Business Partner", "Customers"],
  },
  {
    id: "talks", label: "Presentations & talks", emoji: "🎤", hint: "Keynotes, training, podcasts",
    scenarios: [
      "Conference Keynote", "Technical Presentation", "Training Presentation", "TED-style Talk",
      "Fundraising Appeal", "Media Interview Response", "Podcast Introduction",
    ],
    audiences: ["General Public", "Tech Professionals", "Students", "Donors", "Media / Press"],
  },
  {
    id: "exams", label: "English exams", emoji: "📚", hint: "IELTS, TOEFL, PTE, Cambridge",
    scenarios: [
      "IELTS Speaking Part 1", "IELTS Speaking Part 2 (Cue Card)", "IELTS Speaking Part 3 (Discussion)",
      "TOEFL Independent Speaking", "TOEFL Integrated Speaking", "PTE Retell Lecture",
      "TOEIC Picture Description", "Cambridge C1 Long Turn",
    ],
    audiences: ["IELTS Examiner", "TOEFL Examiner", "PTE Examiner", "Cambridge Examiner"],
  },
  {
    id: "occasions", label: "Special occasions", emoji: "🥂", hint: "Weddings, toasts, awards",
    scenarios: ["Wedding Speech", "Toast / Tribute", "Award Acceptance Speech", "Graduation Speech"],
    audiences: ["Wedding Guests", "Family & Friends", "Graduates & Families", "Event Guests"],
  },
];

export const SCENARIOS = OCCASION_GROUPS.flatMap((g) => g.scenarios);
export const ALL_AUDIENCES = [...new Set(OCCASION_GROUPS.flatMap((g) => g.audiences))];

export function groupForScenario(scenario: string): OccasionGroup | undefined {
  return OCCASION_GROUPS.find((g) => g.scenarios.includes(scenario));
}

export const TONES: { value: string; hint: string }[] = [
  { value: "Professional", hint: "Clear and polished — safe for most work situations" },
  { value: "Conversational", hint: "Relaxed, like talking to a friend or colleague" },
  { value: "Confident", hint: "Strong and sure of yourself" },
  { value: "Persuasive", hint: "Convinces people to agree or act" },
  { value: "Inspirational", hint: "Uplifting and motivating" },
  { value: "Warm & Humorous", hint: "Friendly with light jokes" },
  { value: "Empathetic", hint: "Caring and understanding" },
  { value: "Formal", hint: "Very proper — exams, ceremonies, official settings" },
  { value: "Academic", hint: "Careful and well-reasoned" },
  { value: "Executive", hint: "Short, direct, focused on decisions" },
];

export const DURATIONS: { value: string; label: string; hint: string; words: number }[] = [
  { value: "30s", label: "30 seconds", hint: "A quick answer or intro", words: 75 },
  { value: "1min", label: "1 minute", hint: "A short answer or opener", words: 150 },
  { value: "2min", label: "2 minutes", hint: "A typical update or story", words: 300 },
  { value: "3min", label: "3 minutes", hint: "A full pitch or speech", words: 450 },
  { value: "5min", label: "5 minutes", hint: "A short presentation", words: 750 },
  { value: "10min", label: "10 minutes", hint: "A full talk", words: 1500 },
];

export const STYLES = [
  { label: "No specific style", value: "", emoji: "" },
  { label: "Steve Jobs", value: "Steve Jobs — simple, storytelling, dramatic pauses, 'one more thing' suspense, minimalist language", emoji: "🍎" },
  { label: "Barack Obama", value: "Barack Obama — measured cadence, inclusive 'we' language, inspirational, hopeful, oratorical rhythm", emoji: "🇺🇸" },
  { label: "Simon Sinek", value: "Simon Sinek — Start With Why framework, conceptual, repeating core ideas, simple powerful language", emoji: "💡" },
  { label: "Brené Brown", value: "Brené Brown — vulnerable, story-driven, academic research woven with personal anecdotes, warm and authentic", emoji: "❤️" },
  { label: "Elon Musk", value: "Elon Musk — direct, data-driven, bold vision, matter-of-fact delivery, future-focused, blunt honesty", emoji: "🚀" },
  { label: "Oprah Winfrey", value: "Oprah Winfrey — warm, empowering, emotional connection, personal stories, uplifting and energizing", emoji: "✨" },
  { label: "Winston Churchill", value: "Winston Churchill — powerful rhetorical questions, tricolon (rule of three), dramatic pauses, historic gravitas", emoji: "🎖️" },
  { label: "Martin Luther King Jr.", value: "Martin Luther King Jr. — repetition (anaphora), vivid imagery, moral urgency, rhythmic and poetic cadence", emoji: "🕊️" },
  { label: "Tony Robbins", value: "Tony Robbins — high energy, pattern interrupts, direct commands, empowering questions, bold certainty", emoji: "🔥" },
  { label: "Sheryl Sandberg", value: "Sheryl Sandberg — data-backed, authentic personal stories, leadership-focused, empowering professional tone", emoji: "👩‍💼" },
  { label: "Richard Feynman", value: "Richard Feynman — explain complex ideas simply, curious and playful, analogies, step-by-step reasoning", emoji: "🔬" },
  { label: "Malala Yousafzai", value: "Malala Yousafzai — calm moral courage, personal narrative, universal values, simple direct language, quiet yet powerful conviction", emoji: "📖" },
  { label: "Jordan Peterson", value: "Jordan Peterson — precise vocabulary, archetypal references, structured arguments, building complexity step-by-step, serious intellectual tone", emoji: "🦞" },
  { label: "Gary Vaynerchuk", value: "Gary Vaynerchuk — raw and direct, high energy, street-smart authenticity, no-fluff hustle mindset, casual but urgent", emoji: "⚡" },
  { label: "Satya Nadella", value: "Satya Nadella — empathetic leadership, growth mindset language, cultural transformation, humble and visionary, strategic clarity", emoji: "🌐" },
  { label: "Nelson Mandela", value: "Nelson Mandela — dignified and measured, moral authority, reconciliation and unity, long-view perspective, quiet gravitas", emoji: "✊" },
  { label: "Amy Cuddy", value: "Amy Cuddy — research-backed storytelling, personal vulnerability, accessible science, empowering and practical, relatable examples", emoji: "🧠" },
  { label: "Seth Godin", value: "Seth Godin — short punchy sentences, counterintuitive insight, marketing philosophy, memorable metaphors, challenges assumptions", emoji: "🟣" },
  { label: "Chimamanda Ngozi Adichie", value: "Chimamanda Ngozi Adichie — rich storytelling, literary precision, cultural depth, warm wit, challenges single narratives with nuance", emoji: "🌍" },
  { label: "Jocko Willink", value: "Jocko Willink — extreme ownership, military directness, no excuses, short declarative sentences, disciplined and commanding tone", emoji: "🪖" },
  { label: "Yuval Noah Harari", value: "Yuval Noah Harari — sweeping historical perspective, clear analytical prose, thought-provoking questions, connects big ideas across disciplines", emoji: "📚" },
];

// Rewrite actions. The first four are shown as buttons; the rest sit under "More…".
export const REWRITES: { label: string; hint: string; instruction: string }[] = [
  { label: "Make it shorter", hint: "Same message, fewer words", instruction: "Make this script shorter and more concise without losing the key messages" },
  { label: "Simpler words", hint: "Easier to say and understand", instruction: "Simplify the language so it's easier to understand and more conversational. Prefer short, common words." },
  { label: "More confident", hint: "Sound sure of yourself", instruction: "Rewrite with a more confident, assertive tone" },
  { label: "Better opening & ending", hint: "Grab attention, finish strong", instruction: "Rewrite the opening to be more attention-grabbing and the closing to be more memorable. Keep the middle as it is." },
  { label: "Make it longer", hint: "Add detail and examples", instruction: "Expand this script with more detail, examples, and supporting points" },
  { label: "More professional", hint: "Polished, business-ready", instruction: "Make this script more professional and executive-level" },
  { label: "More persuasive", hint: "Convince your listeners", instruction: "Make this script more persuasive and compelling" },
  { label: "Add a story", hint: "A short example or analogy", instruction: "Add a brief personal story or analogy to make this more engaging" },
  { label: "Smoother flow", hint: "Better links between parts", instruction: "Add smooth transitional phrases between sections" },
  { label: "Add likely questions", hint: "3 questions + good answers", instruction: "Add 3 likely questions the audience might ask, with strong answers" },
  { label: "Turn into bullet notes", hint: "Short prompts instead of full text", instruction: "Convert this to speaker notes in bullet point format" },
];

export interface Preset {
  label: string;
  icon: string;
  form: { scenario: string; goal: string; audience: string; tone: string; duration: string; style: string };
}

export const PRESETS: Preset[] = [
  { label: "Tell Me About Yourself", icon: "🎯", form: { scenario: "Job Interview: Tell Me About Yourself", goal: "A compelling 90-second personal introduction covering my background, key strengths, and why I am the right fit for this role.", audience: "Interview Panel", tone: "Professional", duration: "1min", style: "" } },
  { label: "IELTS Part 2 Cue Card", icon: "📚", form: { scenario: "IELTS Speaking Part 2 (Cue Card)", goal: "Describe a memorable trip I took. Include where I went, who I went with, what I did, and why it was memorable.", audience: "IELTS Examiner", tone: "Conversational", duration: "2min", style: "" } },
  { label: "Project Status Update", icon: "📊", form: { scenario: "Business Meeting Update", goal: "Give a concise project status update covering: progress against targets, two current blockers, and the plan for the next sprint.", audience: "Senior Management", tone: "Professional", duration: "2min", style: "" } },
  { label: "Investor Pitch Intro", icon: "💡", form: { scenario: "Investor Pitch", goal: "Open an investor pitch for a B2B SaaS startup. Cover the problem we solve, our solution, traction, and the ask.", audience: "Investors", tone: "Persuasive", duration: "3min", style: "" } },
  { label: "Sales Discovery Opening", icon: "💼", form: { scenario: "Sales Pitch", goal: "Open a discovery call with a new prospect. Build rapport, explain our value proposition, and transition into discovery questions.", audience: "Potential Clients", tone: "Conversational", duration: "1min", style: "" } },
  { label: "Wedding Toast", icon: "🥂", form: { scenario: "Wedding Speech", goal: "Give a heartfelt and funny wedding toast. Share a story about the couple, express love, and raise a toast.", audience: "Wedding Guests", tone: "Warm & Humorous", duration: "2min", style: "" } },
  { label: "Performance Self-Review", icon: "📋", form: { scenario: "Performance Review (Self)", goal: "Deliver a confident self-appraisal covering my top three achievements this year, one area I am actively improving, and my goals for next year.", audience: "Line Manager", tone: "Professional", duration: "2min", style: "" } },
  { label: "Cold Call Opener", icon: "📞", form: { scenario: "Cold Call Introduction", goal: "Deliver a 30-second cold call opener that earns a conversation. State who I am, the specific reason for calling, and end with a permission question.", audience: "Potential Clients", tone: "Conversational", duration: "30s", style: "" } },
  { label: "TOEFL Independent Task", icon: "🌍", form: { scenario: "TOEFL Independent Speaking", goal: "Respond to: 'Some people prefer to work in teams. Others prefer to work alone. Which do you prefer and why?' Give a structured 45-second response.", audience: "TOEFL Examiner", tone: "Formal", duration: "30s", style: "" } },
  { label: "Team Motivational Briefing", icon: "💪", form: { scenario: "Team Briefing", goal: "Motivate the team at the start of a challenging project. Acknowledge the difficulty ahead, remind them of past wins, and build excitement for what's coming.", audience: "Team Members", tone: "Inspirational", duration: "2min", style: "" } },
];

// Spoken length estimate at ~130 words per minute.
export function formatSpokenLength(words: number): string {
  const secs = Math.round((words / 130) * 60);
  if (secs < 60) return `about ${Math.max(5, Math.round(secs / 5) * 5)} seconds`;
  const mins = Math.round(secs / 30) / 2;
  return `about ${mins} minute${mins === 1 ? "" : "s"}`;
}
