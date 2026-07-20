ALTER TYPE "StageType" ADD VALUE IF NOT EXISTS 'COGNITIVE_APTITUDE';

CREATE TABLE "VideoInterviewSession" (
  "id" TEXT NOT NULL,
  "stageRunId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CONSENT_REQUIRED',
  "consentGrantedAt" TIMESTAMP(3),
  "alternativeRequested" BOOLEAN NOT NULL DEFAULT false,
  "provider" TEXT,
  "providerSessionId" TEXT,
  "recordingUrl" TEXT,
  "transcript" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "evidence" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VideoInterviewSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VideoInterviewSession_stageRunId_key"
ON "VideoInterviewSession"("stageRunId");

ALTER TABLE "VideoInterviewSession"
ADD CONSTRAINT "VideoInterviewSession_stageRunId_fkey"
FOREIGN KEY ("stageRunId") REFERENCES "StageRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
