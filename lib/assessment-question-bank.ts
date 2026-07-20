import { randomInt } from "node:crypto";
import type { StageType } from "@prisma/client";

export type AssessmentAnswerType = "LONG_TEXT" | "SHORT_TEXT" | "SINGLE_SELECT" | "DATE";

export type AssessmentQuestion = {
  id: string;
  category: string;
  prompt: string;
  answerType: AssessmentAnswerType;
  options?: string[];
  required: boolean;
  source: "QUESTION_BANK" | "RECRUITER";
};

type QuestionDefinition = Omit<AssessmentQuestion, "prompt" | "source"> & {
  prompt: string;
};

export type QuestionContext = {
  jobTitle: string;
  companyName: string;
  primarySkill: string;
  location: string;
  workMode: string;
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
  SKILL_VERIFICATION: skillVerificationQuestions,
  BEHAVIOURAL: behaviouralQuestions,
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
): AssessmentQuestion[] {
  const targetCount = randomInteger(9, 11);
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
  const available = shuffle([...assessmentQuestionBanks[stageType]], randomInteger);
  const bankQuestions = available.slice(0, targetCount - custom.length).map((item) => ({
    ...item,
    prompt: interpolate(item.prompt, context),
    source: "QUESTION_BANK" as const,
  }));
  return shuffle([...custom, ...bankQuestions], randomInteger);
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
