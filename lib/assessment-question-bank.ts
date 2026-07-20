import { randomInt } from "node:crypto";
import type { StageType } from "@prisma/client";

export type AssessmentAnswerType =
  "LONG_TEXT" | "SHORT_TEXT" | "SINGLE_SELECT" | "NUMERIC" | "DATE";

export type AssessmentQuestion = {
  id: string;
  category: string;
  prompt: string;
  answerType: AssessmentAnswerType;
  options?: string[];
  required: boolean;
  source: "QUESTION_BANK" | "RECRUITER";
  difficulty?: 1 | 2 | 3;
};

type QuestionDefinition = Omit<AssessmentQuestion, "prompt" | "source"> & {
  prompt: string;
  correctAnswer?: string;
  jobFamilies?: string[];
  experienceLevels?: string[];
};

export type QuestionContext = {
  jobTitle: string;
  companyName: string;
  primarySkill: string;
  location: string;
  workMode: string;
  jobFamily: string;
  experienceLevel: string;
};

const preScreenQuestions: QuestionDefinition[] = [
  question(
    "pre-work-rights",
    "Eligibility",
    "Do you currently meet the work-rights requirement published for this role?",
    "SINGLE_SELECT",
    ["Yes", "No", "Unsure"],
  ),
  question(
    "pre-location",
    "Eligibility",
    "Can you work from {{location}} using the advertised {{workMode}} arrangement?",
    "SINGLE_SELECT",
    ["Yes", "No", "With a reasonable adjustment", "I would like to discuss this"],
  ),
  question(
    "pre-start",
    "Availability",
    "What is the earliest date you could commence this role?",
    "DATE",
  ),
  question(
    "pre-employment",
    "Eligibility",
    "Can you accept the employment arrangement stated in the advertisement?",
    "SINGLE_SELECT",
    ["Yes", "No", "I would like to discuss this"],
  ),
  question(
    "pre-salary",
    "Expectations",
    "Is the published salary range acceptable to you?",
    "SINGLE_SELECT",
    ["Yes", "No", "Open to discussion", "No range was published"],
  ),
  question(
    "pre-primary-evidence",
    "Skills",
    "Describe a recent situation where you used {{primarySkill}}. Explain your actions and the result.",
    "LONG_TEXT",
  ),
  question(
    "pre-proficiency",
    "Skills",
    "Which option best describes your experience with {{primarySkill}}?",
    "SINGLE_SELECT",
    [
      "Studied or practised",
      "Used with supervision",
      "Use independently",
      "Guide or train others",
      "Design standards or strategy",
    ],
  ),
  question(
    "pre-problem",
    "Skills",
    "Describe a problem you solved in work similar to {{jobTitle}}. How did you identify the cause and verify the result?",
    "LONG_TEXT",
  ),
  question(
    "pre-quality",
    "Skills",
    "How do you check that your work is accurate, safe and complete?",
    "LONG_TEXT",
  ),
  question(
    "pre-learning",
    "Skills",
    "Describe a tool, skill or process you recently learned and how you applied it.",
    "LONG_TEXT",
  ),
  question(
    "pre-role-motivation",
    "Motivation",
    "What specifically interests you about the day-to-day responsibilities of this {{jobTitle}} role?",
    "LONG_TEXT",
  ),
  question(
    "pre-career",
    "Motivation",
    "How does this opportunity fit your current career goals?",
    "LONG_TEXT",
  ),
  question(
    "pre-company",
    "Motivation",
    "What interests you about working with {{companyName}}?",
    "LONG_TEXT",
  ),
  question(
    "pre-success",
    "Motivation",
    "What would make this role a successful next step for you?",
    "LONG_TEXT",
  ),
  question(
    "pre-development",
    "Skills",
    "Which aspect of this role would require the most development for you, and how would you close that gap?",
    "LONG_TEXT",
  ),
];

