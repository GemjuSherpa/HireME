export type MatchCandidate = {
  skills: { name: string; proficiency: number; verified: boolean }[];
  desiredTitles: string[];
  workModes: string[];
  yearsExperience: number;
};
export type MatchJob = {
  title: string;
  workMode: string;
  experienceYears: number;
  skills: { name: string; weight: number; required: boolean }[];
};

/**
 * Produces the deterministic fallback match score used when the ML ranker is unavailable.
 * Protected attributes are deliberately absent from both inputs.
 */
export function calculateMatch(candidate: MatchCandidate, job: MatchJob) {
  const skills = new Map(candidate.skills.map((s) => [s.name.toLowerCase(), s]));
  const totalWeight = job.skills.reduce((sum, s) => sum + s.weight, 0) || 1;
  let earned = 0;
  const reasons: string[] = [];
  const missingRequired: string[] = [];
  for (const requirement of job.skills) {
    const found = skills.get(requirement.name.toLowerCase());
    if (found) {
      const proofBoost = found.verified ? 1 : 0.9;
      earned += requirement.weight * Math.min(found.proficiency / 3, 1) * proofBoost;
      if (found.verified) reasons.push(`Verified ${requirement.name}`);
    } else if (requirement.required) missingRequired.push(requirement.name);
  }
  const skillScore = (earned / totalWeight) * 70;
  const preferenceScore = candidate.desiredTitles.some((t) =>
    job.title.toLowerCase().includes(t.toLowerCase()),
  )
    ? 15
    : 8;
  const modeScore = candidate.workModes.includes(job.workMode) ? 10 : 0;
  const experienceScore =
    Math.min(candidate.yearsExperience / Math.max(job.experienceYears, 1), 1) * 5;
  const penalty = missingRequired.length * 12;
  return {
    score: Math.max(
      0,
      Math.min(
        100,
        Math.round(skillScore + preferenceScore + modeScore + experienceScore - penalty),
      ),
    ),
    reasons,
    missingRequired,
  };
}
