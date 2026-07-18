-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "highestEducation" TEXT,
ADD COLUMN     "workRights" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "desiredStartDate" TIMESTAMP(3),
ADD COLUMN     "preferredTimezone" TEXT,
ADD COLUMN     "requiredEducation" TEXT,
ADD COLUMN     "workRightsRequirement" TEXT;