const skillVerificationQuestions: QuestionDefinition[] = [
  question(
    "skill-evidence",
    "Evidence",
    "Give a detailed example of using {{primarySkill}} to deliver an outcome.",
    "LONG_TEXT",
  ),
  question(
    "skill-scenario",
    "Application",
    "How would you apply {{primarySkill}} to a realistic challenge in this {{jobTitle}} role?",
    "LONG_TEXT",
  ),
  question(
    "skill-tools",
    "Methods",
    "Which tools, equipment or methods do you use for {{primarySkill}}, and why?",
    "LONG_TEXT",
  ),
  question(
    "skill-quality",
    "Quality",
    "How do you validate the quality of work involving {{primarySkill}}?",
    "LONG_TEXT",
  ),
  question(
    "skill-tradeoff",
    "Judgement",
    "Describe an important trade-off you made while completing similar work.",
    "LONG_TEXT",
  ),
  question(
    "skill-debug",
    "Problem solving",
    "Describe a difficult fault or problem you diagnosed and the steps you followed.",
    "LONG_TEXT",
  ),
  question(
    "skill-safety",
    "Risk",
    "What safety, privacy, compliance or operational risks apply to this work?",
    "LONG_TEXT",
  ),
  question(
    "skill-improve",
    "Reflection",
    "What would you improve if you repeated your most relevant project or task?",
    "LONG_TEXT",
  ),
  question(
    "skill-learn",
    "Learning",
    "How do you keep your knowledge of {{primarySkill}} current?",
    "LONG_TEXT",
  ),
  question(
    "skill-explain",
    "Communication",
    "Explain a complex part of your work to a colleague without the same expertise.",
    "LONG_TEXT",
  ),
  question(
    "skill-support",
    "Collaboration",
    "Give an example of helping someone else apply a skill or process correctly.",
    "LONG_TEXT",
  ),
  question(
    "skill-limit",
    "Self-awareness",
    "What are the limits of your current experience with {{primarySkill}}?",
    "LONG_TEXT",
  ),
];

const behaviouralQuestions: QuestionDefinition[] = [
  question(
    "beh-priority",
    "Adaptability",
    "Tell us about a time priorities changed unexpectedly. What did you do and what happened?",
    "LONG_TEXT",
  ),
  question(
    "beh-conflict",
    "Collaboration",
    "Describe a difficult workplace disagreement and how you resolved it.",
    "LONG_TEXT",
  ),
  question(
    "beh-feedback",
    "Learning",
    "Give an example of feedback that changed your approach.",
    "LONG_TEXT",
  ),
  question(
    "beh-influence",
    "Influence",
    "Tell us about a time you influenced a decision without formal authority.",
    "LONG_TEXT",
  ),
  question(
    "beh-mistake",
    "Accountability",
    "Describe a mistake you made, how you responded and what you learned.",
    "LONG_TEXT",
  ),
  question(
    "beh-pressure",
    "Judgement",
    "Tell us about an important decision you made under time pressure.",
    "LONG_TEXT",
  ),
  question(
    "beh-customer",
    "Service",
    "Describe a time you improved an outcome for a customer or stakeholder.",
    "LONG_TEXT",
  ),
  question(
    "beh-inclusive",
    "Inclusion",
    "Give an example of making it easier for different perspectives to be heard.",
    "LONG_TEXT",
  ),
  question(
    "beh-ambiguity",
    "Problem solving",
    "Describe a situation where the goal or instructions were unclear.",
    "LONG_TEXT",
  ),
  question(
    "beh-team",
    "Teamwork",
    "Tell us about a team outcome and your specific contribution to it.",
    "LONG_TEXT",
  ),
  question(
    "beh-quality",
    "Standards",
    "Describe a time you protected quality when others wanted to move faster.",
    "LONG_TEXT",
  ),
  question(
    "beh-change",
    "Adaptability",
    "Give an example of successfully adopting a new process or technology.",
    "LONG_TEXT",
  ),
];

