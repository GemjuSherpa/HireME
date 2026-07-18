-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "syntheticDatasetVersion" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSynthetic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DataMigration" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "recordsCreated" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataMigration_key_key" ON "DataMigration"("key");
