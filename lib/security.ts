import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

/** Hashes a password with a unique salt using Node's memory-hard scrypt implementation. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

/** Verifies a password without leaking comparison timing information. */
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, key] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

/** Creates a URL-safe cryptographically secure token for sessions and invitations. */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}
/** Stores only a one-way digest of bearer tokens so database disclosure does not expose them. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
/** Produces a stable two-character avatar fallback from a person's display name. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
