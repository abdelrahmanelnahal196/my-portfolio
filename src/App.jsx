// src/App.jsx
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import { loadPortfolio } from "./portfolioStore";

/* =========================================================
   BASE helpers (عشان GitHub Pages)
========================================================= */
const BASE = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, "/");
const withBase = (p) => `${BASE}${String(p || "").replace(/^\/+/, "")}`;

/* =========================================================
   ✅ Admin Auth (Client-side Gate)
   - ضع الباسورد في .env: VITE_ADMIN_PASSWORD=your_password
========================================================= */
const AUTH_KEY = "portfolio_admin_authed_v1";
const ADMIN_PASSWORD = import.meta?.env?.VITE_ADMIN_PASSWORD || "196105";

function authKey(scope) {
  return `${AUTH_KEY}:${scope || "master"}`;
}

function isAuthed(scope) {
  try {
    return sessionStorage.getItem(authKey(scope)) === "1";
  } catch {
    return false;
  }
}

function setAuthed(v, scope) {
  try {
    sessionStorage.setItem(authKey(scope), v ? "1" : "0");
  } catch {
    // ignore
  }
}

/* =========================================================
   ✅ THEME (Fix: persist + no flash on reload)
========================================================= */
const THEME_KEY = "theme";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme; // ✅ forms/scrollbars consistent
}

// ✅ Apply ASAP before first paint (reduces/removes flash)
(() => {
  if (typeof document === "undefined") return;
  applyTheme(getInitialTheme());
})();

function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  // ✅ useLayoutEffect runs before paint
  useLayoutEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  return { theme, setTheme };
}

/* =========================================================
   ✅ THEME PALETTES (Colors) — من الداشبورد
========================================================= */
const PALETTES = [
  { id: "ocean", accent: "#0ea5e9", accent2: "#2563eb" },
  { id: "purple", accent: "#8b5cf6", accent2: "#a855f7" },
  { id: "emerald", accent: "#10b981", accent2: "#14b8a6" },
  { id: "rose", accent: "#f43f5e", accent2: "#ec4899" },
  { id: "amber", accent: "#f59e0b", accent2: "#f97316" },

  // ✅ Extra palettes
  { id: "cyan", accent: "#06b6d4", accent2: "#3b82f6" },
  { id: "lime", accent: "#84cc16", accent2: "#10b981" },
  { id: "fuchsia", accent: "#d946ef", accent2: "#6366f1" },
  { id: "red", accent: "#ef4444", accent2: "#f97316" },
  { id: "slate", accent: "#64748b", accent2: "#94a3b8" },
  { id: "sunset", accent: "#fb7185", accent2: "#f59e0b" },
  { id: "aurora", accent: "#22c55e", accent2: "#06b6d4" },
  { id: "mono", accent: "#e5e7eb", accent2: "#94a3b8" },
];

function applyPalette(paletteId, custom) {
  if (typeof document === "undefined") return;

  let p = PALETTES.find((x) => x.id === paletteId) || PALETTES[0];

  // ✅ Custom palette
  if (
    paletteId === "custom" &&
    custom &&
    typeof custom.accent === "string" &&
    typeof custom.accent2 === "string" &&
    custom.accent.trim() &&
    custom.accent2.trim()
  ) {
    p = { id: "custom", accent: custom.accent.trim(), accent2: custom.accent2.trim() };
  }

  const root = document.documentElement;
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent2", p.accent2);
  root.setAttribute("data-palette", p.id);
}

/* =========================================================
   ✅ STYLE PRESETS (switch via html[data-style])
========================================================= */
function applyStylePreset(presetId) {
  if (typeof document === "undefined") return;
  const preset = String(presetId || "default").trim() || "default";
  document.documentElement.setAttribute("data-style", preset);
}

/* =========================================================
   HELPERS
========================================================= */
function openExternal(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function firstValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function splitTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueValues(items, getter) {
  return [...new Set(items.map(getter).map((item) => String(item || "").trim()).filter(Boolean))];
}

function certificateIssuer(certificate) {
  return firstValue(certificate?.issuer, certificate?.org, String(certificate?.meta || "").split("•")[0]);
}

function certificateDate(certificate) {
  if (certificate?.date) return certificate.date;
  const parts = String(certificate?.meta || "")
    .split("•")
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function scrollToHash(hash) {
  const id = (hash || "").replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  if (id === "home") window.dispatchEvent(new CustomEvent("portfolio:active-section", { detail: "home" }));
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    window.dispatchEvent(new Event("portfolio:check-active-section"));
  }, 450);
}

