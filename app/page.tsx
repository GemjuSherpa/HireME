import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  Clock3,
  LockKeyhole,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { PublicNav } from "@/components/public-nav";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "RECRUITER" ? "/recruiter" : "/dashboard");
  return (
    <main>
      <PublicNav />

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> A better way to be discovered
          </div>
          <h1>
            Stop chasing jobs.
            <br />
            <em>Let the right one find you.</em>
          </h1>
          <p>
            Create one rich, verified profile. HireME quietly matches you with roles that fit — no
            endless searches, no tailored résumés, no application black holes.
          </p>
          <div className="hero-actions">
            <Link className="button button-coral" href="/signup">
              Build my profile <ArrowRight size={18} />
            </Link>
            <Link className="button button-ghost" href="/login">
              I’m hiring talent
            </Link>
          </div>
          <div className="trust">
            <div className="avatars">
              <span>AM</span>
              <span>JL</span>
              <span>SK</span>
            </div>
            <p>
              <strong>10,000+ candidates</strong>
              <br />
              ready to be discovered
            </p>
          </div>
        </div>
        <div className="hero-visual" aria-label="Example candidate match card">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="profile-card">
            <div className="profile-top">
              <div className="avatar-lg">MP</div>
              <div>
                <span className="status">OPEN TO OFFERS</span>
                <h3>Maya Patel</h3>
                <p>Senior Product Designer · Melbourne</p>
              </div>
              <div className="match-ring">
                <strong>94</strong>
                <span>match</span>
              </div>
            </div>
            <p className="profile-bio">
              I turn complex systems into clear, useful experiences. Seven years across fintech and
              climate technology.
            </p>
            <div className="skill-row">
              <span>Product strategy</span>
              <span>Figma</span>
              <span>Research</span>
              <span>+5</span>
            </div>
            <div className="verified-row">
              <BadgeCheck size={19} />
              <span>
                <strong>Identity & experience verified</strong>
                <small>4 credentials · 3 references</small>
              </span>
            </div>
          </div>
          <div className="invite-card">
            <div className="tiny-icon">
              <Target size={18} />
            </div>
            <div>
              <small>NEW INVITATION</small>
              <strong>Lead Product Designer</strong>
              <span>Greenly · 96% fit</span>
            </div>
            <button aria-label="Open invitation">
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="mini-card">
            <UsersRound size={18} />
            <span>
              <strong>28</strong> profile views
            </span>
          </div>
        </div>
      </section>

      <section className="proof">
        <div className="shell proof-grid">
          <div>
            <strong>50%</strong>
            <span>faster time to hire</span>
          </div>
          <div>
            <strong>One</strong>
            <span>profile for every opportunity</span>
          </div>
          <div>
            <strong>Privacy</strong>
            <span>you stay in control</span>
          </div>
          <div>
            <strong>Fairness</strong>
            <span>skills over keywords</span>
          </div>
        </div>
      </section>

      <section id="how" className="section shell">
        <div className="section-kicker">Designed around you</div>
        <div className="section-head">
          <h2>
            Your career keeps moving,
            <br />
            <em>even when you’re not searching.</em>
          </h2>
          <p>
            HireME flips recruitment. Build your story once, choose what you want next, and let our
            matching agents do the searching.
          </p>
        </div>
        <div className="steps">
          <article>
            <span className="step-no">01</span>
            <div className="step-icon mint">
              <UsersRound />
            </div>
            <h3>Tell your whole story</h3>
            <p>
              Add experience, skills, projects, preferences and goals. Import public GitHub work and
              verify credentials.
            </p>
          </article>
          <article>
            <span className="step-no">02</span>
            <div className="step-icon peach">
              <BrainCircuit />
            </div>
            <h3>Get thoughtfully matched</h3>
            <p>
              Our matching engine finds roles aligned to your evidence, potential and preferences —
              not résumé keyword tricks.
            </p>
          </article>
          <article>
            <span className="step-no">03</span>
            <div className="step-icon violet">
              <Target />
            </div>
            <h3>Choose your invitations</h3>
            <p>
              Review the role and company before revealing your identity. Accept only the
              opportunities worth your time.
            </p>
          </article>
        </div>
      </section>

      <section id="journey" className="journey-section shell">
        <div className="section-kicker">From match to final interview</div>
        <div className="section-head">
          <h2>
            One continuous
            <br />
            <em>interview journey.</em>
          </h2>
          <p>
            Each stage updates your dashboard instantly. Consistent rubrics and human oversight keep
            progression transparent.
          </p>
        </div>
        <div className="journey-strip">
          <span>
            01<strong>Pre-screen</strong>
          </span>
          <i />
          <span>
            02<strong>Behavioural</strong>
          </span>
          <i />
          <span>
            03<strong>Technical</strong>
          </span>
          <i />
          <span>
            04<strong>AI interview</strong>
          </span>
          <i />
          <span>
            05<strong>Final shortlist</strong>
          </span>
        </div>
      </section>

      <section id="values" className="values-section">
        <div className="shell values-grid">
          <div>
            <div className="section-kicker light">Built differently</div>
            <h2>
              Hiring should feel
              <br />
              <em>human again.</em>
            </h2>
            <p>Automation handles the repetitive work. People keep the meaningful decisions.</p>
            <Link href="/login" className="button button-light">
              Explore the candidate workspace <ArrowRight size={17} />
            </Link>
          </div>
          <div className="value-list">
            <div>
              <Clock3 />
              <span>
                <strong>No application treadmill</strong>
                <p>One living profile replaces repetitive forms and tailored résumés.</p>
              </span>
            </div>
            <div>
              <Check />
              <span>
                <strong>Clear outcomes</strong>
                <p>Track every invitation and receive structured feedback after assessments.</p>
              </span>
            </div>
            <div>
              <LockKeyhole />
              <span>
                <strong>Consent at every step</strong>
                <p>Your personal details stay hidden until you decide to proceed.</p>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cta shell">
        <div>
          <span className="section-kicker">Your next move</span>
          <h2>
            Ready to let opportunity
            <br />
            <em>come to you?</em>
          </h2>
        </div>
        <Link href="/signup" className="button button-coral">
          Create a free profile <ArrowRight size={18} />
        </Link>
      </section>
      <footer>
        <div className="shell footer-inner">
          <Link className="brand brand-light" href="/">
            <span>H</span>HireME
          </Link>
          <p>Talent finds you.</p>
          <div>
            <a href="#">Privacy</a>
            <a href="#">Accessibility</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
