"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function PublicNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);
  return (
    <header className="public-nav-wrap">
      <nav className="nav shell" aria-label="Main navigation">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span>H</span>HireME
        </Link>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <div id="mobile-navigation" className={`nav-menu ${open ? "open" : ""}`}>
          <div className="navlinks">
            <Link href="/#how" onClick={() => setOpen(false)}>
              How it works
            </Link>
            <Link href="/#values" onClick={() => setOpen(false)}>
              Why HireME
            </Link>
            <Link href="/#journey" onClick={() => setOpen(false)}>
              Interview journey
            </Link>
          </div>
          <div className="nav-actions">
            <Link className="text-link" href="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link className="button button-dark" href="/signup" onClick={() => setOpen(false)}>
              Create your profile
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