const cognitiveAptitudeQuestions: QuestionDefinition[] = [
  cognitive(
    "cog-num-percent",
    "Numerical reasoning",
    "A team completes 84 of 120 tasks. What percentage is complete?",
    ["60%", "65%", "70%", "75%"],
    "70%",
    1,
  ),
  cognitive(
    "cog-num-rate",
    "Numerical reasoning",
    "Four workers complete 240 units in six hours at an equal rate. How many units does each worker complete per hour?",
    ["8", "10", "12", "15"],
    "10",
    2,
  ),
  cognitive(
    "cog-num-change",
    "Data interpretation",
    "Weekly defects fell from 40 to 26. By what percentage did defects decrease?",
    ["14%", "26%", "35%", "54%"],
    "35%",
    2,
  ),
  cognitive(
    "cog-verbal-inference",
    "Verbal reasoning",
    "All approved requests have a reference number. This request has no reference number. Which conclusion is supported?",
    ["It is approved", "It is not approved", "It was submitted today", "No conclusion is possible"],
    "It is not approved",
    2,
  ),
  cognitive(
    "cog-verbal-policy",
    "Instruction following",
    "A policy says incidents must be reported immediately and documented before the end of shift. What should happen first?",
    [
      "Complete the document",
      "Report the incident",
      "Wait for a manager",
      "Finish the current task",
    ],
    "Report the incident",
    1,
  ),
  cognitive(
    "cog-logic-sequence",
    "Logical reasoning",
    "What comes next: 3, 6, 12, 24, ?",
    ["30", "36", "42", "48"],
    "48",
    1,
  ),
  cognitive(
    "cog-logic-alternating",
    "Logical reasoning",
    "What comes next: 2, 5, 4, 7, 6, 9, ?",
    ["7", "8", "10", "11"],
    "8",
    2,
  ),
  cognitive(
    "cog-order-dependency",
    "Process reasoning",
    "Task B must follow A. Task D must follow C. A must finish before C. Which order is valid?",
    ["A, C, D, B", "A, B, C, D", "C, D, A, B", "B, A, C, D"],
    "A, B, C, D",
    2,
  ),
  cognitive(
    "cog-detail-code",
    "Attention to detail",
    "Which code exactly matches AB7-19Q-X4?",
    ["AB7-19Q-X4", "AB7-19O-X4", "AB7-91Q-X4", "AB7-19Q-4X"],
    "AB7-19Q-X4",
    1,
  ),
  cognitive(
    "cog-detail-total",
    "Error detection",
    "An invoice lists $18, $27, $35 and a total of $79. What is the issue?",
    ["No issue", "The total is $1 too low", "The total is $1 too high", "The total is $2 too low"],
    "The total is $1 too low",
    1,
  ),
  cognitive(
    "cog-priority-safety",
    "Prioritisation",
    "You notice an immediate safety hazard while an important deadline is approaching. What is the best first action?",
    [
      "Continue until the deadline",
      "Control or escalate the hazard",
      "Email about it tomorrow",
      "Ask a colleague to ignore it",
    ],
    "Control or escalate the hazard",
    1,
  ),
  cognitive(
    "cog-priority-impact",
    "Prioritisation",
    "Two tasks are equally urgent. One blocks five colleagues; the other affects only your own work. What should normally be addressed first?",
    [
      "Your own task",
      "The task blocking five colleagues",
      "Whichever is easier",
      "Neither until instructed",
    ],
    "The task blocking five colleagues",
    2,
  ),
  cognitive(
    "cog-estimate-area",
    "Estimation",
    "A rectangular area is 8 metres by 5 metres. What is its area?",
    ["13 m²", "26 m²", "40 m²", "80 m²"],
    "40 m²",
    1,
  ),
  cognitive(
    "cog-mechanical-gear",
    "Mechanical reasoning",
    "If a driving gear rotates clockwise, a directly connected gear rotates in which direction?",
    ["Clockwise", "Counter-clockwise", "It does not move", "Direction cannot be determined"],
    "Counter-clockwise",
    1,
  ),
  cognitive(
    "cog-spatial-turn",
    "Spatial reasoning",
    "You face north, turn right, then turn 180 degrees. Which direction are you facing?",
    ["North", "South", "East", "West"],
    "West",
    1,
  ),
  cognitive(
    "cog-data-average",
    "Data interpretation",
    "Output over four days is 18, 22, 20 and 24 units. What is the average?",
    ["20", "21", "22", "23"],
    "21",
    1,
  ),
  cognitive(
    "cog-data-ratio",
    "Data interpretation",
    "A mix uses two parts concentrate to five parts water. How much water is needed for six litres of concentrate?",
    ["10 L", "12 L", "15 L", "18 L"],
    "15 L",
    2,
  ),
  cognitive(
    "cog-logic-constraint",
    "Critical reasoning",
    "No temporary staff may approve expenses. Some project members are temporary staff. Which statement must be true?",
    [
      "No project member may approve expenses",
      "Some project members may not approve expenses",
      "All permanent staff approve expenses",
      "Temporary staff manage the project",
    ],
    "Some project members may not approve expenses",
    3,
  ),
  cognitive(
    "cog-instruction-exception",
    "Reading comprehension",
    "Deliveries are accepted 9–4 except urgent medical supplies, which may arrive at any time. A medical delivery arrives at 6 pm. What applies?",
    ["Reject it", "Accept it", "Hold it until 9 am", "Return it without checking"],
    "Accept it",
    2,
  ),
  cognitive(
    "cog-pattern-difference",
    "Abstract reasoning",
    "Which number does not follow the same pattern: 16, 25, 36, 45, 49?",
    ["16", "25", "45", "49"],
    "45",
    2,
  ),
  cognitive(
    "cog-critical-schedule",
    "Critical reasoning",
    "A project can start only after both approval and funding. Approval is complete, but funding is pending. Which conclusion is valid?",
    [
      "The project can start",
      "The project cannot yet start",
      "Approval is invalid",
      "Funding is unnecessary",
    ],
    "The project cannot yet start",
    3,
  ),
  cognitive(
    "cog-multi-rate",
    "Numerical reasoning",
    "A machine produces 180 units in 45 minutes. At the same rate, how many units will three machines produce in two hours?",
    ["720", "960", "1,080", "1,440"],
    "1,440",
    3,
  ),
];

