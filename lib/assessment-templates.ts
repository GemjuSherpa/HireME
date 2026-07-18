export type AssessmentPhaseTemplate = {
  id: string;
  name: string;
  type:
    | "PRE_SCREEN"
    | "SKILL_VERIFICATION"
    | "BEHAVIOURAL"
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
    id: "skills",
    name: "Skills verification",
    type: "SKILL_VERIFICATION",
    description: "Validates the required capabilities through consistent evidence.",
    durationMinutes: 35,
    passThreshold: 72,
    recommended: true,
    questionType: "Knowledge, evidence and practical",
    questions: [
      "Describe a recent example where you applied the role's primary skill.",
      "Which tools or methods did you use, and why?",
      "What measurable result did your work produce?",
      "What would you change if you repeated the work?",
      "Complete the role-specific knowledge check configured by the hiring team.",
    ],
  },
  {
    id: "behavioural",
    name: "Behavioural interview",
    type: "BEHAVIOURAL",
    description: "Structured STAR questions mapped to workplace competencies.",
    durationMinutes: 35,
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
    description: "Consistent agent-led questions with transcript, consent and human review.",
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
    name: "Final shortlist review",
    type: "FINAL_REVIEW",
    description: "Human review of the complete evidence pack before face-to-face interviews.",
    durationMinutes: 20,
    passThreshold: 80,
    recommended: true,
    questionType: "Hiring-team evidence review",
    questions: [
      "Are all mandatory eligibility checks satisfied?",
      "Does the evidence meet each published essential criterion?",
      "Were any model outputs low-confidence or disputed?",
      "Has a human reviewer checked the complete evidence pack?",
      "Should this candidate proceed to the company face-to-face interview?",
    ],
  },
];