function useActiveSection(sectionIds) {
  const [active, setActive] = useState(sectionIds?.[0] || "home");

  useEffect(() => {
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    let frameId = 0;

    const updateActive = () => {
      frameId = 0;
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scrollTop <= 80) {
        setActive(els[0]?.id || "home");
        return;
      }

      const navOffset = 120;
      const viewportProbe = navOffset + window.innerHeight * 0.18;
      let current = els[0]?.id || "home";

      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        if (top <= viewportProbe) current = el.id;
      }

      const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const nearBottom = window.innerHeight + scrollTop >= pageHeight - 8;
      if (nearBottom) current = els[els.length - 1]?.id || current;

      setActive(current);
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    const onForcedActive = (event) => {
      if (sectionIds.includes(event.detail)) setActive(event.detail);
    };
    window.addEventListener("scroll", requestUpdate, { passive: true });
    document.addEventListener("scroll", requestUpdate, { passive: true, capture: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("portfolio:check-active-section", requestUpdate);
    window.addEventListener("portfolio:active-section", onForcedActive);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestUpdate);
      document.removeEventListener("scroll", requestUpdate, { capture: true });
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("portfolio:check-active-section", requestUpdate);
      window.removeEventListener("portfolio:active-section", onForcedActive);
    };
  }, [sectionIds]);

  return active;
}

/* =========================================================
   Small UI atoms
========================================================= */
const Pill = memo(function Pill({ children, className = "" }) {
  return <span className={className}>{children}</span>;
});

const Card = memo(function Card({ children, className = "", variant = "glass" }) {
  const surface =
    variant === "solid"
      ? "bg-white/10 border border-white/10"
      : variant === "outline"
      ? "bg-transparent border border-[var(--stroke)]"
      : "glass";

  return <div className={`${surface} glow-card rounded-2xl ${className}`}>{children}</div>;
});

