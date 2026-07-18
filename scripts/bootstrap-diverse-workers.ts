import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient, UserRole, Visibility } from "@prisma/client";
import { hashPassword } from "../lib/security";

const prisma = new PrismaClient();
const MIGRATION_KEY = "synthetic-diverse-workers";
const VERSION = "faker-au-frontline-v1";
const TARGET = 5_000;
const BATCH = 500;
const PASSWORD = "HireME-Mock-2026!";

const professions = [
  [
    "Commercial Cleaner",
    ["Commercial cleaning", "Chemical safety", "Floor care", "Time management", "Manual handling"],
  ],
  [
    "Housekeeper",
    ["Housekeeping", "Laundry", "Room servicing", "Hygiene standards", "Customer service"],
  ],
  [
    "Barista",
    ["Coffee preparation", "POS systems", "Food safety", "Customer service", "Cash handling"],
  ],
  [
    "Hospitality Team Member",
    ["Table service", "Food safety", "POS systems", "Customer service", "Teamwork"],
  ],
  [
    "Chef",
    ["Food preparation", "Menu planning", "Food safety", "Kitchen operations", "Stock control"],
  ],
  [
    "Farm Hand",
    ["Crop maintenance", "Livestock handling", "Farm machinery", "Irrigation", "Workplace safety"],
  ],
  [
    "Construction Labourer",
    ["Construction", "Power tools", "Site safety", "Manual handling", "White Card"],
  ],
  ["Carpenter", ["Carpentry", "Blueprint reading", "Power tools", "Framing", "Site safety"]],
  [
    "Electrician",
    [
      "Electrical installation",
      "Fault finding",
      "Wiring",
      "Electrical safety",
      "Blueprint reading",
    ],
  ],
  ["Plumber", ["Plumbing", "Pipe fitting", "Fault finding", "Drainage", "Workplace safety"]],
  ["Painter", ["Painting", "Surface preparation", "Colour matching", "Power tools", "Site safety"]],
  [
    "Landscape Gardener",
    ["Landscaping", "Horticulture", "Irrigation", "Power tools", "Plant care"],
  ],
  [
    "Warehouse Storeperson",
    ["Warehousing", "Forklift operation", "Inventory control", "Order picking", "Manual handling"],
  ],
  [
    "Delivery Driver",
    ["Route planning", "Safe driving", "Customer service", "Proof of delivery", "Manual handling"],
  ],
  [
    "Truck Driver",
    [
      "Heavy vehicle operation",
      "Load restraint",
      "Logbook compliance",
      "Route planning",
      "Vehicle inspection",
    ],
  ],
  [
    "Aged Care Worker",
    [
      "Personal care",
      "Medication assistance",
      "Infection control",
      "First aid",
      "Care documentation",
    ],
  ],
  [
    "Disability Support Worker",
    [
      "Disability support",
      "Personal care",
      "Positive behaviour support",
      "First aid",
      "Care documentation",
    ],
  ],
  [
    "Retail Assistant",
    ["Retail sales", "POS systems", "Merchandising", "Customer service", "Stock control"],
  ],
  [
    "Security Officer",
    [
      "Security operations",
      "Incident reporting",
      "Access control",
      "Conflict resolution",
      "First aid",
    ],
  ],
  [
    "Motor Mechanic",
    ["Vehicle servicing", "Diagnostics", "Mechanical repair", "Power tools", "Workplace safety"],
  ],
  [
    "Machine Operator",
    [
      "Machine operation",
      "Quality control",
      "Preventive maintenance",
      "Production reporting",
      "Workplace safety",
    ],
  ],
  [
    "Welder",
    ["MIG welding", "Metal fabrication", "Blueprint reading", "Grinding", "Workplace safety"],
  ],
  [
    "Early Childhood Educator",
    [
      "Early childhood education",
      "Child safeguarding",
      "Learning activities",
      "First aid",
      "Family communication",
    ],
  ],
  [
    "Receptionist",
    ["Reception", "Appointment scheduling", "Customer service", "Microsoft Office", "Data entry"],
  ],
] as const;

