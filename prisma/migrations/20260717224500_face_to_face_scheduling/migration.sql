CREATE TABLE "FaceToFaceInterview" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "firstOption" TIMESTAMP(3) NOT NULL,
  "secondOption" TIMESTAMP(3) NOT NULL,
  "selectedOption" TIMESTAMP(3),
  "timezone" TEXT NOT NULL DEFAULT 'Australia/Melbourne',
  "location" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PROPOSED',
  "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FaceToFaceInterview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FaceToFaceInterview_applicationId_key" ON "FaceToFaceInterview"("applicationId");
ALTER TABLE "FaceToFaceInterview" ADD CONSTRAINT "FaceToFaceInterview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
