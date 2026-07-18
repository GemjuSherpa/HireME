UPDATE "Application" AS application
SET "identityRevealed" = TRUE
WHERE EXISTS (
  SELECT 1 FROM "Invitation" AS invitation
  WHERE invitation."applicationId" = application.id
    AND invitation.kind = 'SHORTLIST'
    AND invitation.status = 'ACCEPTED'
);