const technicalQuestions: QuestionDefinition[] = [
  question(
    "tech-approach",
    "Solution",
    "Explain your approach to the supplied role-specific practical task.",
    "LONG_TEXT",
  ),
  question(
    "tech-assumptions",
    "Reasoning",
    "What assumptions did you make, and how did you validate them?",
    "LONG_TEXT",
  ),
  question(
    "tech-tradeoffs",
    "Reasoning",
    "What trade-offs did you consider in your solution?",
    "LONG_TEXT",
  ),
  question(
    "tech-testing",
    "Quality",
    "How did you test or inspect the quality of your result?",
    "LONG_TEXT",
  ),
  question(
    "tech-security",
    "Risk",
    "What security, safety or compliance risks did you consider?",
    "LONG_TEXT",
  ),
  question(
    "tech-scale",
    "Scalability",
    "How would your solution change under substantially greater demand?",
    "LONG_TEXT",
  ),
  question(
    "tech-failure",
    "Resilience",
    "What could fail in your solution, and how would you detect it?",
    "LONG_TEXT",
  ),
  question(
    "tech-alternative",
    "Reasoning",
    "Describe an alternative approach and why you did not choose it.",
    "LONG_TEXT",
  ),
  question(
    "tech-maintain",
    "Maintainability",
    "How would another person safely maintain or extend this work?",
    "LONG_TEXT",
  ),
  question(
    "tech-limit",
    "Reflection",
    "Identify one limitation and how you would address it with more time.",
    "LONG_TEXT",
  ),
  question(
    "tech-requirement",
    "Requirements",
    "Which requirement had the greatest influence on your solution and why?",
    "LONG_TEXT",
  ),
  question(
    "tech-evidence",
    "Evidence",
    "What evidence demonstrates that your solution meets the expected outcome?",
    "LONG_TEXT",
  ),
  technical(
    "tech-software-dsa",
    "Data structures & algorithms",
    "Choose a suitable data structure for a high-volume lookup requirement and justify its complexity and trade-offs.",
    ["SOFTWARE"],
    ["JUNIOR", "MID", "SENIOR"],
  ),
  technical(
    "tech-software-debug",
    "Debugging",
    "A production service becomes slower after a release. Explain how you would isolate, verify and resolve the regression.",
    ["SOFTWARE"],
    ["JUNIOR", "MID", "SENIOR"],
  ),
  technical(
    "tech-software-code",
    "Code quality",
    "Describe how you would assess whether unfamiliar code is safe to change.",
    ["SOFTWARE"],
    ["ENTRY", "JUNIOR", "MID", "SENIOR"],
  ),
  technical(
    "tech-software-test",
    "Testing",
    "Design a focused test strategy for a business-critical API change.",
    ["SOFTWARE"],
    ["JUNIOR", "MID", "SENIOR"],
  ),
  technical(
    "tech-software-system",
    "System design",
    "Design a reliable service for a rapidly growing workload. Explain boundaries, failure modes and observability.",
    ["SOFTWARE"],
    ["MID", "SENIOR", "EXECUTIVE"],
  ),
  technical(
    "tech-software-security",
    "Security",
    "Identify the main security risks in a user-authenticated web application and how you would mitigate them.",
    ["SOFTWARE"],
    ["MID", "SENIOR"],
  ),
];