/* =========================================================
   UI: Navbar
========================================================= */
const Navbar = memo(function Navbar({ theme, onToggleTheme, profile }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: "Home", href: "#home", id: "home" },
      { label: "About", href: "#about", id: "about" },
      { label: "Skills", href: "#skills", id: "skills" },
      { label: "Work Experience", href: "#experience", id: "experience" },
      { label: "Projects", href: "#projects", id: "projects" },
      { label: "Certificates", href: "#certificates", id: "certificates" },
      { label: "Contact", href: "#contact", id: "contact" },
    ],
    []
  );

  const sectionIds = useMemo(() => navItems.map((n) => n.id), [navItems]);
  const active = useActiveSection(sectionIds);

  const onNav = useCallback((href) => {
    setMobileOpen(false);
    scrollToHash(href);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 md:px-10 py-3">
      <div className="glass rounded-2xl px-4 md:px-5 py-3 flex items-center justify-between gap-3">
        <button
          className="font-bold text-lg text-[color:var(--accent)] whitespace-nowrap focus-ring"
          onClick={() => onNav("#home")}
          aria-label="Go to home"
          title="Home"
          style={{ background: "transparent" }}
        >
          {(profile?.name || "Portfolio").split(" ")[0]}{" "}
          <span className="text-[color:var(--text-main)] dark:text-white">
            {(profile?.name || "").split(" ").slice(1).join(" ")}
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {navItems.map((i) => {
            const isActive = active === i.id;
            return (
              <button
                key={i.href}
                onClick={() => onNav(i.href)}
                className={`nav-link focus-ring ${isActive ? "active" : ""}`}
                style={{ background: "transparent" }}
              >
                {i.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="lg:hidden btn glass rounded-xl px-3 py-2 text-sm font-semibold focus-ring"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            title="Menu"
          >
            ☰
          </button>

          <button
            className="btn glass rounded-xl px-4 py-2 text-sm font-semibold focus-ring"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden px-4 md:px-10 mt-2">
          <div className="glass rounded-2xl p-3">
            <div className="grid gap-2">
              {navItems.map((i) => {
                const isActive = active === i.id;
                return (
                  <button
                    key={i.href}
                    onClick={() => onNav(i.href)}
                    className={`mobile-link focus-ring ${isActive ? "active" : ""}`}
                    style={{ background: "transparent", textAlign: "left" }}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

/* =========================================================
   UI: Background Decor
========================================================= */
const BackgroundDecor = memo(function BackgroundDecor() {
  const items = useMemo(
    () => [
      { type: "tri", cls: "t1 float-slow" },
      { type: "tri", cls: "t2 float-mid" },
      { type: "tri", cls: "t3 float-fast" },
      { type: "dot", cls: "d1 drift-slow" },
      { type: "dot", cls: "d2 drift-mid" },
      { type: "dot", cls: "d3 drift-fast" },
    ],
    []
  );

  return (
    <div className="bg-decor" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, idx) => {
        const it = items[idx % items.length];
        return <div key={idx} className={`${it.type} ${it.cls}`} />;
      })}
    </div>
  );
});

/* =========================================================
   UI: Section wrapper
========================================================= */
const Section = memo(function Section({ id, title, subtitle, icon, children }) {
  return (
    <section id={id} className="section">
      <div className="container-max">
        <div className="flex items-center justify-center gap-3">
          {icon && <span className="section-icon">{icon}</span>}
          <h2 className="section-title">{title}</h2>
        </div>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
});

/* =========================================================
   Portfolio Site (بيقرأ من localStorage)
========================================================= */
const PortfolioSite = memo(function PortfolioSite() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), [setTheme]);

  const [data, setData] = useState(() => loadPortfolio());

  useEffect(() => {
    const onUpdate = () => setData(loadPortfolio());
    window.addEventListener("portfolio:updated", onUpdate);
    return () => window.removeEventListener("portfolio:updated", onUpdate);
  }, []);

  const siteTheme = data?.siteTheme || {};
  const cardVariant = siteTheme?.style?.cards || "glass";
  const density = siteTheme?.density || "comfortable";
  const layout = siteTheme?.layout || {};

  const GAP = density === "compact" ? "gap-4" : "gap-6";

  // ✅ Apply palette + preset when data changes
  useLayoutEffect(() => {
    const paletteId = siteTheme?.palette || "ocean";
    applyPalette(paletteId, siteTheme?.custom);

    // ✅ style preset: default | neon | minimal | corporate | gradient
    const preset = siteTheme?.style?.preset || "default";
    applyStylePreset(preset);
  }, [
    siteTheme?.palette,
    siteTheme?.custom?.accent,
    siteTheme?.custom?.accent2,
    siteTheme?.style?.preset,
  ]);

  const isRemoteOrData = useCallback((p) => {
    const s = String(p || "").trim();
    return s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://");
  }, []);

  const assetUrl = useCallback(
    (p) => {
      if (!p) return "";
      const s = String(p).trim();
      if (!s) return "";
      if (isRemoteOrData(s)) return s; // ✅ data: / http(s) as-is
      const clean = s.replace(/^\/+/, "");
      return `${BASE}${clean}`;
    },
    [isRemoteOrData]
  );

  const visibleTextList = useCallback((arr) => {
    return (arr || [])
      .map((x) => (typeof x === "string" ? { text: x, hidden: false } : { text: x?.text ?? "", hidden: !!x?.hidden }))
      .filter((x) => x.text && !x.hidden)
      .map((x) => x.text);
  }, []);

  const visibleObjectList = useCallback((arr) => {
    return (arr || []).filter((x) => !x?.hidden);
  }, []);

  const assets = data.assets || {};
  const profile = data.profile || {};

  const ABOUT_CERTIFICATIONS = visibleObjectList(data.aboutCertifications);
  const TECHNICAL_SKILLS = visibleTextList(data.technicalSkills);
  const SOFT_SKILLS = visibleTextList(data.softSkills);
  const BUSINESS_DOMAINS = visibleTextList(data.businessDomains);

  const WORK_EXPERIENCE = visibleObjectList(data.workExperience);
  const TOOLKIT = visibleObjectList(data.toolkit);
  const PROJECTS = visibleObjectList(data.projects).filter((p) => p?.title || p?.desc);
  const CERTS = visibleObjectList(data.certificates);
  const CONTACT = visibleObjectList(data.contactCards);

  // ✅ NEW: floating buttons from dashboard
  const FLOATING_BTNS = visibleObjectList(data.floatingButtons);
  const hasPublicContent = Boolean(
    profile.name ||
      profile.title ||
      profile.summary ||
      TECHNICAL_SKILLS.length ||
      WORK_EXPERIENCE.length ||
      PROJECTS.length ||
      CERTS.length ||
      CONTACT.length
  );

  const Home = memo(function Home() {
    const actions = [
      {
        label: "View LinkedIn",
        className:
          "btn btn-glow rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent2)] focus-ring",
        onClick: () => openExternal(profile.linkedin),
      },
      {
        label: "View GitHub",
        className:
          "btn rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[color:var(--accent2)] to-[color:var(--accent)] focus-ring",
        onClick: () => openExternal(profile.github),
      },
      {
        label: "Reach Me",
        className:
          "btn rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-slate-700 to-slate-900 focus-ring",
        onClick: () => (window.location.href = `mailto:${profile.email}`),
      },
      {
        label: "CV",
        className:
          "btn rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-slate-700 to-slate-900 focus-ring",
        onClick: () => openExternal(assetUrl(assets.cv)),
      },
    ];

    return (
      <section id="home" className="section">
        <div className="container-max">
          <div className="glass rounded-3xl p-7 sm:p-8 md:p-12 relative overflow-hidden">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="avatar-wrap">
                <img
                  src={assetUrl(assets.photo)}
                  alt={`${profile.name} profile`}
                  className="avatar-img"
                  loading="lazy"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>

              <h1 className="hero-title">{profile.name}</h1>

              <div className="hero-meta">
                {profile.title} • <span>{profile.location}</span>
              </div>

              <p className="hero-summary">{profile.summary}</p>

              <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {actions.map((a) => (
                  <button key={a.label} className={a.className} onClick={a.onClick}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  });

  const About = memo(function About() {
    return (
      <Section id="about" title="About Me" subtitle="A brief introduction about me and my journey in software testing.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--accent)] text-xl">👥</span>
              <h3 className="card-title">About</h3>
            </div>

            <div className="mt-5">
              <div className="font-extrabold text-2xl">{profile.name}</div>
              <p className="mt-3 text-[color:var(--text-soft)] leading-relaxed">{profile.summary}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--stroke)]">
              <div className="flex items-center gap-2 text-[color:var(--accent)] font-semibold">
                🎓 <span>Education</span>
              </div>

              <div className="mt-3">
                <div className="font-semibold">Bachelor of Management Information Systems</div>
                <div className="text-sm text-[color:var(--text-soft)]">
                  Higher Institute of Computer Science and Information Systems (HICIS)
                </div>
              </div>
            </div>
          </Card>

          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--accent)] text-xl">{"</>"}</span>
              <h3 className="card-title">Technical Skills</h3>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {TECHNICAL_SKILLS.map((s) => (
                <Pill key={s} className="skill-pill">
                  {s}
                </Pill>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--accent)] text-xl">🎖️</span>
              <h3 className="card-title">Certifications</h3>
            </div>

            <div className="mt-5 space-y-4">
              {ABOUT_CERTIFICATIONS.map((c) => (
                <div key={`${c.title}-${c.date}`} className="cert-item">
                  <div className="cert-badge">🏅</div>
                  <div className="flex-1">
                    <div className="font-bold leading-snug">{c.title}</div>
                  </div>
                  <div className="cert-date">{c.date}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--accent)] text-xl">🧠</span>
              <h3 className="card-title">Soft Skills</h3>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {SOFT_SKILLS.map((s) => (
                <Pill key={s} className="pill pill-green">
                  {s}
                </Pill>
              ))}
            </div>
          </Card>

          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3">
              <span className="text-[color:var(--accent2)] text-xl">🧩</span>
              <h3 className="card-title">Business Domains</h3>
            </div>

            <p className="mt-3 text-sm text-[color:var(--text-soft)]">
              Industries and business types I’ve worked with in software testing:
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {BUSINESS_DOMAINS.map((d) => (
                <Pill key={d} className="pill pill-purple">
                  {d}
                </Pill>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    );
  });

  const Skills = memo(function Skills() {
    const list = TOOLKIT.length ? [...TOOLKIT, ...TOOLKIT] : [];

    return (
      <Section
        id="skills"
        title="Expertise & Toolkit"
        subtitle="A quick look at the skills and tools that help me deliver reliable testing results."
      >
        <div className="marquee-wrap">
          <div className="marquee-fade left" />
          <div className="marquee-fade right" />

          <div className="marquee" aria-label="Toolkit auto slider">
            <div className="marquee-track">
              {list.map((t, idx) => (
                <div key={`${t.label}-${idx}`} className="tool-card">
                  <div className="tool-icon">
                    <img
                      src={assetUrl(t.icon)}
                      alt={`${t.label} logo`}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.opacity = "0.25")}
                    />
                  </div>
                  <div className="tool-label">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card variant={cardVariant} className="mt-10 p-6 text-[color:var(--text-soft)]">
          I focus on clear test design, strong bug reports, and pragmatic collaboration with developers to ship stable releases.
        </Card>
      </Section>
    );
  });

  const WorkExperience = memo(function WorkExperience() {
    const mode = layout?.experience || "timeline";

    if (mode === "cards") {
      return (
        <Section id="experience" title="Work Experience" subtitle="My professional journey in software testing.">
          <div className={`grid grid-cols-1 ${GAP}`}>
            {WORK_EXPERIENCE.map((it, idx) => (
              <Card key={`${it.company}-${idx}`} variant={cardVariant} className="p-6">
                <div className="font-bold text-lg">
                  {it.role} <span className="text-[color:var(--accent)]">| {it.company}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="chip">{it.date}</span>
                  <span className="chip">{it.location}</span>
                  <span className="chip">{it.type}</span>
                </div>

                <p className="mt-4 text-[color:var(--text-soft)] leading-relaxed">{it.desc}</p>
              </Card>
            ))}
          </div>
        </Section>
      );
    }

    // timeline (default)
    return (
      <Section id="experience" title="Work Experience" subtitle="My professional journey in software testing.">
        <div className="timeline">
          <div className="timeline-line" />

          {WORK_EXPERIENCE.map((it, idx) => (
            <div key={`${it.company}-${idx}`} className={`timeline-item ${it.align === "right" ? "right" : "left"}`}>
              <div className="timeline-dot" />
              <Card variant={cardVariant} className="p-6 w-full max-w-xl">
                <div className="font-bold text-lg">
                  {it.role} <span className="text-[color:var(--accent)]">| {it.company}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="chip">{it.date}</span>
                  <span className="chip">{it.location}</span>
                  <span className="chip">{it.type}</span>
                </div>

                <p className="mt-4 text-[color:var(--text-soft)] leading-relaxed">{it.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </Section>
    );
  });

  const Projects = memo(function Projects() {
    const placeholderImg = (title) =>
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%233b82f6' stop-opacity='.35'/%3E%3Cstop offset='1' stop-color='%23a855f7' stop-opacity='.25'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23070b14'/%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='Arial' font-size='44' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
        title
      )}%3C/text%3E%3C/svg%3E`;

    const filters = ["All", ...uniqueValues(PROJECTS, (project) => project.category)];
    const [activeFilter, setActiveFilter] = useState("All");
    const filteredProjects =
      activeFilter === "All" ? PROJECTS : PROJECTS.filter((project) => project.category === activeFilter);

    return (
      <Section
        id="projects"
        title="Featured Projects"
        subtitle="Case-study cards showing scope, tools, outcomes, and useful links"
      >
        {filters.length > 1 && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-bold border transition focus-ring",
                  activeFilter === filter
                    ? "bg-[color:var(--accent)] text-white border-transparent"
                    : "bg-white/10 border-[var(--stroke)] text-[color:var(--text-soft)] hover:text-[color:var(--text-main)]",
                ].join(" ")}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        <div className={`project-card-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${GAP}`}>
          {filteredProjects.map((p, idx) => {
            const tools = splitTags(p.tools);
            const bullets = splitTags(p.bullets);
            const description = firstValue(p.desc, p.subtitle, bullets[0]);
            const featured = p.featured;

            return (
              <article
                key={`${p.title}-${idx}`}
                className="project-compact-card glass glow-card overflow-hidden"
              >
                <div className="relative border-b border-[var(--stroke)]">
                    <img
                      src={p.image ? assetUrl(p.image) : placeholderImg(p.title)}
                      alt={p.title}
                    className="project-compact-image"
                      loading="lazy"
                    />
                    {p.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                        {p.category}
                      </span>
                    )}
                  </div>

                <div className="project-compact-body">
                  <div className="flex items-start justify-between gap-2">
                      <div>
                      <h3 className="project-compact-title">{p.title}</h3>
                        {p.date && <p className="mt-1 text-xs font-bold text-[color:var(--accent)]">{p.date}</p>}
                      </div>
                      {featured && (
                      <span className="rounded-full border border-[var(--stroke)] px-2 py-1 text-[11px] font-bold text-[color:var(--text-soft)]">
                          Featured
                        </span>
                      )}
                    </div>

                    {description && (
                    <p className="project-compact-desc">{description}</p>
                    )}

                    {bullets.length > 1 && (
                        <ul className="mt-3 grid gap-1.5 text-xs text-[color:var(--text-soft)]">
                          {bullets.slice(1, 3).map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {tools.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tools.slice(0, 4).map((tool) => (
                          <span key={tool} className="chip text-xs font-bold">
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                  <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      {p.link && (
                        <button
                        className="btn rounded-xl px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent2)] focus-ring"
                          onClick={() => openExternal(p.link)}
                        >
                          View
                        </button>
                      )}
                      {p.github && (
                        <button
                        className="btn glass rounded-xl px-3 py-2 text-xs font-bold focus-ring"
                          onClick={() => openExternal(p.github)}
                        >
                          GitHub
                        </button>
                      )}
                      {p.report && (
                        <button
                        className="btn glass rounded-xl px-3 py-2 text-xs font-bold focus-ring"
                          onClick={() => openExternal(assetUrl(p.report))}
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
              </article>
            );
          })}
        </div>
      </Section>
    );
  });

  const Certificates = memo(function Certificates() {
    const fallbackSvg = (t) =>
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Crect width='100%25' height='100%25' fill='%23070b14'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='Arial' font-size='44' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
        t
      )}%3C/text%3E%3C/svg%3E`;

    const mode = layout?.certificates || "grid";
    const filters = ["All", ...uniqueValues(CERTS, (certificate) => certificate.category)];
    const [activeFilter, setActiveFilter] = useState("All");
    const filteredCerts =
      activeFilter === "All" ? CERTS : CERTS.filter((certificate) => certificate.category === activeFilter);

    const filterBar =
      filters.length > 1 ? (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={[
                "rounded-full px-4 py-2 text-sm font-bold border transition focus-ring",
                activeFilter === filter
                  ? "bg-[color:var(--accent)] text-white border-transparent"
                  : "bg-white/10 border-[var(--stroke)] text-[color:var(--text-soft)] hover:text-[color:var(--text-main)]",
              ].join(" ")}
            >
              {filter}
            </button>
          ))}
        </div>
      ) : null;

    if (mode === "list") {
      return (
        <Section id="certificates" title="Certificates Gallery" subtitle="Verified learning, tools, and testing credentials">
          {filterBar}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${GAP}`}>
            {filteredCerts.map((c) => (
              <article key={c.title} className="glass glow-card rounded-2xl overflow-hidden">
                <div className="flex gap-4 p-4">
                  <a
                    className="shrink-0 w-32 h-24 rounded-xl overflow-hidden border border-[var(--stroke)] bg-white/5"
                    href={assetUrl(c.link || c.img)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={assetUrl(c.img)}
                      alt={c.title}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.src = fallbackSvg("Certificate"))}
                    />
                  </a>
                  <div className="min-w-0">
                    <h3 className="font-extrabold">{c.title}</h3>
                    <p className="mt-1 text-sm text-[color:var(--text-soft)]">
                      {certificateIssuer(c)}
                      {certificateDate(c) ? ` • ${certificateDate(c)}` : ""}
                    </p>
                    {c.credentialId && (
                      <p className="mt-1 text-xs text-[color:var(--text-soft)]">ID: {c.credentialId}</p>
                    )}
                    <a
                      className="inline-block mt-3 text-sm font-semibold text-[color:var(--accent)]"
                      href={assetUrl(c.link || c.img)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Certificate
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>
      );
    }

    return (
      <Section id="certificates" title="Certificates Gallery" subtitle="Verified learning, tools, and testing credentials">
        {filterBar}
        <div className="cert-grid">
          {filteredCerts.map((c) => (
            <article key={c.title} className="glass glow-card cert-card">
              <a className="cert-link" href={assetUrl(c.link || c.img)} target="_blank" rel="noreferrer">
                <img
                  className="cert-img"
                  src={assetUrl(c.img)}
                  alt={c.title}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = fallbackSvg("Certificate"))}
                />
              </a>
              <div className="cert-body">
                {c.category && <div className="mb-2 text-xs font-bold text-[color:var(--accent)]">{c.category}</div>}
                <h3 className="cert-title">{c.title}</h3>
                <p className="cert-meta">
                  {certificateIssuer(c)}
                  {certificateDate(c) ? ` • ${certificateDate(c)}` : ""}
                </p>
                {c.credentialId && <p className="cert-meta">ID: {c.credentialId}</p>}
                <a
                  className="mt-4 inline-flex rounded-xl bg-white/10 border border-[var(--stroke)] px-3 py-2 text-sm font-bold text-[color:var(--accent)]"
                  href={assetUrl(c.link || c.img)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Certificate
                </a>
              </div>
            </article>
          ))}
        </div>
      </Section>
    );
  });

  const ContactCard = memo(function ContactCard({ title, button, btnClass, onClick, iconUrl }) {
    return (
      <button
        type="button"
        className="glass glow-card rounded-2xl p-6 text-center contact-card focus-ring"
        onClick={onClick}
        aria-label={button || title}
      >
        <div className="mx-auto rounded-2xl bg-white grid place-items-center contact-icon-box">
          <img src={assetUrl(iconUrl)} alt={`${title} logo`} loading="lazy" />
        </div>
        <h3 className="mt-5 font-bold text-xl">{title}</h3>
        <span className={`mt-5 w-full rounded-xl py-3 font-semibold contact-action ${btnClass}`}>
          {button || title}
        </span>
      </button>
    );
  });

  const Footer = memo(function Footer() {
    return (
      <div className="mt-10">
        <div className="glass glow-card rounded-2xl py-8 px-6">
          <div className="mt-5 text-center text-sm text-[color:var(--text-soft)]">
            Built by <span className="font-semibold text-[color:var(--text-main)]">{profile.name}</span>
          </div>
          <div className="mt-1 text-center text-xs text-[color:var(--text-soft)]">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </div>
    );
  });

  const Contact = memo(function Contact() {
    return (
      <Section id="contact" title="Let's Connect" subtitle="Reach out to me through any of these platforms">
        <div className={`contact-grid grid grid-cols-4 md:grid-cols-2 xl:grid-cols-4 ${GAP}`}>
          {CONTACT.map((c) => (
            <ContactCard
              key={c.title}
              title={c.title}
              button={firstValue(c.button, c.value)}
              btnClass={c.btnClass || "btn glass text-[color:var(--text-main)]"}
              iconUrl={c.iconUrl}
              onClick={() => {
                const href = firstValue(c.url, c.href);
                if (!href) return;
                if (String(href).startsWith("mailto:")) window.location.href = href;
                else openExternal(href);
              }}
            />
          ))}
        </div>
        <Footer />
      </Section>
    );
  });

  /* =========================================================
     ✅ Floating Buttons (from Dashboard)
  ========================================================= */
  const FloatingButtons = memo(function FloatingButtons() {
    const fallback = profile.linkedin ? [{ title: "LinkedIn", url: profile.linkedin, iconUrl: "/assets/icons/linkedin.png" }] : [];

    const list = (FLOATING_BTNS?.length ? FLOATING_BTNS : fallback).filter((b) => firstValue(b?.url, b?.href));
    if (!list.length) return null;

    return (
      <>
        {list.map((b, idx) => {
          const title = firstValue(b.title, b.label, "Open link");
          return (
          <button
            key={`${title}-${idx}`}
            className="fab focus-ring"
            onClick={() => {
              const u = String(firstValue(b.url, b.href));
              if (!u) return;
              if (u.startsWith("mailto:")) window.location.href = u;
              else openExternal(u);
            }}
            aria-label={title}
            title={title}
            style={{ bottom: 22 + idx * 72 }}
          >
            {b.iconUrl ? (
              <img
                src={assetUrl(b.iconUrl)}
                alt={title}
                onError={(e) => (e.currentTarget.style.opacity = "0.25")}
              />
            ) : (
              <span style={{ fontSize: 18 }}>{title.slice(0, 1)}</span>
            )}
          </button>
        );
        })}
      </>
    );
  });

  const ScrollToTopButton = memo(function ScrollToTopButton() {
    const [show, setShow] = useState(false);

    useEffect(() => {
      const onScroll = () => setShow(window.scrollY > 450);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const goTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
    if (!show) return null;

    return (
      <button className="scroll-top-btn focus-ring" onClick={goTop} aria-label="Scroll to top" title="Back to top">
        ↑
      </button>
    );
  });

  return (
    <div className="min-h-screen relative">
      <BackgroundDecor />
      <Navbar theme={theme} onToggleTheme={toggleTheme} profile={profile} />

      <Home />
      <About />
      <Skills />
      <WorkExperience />
      <Projects />
      <Certificates />
      <Contact />

      <FloatingButtons />
      <ScrollToTopButton />
    </div>
  );
});

/* =========================================================
   ✅ Admin Gate UI
========================================================= */
function AdminGate() {
  const scope = "master";
  const expectedPassword = ADMIN_PASSWORD;
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [authed, setAuthedState] = useState(() => isAuthed(scope));

  useEffect(() => {
    setAuthedState(isAuthed(scope));
    setPass("");
    setErr("");
  }, [scope]);

  // ✅ Apply palette + preset even on #admin page (before login)
  useLayoutEffect(() => {
    const d = loadPortfolio();
    const st = d?.siteTheme || {};
    applyPalette(st?.palette || "ocean", st?.custom);

    const preset = st?.style?.preset || "default";
    applyStylePreset(preset);
  }, []);

  const logout = useCallback(() => {
    setAuthed(false, scope);
    setAuthedState(false);
  }, [scope]);

  if (authed) {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <div className="min-h-screen relative px-5 sm:px-6 md:px-10 py-10">
      <div className="max-w-xl mx-auto">
        <div className="glass rounded-3xl p-8">
          <div className="text-[color:var(--accent)] font-extrabold text-2xl">Portfolio Dashboard</div>
          <div className="mt-2 text-sm opacity-80">Enter password to continue.</div>

          <div className="mt-6">
            <label className="block">
              <div className="text-sm font-semibold mb-2">Password</div>
              <input
                type="password"
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setErr("");
                }}
                className="w-full rounded-xl px-4 py-3 bg-black/20 border border-white/10 outline-none"
                placeholder="*********"
              />
            </label>

            {err && <div className="mt-3 text-sm text-rose-300">{err}</div>}

            <div className="mt-5 flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-[color:var(--accent)] text-white font-semibold"
                type="button"
                onClick={() => {
                  if (pass === expectedPassword) {
                    setAuthed(true, scope);
                    setAuthedState(true);
                    setErr("");
                    setPass("");
                  } else {
                    setErr("Wrong password ❌");
                  }
                }}
              >
                Login
              </button>
              <a className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 font-semibold" href={withBase("")}>
                Back to Site
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ✅ Path Router
========================================================= */
export default function App() {
  const [path, setPath] = useState(() => window.location.pathname || "/");

  useEffect(() => {
    const onRoute = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onRoute);
    return () => window.removeEventListener("popstate", onRoute);
  }, []);

  const basePath = new URL(BASE, window.location.origin).pathname.replace(/\/+$/, "");
  const routePath = path.replace(basePath, "").replace(/\/+$/, "") || "/";
  const isAdmin = routePath === "/app" || routePath === "/admin" || routePath === "/master";

  return isAdmin ? <AdminGate /> : <PortfolioSite />;
}
