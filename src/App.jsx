// src/App.jsx
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import { loadPortfolio } from "./portfolioStore";

/* =========================================================
   BASE helpers (GitHub Pages)
========================================================= */
const BASE = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, "/");
const withBase = (p) => `${BASE}${String(p || "").replace(/^\/+/, "")}`;

/* =========================================================
   ✅ Admin Auth (Client-side Gate)
========================================================= */
const AUTH_KEY = "portfolio_admin_authed_v1";
const ADMIN_PASSWORD = import.meta?.env?.VITE_ADMIN_PASSWORD || "196105";

function isAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}
function setAuthed(v) {
  try {
    sessionStorage.setItem(AUTH_KEY, v ? "1" : "0");
  } catch {}
}

/* =========================================================
   ✅ THEME (persist + no flash)
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
  root.style.colorScheme = theme;
}
(() => {
  if (typeof document === "undefined") return;
  applyTheme(getInitialTheme());
})();

function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  useLayoutEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);
  return { theme, setTheme };
}

/* =========================================================
   ✅ Palettes (Built-in + Saved + Custom)
========================================================= */
const BUILTIN_PALETTES = [
  { id: "ocean", name: "Ocean", accent: "#0ea5e9", accent2: "#2563eb" },
  { id: "purple", name: "Purple", accent: "#8b5cf6", accent2: "#a855f7" },
  { id: "emerald", name: "Emerald", accent: "#10b981", accent2: "#14b8a6" },
  { id: "rose", name: "Rose", accent: "#f43f5e", accent2: "#ec4899" },
  { id: "amber", name: "Amber", accent: "#f59e0b", accent2: "#f97316" },
  { id: "cyan", name: "Cyan", accent: "#06b6d4", accent2: "#3b82f6" },
  { id: "lime", name: "Lime", accent: "#84cc16", accent2: "#10b981" },
  { id: "fuchsia", name: "Fuchsia", accent: "#d946ef", accent2: "#6366f1" },
  { id: "red", name: "Red", accent: "#ef4444", accent2: "#f97316" },
  { id: "slate", name: "Slate", accent: "#64748b", accent2: "#94a3b8" },
  { id: "sunset", name: "Sunset", accent: "#fb7185", accent2: "#f59e0b" },
  { id: "aurora", name: "Aurora", accent: "#22c55e", accent2: "#06b6d4" },
  { id: "mono", name: "Mono", accent: "#e5e7eb", accent2: "#94a3b8" },
  { id: "midnight", name: "Midnight", accent: "#38bdf8", accent2: "#a78bfa" },
  { id: "berry", name: "Berry", accent: "#fb7185", accent2: "#8b5cf6" },
  { id: "mint", name: "Mint", accent: "#34d399", accent2: "#60a5fa" },
  { id: "lava", name: "Lava", accent: "#f97316", accent2: "#ef4444" },
  { id: "gold", name: "Gold", accent: "#fbbf24", accent2: "#f97316" },
  { id: "ice", name: "Ice", accent: "#22d3ee", accent2: "#60a5fa" },
  { id: "neon", name: "Neon", accent: "#a3e635", accent2: "#22c55e" },
  { id: "grape", name: "Grape", accent: "#c084fc", accent2: "#22c55e" },
  { id: "skyline", name: "Skyline", accent: "#60a5fa", accent2: "#f472b6" },
  { id: "steel", name: "Steel", accent: "#94a3b8", accent2: "#475569" },
  { id: "nebula", name: "Nebula", accent: "#d946ef", accent2: "#3b82f6" },
  { id: "forest", name: "Forest", accent: "#059669", accent2: "#166534" },
  { id: "cherry", name: "Cherry", accent: "#e11d48", accent2: "#9f1239" },
  { id: "coffee", name: "Coffee", accent: "#92400e", accent2: "#451a03" },
  { id: "royal", name: "Royal", accent: "#6366f1", accent2: "#4338ca" },
  { id: "apricot", name: "Apricot", accent: "#fb923c", accent2: "#db2777" },
  { id: "mystic", name: "Mystic", accent: "#6d28d9", accent2: "#1e1b4b" },
  { id: "olive", name: "Olive", accent: "#a3e635", accent2: "#65a30d" },
  { id: "cloud", name: "Cloud", accent: "#94a3b8", accent2: "#cbd5e1" },
  { id: "fire", name: "Fire", accent: "#fde047", accent2: "#ef4444" },
  { id: "teal", name: "Teal", accent: "#2dd4bf", accent2: "#0d9488" },
  { id: "glacier", name: "Glacier", accent: "#f0f9ff", accent2: "#7dd3fc" },
  { id: "cotton", name: "Cotton", accent: "#fbcfe8", accent2: "#ddd6fe" },
  { id: "sage", name: "Sage", accent: "#d1fae5", accent2: "#a7f3d0" },
  { id: "sand", name: "Sand", accent: "#fef3c7", accent2: "#fde68a" },
  { id: "indigo-night", name: "Indigo Night", accent: "#4338ca", accent2: "#312e81" },
  { id: "blood-orange", name: "Blood Orange", accent: "#f97316", accent2: "#991b1b" },
  { id: "emerald-city", name: "Emerald City", accent: "#059669", accent2: "#064e3b" },
  { id: "plum", name: "Plum", accent: "#a21caf", accent2: "#701a75" },
  { id: "cyber", name: "Cyber", accent: "#00ffc3", accent2: "#00b8ff" },
  { id: "toxic", name: "Toxic", accent: "#bef264", accent2: "#65a30d" },
  { id: "synthwave", name: "Synthwave", accent: "#ff0080", accent2: "#7928ca" },
  { id: "voltage", name: "Voltage", accent: "#fde047", accent2: "#22c55e" },
  { id: "titanium", name: "Titanium", accent: "#4b5563", accent2: "#1f2937" },
  { id: "silver", name: "Silver", accent: "#e2e8f0", accent2: "#94a3b8" },
  { id: "charcoal", name: "Charcoal", accent: "#374151", accent2: "#111827" },
  { id: "peach", name: "Peach", accent: "#fdba74", accent2: "#f87171" },
  { id: "blueberry", name: "Blueberry", accent: "#6366f1", accent2: "#8b5cf6" },
  { id: "watermelon", name: "Watermelon", accent: "#fb7185", accent2: "#4ade80" },
];