const aiInterviewQuestions: QuestionDefinition[] = [
  question(
    "ai-experience",
    "Experience",
    "Walk through the experience most relevant to this {{jobTitle}} position.",
    "LONG_TEXT",
  ),
  question(
    "ai-motivation",
    "Motivation",
    "What attracted you to this role and {{companyName}}?",
    "LONG_TEXT",
  ),
  question(
    "ai-decision",
    "Judgement",
    "Describe a complex decision and the evidence you used.",
    "LONG_TEXT",
  ),
  question(
    "ai-collaboration",
    "Collaboration",
    "How do you collaborate with people from different disciplines?",
    "LONG_TEXT",
  ),
  question(
    "ai-priority",
    "Planning",
    "How do you decide what to prioritise when several tasks are urgent?",
    "LONG_TEXT",
  ),
  question(
    "ai-stakeholder",
    "Communication",
    "Describe communicating an unwelcome decision to a stakeholder.",
    "LONG_TEXT",
  ),
  question(
    "ai-growth",
    "Learning",
    "What capability are you currently developing, and how?",
    "LONG_TEXT",
  ),
  question(
    "ai-impact",
    "Evidence",
    "Which professional outcome are you most proud of, and what was your contribution?",
    "LONG_TEXT",
  ),
  question(
    "ai-values",
    "Working preferences",
    "What working conditions help you perform consistently?",
    "LONG_TEXT",
  ),
  question(
    "ai-first90",
    "Planning",
    "What would you seek to understand during your first 90 days?",
    "LONG_TEXT",
  ),
  question(
    "ai-challenge",
    "Self-awareness",
    "Which aspect of this role would challenge you most?",
    "LONG_TEXT",
  ),
  question(
    "ai-questions",
    "Candidate questions",
    "What would you like to ask the hiring team?",
    "LONG_TEXT",
  ),
];

const finalReviewQuestions: QuestionDefinition[] = [
  question(
    "final-eligibility",
    "Eligibility",
    "Are all published mandatory eligibility checks supported by evidence?",
    "SINGLE_SELECT",
    ["Yes", "No", "Needs review"],
  ),
  question(
    "final-essential",
    "Evidence",
    "Does the evidence meet each published essential criterion?",
    "SINGLE_SELECT",
    ["Yes", "No", "Needs review"],
  ),
  question(
    "final-confidence",
    "Model risk",
    "Were any model outputs low-confidence, inconsistent or disputed?",
    "SINGLE_SELECT",
    ["No", "Yes—reviewed", "Yes—review required"],
  ),
  question(
    "final-human",
    "Governance",
    "Has an authorised human reviewed the complete evidence pack?",
    "SINGLE_SELECT",
    ["Yes", "No"],
  ),
  question(
    "final-adjustment",
    "Fairness",
    "Were requested reasonable adjustments applied without affecting the score?",
    "SINGLE_SELECT",
    ["Yes", "No", "Not applicable"],
  ),
  question(
    "final-consistency",
    "Fairness",
    "Was the same published rubric applied to all candidates?",
    "SINGLE_SELECT",
    ["Yes", "No", "Needs review"],
  ),
  question(
    "final-override",
    "Governance",
    "Does any automated recommendation require a documented human override?",
    "LONG_TEXT",
  ),
  question(
    "final-strength",
    "Evidence",
    "Summarise the strongest job-related evidence for this candidate.",
    "LONG_TEXT",
  ),
  question(
    "final-gap",
    "Evidence",
    "Summarise any material evidence gap against the published criteria.",
    "LONG_TEXT",
  ),
  question(
    "final-comparison",
    "Governance",
    "Confirm the decision is based on criteria rather than protected attributes or candidate similarity.",
    "SINGLE_SELECT",
    ["Confirmed", "Cannot confirm—review required"],
  ),
  question(
    "final-feedback",
    "Feedback",
    "What specific, job-related feedback can be provided to the candidate?",
    "LONG_TEXT",
  ),
  question(
    "final-decision",
    "Decision",
    "Should the candidate proceed to the company face-to-face interview? Explain the evidence.",
    "LONG_TEXT",
  ),
];

