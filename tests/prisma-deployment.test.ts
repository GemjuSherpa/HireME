import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Protects the production bundle from omitting Vercel's Prisma query engine.
 * `native` keeps local and CI generation portable, while the explicit RHEL
 * target is required by Vercel's Linux function runtime.
 */
describe("Prisma deployment configuration", () => {
  it("packages the query engine required by Vercel Functions", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

    expect(schema).toMatch(/binaryTargets\s*=\s*\[\s*"native"\s*,\s*"rhel-openssl-3\.0\.x"\s*\]/);
  });
});