const locations = [
  "Melbourne, Australia",
  "Sydney, Australia",
  "Brisbane, Australia",
  "Perth, Australia",
  "Adelaide, Australia",
  "Geelong, Australia",
  "Newcastle, Australia",
  "Townsville, Australia",
  "Cairns, Australia",
  "Ballarat, Australia",
  "Bendigo, Australia",
  "Toowoomba, Australia",
  "Shepparton, Australia",
  "Mildura, Australia",
];
const institutions = [
  "TAFE NSW",
  "Holmesglen Institute",
  "RMIT University",
  "Chisholm Institute",
  "Kangan Institute",
  "TAFE Queensland",
  "South Metropolitan TAFE",
  "William Angliss Institute",
];

async function main() {
  const existing = await prisma.dataMigration.findUnique({ where: { key: MIGRATION_KEY } });
  if (existing?.version === VERSION && existing.recordsCreated === TARGET) {
    console.log(`[bootstrap] ${TARGET} diverse workers already present (${VERSION}); skipped.`);
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
        metadata: { status: "running", target: TARGET, seed: 20260718 },
      },
    });
  } catch {
    console.log("[bootstrap] diverse-worker migration already running; skipped.");
    return;
  }

  faker.seed(20260718);
  const passwordHash = await hashPassword(PASSWORD);
  const allSkills = [...new Set(professions.flatMap((profession) => [...profession[1]]))];
  for (const name of allSkills)
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, category: "Frontline and trade" },
    });
  const skills = await prisma.skill.findMany({ where: { name: { in: allSkills } } });
  const skillIds = new Map(skills.map((skill) => [skill.name, skill.id]));

  for (let offset = 0; offset < TARGET; offset += BATCH) {
    const users: Prisma.UserCreateManyInput[] = [],
      profiles: Prisma.CandidateProfileCreateManyInput[] = [],
      candidateSkills: Prisma.CandidateSkillCreateManyInput[] = [],
      experiences: Prisma.ExperienceCreateManyInput[] = [],
      education: Prisma.EducationCreateManyInput[] = [],
      projects: Prisma.ProjectCreateManyInput[] = [];
    for (let index = offset; index < Math.min(offset + BATCH, TARGET); index++) {
      const serial = String(index + 1).padStart(5, "0");
      const userId = `syn-user-${VERSION}-${serial}`,
        candidateId = `syn-candidate-${VERSION}-${serial}`;
      const [title, roleSkills] = faker.helpers.arrayElement(professions);
      const selectedSkills = faker.helpers.arrayElements([...roleSkills], { min: 3, max: 5 });
      const years = faker.number.int({ min: 0, max: 18 });
      const location = faker.helpers.arrayElement(locations);
      const educationLevel = faker.helpers.weightedArrayElement([
        { value: "HIGH_SCHOOL", weight: 32 },
        { value: "CERTIFICATE", weight: 38 },
        { value: "DIPLOMA", weight: 22 },
        { value: "BACHELOR", weight: 8 },
      ]);
      const qualification =
        educationLevel === "HIGH_SCHOOL"
          ? "Senior Secondary Certificate"
          : educationLevel === "CERTIFICATE"
            ? "Certificate III or IV"
            : educationLevel === "DIPLOMA"
              ? "Diploma"
              : "Bachelor Degree";
      const workTypes = faker.helpers.arrayElements(
        ["FULL_TIME", "PART_TIME", "CASUAL", "CONTRACT"],
        { min: 1, max: 3 },
      );
      users.push({
        id: userId,
        email: `worker.${serial}@synthetic.hireme.test`,
        emailVerifiedAt: new Date(),
        passwordHash,
        name: faker.person.fullName(),
        role: UserRole.CANDIDATE,
        isSynthetic: true,
      });
      profiles.push({
        id: candidateId,
        userId,
        headline: title,
        bio: `${title} with ${years} years of practical experience. Reliable, safety-conscious and experienced in ${selectedSkills.slice(0, 3).join(", ")}.`,
        location,
        timezone: location.startsWith("Perth")
          ? "Australia/Perth"
          : location.startsWith("Adelaide")
            ? "Australia/Adelaide"
            : "Australia/Melbourne",
        seekingStatus: faker.helpers.weightedArrayElement([
          { value: "ACTIVELY_LOOKING", weight: 65 },
          { value: "OPEN_TO_OFFERS", weight: 32 },
          { value: "NOT_LOOKING", weight: 3 },
        ]),
        workModes: faker.helpers.weightedArrayElement([
          { value: ["ONSITE"], weight: 88 },
          { value: ["ONSITE", "HYBRID"], weight: 10 },
          { value: ["HYBRID", "REMOTE"], weight: 2 },
        ]),
        workTypes,
        desiredTitles: [title],
        expectedSalaryMin: faker.number.int({ min: 45_000, max: 80_000 }),
        expectedSalaryMax: faker.number.int({ min: 82_000, max: 125_000 }),
        salaryVisible: faker.datatype.boolean(0.3),
        visibility: Visibility.ANONYMOUS,
        availableFrom: faker.date.soon({ days: 90 }),
        workRights: faker.helpers.weightedArrayElement([
          { value: "AU_UNRESTRICTED", weight: 78 },
          { value: "AU_VALID_VISA", weight: 17 },
          { value: "REQUIRES_SPONSORSHIP", weight: 5 },
        ]),
        highestEducation: educationLevel,
        syntheticDatasetVersion: VERSION,
        careerGoal: `Build a stable career and progress within ${title.toLowerCase()} work.`,
        careerHighlights: [
          `Maintained strong safety and attendance standards`,
          `Recognised for reliable service and teamwork`,
        ],
        profileScore: faker.number.int({ min: 55, max: 100 }),
      });
      selectedSkills.forEach((name, position) =>
        candidateSkills.push({
          candidateId,
          skillId: skillIds.get(name)!,
          proficiency: faker.number.int({ min: 2, max: 5 }),
          verified: position < 2 && faker.datatype.boolean(0.45),
          verifiedAt: null,
        }),
      );
      experiences.push({
        id: `syn-exp-${VERSION}-${serial}`,
        candidateId,
        company: faker.company.name(),
        title,
        startDate: new Date(
          new Date().getFullYear() - Math.max(1, years),
          faker.number.int({ min: 0, max: 11 }),
          1,
        ),
        endDate: null,
        achievements: [
          faker.helpers.arrayElement([
            "Maintained an excellent safety record",
            "Improved daily service turnaround",
            "Consistently met quality targets",
            "Received positive customer feedback",
          ]),
          "Worked effectively across busy shifts and changing priorities",
        ],
        verified: faker.datatype.boolean(0.28),
        verificationLocked: false,
      });
      education.push({
        id: `syn-edu-${VERSION}-${serial}`,
        candidateId,
        institution: faker.helpers.arrayElement(institutions),
        qualification,
        fieldOfStudy: faker.helpers.arrayElement([
          title,
          "Workplace Skills",
          "Hospitality",
          "Construction",
          "Community Services",
          "Agriculture",
        ]),
        startYear: 2004 + faker.number.int({ min: 0, max: 17 }),
        endYear: 2006 + faker.number.int({ min: 0, max: 17 }),
        verified: faker.datatype.boolean(0.25),
      });
      projects.push({
        id: `syn-project-${VERSION}-${serial}`,
        candidateId,
        title: "Practical workplace achievement",
        description: `Demonstrated dependable ${selectedSkills.slice(0, 2).join(" and ")} in a safety-focused workplace.`,
        url: null,
        tags: selectedSkills.slice(0, 3),
        source: "synthetic-faker-frontline",
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
        metadata: { status: "running", target: TARGET, lastBatch: count, seed: 20260718 },
      },
    });
    console.log(`[bootstrap] diverse workers ${count}/${TARGET}`);
  }
  await prisma.dataMigration.update({
    where: { key: MIGRATION_KEY },
    data: {
      recordsCreated: TARGET,
      metadata: { status: "complete", target: TARGET, seed: 20260718 },
    },
  });
  console.log(`[bootstrap] created ${TARGET} diverse workers; shared password: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("[bootstrap] failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
