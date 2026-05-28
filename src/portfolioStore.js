// src/portfolioStore.js
import defaultData from "./default-data.json";

export const STORAGE_KEY = "portfolio_dashboard_v1";
const LEGACY_PORTFOLIOS_INDEX_KEY = "portfolio_master_index_v1";
const LEGACY_PORTFOLIO_DATA_PREFIX = "portfolio_master_data_v1:";

const SCHEMA_DATA = {
  assets: {
    photo: "",
    cv: "",
  },

  profile: {
    name: "",
    title: "",
    location: "",
    summary: "",
    email: "",
    linkedin: "",
    github: "",
  },

  aboutCertifications: [],
  technicalSkills: [],
  softSkills: [],
  businessDomains: [],
  workExperience: [],
  toolkit: [],
  projects: [],
  certificates: [],
  contactCards: [],
  floatingButtons: [],

  siteTheme: {
    palette: "ocean",
    custom: { accent: "#0ea5e9", accent2: "#2563eb" },
    style: { cards: "glass", preset: "default" },
    density: "comfortable",
    layout: { projects: "grid", certificates: "grid", experience: "timeline" },
    background: { light1: "#f6fbff", light2: "#eef6ff", dark1: "#070b14", dark2: "#0a1022" },
    avatarStyle: "circle",
  },
};

export const DEFAULT_DATA = deepMerge(SCHEMA_DATA, defaultData);

function cloneDeep(obj) {
  try {
    // eslint-disable-next-line no-undef
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj ?? null));
  }
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(fallback, incoming) {
  if (incoming === undefined || incoming === null) return cloneDeep(fallback);

  if (Array.isArray(fallback) || Array.isArray(incoming)) {
    return Array.isArray(incoming) ? cloneDeep(incoming) : cloneDeep(fallback);
  }

  if (isPlainObject(fallback) && isPlainObject(incoming)) {
    const out = { ...cloneDeep(fallback) };
    for (const key of Object.keys(incoming)) {
      out[key] = deepMerge(fallback?.[key], incoming[key]);
    }
    return out;
  }

  return incoming !== undefined ? incoming : cloneDeep(fallback);
}

function migrateData(data) {
  const d = cloneDeep(data || {});

  d.assets = d.assets || {};
  d.profile = d.profile || {};

  if (Array.isArray(d.floatingButtons)) {
    d.floatingButtons = d.floatingButtons.map((button) => {
      if (!button) return button;
      return {
        label: button.label ?? button.title ?? "",
        href: button.href ?? button.url ?? "",
        iconUrl: button.iconUrl ?? "",
        hidden: !!button.hidden,
      };
    });
  } else {
    d.floatingButtons = [];
  }

  if (Array.isArray(d.contactCards)) {
    d.contactCards = d.contactCards.map((card) => {
      if (!card) return card;
      return {
        title: card.title ?? "",
        subtitle: card.subtitle ?? "",
        value: card.value ?? card.button ?? "",
        href: card.href ?? card.url ?? "",
        iconUrl: card.iconUrl ?? "",
        hidden: !!card.hidden,
      };
    });
  } else {
    d.contactCards = [];
  }

  d.certificates = Array.isArray(d.certificates)
    ? d.certificates.map((certificate) => (certificate ? { ...certificate, hidden: !!certificate.hidden } : certificate))
    : [];
  d.siteTheme = d.siteTheme || {};

  return d;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function loadLegacyActivePortfolio() {
  const index = readJson(LEGACY_PORTFOLIOS_INDEX_KEY);
  const activeId = index?.activeId || index?.items?.[0]?.id;
  if (!activeId) return null;
  return readJson(`${LEGACY_PORTFOLIO_DATA_PREFIX}${activeId}`);
}

function normalizePortfolio(data) {
  return deepMerge(DEFAULT_DATA, migrateData(data));
}

function dispatchPortfolioUpdate() {
  window.dispatchEvent(new Event("portfolio:updated"));
}

export function loadPortfolio() {
  const saved = readJson(STORAGE_KEY);
  if (saved) return normalizePortfolio(saved);

  const legacy = loadLegacyActivePortfolio();
  if (legacy) {
    const normalized = normalizePortfolio(legacy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  return cloneDeep(DEFAULT_DATA);
}

export function savePortfolio(data) {
  const safe = normalizePortfolio(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  dispatchPortfolioUpdate();
}

export function resetPortfolio() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
  dispatchPortfolioUpdate();
}
