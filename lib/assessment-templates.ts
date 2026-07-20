export type AssessmentPhaseTemplate = {
  id: string;
  name: string;
  type:
    | "PRE_SCREEN"
    | "SKILL_VERIFICATION"
    | "BEHAVIOURAL"
    | "COGNITIVE_APTITUDE"
    | "TECHNICAL"
    | "AI_INTERVIEW"
    | "FINAL_REVIEW";
  description: string;
  durationMinutes: number;
  passThreshold: number;
  recommended: boolean;
  questionType: string;
  questions: string[];
};
export const assessmentTemplates: AssessmentPhaseTemplate[] = [
  {
    id: "eligibility",
    name: "Eligibility & pre-screen",
    type: "PRE_SCREEN",
    description: "Confirms non-negotiable eligibility before candidates invest time.",
    durationMinutes: 15,
    passThreshold: 70,
    recommended: true,
    questionType: "Knockout and short answer",
    questions: [
      "Do you currently hold the work rights required for this role?",
      "Can you work from the advertised location and work mode?",
      "When could you commence this role?",
      "What salary range are you seeking?",
      "In 150 words, why does this opportunity align with your career goals?",
    ],
  },
  {
    id: "behavioural",
    name: "Behavioural & skills interview",
    type: "BEHAVIOURAL",
    description: "Structured STAR and skills-evidence questions mapped to job criteria.",
    durationMinutes: 45,
    passThreshold: 72,
    recommended: true,
    questionType: "Recorded or written STAR response",
    questions: [
      "Tell us about a time you influenced a decision without formal authority.",
      "Describe a difficult disagreement and how you resolved it.",
      "Give an example of receiving feedback that changed your approach.",
      "Tell us about a time priorities changed unexpectedly.",
      "Describe how you created an inclusive environment for others.",
    ],
  },
  {
    id: "cognitive",
    name: "Cognitive aptitude test",
    type: "COGNITIVE_APTITUDE",
    description: "A balanced 10–20 item test tailored to the role family and experience level.",
    durationMinutes: 20,
    passThreshold: 70,
    recommended: true,
    questionType: "Numerical, verbal, logical, attention and situational reasoning",
    questions: [],
  },
  {
    id: "technical",
    name: "Technical assessment",
    type: "TECHNICAL",
    description: "A practical, job-relevant exercise with an explicit scoring rubric.",
    durationMinutes: 90,
    passThreshold: 75,
    recommended: true,
    questionType: "Coding, case study, portfolio or work sample",
    questions: [
      "Complete the supplied role-specific practical task.",
      "Explain the assumptions and trade-offs in your solution.",
      "How did you validate the quality of your result?",
      "Identify one limitation and how you would address it with more time.",
      "Provide links or files that support your response.",
    ],
  },
  {
    id: "agent-interview",
    name: "AI structured first interview",
    type: "AI_INTERVIEW",
    description: "Consistent agent-led questions with transcript and autonomous rubric scoring.",
    durationMinutes: 30,
    passThreshold: 76,
    recommended: true,
    questionType: "Voice or video agent call",
    questions: [
      "Walk through the experience most relevant to this position.",
      "What attracted you to this company and role?",
      "Describe a complex decision and the evidence you used.",
      "How do you collaborate across different disciplines?",
      "What questions would you ask the hiring manager?",
    ],
  },
  {
    id: "values",
    name: "Values & motivation interview",
    type: "BEHAVIOURAL",
    description:
      "Explores working preferences without using personality labels as exclusion criteria.",
    durationMinutes: 25,
    passThreshold: 70,
    recommended: false,
    questionType: "Structured written or recorded response",
    questions: [
      "What conditions help you do your best work?",
      "Which company value resonates with you and why?",
      "Describe the kind of team environment you help create.",
      "What would make this role a successful move for you?",
    ],
  },
  {
    id: "final-review",
    name: "Automated final evidence audit",
    type: "FINAL_REVIEW",
    description: "Automatically verifies the complete evidence pack before finalist selection.",
    durationMinutes: 20,
    passThreshold: 80,
    recommended: true,
    questionType: "System evidence audit",
    questions: [
      "Are all mandatory eligibility checks satisfied?",
      "Does the evidence meet each published essential criterion?",
      "Were any model outputs low-confidence or disputed?",
      "Has every assessment produced a complete and valid scoring record?",
      "Should this candidate proceed to the company face-to-face interview?",
    ],
  },
];
