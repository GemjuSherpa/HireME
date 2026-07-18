-- AlterTable
ALTER TABLE "HiringStage" ADD COLUMN     "completionDays" INTEGER NOT NULL DEFAULT 7;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'SHORTLIST',
ADD COLUMN     "ranking" INTEGER;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "idealCandidate" TEXT,
ADD COLUMN     "perks" TEXT,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "shortlistResponseDays" INTEGER NOT NULL DEFAULT 3;
