"""Canonical text serialization shared by semantic training and inference."""

from __future__ import annotations


def job_to_text(job: dict) -> str:
    """Serializes a job into stable, labelled sections for the embedding model."""

    skills = ", ".join(item["name"] for item in job.get("skills", []))
    return "\n".join(
        (
            f"Job title: {job.get('title', '')}",
            f"Job family: {job.get('family', '')}",
            f"Description: {job.get('description', '')}",
            f"Responsibilities: {job.get('responsibilities', '')}",
            f"Ideal candidate: {job.get('ideal_candidate', '')}",
            f"Required and desired skills: {skills}",
        )
    )


def candidate_to_text(candidate: dict) -> str:
    """Serializes only job-related candidate evidence for semantic comparison."""

    skills = ", ".join(item["name"] for item in candidate.get("skills", []))
    titles = ", ".join(candidate.get("desired_titles", []))
    projects = "; ".join(candidate.get("projects", []))
    return "\n".join(
        (
            f"Target roles: {titles}",
            f"Professional summary: {candidate.get('summary', '')}",
            f"Skills: {skills}",
            f"Years of experience: {candidate.get('years_experience', 0)}",
            f"Relevant work evidence: {projects}",
        )
    )
