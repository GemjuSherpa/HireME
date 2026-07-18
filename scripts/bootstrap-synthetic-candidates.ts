import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient, UserRole, Visibility } from "@prisma/client";
import { hashPassword } from "../lib/security";

const prisma = new PrismaClient();
const MIGRATION_KEY = "synthetic-candidates";
const VERSION = "faker-au-v1";
const TARGET = 10_000;
const BATCH = 500;
export const SYNTHETIC_PASSWORD = "HireME-Mock-2026!";
const roles = [
  ["Software Engineer", ["JavaScript", "TypeScript", "React", "Node.js", "Testing", "Git"]],
  ["Backend Engineer", ["Python", "FastAPI", "PostgreSQL", "System design", "Docker", "AWS"]],
  [
    "Machine Learning Engineer",
    ["Python", "Machine learning", "PyTorch", "Data science", "SQL", "MLOps"],
  ],
  ["Data Analyst", ["SQL", "Python", "Tableau", "Statistics", "Data visualisation", "Excel"]],
  [
    "Product Designer",
    ["Figma", "User research", "Product design", "Accessibility", "Design systems", "Prototyping"],
  ],
  [
    "Product Manager",
    [
      "Product strategy",
      "Roadmapping",
      "User research",
      "Analytics",
      "Stakeholder management",
      "Agile",
    ],
  ],
  ["DevOps Engineer", ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD", "Observability"]],
  [
    "Cyber Security Analyst",
    ["Cyber security", "Threat modelling", "SIEM", "Incident response", "Cloud security", "Risk"],
  ],
  [
    "Business Analyst",
    [
      "Requirements analysis",
      "Process mapping",
      "SQL",
      "Stakeholder management",
      "Agile",
      "Documentation",
    ],
  ],
  [
    "Marketing Specialist",
    ["Digital marketing", "SEO", "Content strategy", "Analytics", "CRM", "Campaign management"],
  ],
  ["Finance Analyst", ["Financial modelling", "Excel", "Forecasting", "SQL", "Reporting", "Risk"]],
  [
    "Human Resources Advisor",
    ["Employee relations", "Recruitment", "HRIS", "Policy", "Coaching", "Workplace law"],
  ],
] as const;
const locations = [
  "Melbourne, Australia",
  "Sydney, Australia",
  "Brisbane, Australia",
  "Perth, Australia",
  "Adelaide, Australia",
  "Canberra, Australia",
  "Hobart, Australia",
  "Darwin, Australia",
  "Geelong, Australia",
  "Newcastle, Australia",
];
const educationLevels = ["HIGH_SCHOOL", "CERTIFICATE", "DIPLOMA", "BACHELOR", "MASTER", "PHD"];
const modes = ["REMOTE", "HYBRID", "ONSITE"];

async function main() {
  const existing = await prisma.dataMigration.findUnique({ where: { key: MIGRATION_KEY } });
  if (existing?.version === VERSION && existing.recordsCreated === TARGET) {
    console.log(
      `[bootstrap] ${TARGET} synthetic candidates already present (${VERSION}); skipped.`,
    );
    return;
  }
  if (existing) {
    await prisma.user.deleteMany({
      where: { isSynthetic: true, candidate: { syntheticDatasetVersion: VERSION } },
    });
    await prisma.dataMigration.delete({ where: { key: MIGRATION_KEY } });
  }
  try {
    await prisma.dataMigration.create({
      data: {
        key: MIGRATION_KEY,
        version: VERSION,
        metadata: {
          status: "running",
          target: TARGET,
          generator: "@faker-js/faker 10.1.0",
          seed: 20260717,
        },
      },
    });
  } catch {
    console.log("[bootstrap] migration already running; skipped.");
    return;
  }
  faker.seed(20260717);
  const passwordHash = await hashPassword(SYNTHETIC_PASSWORD);
  const allSkills = [...new Set(roles.flatMap((role) => [...role[1]]))];
  for (const name of allSkills)
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, category: "Synthetic training taxonomy" },
    });
  const skillRows = await prisma.skill.findMany({ where: { name: { in: allSkills } } });
  const skillIds = new Map(skillRows.map((skill) => [skill.name, skill.id]));
  for (let offset = 0; offset < TARGET; offset += BATCH) {
    const users: Prisma.UserCreateManyInput[] = [];
    const profiles: Prisma.CandidateProfileCreateManyInput[] = [];
    const candidateSkills: Prisma.CandidateSkillCreateManyInput[] = [];
    const experiences: Prisma.ExperienceCreateManyInput[] = [];
    const education: Prisma.EducationCreateManyInput[] = [];
    const projects: Prisma.ProjectCreateManyInput[] = [];
    for (let index = offset; index < Math.min(offset + BATCH, TARGET); index++) {
      const serial = String(index + 1).padStart(5, "0"),
        userId = `syn-user-${VERSION}-${serial}`,
        candidateId = `syn-candidate-${VERSION}-${serial}`;
      const [roleTitle, roleSkills] = faker.helpers.arrayElement(roles);
      const seniority = faker.helpers.arrayElement(["Junior", "Mid-level", "Senior", "Lead"]);
      const headline = `${seniority} ${roleTitle}`;
      const selectedSkills = faker.helpers.arrayElements([...roleSkills], { min: 3, max: 6 });
      const location = faker.helpers.arrayElement(locations);
      const workModes = faker.helpers.arrayElements(modes, { min: 1, max: 3 });
      const years =
        seniority === "Junior"
          ? faker.number.int({ min: 0, max: 2 })
          : seniority === "Mid-level"
            ? faker.number.int({ min: 2, max: 5 })
            : seniority === "Senior"
              ? faker.number.int({ min: 5, max: 10 })
              : faker.number.int({ min: 8, max: 18 });
      const educationLevel = faker.helpers.arrayElement(educationLevels);
      users.push({
        id: userId,
        email: `candidate.${serial}@synthetic.hireme.test`,
        emailVerifiedAt: new Date(),
        passwordHash,
        name: faker.person.fullName(),
        role: UserRole.CANDIDATE,
        isSynthetic: true,
      });
      profiles.push({
        id: candidateId,
        userId,
        headline,
        bio: `${headline} with ${years} years of experience delivering ${faker.company.buzzPhrase().toLowerCase()}. Evidence includes ${selectedSkills.slice(0, 3).join(", ")}.`,
        location,
        timezone: location.startsWith("Perth")
          ? "Australia/Perth"
          : location.startsWith("Adelaide")
            ? "Australia/Adelaide"
            : "Australia/Melbourne",
        seekingStatus: faker.helpers.weightedArrayElement([
          { value: "ACTIVELY_LOOKING", weight: 55 },
          { value: "OPEN_TO_OFFERS", weight: 40 },
          { value: "NOT_LOOKING", weight: 5 },
        ]),
        workModes,
        workTypes: faker.helpers.arrayElements(["FULL_TIME", "PART_TIME", "CONTRACT", "CASUAL"], {
          min: 1,
          max: 2,
        }),
        desiredTitles: [headline, roleTitle],
        expectedSalaryMin: 70000 + years * 7000 + faker.number.int({ min: 0, max: 20000 }),
        expectedSalaryMax: 95000 + years * 8500 + faker.number.int({ min: 0, max: 25000 }),
        salaryVisible: faker.datatype.boolean(0.35),
        visibility: Visibility.ANONYMOUS,
        availableFrom: faker.date.soon({ days: 120 }),
        workRights: faker.helpers.weightedArrayElement([
          { value: "AU_UNRESTRICTED", weight: 72 },
          { value: "AU_VALID_VISA", weight: 16 },
          { value: "REQUIRES_SPONSORSHIP", weight: 8 },
          { value: "OTHER", weight: 4 },
        ]),
        highestEducation: educationLevel,
        syntheticDatasetVersion: VERSION,
        careerGoal: `Progress into a ${faker.helpers.arrayElement(["senior specialist", "technical leadership", "people leadership", "cross-functional"])} role.`,
        careerHighlights: [faker.company.catchPhrase(), faker.company.catchPhrase()],
        profileScore: faker.number.int({ min: 58, max: 100 }),
      });
      selectedSkills.forEach((name, skillIndex) =>
        candidateSkills.push({
          candidateId,
          skillId: skillIds.get(name)!,
          proficiency: faker.number.int({ min: 2, max: 5 }),
          verified: skillIndex < 2 && faker.datatype.boolean(0.55),
          verifiedAt: skillIndex < 2 ? faker.date.past({ years: 2 }) : null,
        }),
      );
      experiences.push({
        id: `syn-exp-${VERSION}-${serial}`,
        candidateId,
        company: faker.company.name(),
        title: headline,
        startDate: new Date(
          new Date().getFullYear() - Math.max(1, years),
          faker.number.int({ min: 0, max: 11 }),
          1,
        ),
        endDate: null,
        achievements: [
          `Improved ${faker.helpers.arrayElement(["delivery time", "reliability", "customer satisfaction", "conversion", "operational efficiency"])} by ${faker.number.int({ min: 8, max: 45 })}%`,
          faker.company.catchPhrase(),
        ],
        verified: faker.datatype.boolean(0.32),
        verificationLocked: false,
      });
      education.push({
        id: `syn-edu-${VERSION}-${serial}`,
        candidateId,
        institution: faker.helpers.arrayElement([
          "University of Melbourne",
          "RMIT University",
          "Monash University",
          "UNSW Sydney",
          "University of Queensland",
          "TAFE NSW",
          "Deakin University",
          "Curtin University",
        ]),
        qualification: educationLabel(educationLevel),
        fieldOfStudy: faker.helpers.arrayElement([
          "Computer Science",
          "Business",
          "Design",
          "Engineering",
          "Data Science",
          "Marketing",
          "Finance",
          "Psychology",
        ]),
        startYear: 2010 + faker.number.int({ min: 0, max: 10 }),
        endYear: 2014 + faker.number.int({ min: 0, max: 10 }),
        verified: faker.datatype.boolean(0.25),
      });
      projects.push({
        id: `syn-project-${VERSION}-${serial}`,
        candidateId,
        title: faker.company.catchPhrase(),
        description: `A ${faker.helpers.arrayElement(["customer-facing", "data-driven", "cloud-based", "accessible", "automation"])} project demonstrating ${selectedSkills.slice(0, 2).join(" and ")}.`,
        url: null,
        tags: selectedSkills.slice(0, 3),
        source: "synthetic-faker",
      });
    }
    await prisma.$transaction([
      prisma.user.createMany({ data: users, skipDuplicates: true }),
      prisma.candidateProfile.createMany({ data: profiles, skipDuplicates: true }),
      prisma.candidateSkill.createMany({ data: candidateSkills, skipDuplicates: true }),
      prisma.experience.createMany({ data: experiences, skipDuplicates: true }),
      prisma.education.createMany({ data: education, skipDuplicates: true }),
      prisma.project.createMany({ data: projects, skipDuplicates: true }),
    ]);
    const count = Math.min(offset + BATCH, TARGET);
    await prisma.dataMigration.update({
      where: { key: MIGRATION_KEY },
      data: {
        recordsCreated: count,
        metadata: {
          status: "running",
          target: TARGET,
          lastBatch: count,
          generator: "@faker-js/faker 10.1.0",
          seed: 20260717,
        },
      },
    });
    console.log(`[bootstrap] synthetic candidates ${count}/${TARGET}`);
  }
  await prisma.dataMigration.update({
    where: { key: MIGRATION_KEY },
    data: {
      recordsCreated: TARGET,
      metadata: {
        status: "complete",
        target: TARGET,
        generator: "@faker-js/faker 10.1.0",
        seed: 20260717,
        password: SYNTHETIC_PASSWORD,
      },
    },
  });
  console.log(`[bootstrap] created ${TARGET} candidates; password: ${SYNTHETIC_PASSWORD}`);
}
function educationLabel(level: string) {
  return (
    {
      HIGH_SCHOOL: "Victorian Certificate of Education",
      CERTIFICATE: "Certificate IV",
      DIPLOMA: "Diploma",
      BACHELOR: "Bachelor Degree",
      MASTER: "Master Degree",
      PHD: "Doctor of Philosophy",
    } as Record<string, string>
  )[level];
}
main()
  .catch((error) => {
    console.error("[bootstrap] failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
