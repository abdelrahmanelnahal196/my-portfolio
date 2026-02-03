// src/portfolioStore.js
export const STORAGE_KEY = "portfolio_dashboard_v1";
export const SAVED_PALETTES_KEY = "portfolio_saved_palettes_v1";

/* =========================================================
   ✅ Default Schema (EMPTY by default)
========================================================= */
export const DEFAULT_DATA = {
  assets: {
    photo: "",
    cv: "",
    ogImage: "",
    // ✅ NEW (safe): icons (used by App.jsx for FAB + footer/contact)
    icons: {
      whatsapp: "",
      linkedin: "",
      github: "",
      gmail: "",
      telegram: "",
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  },

  profile: {
    name: "",
    title: "",
    location: "",
    summary: "",
    email: "",

    whatsapp: "",
    linkedin: "",
    github: "",
    instagram: "",
    facebook: "",
    telegram: "",
    tiktok: "",
  },

  // ✅ NEW: Education (editable from Dashboard)
  // { degree, institution, details, date, hidden }
  education: [],

  aboutCertifications: [],
  technicalSkills: [],
  softSkills: [],
  businessDomains: [],

  workExperience: [],
  toolkit: [],
  projects: [],
  certificates: [],

  // { title, button, btnClass, url, iconUrl, hidden }
  contactCards: [],

  // { title, url, iconUrl, hidden, button?, btnClass? }
  floatingButtons: [],

  siteTheme: {
    // can be "ocean", ... , "custom", or "saved:NAME"
    palette: "ocean",
    custom: { accent: "#0ea5e9", accent2: "#2563eb" },

    style: { cards: "glass", preset: "default" },
    density: "comfortable",
    layout: { projects: "grid", certificates: "grid", experience: "timeline" },

    background: {
      light1: "#f6fbff",
      light2: "#eef6ff",
      dark1: "#070b14",
      dark2: "#0a1022",
    },

    avatarStyle: "circle",

    // ✅ NEW: Section Manager (order + hidden)
    sections: {
      order: ["home", "about", "skills", "experience", "projects", "certificates", "contact"],
      hidden: {},
    },

    seo: {
      siteTitle: "",
      description: "",
      ogImage: "",
    },

    analytics: {
      enabled: false,
      provider: "plausible", // "plausible" | "ga4"
      plausibleDomain: "",
      gaMeasurementId: "",
    },

    contactForm: {
      mode: "mailto", // "mailto" | "formspree"
      formspreeEndpoint: "",
      subject: "Portfolio Contact",
      toEmail: "",
    },
  },
};

/* =========================================================
   ✅ Helpers
========================================================= */
function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function cloneDeep(obj) {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj ?? null));
  }
}

function cleanStr(v) {
  return String(v ?? "").trim();
}

/**
 * Deep merge objects:
 * - Objects: merged recursively
 * - Arrays: keep incoming as-is
 */
function deepMerge(fallback, incoming) {
  if (incoming === undefined || incoming === null) return cloneDeep(fallback);

  if (Array.isArray(fallback) || Array.isArray(incoming)) {
    return Array.isArray(incoming) ? cloneDeep(incoming) : cloneDeep(fallback);
  }

  if (isPlainObject(fallback) && isPlainObject(incoming)) {
    const out = { ...cloneDeep(fallback) };
    for (const k of Object.keys(incoming)) {
      out[k] = deepMerge(fallback?.[k], incoming[k]);
    }
    return out;
  }

  return incoming !== undefined ? incoming : cloneDeep(fallback);
}

/* =========================================================
   ✅ Migration / Normalization
========================================================= */
function normalizeTextItem(x) {
  if (typeof x === "string") return { text: x, hidden: false };
  return { text: x?.text ?? "", hidden: !!x?.hidden };
}

function normalizeEducationItem(x) {
  if (!x || typeof x !== "object") {
    return { degree: "", institution: "", details: "", date: "", hidden: false };
  }
  return {
    degree: x.degree ?? "",
    institution: x.institution ?? "",
    details: x.details ?? "",
    date: x.date ?? "",
    hidden: !!x.hidden,
  };
}

function normalizeSectionsCfg(x) {
  const def = cloneDeep(DEFAULT_DATA.siteTheme.sections);
  if (!x || typeof x !== "object") return def;

  const order = Array.isArray(x.order) ? x.order.map((s) => cleanStr(s)).filter(Boolean) : def.order;
  const hidden = isPlainObject(x.hidden) ? x.hidden : def.hidden;

  return { order, hidden };
}