const SAVED_PALETTES_KEY = "portfolio_saved_palettes_v1";

function readSavedPalettes() {
  try {
    const raw = localStorage.getItem(SAVED_PALETTES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map((p) => ({
        name: String(p?.name || "").trim(),
        accent: String(p?.accent || "").trim(),
        accent2: String(p?.accent2 || "").trim(),
      }))
      .filter((p) => p.name && p.accent && p.accent2);
  } catch {
    return [];
  }
}

function applyPalette(paletteId, custom) {
  if (typeof document === "undefined") return;

  let p = BUILTIN_PALETTES.find((x) => x.id === paletteId) || BUILTIN_PALETTES[0];

  if (String(paletteId || "").startsWith("saved:")) {
    const name = String(paletteId).replace("saved:", "").trim();
    const saved = readSavedPalettes().find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (saved) p = { id: `saved:${saved.name}`, name: saved.name, accent: saved.accent, accent2: saved.accent2 };
  }

  if (
    paletteId === "custom" &&
    custom &&
    typeof custom.accent === "string" &&
    typeof custom.accent2 === "string" &&
    custom.accent.trim() &&
    custom.accent2.trim()
  ) {
    p = { id: "custom", name: "Custom", accent: custom.accent.trim(), accent2: custom.accent2.trim() };
  }

  const root = document.documentElement;
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent2", p.accent2);
  root.setAttribute("data-palette", p.id);
}

function applyBackground(background) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const bg = background || {};
  root.style.setProperty("--bg1-light", bg.light1 || "#f6fbff");
  root.style.setProperty("--bg2-light", bg.light2 || "#eef6ff");
  root.style.setProperty("--bg1-dark", bg.dark1 || "#070b14");
  root.style.setProperty("--bg2-dark", bg.dark2 || "#0a1022");
}
function applyDensity(density) {
  if (typeof document === "undefined") return;
  const v = String(density || "comfortable").trim() || "comfortable";
  document.documentElement.setAttribute("data-density", v);
}
function applyAvatarStyle(avatarId) {
  if (typeof document === "undefined") return;
  const id = String(avatarId || "circle").trim() || "circle";
  document.documentElement.setAttribute("data-avatar", id);
}
function applyCardsStyle(cards) {
  if (typeof document === "undefined") return;
  const v = String(cards || "glass").trim() || "glass";
  document.documentElement.setAttribute("data-cards", v);
}
function applyStylePreset(presetId) {
  if (typeof document === "undefined") return;
  const preset = String(presetId || "default").trim() || "default";
  document.documentElement.setAttribute("data-style", preset);
}

/* =========================================================
   ✅ Section Manager (Order + Hide/Show) integration
========================================================= */
const SECTION_DEFS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" }, // Expertise & Toolkit
  { id: "experience", label: "Work Experience" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
  { id: "contact", label: "Contact" },
];