export const assessmentQuestionBanks: Record<StageType, readonly QuestionDefinition[]> = {
  PRE_SCREEN: preScreenQuestions,
  SKILL_VERIFICATION: [...skillVerificationQuestions, ...behaviouralQuestions],
  BEHAVIOURAL: [...skillVerificationQuestions, ...behaviouralQuestions],
  COGNITIVE_APTITUDE: cognitiveAptitudeQuestions,
  TECHNICAL: technicalQuestions,
  AI_INTERVIEW: aiInterviewQuestions,
  FINAL_REVIEW: finalReviewQuestions,
};

/** Selects and snapshots 9–10 questions from one phase bank, always including recruiter questions. */
export function selectAssessmentQuestions(
  stageType: StageType,
  context: QuestionContext,
  recruiterQuestions: string[] = [],
  randomInteger: (minimum: number, maximum: number) => number = randomInt,
  requestedCount?: number,
): AssessmentQuestion[] {
  const targetCount =
    stageType === "COGNITIVE_APTITUDE"
      ? Math.min(20, Math.max(10, requestedCount ?? 15))
      : randomInteger(9, 11);
  const custom = recruiterQuestions
    .map((prompt) => prompt.trim())
    .filter(Boolean)
    .slice(0, targetCount)
    .map((prompt, index) => ({
      id: `recruiter-${index + 1}`,
      category: "Recruiter question",
      prompt: interpolate(prompt, context),
      answerType: "LONG_TEXT" as const,
      required: true,
      source: "RECRUITER" as const,
    }));
  const applicableBank = assessmentQuestionBanks[stageType].filter(
    (item) =>
      (!item.jobFamilies || item.jobFamilies.includes(context.jobFamily)) &&
      (!item.experienceLevels || item.experienceLevels.includes(context.experienceLevel)),
  );
  const available =
    stageType === "COGNITIVE_APTITUDE"
      ? selectBalancedCognitive(applicableBank, targetCount - custom.length, randomInteger)
      : stageType === "TECHNICAL"
        ? selectTechnicalQuestions(
            applicableBank,
            targetCount - custom.length,
            context.jobFamily,
            randomInteger,
          )
        : shuffle([...applicableBank], randomInteger);
  const bankQuestions = available
    .slice(0, targetCount - custom.length)
    .map((item): AssessmentQuestion => ({
      id: item.id,
      category: item.category,
      prompt: interpolate(item.prompt, context),
      answerType: item.answerType,
      options: item.options,
      required: item.required,
      difficulty: item.difficulty,
      source: "QUESTION_BANK",
    }));
  return shuffle([...custom, ...bankQuestions], randomInteger);
}

/** Scores objective cognitive answers without exposing answer keys in the candidate payload. */
export function scoreCognitiveAnswers(
  questions: AssessmentQuestion[],
  answers: Record<string, string>,
): { score: number; correct: number; total: number; categoryScores: Record<string, number> } {
  const definitions = new Map(cognitiveAptitudeQuestions.map((item) => [item.id, item]));
  const scored = questions.flatMap((selected) => {
    const definition = definitions.get(selected.id);
    return definition?.correctAnswer
      ? [
          {
            category: definition.category,
            correct: answers[selected.id] === definition.correctAnswer,
          },
        ]
      : [];
  });
  const categories = [...new Set(scored.map(({ category }) => category))];
  const categoryScores = Object.fromEntries(
    categories.map((category) => {
      const items = scored.filter((item) => item.category === category);
      return [category, percentage(items.filter((item) => item.correct).length, items.length)];
    }),
  );
  const correct = scored.filter((item) => item.correct).length;
  return {
    score: percentage(correct, scored.length),
    correct,
    total: scored.length,
    categoryScores,
  };
}

