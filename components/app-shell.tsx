"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

function displayInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "HM"
  );
}

export function AppShell({
  role,
  name,
  subtitle,
  badgeCount = 0,
  children,
}: {
  role: "candidate" | "recruiter";
  name: string;
  subtitle: string;
  badgeCount?: number;
  children: React.ReactNode;
}) {
  const recruiter = role === "recruiter",
    pathname = usePathname(),
    [hash, setHash] = useState("");
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [pathname]);
  const active = (route: string, section?: string) =>
    pathname === route && (section ? hash === `#${section}` : !hash);
  const routeActive = (route: string) => pathname === route || pathname.startsWith(`${route}/`);
  const overviewHref = recruiter ? "/recruiter" : "/dashboard";
  const journeyHref = recruiter ? "/recruiter#matches" : "/dashboard#journeys";
  const createHref = recruiter ? "/recruiter/jobs/new" : "/dashboard#interview-stages";

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span>H</span>HireME
        </Link>
        <p className="side-label">WORKSPACE</p>
        <nav>
          <Link className={active(overviewHref) ? "active" : undefined} href={overviewHref}>
            <LayoutDashboard />
            Overview
          </Link>
          <Link
            className={
              active(overviewHref, recruiter ? "matches" : "journeys") ? "active" : undefined
            }
            href={journeyHref}
          >
            <Sparkles />
            {recruiter ? "Talent matches" : "My journey"}
            {badgeCount > 0 && <b>{badgeCount}</b>}
          </Link>
          <Link
            className={
              (
                recruiter
                  ? routeActive("/recruiter/jobs/new")
                  : active("/dashboard", "interview-stages")
              )
                ? "active"
                : undefined
            }
            href={createHref}
          >
            <BriefcaseBusiness />
            {recruiter ? "Create job" : "Interview stages"}
          </Link>
          <Link className={routeActive("/analytics") ? "active" : undefined} href="/analytics">
            <ChartNoAxesCombined />
            Analytics
          </Link>
        </nav>
        <p className="side-label">ACCOUNT</p>
        <nav>
          <Link
            className={
              routeActive(recruiter ? "/recruiter/onboarding" : "/profile") ? "active" : undefined
            }
            href={recruiter ? "/recruiter/onboarding" : "/profile"}
          >
            <UserRound />
            {recruiter ? "Company profile" : "My profile"}
          </Link>
          <Link className={routeActive("/settings") ? "active" : undefined} href="/settings">
            <Settings />
            Settings
          </Link>
        </nav>
        <div className="side-foot">
          <div className="avatar-sm">{displayInitials(name)}</div>
          <span>
            <strong>{name}</strong>
            <small>{subtitle}</small>
          </span>
          <form action="/api/auth/logout" method="post">
            <button aria-label="Sign out">
              <LogOut />
            </button>
          </form>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <Link className="mobile-brand brand" href="/">
            <span>H</span>HireME
          </Link>
          <div className="search">
            <Search />
            <span>Search jobs and candidates…</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
            <button aria-label="Notifications">
              <Bell />
              <i />
            </button>
            <form className="mobile-signout" action="/api/auth/logout" method="post">
              <button aria-label="Sign out">
                <LogOut />
              </button>
            </form>
          </div>
        </header>
        {children}
        <nav className="mobile-app-nav" aria-label="Mobile workspace navigation">
          <Link className={active(overviewHref) ? "active" : undefined} href={overviewHref}>
            <LayoutDashboard />
            <span>Home</span>
          </Link>
          <Link className={routeActive("/analytics") ? "active" : undefined} href="/analytics">
            <ChartNoAxesCombined />
            <span>Analytics</span>
          </Link>
          <Link
            className={
              (recruiter ? routeActive("/recruiter/jobs/new") : routeActive("/profile"))
                ? "active"
                : undefined
            }
            href={recruiter ? "/recruiter/jobs/new" : "/profile"}
          >
            {recruiter ? <BriefcaseBusiness /> : <UserRound />}
            <span>{recruiter ? "New job" : "Profile"}</span>
          </Link>
          <Link className={routeActive("/settings") ? "active" : undefined} href="/settings">
            <Settings />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