function normalizeSections(siteTheme) {
  const sec = siteTheme?.sections || {};
  const defaultOrder = SECTION_DEFS.map((s) => s.id);

  const rawOrder = Array.isArray(sec.order) && sec.order.length ? sec.order : defaultOrder;
  const hidden = sec.hidden && typeof sec.hidden === "object" ? sec.hidden : {};

  // Keep only known ids, then append any missing defaults.
  const cleaned = rawOrder.filter((id) => defaultOrder.includes(id));
  const normalizedOrder = [...cleaned, ...defaultOrder.filter((id) => !cleaned.includes(id))];

  return { order: normalizedOrder, hidden };
}

/* =========================================================
   Helpers
========================================================= */
function openExternal(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
function scrollToHash(hash) {
  const safe = String(hash || "");
  if (!safe.startsWith("#")) return;
  try {
    window.history.pushState(null, "", safe);
  } catch {}
  const id = safe.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function isPreviewMode() {
  try {
    const q = new URLSearchParams(window.location.search);
    return q.get("preview") === "1";
  } catch {
    return false;
  }
}
function getPreviewSection() {
  try {
    const q = new URLSearchParams(window.location.search);
    return String(q.get("section") || "").trim();
  } catch {
    return "";
  }
}

function useActiveSection(sectionIds) {
  const getInitial = () => {
    const h = String(window.location.hash || "").replace("#", "");
    if (h && sectionIds.includes(h)) return h;
    return sectionIds?.[0] || "home";
  };
  const [active, setActive] = useState(getInitial);

  useEffect(() => {
    const onHash = () => {
      const h = String(window.location.hash || "").replace("#", "");
      if (h && sectionIds.includes(h)) setActive(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [sectionIds]);

  useEffect(() => {
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { threshold: [0.12, 0.2, 0.35, 0.5], rootMargin: "-25% 0px -55% 0px" }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sectionIds]);

  return active;
}

/* =========================================================
   ✅ SEO & Analytics Injectors
========================================================= */
function setMeta(nameOrProp, value, isProperty = false) {
  if (!value) return;
  const selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (isProperty) tag.setAttribute("property", nameOrProp);
    else tag.setAttribute("name", nameOrProp);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function ensureLinkRel(rel, href) {
  if (!href) return;
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function useAnalytics(siteTheme) {
  useEffect(() => {
    const a = siteTheme?.analytics || {};
    const prev = document.querySelectorAll("script[data-portfolio-analytics='1']");
    prev.forEach((s) => s.remove());

    if (!a.enabled) return;

    if (a.provider === "plausible" && a.plausibleDomain) {
      const s = document.createElement("script");
      s.defer = true;
      s.setAttribute("data-domain", a.plausibleDomain);
      s.src = "https://plausible.io/js/script.js";
      s.setAttribute("data-portfolio-analytics", "1");
      document.head.appendChild(s);
    }

    if (a.provider === "ga4" && a.gaMeasurementId) {
      const id = a.gaMeasurementId.trim();
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      s1.setAttribute("data-portfolio-analytics", "1");
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.setAttribute("data-portfolio-analytics", "1");
      s2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `;
      document.head.appendChild(s2);
    }
  }, [
    siteTheme?.analytics?.enabled,
    siteTheme?.analytics?.provider,
    siteTheme?.analytics?.plausibleDomain,
    siteTheme?.analytics?.gaMeasurementId,
  ]);
}

function useSeo(profile, assets, siteTheme, assetUrl) {
  useEffect(() => {
    const seo = siteTheme?.seo || {};
    const title = seo.siteTitle || `${profile?.name || "Portfolio"} | ${profile?.title || ""}`.trim();
    const desc = seo.description || profile?.summary || "Portfolio website.";
    const ogImage = seo.ogImage || assets?.ogImage || "";

    document.title = title;

    setMeta("description", desc, false);

    try {
      ensureLinkRel("canonical", window.location.origin + window.location.pathname);
    } catch {}

    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:type", "website", true);
    try {
      setMeta("og:url", window.location.href, true);
    } catch {}

    const ogImgAbs = ogImage ? assetUrl(ogImage) : "";
    if (ogImgAbs) setMeta("og:image", ogImgAbs, true);

    setMeta("twitter:card", "summary_large_image", false);
    setMeta("twitter:title", title, false);
    setMeta("twitter:description", desc, false);
    if (ogImgAbs) setMeta("twitter:image", ogImgAbs, false);
  }, [
    profile?.name,
    profile?.title,
    profile?.summary,
    assets?.ogImage,
    siteTheme?.seo?.siteTitle,
    siteTheme?.seo?.description,
    siteTheme?.seo?.ogImage,
  ]);
}

/* =========================================================
   UI atoms
========================================================= */
const Pill = memo(function Pill({ children, className = "", onClick, active }) {
  const cls = `pill-chip ${active ? "active" : ""} ${className}`;
  return onClick ? (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
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
   Navbar (✅ now respects Section Manager order + hide)
========================================================= */
const Navbar = memo(function Navbar({ theme, onToggleTheme, profile, navItems }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
   Background Decor
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
   ✅ Floating Button (FIX) - ADDED
========================================================= */
const FloatingButton = memo(function FloatingButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // ✅ Some browsers/devices report scroll on documentElement, so we read both.
    const getY = () => window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const onScroll = () => setShow(getY() > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      className="fab"
      type="button"
      aria-label="Scroll to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
});

/* =========================================================
   Section wrapper
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
   Portfolio Site
========================================================= */
const PortfolioSite = memo(function PortfolioSite() {
  const previewMode = useMemo(() => isPreviewMode(), []);
  const previewSection = useMemo(() => (previewMode ? getPreviewSection() : ""), [previewMode]);
  const previewOnly = !!previewSection;

  const { theme, setTheme } = useTheme();
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), [setTheme]);

  const [data, setData] = useState(() => loadPortfolio());

  useEffect(() => {
    if (previewMode) return;
    const onUpdate = () => setData(loadPortfolio());
    window.addEventListener("portfolio:updated", onUpdate);
    return () => window.removeEventListener("portfolio:updated", onUpdate);
  }, [previewMode]);

  useEffect(() => {
    if (!previewMode) return;

    const onMsg = (e) => {
      const msg = e?.data;
      if (!msg || msg.type !== "portfolio-preview") return;
      if (!msg.payload) return;
      setData(msg.payload);
    };

    window.addEventListener("message", onMsg);
    try {
      window.parent?.postMessage({ type: "portfolio-preview-ready" }, "*");
    } catch {}
    return () => window.removeEventListener("message", onMsg);
  }, [previewMode]);

  const siteTheme = data?.siteTheme || {};
  const cardVariant = siteTheme?.style?.cards || "glass";
  const density = siteTheme?.density || "comfortable";
  const layout = siteTheme?.layout || {};
  const contactForm = siteTheme?.contactForm || {};

  const GAP = density === "compact" ? "gap-4" : "gap-6";

  const isRemoteOrData = useCallback((p) => {
    const s = String(p || "").trim();
    return s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://");
  }, []);

  const assetUrl = useCallback(
    (p) => {
      if (!p) return "";
      const s = String(p).trim();
      if (!s) return "";
      if (isRemoteOrData(s)) return s;
      const clean = s.replace(/^\/+/, "");
      return `${BASE}${clean}`;
    },
    [isRemoteOrData]
  );

  useLayoutEffect(() => {
    applyPalette(siteTheme?.palette || "ocean", siteTheme?.custom);
    applyStylePreset(siteTheme?.style?.preset || "default");
    applyBackground(siteTheme?.background);
    applyAvatarStyle(siteTheme?.avatarStyle || "circle");
    applyCardsStyle(siteTheme?.style?.cards || "glass");
    applyDensity(siteTheme?.density || "comfortable");
  }, [
    siteTheme?.palette,
    siteTheme?.custom?.accent,
    siteTheme?.custom?.accent2,
    siteTheme?.style?.preset,
    siteTheme?.background?.light1,
    siteTheme?.background?.light2,
    siteTheme?.background?.dark1,
    siteTheme?.background?.dark2,
    siteTheme?.avatarStyle,
    siteTheme?.style?.cards,
    siteTheme?.density,
  ]);

  useEffect(() => {
    const onPal = () => applyPalette(siteTheme?.palette || "ocean", siteTheme?.custom);
    window.addEventListener("portfolio:palettes-updated", onPal);
    return () => window.removeEventListener("portfolio:palettes-updated", onPal);
  }, [siteTheme?.palette, siteTheme?.custom]);

  const assets = data.assets || {};
  const profile = data.profile || {};

  useSeo(profile, assets, siteTheme, assetUrl);
  useAnalytics(siteTheme);

  const visibleTextList = useCallback((arr) => {
    return (arr || [])
      .map((x) => (typeof x === "string" ? { text: x, hidden: false } : { text: x?.text ?? "", hidden: !!x?.hidden }))
      .filter((x) => x.text && !x.hidden)
      .map((x) => x.text);
  }, []);

  const visibleObjectList = useCallback((arr) => {
    return (arr || []).filter((x) => !x?.hidden);
  }, []);

  const ABOUT_CERTIFICATIONS = visibleObjectList(data.aboutCertifications);
  const TECHNICAL_SKILLS = visibleTextList(data.technicalSkills);
  const SOFT_SKILLS = visibleTextList(data.softSkills);
  const BUSINESS_DOMAINS = visibleTextList(data.businessDomains);

  const WORK_EXPERIENCE = visibleObjectList(data.workExperience);
  const TOOLKIT = visibleObjectList(data.toolkit);
  const PROJECTS = visibleObjectList(data.projects);
  const CERTS = visibleObjectList(data.certificates);

  const EDUCATION = useMemo(() => {
    return visibleObjectList(data.education).filter((e) => e.degree || e.institution);
  }, [data.education, visibleObjectList]);

  const CONTACT = useMemo(() => {
    const raw = visibleObjectList(data.contactCards);
    return raw
      .map((c) => {
        const title = c?.title || "";
        const iconUrl = c?.iconUrl || "";
        const url = c?.url || c?.href || "";
        const button = c?.button || c?.value || "Open";
        const btnClass = c?.btnClass || "btn glass";
        return { title, iconUrl, url, button, btnClass };
      })
      .filter((c) => c.title && c.url);
  }, [data.contactCards, visibleObjectList]);

  /* =========================================================
     ✅ Section Manager state (order + hide)
  ========================================================= */
  const sectionsCfg = useMemo(() => normalizeSections(siteTheme), [siteTheme]);
  const sectionOrder = sectionsCfg.order;
  const hiddenMap = sectionsCfg.hidden || {};

  const navItems = useMemo(() => {
    const defMap = new Map(SECTION_DEFS.map((s) => [s.id, s.label]));
    return sectionOrder
      .filter((id) => !hiddenMap?.[id])
      .map((id) => ({
        id,
        label: defMap.get(id) || id,
        href: `#${id}`,
      }));
  }, [sectionOrder, hiddenMap]);

  const shouldRenderSection = useCallback(
    (id) => {
      // Preview-only should show requested section even if hidden.
      if (previewOnly) return previewSection === id;
      // Normal mode: respect hide.
      return !hiddenMap?.[id];
    },
    [previewOnly, previewSection, hiddenMap]
  );

  /* =========================================================
     Home
  ========================================================= */
  const Home = memo(function Home() {
    const cv = assetUrl(assets.cv);
    const isPdf = String(cv || "").toLowerCase().endsWith(".pdf");
    const downloadName = `${(profile.name || "CV").replace(/\s+/g, "-")}.pdf`;

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

              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  className="btn btn-glow rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent2)] focus-ring"
                  onClick={() => openExternal(profile.linkedin)}
                >
                  View LinkedIn
                </button>

                <button
                  className="btn rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[color:var(--accent2)] to-[color:var(--accent)] focus-ring"
                  onClick={() => openExternal(profile.github)}
                >
                  View GitHub
                </button>

                <button
                  className="btn rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-slate-700 to-slate-900 focus-ring"
                  onClick={() => (window.location.href = `mailto:${profile.email}`)}
                >
                  Reach Me
                </button>

                {cv ? (
                  <div className="flex gap-3">
                    <a className="btn glass rounded-xl px-6 py-3 font-semibold focus-ring" href={cv} target="_blank" rel="noreferrer">
                      View CV
                    </a>

                    {isPdf && (
                      <a className="btn glass rounded-xl px-6 py-3 font-semibold focus-ring" href={cv} download={downloadName}>
                        Download CV
                      </a>
                    )}
                  </div>
                ) : (
                  <button className="btn glass rounded-xl px-6 py-3 font-semibold" disabled>
                    Add CV in Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  });

  /* =========================================================
     About
  ========================================================= */
  const About = memo(function About() {
    return (
      <Section id="about" title="About Me" subtitle="A brief introduction about me and my journey in software testing.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant={cardVariant} className="p-6">
            <div className="flex items-center gap-3"></div>
            <div className="mt-6 pt-6 border-t border-[var(--stroke)]">
              <div className="flex items-center gap-2 text-[color:var(--accent)] font-semibold">
                🎓 <span>Education</span>
              </div>
              <div className="mt-3 space-y-3">
                {EDUCATION.length === 0 ? (
                  <div className="text-sm text-[color:var(--text-soft)] opacity-80">
                    Add your education in Dashboard → Education tab.
                  </div>
                ) : (
                  EDUCATION.map((e, idx) => (
                    <div key={`${e.degree}-${idx}`} className="text-sm">
                      <div className="font-semibold">{e.degree || "Education"}</div>
                      <div className="text-[color:var(--text-soft)]">{e.institution || ""}</div>
                      {e.date ? <div className="text-[color:var(--text-soft)] opacity-90">{e.date}</div> : null}
                      {e.details ? <div className="text-[color:var(--text-soft)] mt-1">{e.details}</div> : null}
                    </div>
                  ))
                )}
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
              {(ABOUT_CERTIFICATIONS || []).map((c) => (
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

  /* =========================================================
     Skills (Expertise & Toolkit)
  ========================================================= */
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

  /* =========================================================
     Work Experience
  ========================================================= */
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

  /* =========================================================
     Projects
  ========================================================= */
  const Projects = memo(function Projects() {
    const mode = layout?.projects || "grid";

    const allTags = useMemo(() => {
      const set = new Set();
      PROJECTS.forEach((p) => (p.tags || []).forEach((t) => set.add(String(t).trim())));
      return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }, [PROJECTS]);

    const [tag, setTag] = useState("All");
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
      const query = q.trim().toLowerCase();
      return PROJECTS.filter((p) => {
        const tags = (p.tags || []).map((t) => String(t));
        const okTag = tag === "All" ? true : tags.includes(tag);
        const okQ =
          !query ||
          String(p.title || "").toLowerCase().includes(query) ||
          String(p.desc || "").toLowerCase().includes(query) ||
          tags.join(" ").toLowerCase().includes(query);
        return okTag && okQ;
      });
    }, [PROJECTS, tag, q]);

    const placeholderImg = (title) =>
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%233b82f6' stop-opacity='.35'/%3E%3Cstop offset='1' stop-color='%23a855f7' stop-opacity='.25'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%23070b14'/%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='Arial' font-size='44' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
        title
      )}%3C/text%3E%3C/svg%3E`;

    return (
      <Section id="projects" title="Featured Projects" subtitle="Filter by tags and quickly find what you want.">
        <div className="projects-toolbar">
          <input
            className="projects-search"
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="projects-tags">
            <Pill active={tag === "All"} onClick={() => setTag("All")}>
              All
            </Pill>
            {allTags.map((t) => (
              <Pill key={t} active={tag === t} onClick={() => setTag(t)}>
                {t}
              </Pill>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card variant={cardVariant} className="p-6 text-center text-[color:var(--text-soft)]">
            No projects match your filters.
          </Card>
        ) : (
          <div className={mode === "list" ? `grid grid-cols-1 ${GAP}` : `grid grid-cols-1 md:grid-cols-3 ${GAP}`}>
            {filtered.map((p) => (
              <article key={p.title} className="glass glow-card rounded-2xl overflow-hidden">
                <img
                  src={p.image ? assetUrl(p.image) : placeholderImg(p.title)}
                  alt={p.title}
                  className="w-full aspect-[16/10] object-cover border-b border-[var(--stroke)]"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="font-extrabold text-lg">{p.title}</h3>
                  <p className="mt-2 text-[color:var(--text-soft)] text-sm leading-relaxed">{p.desc}</p>

                  {(p.tags || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.tags || []).map((t) => (
                        <span key={t} className="tag-badge">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {p.link ? (
                    <button
                      className="mt-4 btn glass rounded-xl px-4 py-2 text-sm font-semibold focus-ring"
                      onClick={() => openExternal(p.link)}
                    >
                      View
                    </button>
                  ) : (
                    <div className="mt-4 text-xs text-[color:var(--text-soft)] opacity-80">(Add a link when ready)</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>
    );
  });

  /* =========================================================
     Certificates
  ========================================================= */
  const Certificates = memo(function Certificates() {
    const fallbackSvg = (t) =>
      `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Crect width='100%25' height='100%25' fill='%23070b14'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='Arial' font-size='44' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(
        t
      )}%3C/text%3E%3C/svg%3E`;

    const mode = layout?.certificates || "grid";

    if (mode === "list") {
      return (
        <Section id="certificates" title="Certificates Gallery" subtitle="Professional certifications and achievements">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${GAP}`}>
            {CERTS.map((c) => (
              <article key={c.title} className="glass glow-card rounded-2xl overflow-hidden">
                <div className="flex gap-4 p-4">
                  <a
                    className="shrink-0 w-28 h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5"
                    href={assetUrl(c.img)}
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
                    <p className="mt-1 text-sm text-[color:var(--text-soft)]">{c.meta}</p>
                    <a
                      className="inline-block mt-3 text-sm font-semibold text-[color:var(--accent)]"
                      href={assetUrl(c.img)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open →
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
      <Section id="certificates" title="Certificates Gallery" subtitle="Professional certifications and achievements">
        <div className="cert-grid">
          {CERTS.map((c) => (
            <article key={c.title} className="glass glow-card cert-card">
              <a className="cert-link" href={assetUrl(c.img)} target="_blank" rel="noreferrer">
                <img
                  className="cert-img"
                  src={assetUrl(c.img)}
                  alt={c.title}
                  loading="lazy"
                  onError={(e) => (e.currentTarget.src = fallbackSvg("Certificate"))}
                />
              </a>
              <div className="cert-body">
                <h3 className="cert-title">{c.title}</h3>
                <p className="cert-meta">{c.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>
    );
  });

  /* =========================================================
     Contact
  ========================================================= */
  const ContactCard = memo(function ContactCard({ title, button, btnClass, onClick, iconUrl }) {
    return (
      <div className="glass glow-card rounded-2xl p-6 text-center contact-card w-full max-w-[320px]">
        <div className="mx-auto w-24 h-24 rounded-2xl bg-white grid place-items-center contact-icon-box">
          <img src={assetUrl(iconUrl)} alt={`${title} logo`} loading="lazy" />
        </div>
        <h3 className="mt-5 font-bold text-xl">{title}</h3>
        <button className={`mt-5 w-full rounded-xl py-3 font-semibold focus-ring ${btnClass || "btn glass"}`} onClick={onClick}>
          {button || "Open"}
        </button>
      </div>
    );
  });

  const ContactForm = memo(function ContactForm() {
    const mode = String(contactForm?.mode || "mailto");
    const toEmail = String(contactForm?.toEmail || profile?.email || "").trim();
    const subject = String(contactForm?.subject || "Portfolio Contact").trim();
    const endpoint = String(contactForm?.formspreeEndpoint || "").trim();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);

    const canSend = !!message.trim() && (mode === "formspree" ? !!endpoint : !!toEmail);

    const onSubmit = async (e) => {
      e.preventDefault();
      setNote("");

      if (!canSend) {
        setNote("Please fill the message (and ensure email settings are configured).");
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      };

      if (mode === "formspree") {
        try {
          setSending(true);
          const fd = new FormData();
          fd.append("name", payload.name);
          fd.append("email", payload.email);
          fd.append("message", payload.message);
          fd.append("_subject", subject);

          const res = await fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error("Request failed");
          setNote("Sent ✅");
          setName("");
          setEmail("");
          setMessage("");
        } catch {
          setNote("Failed to send ❌");
        } finally {
          setSending(false);
        }
        return;
      }

      const body = `Name: ${payload.name}\nEmail: ${payload.email}\n\nMessage:\n${payload.message}`;
      const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    };

    return (
      <div className="mt-10">
        <Card variant={cardVariant} className="p-6 md:p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="text-[color:var(--accent)] text-xl">✉️</div>
            <h3 className="card-title text-center">Send a Message</h3>
          </div>

          <p className="mt-3 text-center text-sm text-[color:var(--text-soft)]">
            {mode === "formspree"
              ? "This form will send your message via Formspree."
              : "This form will open your email client (mailto)."}
          </p>

          <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
            <input
              className="projects-search"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="projects-search"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <textarea
              className="projects-search"
              placeholder="Write your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              style={{ resize: "vertical" }}
            />

            <button
              type="submit"
              className="btn btn-glow rounded-xl px-6 py-3 font-semibold text-white bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent2)] focus-ring disabled:opacity-60"
              disabled={!canSend || sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>

            {note ? <div className="text-center text-sm text-[color:var(--text-soft)]">{note}</div> : null}

            {mode === "formspree" && !endpoint ? (
              <div className="text-center text-xs text-[color:var(--text-soft)] opacity-80">
                (Add Formspree endpoint in Dashboard → Contact → Contact Form Settings)
              </div>
            ) : null}
            {mode === "mailto" && !toEmail ? (
              <div className="text-center text-xs text-[color:var(--text-soft)] opacity-80">
                (Add profile email or set To Email in Dashboard → Contact → Contact Form Settings)
              </div>
            ) : null}
          </form>
        </Card>
      </div>
    );
  });

  const Contact = memo(function Contact() {
    return (
      <Section id="contact" title="Let's Connect" subtitle="Reach out to me through any of these platforms">
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${GAP} justify-items-center`}>
          {CONTACT.map((c) => (
            <ContactCard
              key={c.title}
              title={c.title}
              button={c.button}
              btnClass={c.btnClass}
              iconUrl={c.iconUrl}
              onClick={() => {
                const u = String(c.url || "");
                if (!u) return;
                if (u.startsWith("mailto:")) window.location.href = u;
                else openExternal(u);
              }}
            />
          ))}
        </div>

        <ContactForm />
      </Section>
    );
  });

  /* =========================================================
     Footer
  ========================================================= */
  const Footer = memo(function Footer() {
    const year = new Date().getFullYear();
    const fcfg = st.footer || {};
    if (fcfg.enabled === false) return null;

    const cardClass = st.style?.cards || "glass";
    const tagline = String(fcfg.tagline || "").trim();
    const showIcons = fcfg.showIcons !== false;
    const maxIcons = Math.max(0, Number(fcfg.maxIcons ?? 6)) || 0;

    return (
      <footer className="site-footer">
        <div className="container-max">
          <div className={`footer-inner ${cardClass}`}>
            <div className="footer-left">
              <div className="footer-name">{profile.name || "Portfolio"}</div>
              <div className="footer-sub">
                © {year} • {tagline ? tagline : "All rights reserved."}
              </div>
            </div>

            {showIcons ? (
              <div className="footer-right">
                {(CONTACT || []).slice(0, maxIcons || 0).map((c) => (
                  <button
                    key={c.title}
                    type="button"
                    className="footer-icon"
                    title={c.title}
                    aria-label={c.title}
                    onClick={() => {
                      const u = String(c.url || "");
                      if (!u) return;
                      if (u.startsWith("mailto:")) window.location.href = u;
                      else openExternal(u);
                    }}
                  >
                    {c.iconUrl ? <img src={assetUrl(c.iconUrl)} alt={c.title} loading="lazy" /> : <span symbol="link">↗</span>}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </footer>
    );
  });

  /* =========================================================
     ✅ Render sections in dashboard order
  ========================================================= */
  const sectionRenderers = useMemo(
    () => ({
      home: () => <Home />,
      about: () => <About />,
      skills: () => <Skills />,
      experience: () => <WorkExperience />,
      projects: () => <Projects />,
      certificates: () => <Certificates />,
      contact: () => <Contact />,
    }),
    []
  );

  const orderedToRender = useMemo(() => {
    if (previewOnly) return [previewSection].filter(Boolean);
    return sectionOrder;
  }, [previewOnly, previewSection, sectionOrder]);

  return (
    <div className="min-h-screen relative">
      <BackgroundDecor />

      {/* لو Preview بيعرض جزء واحد: نخفي الـ Navbar */}
      {!previewOnly ? <Navbar theme={theme} onToggleTheme={toggleTheme} profile={profile} navItems={navItems} /> : null}

      {orderedToRender.map((id) => {
        const render = sectionRenderers[id];
        if (!render) return null;
        if (!shouldRenderSection(id)) return null;
        return <React.Fragment key={id}>{render()}</React.Fragment>;
      })}

      {/* ✅ Footer */}
      {!previewOnly ? <Footer /> : null}

      {/* ✅ Floating Button (FIX) */}
      {!previewOnly ? <FloatingButton /> : null}
    </div>
  );
});

/* =========================================================
   ✅ Admin Gate UI
========================================================= */
function AdminGate() {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [authed, setAuthedState] = useState(() => isAuthed());

  useLayoutEffect(() => {
    const d = loadPortfolio();
    const st = d?.siteTheme || {};
    applyPalette(st?.palette || "ocean", st?.custom);
    applyCardsStyle(st?.style?.cards || "glass");
    applyStylePreset(st?.style?.preset || "default");
    applyBackground(st?.background);
    applyAvatarStyle(st?.avatarStyle || "circle");
    applyDensity(st?.density || "comfortable");
  }, []);

  useEffect(() => {
    const onPal = () => {
      const d = loadPortfolio();
      const st = d?.siteTheme || {};
      applyPalette(st?.palette || "ocean", st?.custom);
    };
    window.addEventListener("portfolio:palettes-updated", onPal);
    return () => window.removeEventListener("portfolio:palettes-updated", onPal);
  }, []);

  const logout = useCallback(() => {
    setAuthed(false);
    setAuthedState(false);
    window.location.hash = "#admin";
  }, []);

  if (authed) {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <div className="min-h-screen relative px-5 sm:px-6 md:px-10 py-10">
      <div className="max-w-xl mx-auto">
        <div className="glass rounded-3xl p-8">
          <div className="text-[color:var(--accent)] font-extrabold text-2xl">Admin Dashboard</div>
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
                  if (pass === ADMIN_PASSWORD) {
                    setAuthed(true);
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
              <a className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 font-semibold" href={withBase("#")}>
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
   Router
========================================================= */
export default function App() {
  const [hash, setHash] = useState(() => window.location.hash || "#");

  const isPathDashboard = useMemo(() => {
    try {
      const p = window.location.pathname || "/";
      return p.endsWith("/dashboard") || p.endsWith("/dashboard/");
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!isPathDashboard) return;
    if (window.location.hash !== "#admin") {
      window.location.hash = "#admin";
    }
  }, [isPathDashboard]);

  const isAdmin = hash === "#admin" || hash.startsWith("#admin/") || isPathDashboard;
  return isAdmin ? <AdminGate /> : <PortfolioSite />;
}
