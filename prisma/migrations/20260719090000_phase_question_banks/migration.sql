-- Persist the exact randomly selected question set for each candidate attempt.
-- This prevents refresh-based reselection and preserves an auditable assessment snapshot.
ALTER TABLE "StageRun"
ADD COLUMN "questionSet" JSONB NOT NULL DEFAULT '[]'::jsonb;
