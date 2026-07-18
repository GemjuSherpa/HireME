import { prisma } from "@/lib/prisma";
import { spawn } from "node:child_process";

type JobEmail = {
  title: string;
  description: string;
  responsibilities: string | null;
  idealCandidate: string | null;
  perks: string | null;
  contactName: string | null;
  contactEmail: string | null;
  location: string | null;
  workMode: string;
  employmentType: string;
  requiredEducation: string | null;
  workRightsRequirement: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  company: { name: string };
  skills: { skill: { name: string } }[];
};

/** Builds the consent-first shortlist message containing the complete published job context. */
export function shortlistEmail(job: JobEmail, token: string, expiresAt: Date) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const invitationUrl = `${base}/invitations/${encodeURIComponent(token)}`;
  const salary =
    job.salaryMin && job.salaryMax
      ? `AUD $${job.salaryMin.toLocaleString()}–$${job.salaryMax.toLocaleString()}`
      : "Not disclosed";
  const row = (label: string, value: string | null | undefined) =>
    `<tr><td style="padding:7px 12px;color:#667085">${escapeHtml(label)}</td><td style="padding:7px 12px;font-weight:600">${escapeHtml(value || "Not specified")}</td></tr>`;
  const section = (title: string, value: string | null | undefined) =>
    `<h3 style="margin:24px 0 8px">${escapeHtml(title)}</h3><p style="white-space:pre-line;line-height:1.65">${escapeHtml(value || "Not specified")}</p>`;
  return {
    subject: `You have been shortlisted: ${job.title} at ${job.company.name}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#182230"><h1 style="color:#ef5b48">HireME</h1><h2>You’ve been shortlisted for ${escapeHtml(job.title)}</h2><p>Your profile was matched against the role’s published requirements. Review the complete opportunity below before choosing whether to continue.</p><table style="width:100%;background:#f8fafc;border-radius:12px">${row("Company", job.company.name)}${row("Location", job.location)}${row("Work arrangement", job.workMode)}${row("Employment", job.employmentType.replaceAll("_", " "))}${row("Education", job.requiredEducation?.replaceAll("_", " "))}${row("Work rights", job.workRightsRequirement?.replaceAll("_", " "))}${row("Salary", salary)}${row("Required skills", job.skills.map((x) => x.skill.name).join(", "))}</table>${section("About the role", job.description)}${section("Roles and responsibilities", job.responsibilities)}${section("Ideal candidate", job.idealCandidate)}${section("Why work with us", job.perks)}<p><strong>Questions?</strong> Contact ${escapeHtml(job.contactName)} at <a href="mailto:${escapeHtml(job.contactEmail)}">${escapeHtml(job.contactEmail)}</a>.</p><p>This invitation expires ${escapeHtml(expiresAt.toLocaleString("en-AU", { timeZone: "Australia/Melbourne" }))}.</p><a href="${invitationUrl}" style="display:inline-block;background:#ef5b48;color:white;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:700">Review, accept or decline</a><p style="font-size:12px;color:#667085;margin-top:24px">Assessment access is created only after you accept this invitation.</p></div>`,
    invitationUrl,
  };
}

/**
 * Delivers one persisted outbox record through Mailpit or Resend and records the outcome.
 * Keeping persistence separate from transport prevents workflow state from depending on email uptime.
 */
export async function deliverOutboxEmail(outboxId: string, subject: string, html: string) {
  const message = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: outboxId } });
  const from = process.env.EMAIL_FROM;
  if (process.env.EMAIL_TRANSPORT === "mailpit") {
    try {
      await sendToMailpit(
        message.toEmail,
        from ?? "HireME <invitations@hireme.local>",
        subject,
        html,
      );
      await prisma.emailOutbox.update({
        where: { id: outboxId },
        data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
      return { delivered: true };
    } catch (error) {
      await prisma.emailOutbox.update({
        where: { id: outboxId },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Mailpit delivery failed",
        },
      });
      return {
        delivered: false,
        reason: error instanceof Error ? error.message : "Mailpit delivery failed",
      };
    }
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !from)
    return {
      delivered: false,
      reason: "Email provider is not configured; message retained in outbox.",
    };
  const recipient = testRecipient(message.toEmail);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        html,
        headers: { "X-HireME-Intended-Recipient": message.toEmail },
      }),
    });
    if (!response.ok)
      throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
    await prisma.emailOutbox.update({
      where: { id: outboxId },
      data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
    });
    return { delivered: true };
  } catch (error) {
    await prisma.emailOutbox.update({
      where: { id: outboxId },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : "Email delivery failed",
      },
    });
    return {
      delivered: false,
      reason: error instanceof Error ? error.message : "Email delivery failed",
    };
  }
}

function sendToMailpit(to: string, from: string, subject: string, html: string) {
  return new Promise<void>((resolve, reject) => {
    const binary = process.env.MAILPIT_SENDMAIL_PATH ?? "/opt/homebrew/opt/mailpit/bin/mailpit";
    const child = spawn(
      binary,
      [
        "sendmail",
        "-S",
        process.env.MAILPIT_SMTP ?? "127.0.0.1:1025",
        "-f",
        extractAddress(from),
        to,
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let error = "";
    child.stderr.on("data", (chunk) => (error += String(chunk)));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(error || `Mailpit sendmail exited with ${code}`)),
    );
    child.stdin.end(
      `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`,
    );
  });
}
function extractAddress(value: string) {
  return value.match(/<([^>]+)>/)?.[1] ?? value;
}
function testRecipient(intended: string) {
  const configured = process.env.RESEND_TEST_RECIPIENT;
  if (!configured) return intended;
  const [local, domain] = configured.split("@");
  if (domain !== "resend.dev") return configured;
  const label = intended
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return local !== "suppressed" ? `${local}+${label}@${domain}` : configured;
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!,
  );
}