function question(
  id: string,
  category: string,
  prompt: string,
  answerType: AssessmentAnswerType,
  options?: string[],
): QuestionDefinition {
  return { id, category, prompt, answerType, options, required: true };
}

function cognitive(
  id: string,
  category: string,
  prompt: string,
  options: string[],
  correctAnswer: string,
  difficulty: 1 | 2 | 3,
): QuestionDefinition {
  return {
    id,
    category,
    prompt,
    answerType: "SINGLE_SELECT",
    options,
    correctAnswer,
    difficulty,
    required: true,
  };
}

function technical(
  id: string,
  category: string,
  prompt: string,
  jobFamilies: string[],
  experienceLevels: string[],
): QuestionDefinition {
  return {
    id,
    category,
    prompt,
    answerType: "LONG_TEXT",
    required: true,
    jobFamilies,
    experienceLevels,
  };
}

/** Maps job titles and skills to a stable technical question-bank family. */
export function inferJobFamily(jobTitle: string, skills: string[]): string {
  const text = `${jobTitle} ${skills.join(" ")}`.toLowerCase();
  if (/software|developer|programmer|engineer|typescript|javascript|python|react|java\b/.test(text))
    return "SOFTWARE";
  if (/construction|carpenter|electrician|plumb|trade|builder/.test(text)) return "TRADES";
  if (/hospitality|chef|cook|barista|restaurant|hotel/.test(text)) return "HOSPITALITY";
  if (/farm|agricultur|livestock|crop/.test(text)) return "AGRICULTURE";
  if (/account|finance|analyst|bookkeep/.test(text)) return "FINANCE";
  return "GENERAL";
}

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 10_000) / 100;
}

function interpolate(prompt: string, context: QuestionContext): string {
  return prompt.replace(/{{(jobTitle|companyName|primarySkill|location|workMode)}}/g, (_, key) =>
    String(context[key as keyof QuestionContext]),
  );
}

function shuffle<T>(items: T[], randomInteger: (minimum: number, maximum: number) => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index + 1);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function selectBalancedCognitive(
  items: readonly QuestionDefinition[],
  count: number,
  randomInteger: (minimum: number, maximum: number) => number,
): QuestionDefinition[] {
  const foundationalCount = Math.round(count * 0.3);
  const challengingCount = Math.round(count * 0.2);
  const roleLevelCount = count - foundationalCount - challengingCount;
  const selected = [
    ...shuffle(
      items.filter(({ difficulty }) => difficulty === 1),
      randomInteger,
    ).slice(0, foundationalCount),
    ...shuffle(
      items.filter(({ difficulty }) => difficulty === 2),
      randomInteger,
    ).slice(0, roleLevelCount),
    ...shuffle(
      items.filter(({ difficulty }) => difficulty === 3),
      randomInteger,
    ).slice(0, challengingCount),
  ];
  if (selected.length < count) {
    const used = new Set(selected.map(({ id }) => id));
    selected.push(
      ...shuffle(
        items.filter(({ id }) => !used.has(id)),
        randomInteger,
      ).slice(0, count - selected.length),
    );
  }
  return shuffle(selected, randomInteger);
}

function selectTechnicalQuestions(
  items: readonly QuestionDefinition[],
  count: number,
  jobFamily: string,
  randomInteger: (minimum: number, maximum: number) => number,
): QuestionDefinition[] {
  const specialised = shuffle(
    items.filter(({ jobFamilies }) => jobFamilies?.includes(jobFamily)),
    randomInteger,
  );
  const general = shuffle(
    items.filter(({ jobFamilies }) => !jobFamilies),
    randomInteger,
  );
  const specialisedCount = Math.min(specialised.length, Math.ceil(count * 0.6));
  return shuffle(
    [...specialised.slice(0, specialisedCount), ...general.slice(0, count - specialisedCount)],
    randomInteger,
  );
}
