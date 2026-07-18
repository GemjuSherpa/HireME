export type CandidateEligibilityProfile = {
  workModes: string[];
  location: string | null;
  workRights: string | null;
  highestEducation: string | null;
};

export type JobEligibilityRequirements = {
  workMode: string;
  location: string | null;
  workRightsRequirement: string | null;
  requiredEducation: string | null;
  sponsorship: boolean;
};

export type EligibilityResult = { eligible: boolean; checks: Record<string, string> };

const EDUCATION_LEVELS: Readonly<Record<string, number>> = {
  NONE: 0,
  HIGH_SCHOOL: 1,
  CERTIFICATE: 2,
  DIPLOMA: 3,
  BACHELOR: 4,
  MASTER: 5,
  PHD: 6,
};

/**
 * Applies lawful hard filters before candidate ranking.
 *
 * @param candidate Candidate preferences and verifiable eligibility attributes.
 * @param job Published job constraints.
 * @returns Overall eligibility plus an explanation for every evaluated filter.
 */
export function evaluateCandidateEligibility(
  candidate: CandidateEligibilityProfile,
  job: JobEligibilityRequirements,
): EligibilityResult {
  const checks: Record<string, string> = {};
  const workModeMatches = candidate.workModes.includes(job.workMode);
  checks.workMode = workModeMatches
    ? "Matched"
    : "Candidate preference does not include this arrangement";

  const jobCity = job.location?.split(",")[0]?.trim().toLowerCase();
  const candidateLocation = candidate.location?.toLowerCase() ?? "";
  const locationMatches =
    job.workMode === "REMOTE" || !jobCity || candidateLocation.includes(jobCity);
  checks.location = locationMatches ? "Matched" : "Outside the required location";

  const rightsRequirement = job.workRightsRequirement ?? "GLOBAL";
  const knownRights = candidate.workRights;
  const workRightsMatch =
    rightsRequirement === "GLOBAL" ||
    !knownRights ||
    knownRights === "OTHER" ||
    knownRights === "AU_UNRESTRICTED" ||
    (rightsRequirement === "AU_VALID_VISA" && knownRights === "AU_VALID_VISA") ||
    (job.sponsorship && knownRights === "REQUIRES_SPONSORSHIP");
  checks.workRights =
    !knownRights || knownRights === "OTHER"
      ? "Verification required during pre-screen"
      : workRightsMatch
        ? "Matched"
        : "Does not meet requirement";

  const requiredLevel = EDUCATION_LEVELS[job.requiredEducation ?? "NONE"] ?? 0;
  const candidateLevel = candidate.highestEducation
    ? EDUCATION_LEVELS[candidate.highestEducation]
    : undefined;
  const educationMatches = candidateLevel === undefined || candidateLevel >= requiredLevel;
  checks.education =
    candidateLevel === undefined
      ? "Verification required during pre-screen"
      : educationMatches
        ? "Matched"
        : "Below minimum requirement";

  return {
    eligible: workModeMatches && locationMatches && workRightsMatch && educationMatches,
    checks,
  };
}
