-- Lower the discovery threshold while preserving recruiter control per pipeline.
ALTER TABLE "Job" ALTER COLUMN "minMatchScore" SET DEFAULT 45;

-- Existing jobs still using the former system default should adopt the new default.
-- Recruiter-customised thresholds are left unchanged.
UPDATE "Job" SET "minMatchScore" = 45 WHERE "minMatchScore" = 60;
