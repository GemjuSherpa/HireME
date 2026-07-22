type CandidateInput = {
  id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  workRights: string | null;
  highestEducation: string | null;
  workModes: string[];
  desiredTitles: string[];
  expectedSalaryMin: number | null;
  availableFrom: Date | null;
  skills: { proficiency: number; verified: boolean; skill: { name: string } }[];
  experiences: { startDate: Date; endDate: Date | null }[];
  projects?: { title: string; description: string }[];
};
type JobInput = {
  title: string;
  description: string;
  responsibilities: string | null;
  idealCandidate: string | null;
  location: string | null;
  workMode: string;
  experienceLevel: string;
  workRightsRequirement: string | null;
  requiredEducation: string | null;
  sponsorship: boolean;
  salaryMax: number | null;
  skills: { weight: number; required: boolean; skill: { name: string } }[];
};
export type HybridResult = {
  candidate_id: string;
  eligible: boolean;
  score: number;
  confidence: number;
  model_version: string;
  filter_checks: Record<string, string>;
  evidence: {
    missing_required_skills: string[];
    matched_skills: Record<string, string | number | boolean>[];
  };
  top_factors: { factor: string; value: number }[];
  human_review_required: boolean;
};

/**
 * Requests ranked candidates from the optional Python service.
 * Returns `null` on configuration or network failure so callers can use the audited fallback.
 */
export async function rankWithMatchingService(candidates: CandidateInput[], job: JobInput) {
  const url = process.env.MATCHING_SERVICE_URL;
  if (!url) return null;
  const payload = {
    job: {
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities ?? "",
      ideal_candidate: job.idealCandidate ?? "",
      location: job.location,
      work_mode: job.workMode,
      experience_years: experienceYears(job.experienceLevel),
      work_rights: job.workRightsRequirement ?? "GLOBAL",
      required_education: job.requiredEducation ?? "NONE",
      sponsorship: job.sponsorship,
      salary_max: job.salaryMax,
      skills: job.skills.map((x) => ({
        name: x.skill.name,
        weight: x.weight,
        required: x.required,
      })),
    },
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      summary: [candidate.headline, candidate.bio].filter(Boolean).join(". "),
      location: candidate.location,
      work_rights: candidate.workRights,
      education_level: candidate.highestEducation,
      work_modes: candidate.workModes,
      desired_titles: candidate.desiredTitles,
      expected_salary_min: candidate.expectedSalaryMin,
      available: !candidate.availableFrom || candidate.availableFrom <= new Date(),
      years_experience: candidate.experiences.reduce(
        (sum, item) =>
          sum +
          ((item.endDate ?? new Date()).getTime() - item.startDate.getTime()) / 31_557_600_000,
        0,
      ),
      skills: candidate.skills.map((x) => ({
        name: x.skill.name,
        proficiency: x.proficiency,
        verified: x.verified,
      })),
      projects: candidate.projects?.map((x) => `${x.title}: ${x.description}`) ?? [],
    })),
    limit: Math.min(candidates.length, 1000),
  };
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/v3/matches/rank`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Matching service returned ${response.status}`);
    const body = (await response.json()) as { results: HybridResult[] };
    return new Map(body.results.map((result) => [result.candidate_id, result]));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown matching service error";
    console.warn(`Hybrid matching service unavailable; using deterministic fallback: ${reason}`);
    return null;
  }
}
function experienceYears(level: string) {
  return (
    ({ ENTRY: 0, JUNIOR: 1, MID: 3, SENIOR: 5, EXECUTIVE: 10 } as Record<string, number>)[
      level.toUpperCase()
    ] ?? 3
  );
}
