import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, randomToken, verifyPassword } from "@/lib/security";
describe("authentication security", () => {
  it("stores salted password hashes and verifies safely", async () => {
    const first = await hashPassword("correct horse battery staple");
    const second = await hashPassword("correct horse battery staple");
    expect(first).not.toBe(second);
    expect(await verifyPassword("correct horse battery staple", first)).toBe(true);
    expect(await verifyPassword("wrong password", first)).toBe(false);
  });
  it("hashes opaque session tokens before storage", () => {
    const token = randomToken();
    expect(token).not.toBe(hashToken(token));
    expect(hashToken(token)).toHaveLength(64);
  });
});
