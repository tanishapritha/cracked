export type Difficulty = "Easy" | "Medium" | "Hard";

export type Topic =
  | "arrays"
  | "two-pointers"
  | "sliding-window"
  | "binary-search"
  | "trees"
  | "graphs"
  | "dynamic-programming"
  | "heaps"
  | "backtracking"
  | "tries"
  | "stacks";

export interface Problem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: Topic[];
  lc_url: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  starter_code: {
    python: string;
    javascript: string;
    java: string;
  };
  coach_context: string;
}

export type CoachStep = 1 | 2 | 3 | 4 | 5 | 6;

export const STEP_LABELS: Record<CoachStep, string> = {
  1: "Understand",
  2: "Approach",
  3: "Data Structure",
  4: "Build",
  5: "Edge Cases",
  6: "Review",
};

// Keep old type as alias for backward compat
export type CoachStage = CoachStep;

export interface ChatMessage {
  role: "coach" | "user";
  content: string;
  type?: "problem-intro" | "text" | "hint" | "code-reveal";
  codeSnippet?: string; // AI-generated code for "Show me" actions
}

export interface Session {
  id: string;
  user_id: string;
  problem_slug: string;
  stage_reached: number;
  hints_used: number;
  duration_seconds: number;
  solved: boolean;
  created_at: string;
}

export interface SkillScore {
  id: string;
  user_id: string;
  topic: Topic;
  score: number;
}

export const TOPICS: Topic[] = [
  "arrays",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "trees",
  "graphs",
  "dynamic-programming",
  "heaps",
  "backtracking",
  "tries",
  "stacks",
];

export function getSkillLabel(score: number): string {
  if (score <= 30) return "Weak";
  if (score <= 55) return "Shaky";
  if (score <= 75) return "Okay";
  if (score <= 90) return "Good";
  return "Strong";
}

export function getSkillColor(score: number): string {
  if (score <= 30) return "#ef4444";
  if (score <= 55) return "#f59e0b";
  if (score <= 75) return "#eab308";
  if (score <= 90) return "#84cc16";
  return "#22c55e";
}