function migrateData(data) {
  const d = cloneDeep(data || {});
  d.assets = d.assets || {};
  d.profile = d.profile || {};
  d.siteTheme = d.siteTheme || {};

  // ✅ Ensure assets/icons exists (App.jsx may use it)
  d.assets.icons = d.assets.icons || {};

  d.siteTheme.custom = d.siteTheme.custom || { accent: "#0ea5e9", accent2: "#2563eb" };
  d.siteTheme.style = d.siteTheme.style || { cards: "glass", preset: "default" };
  d.siteTheme.layout = d.siteTheme.layout || { projects: "grid", certificates: "grid", experience: "timeline" };
  d.siteTheme.background =
    d.siteTheme.background || {
      light1: "#f6fbff",
      light2: "#eef6ff",
      dark1: "#070b14",
      dark2: "#0a1022",
    };

  d.siteTheme.seo = d.siteTheme.seo || {};
  d.siteTheme.analytics = d.siteTheme.analytics || {};
  d.siteTheme.contactForm = d.siteTheme.contactForm || {};

  // ✅ NEW: sections manager config
  d.siteTheme.sections = normalizeSectionsCfg(d.siteTheme.sections);

  // ✅ education
  if (Array.isArray(d.education))
    d.education = d.education.map(normalizeEducationItem).filter((x) => x.degree || x.institution);
  else d.education = [];

  // normalize skill arrays to objects {text, hidden}
  if (Array.isArray(d.technicalSkills)) d.technicalSkills = d.technicalSkills.map(normalizeTextItem).filter((x) => x.text);
  else d.technicalSkills = [];

  if (Array.isArray(d.softSkills)) d.softSkills = d.softSkills.map(normalizeTextItem).filter((x) => x.text);
  else d.softSkills = [];

  if (Array.isArray(d.businessDomains)) d.businessDomains = d.businessDomains.map(normalizeTextItem).filter((x) => x.text);
  else d.businessDomains = [];

  // normalize projects tags + hidden
  if (Array.isArray(d.projects)) {
    d.projects = d.projects
      .map((p) => {
        if (!p) return p;
        const tags = Array.isArray(p.tags)
          ? p.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean)
          : typeof p.tags === "string"
          ? p.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
        return { ...p, tags, hidden: !!p.hidden };
      })
      .filter(Boolean);
  } else d.projects = [];

  // floating buttons compat (supports old fields + new optional button/btnClass)
  if (Array.isArray(d.floatingButtons)) {
    d.floatingButtons = d.floatingButtons
      .map((b) => {
        if (!b) return b;
        return {
          title: b.title ?? b.label ?? "Link",
          url: b.url ?? b.href ?? "",
          iconUrl: b.iconUrl ?? "",
          // ✅ Optional fields (won't break anything if unused)
          button: b.button ?? b.value ?? "",
          btnClass: b.btnClass ?? "",
          hidden: !!b.hidden,
        };
      })
      .filter((b) => b && (b.title || b.url));
  } else d.floatingButtons = [];

  // contact cards compat
  if (Array.isArray(d.contactCards)) {
    d.contactCards = d.contactCards
      .map((c) => {
        if (!c) return c;
        return {
          title: c.title ?? "",
          button: c.button ?? c.value ?? "Open",
          btnClass: c.btnClass ?? "btn glass",
          url: c.url ?? c.href ?? "",
          iconUrl: c.iconUrl ?? "",
          hidden: !!c.hidden,
        };
      })
      .filter((c) => c && (c.title || c.url));
  } else d.contactCards = [];

  // other lists with hidden
  if (Array.isArray(d.certificates)) d.certificates = d.certificates.map((c) => (c ? { ...c, hidden: !!c.hidden } : c)).filter(Boolean);
  else d.certificates = [];

  if (Array.isArray(d.workExperience)) d.workExperience = d.workExperience.map((x) => (x ? { ...x, hidden: !!x.hidden } : x)).filter(Boolean);
  else d.workExperience = [];

  if (Array.isArray(d.toolkit)) d.toolkit = d.toolkit.map((x) => (x ? { ...x, hidden: !!x.hidden } : x)).filter(Boolean);
  else d.toolkit = [];

  if (Array.isArray(d.aboutCertifications))
    d.aboutCertifications = d.aboutCertifications.map((x) => (x ? { ...x, hidden: !!x.hidden } : x)).filter(Boolean);
  else d.aboutCertifications = [];

  // ✅ Fix/normalize some key strings (safe, no breaking)
  d.profile.email = cleanStr(d.profile.email);
  d.profile.whatsapp = cleanStr(d.profile.whatsapp);
  d.profile.linkedin = cleanStr(d.profile.linkedin);
  d.profile.github = cleanStr(d.profile.github);

  // contactForm defaults (ensure keys exist)
  d.siteTheme.contactForm = {
    mode: cleanStr(d.siteTheme.contactForm.mode || "mailto") || "mailto",
    formspreeEndpoint: cleanStr(d.siteTheme.contactForm.formspreeEndpoint || ""),
    subject: cleanStr(d.siteTheme.contactForm.subject || "Portfolio Contact") || "Portfolio Contact",
    toEmail: cleanStr(d.siteTheme.contactForm.toEmail || ""),
  };

  // analytics defaults
  d.siteTheme.analytics = {
    enabled: !!d.siteTheme.analytics.enabled,
    provider: cleanStr(d.siteTheme.analytics.provider || "plausible") || "plausible",
    plausibleDomain: cleanStr(d.siteTheme.analytics.plausibleDomain || ""),
    gaMeasurementId: cleanStr(d.siteTheme.analytics.gaMeasurementId || ""),
  };

  // seo defaults
  d.siteTheme.seo = {
    siteTitle: cleanStr(d.siteTheme.seo.siteTitle || ""),
    description: cleanStr(d.siteTheme.seo.description || ""),
    ogImage: cleanStr(d.siteTheme.seo.ogImage || ""),
  };

  return d;
}

/* =========================================================
   ✅ Public API
========================================================= */
export function loadPortfolio() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDeep(DEFAULT_DATA);

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return cloneDeep(DEFAULT_DATA);

    const migrated = migrateData(parsed);
    return deepMerge(DEFAULT_DATA, migrated);
  } catch {
    return cloneDeep(DEFAULT_DATA);
  }
}

export function savePortfolio(data) {
  const safe = deepMerge(DEFAULT_DATA, migrateData(data));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new Event("portfolio:updated"));
}

export function resetPortfolio() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("portfolio:updated"));
}

/* =========================================================
   ✅ Saved palettes helpers (persist)
========================================================= */
export function loadSavedPalettes() {
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

export function saveSavedPalettes(palettes) {
  const safe = Array.isArray(palettes) ? palettes : [];
  localStorage.setItem(SAVED_PALETTES_KEY, JSON.stringify(safe));
  window.dispatchEvent(new Event("portfolio:palettes-updated"));
}
