// src/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DATA,
  loadPortfolio,
  resetPortfolio,
  savePortfolio,
  loadSavedPalettes,
  saveSavedPalettes,
  exportPortfolioJson,
  importPortfolioJsonFile,
} from "./portfolioStore";

/**
 * ✅ Tabs:
 * - Academic tab: Education + Skills (subtabs)
 * - NEW: Expertise & Toolkit is a MAIN tab ✅ (was under Career)
 * - Career tab: Experience + Projects + Certificates (subtabs)
 * - Contact tab: Contact Cards + Contact Form (subtabs) ✅
 * - SEO / Analytics / Backup are MAIN tabs
 * - NEW: Sections tab (Section Manager: Order + Hide/Show) ✅ Drag & Drop fixed
 * - NEW: Draft / Publish mode
 * - NEW: Validation before Save/Publish
 * - NEW: Media upload helpers (drag & drop → Base64) for images/icons/logos ✅
 * - NEW: Global Search (jump to field/section)
 */
const TABS = [
  "Home",
  "Profile",
  "Academic",
  "Expertise & Toolkit", // ✅ NEW MAIN TAB
  "Career",
  "Contact",
  "Sections",
  "Layout",
  "SEO Settings",
  "Analytics",
  "Backup / Restore (JSON)",
];

const ACADEMIC_SUBTABS = [
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
];

// ✅ Career no longer contains toolkit
const CAREER_SUBTABS = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
];

const CONTACT_SUBTABS = [
  { id: "cards", label: "Contact Cards" },
  { id: "form", label: "Contact Form" },
];

const LAYOUT_SUBTABS = [
  { id: "design", label: "Design" },
  { id: "theme", label: "Theme" },
];

// Site sections (for Section Manager)
// ids should match your site section keys (used by preview and site renderer)
const SECTION_DEFS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About (Education/Skills)" },
  { id: "skills", label: "Toolkit / Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
  { id: "contact", label: "Contact" },
];

// ✅ FIX: added `name` for UI display
const PRESET_PALETTES = [
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

const DASH_STATE_KEY = "portfolio_dash_ui_state_v5";
const DRAFT_KEY = "portfolio_draft_v1";

/* =========================================================
   Button Class Presets (Contact Cards)
========================================================= */
const BUTTON_CLASS_PRESETS = [
  { id: "glass", label: "Glass", value: "btn glass" },
  { id: "solid", label: "Solid", value: "btn btn-solid" },
  { id: "outline", label: "Outline", value: "btn btn-outline" },
  { id: "accent", label: "Accent Gradient", value: "btn btn-glow" },
  { id: "dark", label: "Dark", value: "btn btn-dark" },
  { id: "custom", label: "Custom", value: "" },
];

function deepClone(x) {
  try {
    return structuredClone(x);
  } catch {
    return JSON.parse(JSON.stringify(x));
  }
}

function getByPath(obj, path) {
  const parts = String(path || "").split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(obj, path, value) {
  const parts = String(path || "").split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

/* =========================================================
   UI Fields
========================================================= */
function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="dash-field">
      <div className="dash-label">{label}</div>
      <input
        className="dash-input"
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function ColorInput({ label, value, onChange, placeholder = "#ffffff" }) {
  const safe = String(value || "").trim() || placeholder;
  return (
    <label className="dash-field">
      <div className="dash-label">{label}</div>
      <div className="dash-color-pick" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          style={{ width: 44, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }}
        />
        <input className="dash-input" value={safe} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="dash-field">
      <div className="dash-label">{label}</div>
      <textarea
        className="dash-textarea"
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Switch({ label, checked, onChange }) {
  return (
    <label className="dash-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function SmallBtn({ children, onClick, variant = "ghost", disabled, title }) {
  const cls = variant === "primary" ? "dash-btn primary" : variant === "danger" ? "dash-btn danger" : "dash-btn";
  return (
    <button type="button" className={cls} onClick={onClick} disabled={!!disabled} title={title}>
      {children}
    </button>
  );
}

function Card({ title, children, right }) {
  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <div className="dash-card-title">{title}</div>
        <div>{right}</div>
      </div>
      <div className="dash-card-body">{children}</div>
    </div>
  );
}

function reorder(arr, from, to) {
  const a = [...(arr || [])];
  const [moved] = a.splice(from, 1);
  a.splice(to, 0, moved);
  return a;
}

/* =========================================================
   ✅ List Editor (Drag & Drop reorder)
========================================================= */
function ListEditor({ title, items, setItems, makeDefaultItem, renderItem }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const onDragStart = (idx) => setDragIndex(idx);

  const onDragOver = (idx, e) => {
    e.preventDefault();
    setOverIndex(idx);
  };

  const onDrop = (idx) => {
    if (dragIndex === null || dragIndex === undefined) return;
    if (idx === dragIndex) return;
    const next = reorder(items, dragIndex, idx);
    setItems(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <Card
      title={title}
      right={
        <SmallBtn variant="primary" onClick={() => setItems([...(items || []), makeDefaultItem()])}>
          + Add
        </SmallBtn>
      }
    >
      {(items || []).length === 0 ? (
        <div className="dash-empty">No items yet.</div>
      ) : (
        <div className="dash-list">
          {items.map((it, idx) => (
            <div
              key={idx}
              className={`dash-list-item ${overIndex === idx ? "is-over" : ""}`}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(idx, e)}
              onDrop={() => onDrop(idx)}
            >
              <div className="dash-list-item-actions">
                <div className="dash-drag-handle" title="Drag to reorder">
                  ⠿
                </div>

                <div className="dash-actions-right">
                  <SmallBtn onClick={() => idx > 0 && setItems(reorder(items, idx, idx - 1))}>↑</SmallBtn>
                  <SmallBtn onClick={() => idx < items.length - 1 && setItems(reorder(items, idx, idx + 1))}>↓</SmallBtn>

                  <SmallBtn onClick={() => setItems(items.filter((_, i) => i !== idx))} variant="danger">
                    Remove
                  </SmallBtn>

                  <Switch
                    label="Hidden"
                    checked={!!it.hidden}
                    onChange={(v) => {
                      const next = [...items];
                      next[idx] = { ...next[idx], hidden: v };
                      setItems(next);
                    }}
                  />
                </div>
              </div>

              {renderItem(it, idx)}
            </div>
          ))}
        </div>
      )}

      <div className="dash-hint">Drag items using (⠿) to reorder. Or use ↑ ↓.</div>
    </Card>
  );
}

/* =========================================================
   ✅ Media Upload helpers (Drag & Drop → Base64)
========================================================= */
function ImageDropInput({ label, value, onChange, hint = "Drag & drop image here, or click to pick." }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const isImageData = typeof value === "string" && value.startsWith("data:image/");

  const pick = () => fileRef.current?.click();

  const readFile = (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    readFile(file);
  };

  return (
    <div className="dash-field">
      <div className="dash-label">{label}</div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => readFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => e.key === "Enter" && pick()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          border: dragOver ? "1px solid rgba(255,255,255,0.35)" : "1px dashed rgba(255,255,255,0.18)",
          borderRadius: 14,
          padding: 12,
          cursor: "pointer",
          display: "grid",
          gridTemplateColumns: "80px 1fr",
          gap: 12,
          alignItems: "center",
          background: dragOver ? "rgba(255,255,255,0.04)" : "transparent",
        }}
      >
        <div
          style={{
            width: 80,
            height: 60,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {isImageData ? (
            <img src={value} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No preview</div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{hint}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SmallBtn onClick={pick}>Pick Image</SmallBtn>
            {value ? (
              <SmallBtn
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              >
                Clear
              </SmallBtn>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <TextInput label="Value (path or Base64)" value={value} onChange={onChange} placeholder="/assets/images/..." />
        <div className="dash-hint">تقدر تسيبها Path عادي (/assets/...) أو تخليها Base64 (data:image/...).</div>
      </div>
    </div>
  );
}

function FileDropInput({
  label,
  value,
  onChange,
  accept = "*/*",
  hint = "Drag & drop file here, or click to pick.",
  maxSizeMB = 4,
  allowPath = true,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [note, setNote] = useState("");

  const pick = () => fileRef.current?.click();

  const readFile = (file) => {
    setNote("");
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (maxSizeMB && sizeMB > maxSizeMB) {
      setNote(`File too large (${sizeMB.toFixed(2)}MB). Max ${maxSizeMB}MB for Base64. Use a path/URL instead.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    readFile(file);
  };

  const isData = typeof value === "string" && value.startsWith("data:");

  return (
    <div className="dash-field">
      <div className="dash-label">{label}</div>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => readFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => e.key === "Enter" && pick()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          border: dragOver ? "1px solid rgba(255,255,255,0.35)" : "1px dashed rgba(255,255,255,0.18)",
          borderRadius: 14,
          padding: 12,
          cursor: "pointer",
          background: dragOver ? "rgba(255,255,255,0.04)" : "transparent",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{hint}</div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isData ? "Stored as Base64 (data:...)" : value ? value : "No file selected"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SmallBtn onClick={pick}>Pick File</SmallBtn>
            {value ? (
              <SmallBtn
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
              >
                Clear
              </SmallBtn>
            ) : null}
          </div>
        </div>
      </div>

      {note ? <div className="dash-hint" style={{ color: "rgba(255,170,170,0.95)" }}>{note}</div> : null}

      {allowPath ? (
        <div style={{ marginTop: 8 }}>
          <TextInput label="Value (path / URL / Base64)" value={value} onChange={onChange} placeholder="/assets/... or https://..." />
          <div className="dash-hint">
            Upload بيخزن Base64 في المتصفح (localStorage) — مناسب للأيقونات والصور الصغيرة. للملفات الكبيرة (زي CV PDF) الأفضل Path/URL.
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   ✅ Button Class Picker (easy styling)
========================================================= */
function ButtonClassPicker({ label = "Button Style", value, onChange }) {
  const detectPreset = () => {
    const v = String(value || "").trim();
    const hit = BUTTON_CLASS_PRESETS.find((p) => p.value && p.value === v);
    return hit?.id || "custom";
  };

  const [preset, setPreset] = useState(detectPreset);

  useEffect(() => {
    setPreset(detectPreset());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onPickPreset = (id) => {
    setPreset(id);
    const p = BUTTON_CLASS_PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (p.id === "custom") return;
    onChange(p.value);
  };

  return (
    <div className="dash-field">
      <div className="dash-label">{label}</div>

      <div className="dash-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label className="dash-field" style={{ margin: 0 }}>
          <div className="dash-label">Preset</div>
          <select className="dash-input" value={preset} onChange={(e) => onPickPreset(e.target.value)}>
            {BUTTON_CLASS_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <TextInput
          label="Button Class (advanced)"
          value={value}
          onChange={(v) => onChange(v)}
          placeholder="btn glass"
        />
      </div>

      <div className="dash-hint">
        اختار Preset سريع أو عدّل الـ class يدويًا. (لازم يكون عندك CSS لهذه الكلاسات في موقعك.)
      </div>
    </div>
  );
}

/* =========================================================
   ✅ Palette UI
========================================================= */
function PaletteTile({ name, accent, accent2, selected, onClick, badge }) {
  return (
    <button type="button" className={`palette-tile ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="palette-swatch" style={{ background: `linear-gradient(90deg, ${accent}, ${accent2})` }} />
      <div className="palette-meta">
        <div className="palette-name">
          {name} {badge ? <span className="palette-badge">{badge}</span> : null}
        </div>
        <div className="palette-codes">
          <span>{accent}</span>
          <span>{accent2}</span>
        </div>
      </div>
    </button>
  );
}

/* =========================================================
   ✅ Preview section mapping
========================================================= */
function tabToPreviewSection(tab, academicSubTab, careerSubTab) {
  switch (tab) {
    case "Profile":
      return "home";

    case "Academic":
      return "about";

    // ✅ NEW: Toolkit tab maps to "skills" section
    case "Expertise & Toolkit":
      return "skills";

    case "Career":
      if (careerSubTab === "experience") return "experience";
      if (careerSubTab === "projects") return "projects";
      if (careerSubTab === "certificates") return "certificates";
      return "experience";

    case "Contact":
      return "contact";

    case "Sections":
    case "Layout":
    case "SEO Settings":
    case "Analytics":
    case "Backup / Restore (JSON)":
    case "Home":
    default:
      return "";
  }
}

/* =========================================================
   ✅ Idle timer (15min)
========================================================= */
function useIdleLogout({ enabled, idleMs, onIdle }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onIdle?.(), idleMs);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [enabled, idleMs, onIdle]);
}

/* =========================================================
   ✅ Validation rules (block Save/Publish)
========================================================= */
function validatePortfolio(data) {
  const issues = [];
  const profile = data?.profile || {};
  const st = data?.siteTheme || {};
  const seo = st?.seo || {};
  const analytics = st?.analytics || {};
  const cf = st?.contactForm || {};
  const assets = data?.assets || {};

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  if (!String(profile.name || "").trim()) issues.push({ key: "profile.name", msg: "Name is required (Profile → Name)" });
  if (!String(profile.title || "").trim()) issues.push({ key: "profile.title", msg: "Title is required (Profile → Title)" });

  const email = String(profile.email || "").trim();
  if (!email) issues.push({ key: "profile.email", msg: "Email is required (Profile → Email)" });
  else if (!isEmail(email)) issues.push({ key: "profile.email", msg: "Email format is invalid (Profile → Email)" });

  if (!String(seo.siteTitle || "").trim()) issues.push({ key: "siteTheme.seo.siteTitle", msg: "SEO Site Title is required (SEO Settings)" });
  if (!String(seo.description || "").trim()) issues.push({ key: "siteTheme.seo.description", msg: "SEO Description is required (SEO Settings)" });

  if (String(cf.mode || "mailto") === "formspree" && !String(cf.formspreeEndpoint || "").trim()) {
    issues.push({ key: "siteTheme.contactForm.formspreeEndpoint", msg: "Formspree Endpoint required (Contact → Contact Form)" });
  }

  if (analytics?.enabled && String(analytics.provider || "plausible") === "ga4" && !String(analytics.gaMeasurementId || "").trim()) {
    issues.push({ key: "siteTheme.analytics.gaMeasurementId", msg: "GA4 Measurement ID required (Analytics)" });
  }

  if (!String(assets.photo || "").trim()) issues.push({ key: "assets.photo", msg: "Photo is empty (Profile → Assets)" });

  return issues;
}

/* =========================================================
   ✅ Global search (simple)
========================================================= */
function buildSearchIndex(data) {
  const idx = [];

  const push = (label, value, nav) => {
    const txt = String(value ?? "").trim();
    if (!txt) return;
    idx.push({ label, value: txt, nav });
  };

  const profile = data.profile || {};
  const assets = data.assets || {};
  const st = data.siteTheme || {};
  const seo = st.seo || {};
  const analytics = st.analytics || {};
  const cf = st.contactForm || {};

  // Profile
  push("Profile → Name", profile.name, { tab: "Profile" });
  push("Profile → Title", profile.title, { tab: "Profile" });
  push("Profile → Location", profile.location, { tab: "Profile" });
  push("Profile → Email", profile.email, { tab: "Profile" });
  push("Profile → WhatsApp", profile.whatsapp, { tab: "Profile" });
  push("Profile → LinkedIn", profile.linkedin, { tab: "Profile" });
  push("Profile → GitHub", profile.github, { tab: "Profile" });

  // Assets
  push("Assets → Photo", assets.photo, { tab: "Profile" });
  push("Assets → CV", assets.cv, { tab: "Profile" });
  push("Assets → OG Image", assets.ogImage, { tab: "Profile" });

  // Academic lists
  (data.education || []).forEach((e, i) => {
    push(`Education #${i + 1} → Degree`, e.degree, { tab: "Academic", academicSubTab: "education" });
    push(`Education #${i + 1} → Institution`, e.institution, { tab: "Academic", academicSubTab: "education" });
  });

  (data.technicalSkills || []).forEach((s, i) => push(`Tech Skill #${i + 1}`, s.text, { tab: "Academic", academicSubTab: "skills" }));
  (data.softSkills || []).forEach((s, i) => push(`Soft Skill #${i + 1}`, s.text, { tab: "Academic", academicSubTab: "skills" }));
  (data.businessDomains || []).forEach((s, i) => push(`Domain #${i + 1}`, s.text, { tab: "Academic", academicSubTab: "skills" }));

  // ✅ Toolkit now points to main tab
  (data.toolkit || []).forEach((t, i) => push(`Toolkit #${i + 1}`, `${t.label} ${t.icon || ""}`, { tab: "Expertise & Toolkit" }));

  // Career lists
  (data.workExperience || []).forEach((w, i) => push(`Experience #${i + 1}`, `${w.company} ${w.role} ${w.desc || ""}`, { tab: "Career", careerSubTab: "experience" }));
  (data.projects || []).forEach((p, i) =>
    push(`Project #${i + 1}`, `${p.title} ${p.desc || ""} ${(p.tags || []).join(" ")}`, { tab: "Career", careerSubTab: "projects" })
  );
  (data.certificates || []).forEach((c, i) => push(`Certificate #${i + 1}`, `${c.title} ${c.meta || ""}`, { tab: "Career", careerSubTab: "certificates" }));

  // SEO/Analytics/ContactForm
  push("SEO → Site Title", seo.siteTitle, { tab: "SEO Settings" });
  push("SEO → Description", seo.description, { tab: "SEO Settings" });
  push("SEO → OG Image", seo.ogImage, { tab: "SEO Settings" });

  push("Analytics → Provider", analytics.provider, { tab: "Analytics" });
  push("Analytics → Domain", analytics.plausibleDomain, { tab: "Analytics" });
  push("Analytics → GA ID", analytics.gaMeasurementId, { tab: "Analytics" });

  push("ContactForm → Mode", cf.mode, { tab: "Contact", contactSubTab: "form" });
  push("ContactForm → To Email", cf.toEmail, { tab: "Contact", contactSubTab: "form" });
  push("ContactForm → Subject", cf.subject, { tab: "Contact", contactSubTab: "form" });
  push("ContactForm → Formspree Endpoint", cf.formspreeEndpoint, { tab: "Contact", contactSubTab: "form" });

  return idx;
}

export default function AdminDashboard({ onLogout }) {
  // ✅ persist UI state across reload (same page)
  const initialUi = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(DASH_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // ✅ sanitize legacy state
  const initialTab = initialUi?.tab || "Home";
  const initialCareerSub = initialUi?.careerSubTab === "toolkit" ? "experience" : (initialUi?.careerSubTab || "experience");

  const [tab, setTab] = useState(initialTab);
  const [layoutSubTab, setLayoutSubTab] = useState(initialUi?.layoutSubTab || "design");
  const [academicSubTab, setAcademicSubTab] = useState(initialUi?.academicSubTab || "education");
  const [careerSubTab, setCareerSubTab] = useState(initialCareerSub);
  const [contactSubTab, setContactSubTab] = useState(initialUi?.contactSubTab || "cards");

  // ✅ Draft/Publish state
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const loadInitialData = () => {
    try {
      const rawDraft = localStorage.getItem(DRAFT_KEY);
      if (rawDraft) {
        setIsDraftLoaded(true);
        setHasDraft(true);
        return JSON.parse(rawDraft);
      }
    } catch {}
    setIsDraftLoaded(false);
    setHasDraft(false);
    return loadPortfolio();
  };

  const [data, setData] = useState(() => loadInitialData());
  const [savedNote, setSavedNote] = useState("");

  // ✅ Import JSON file input ref
  const importFileRef = useRef(null);

  const openImportPicker = () => importFileRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importPortfolioJsonFile(file);
      // put into editor
      setData(parsed);
      // store as draft to avoid overwriting published accidentally
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
        setHasDraft(true);
        setIsDraftLoaded(true);
      } catch {}
      setSavedNote("Imported file ✅ (Draft)");
      setTimeout(() => setSavedNote(""), 1400);
    } catch (err) {
      setSavedNote(err?.message || "Import failed");
      setTimeout(() => setSavedNote(""), 1600);
    } finally {
      e.target.value = "";
    }
  };

  // ✅ Undo stack
  const historyRef = useRef([]);
  const isUndoingRef = useRef(false);
  const [undoCount, setUndoCount] = useState(0);

  // ✅ Auto-save debounce
  const didMountRef = useRef(false);
  const autosaveTimerRef = useRef(null);

  // Preview split
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef(null);

  // ✅ reload control
  const [iframeKey, setIframeKey] = useState(0);

  // Backup/restore UI
  const [backupText, setBackupText] = useState("");

  // saved palettes
  const [savedPalettes, setSavedPalettesState] = useState(() => loadSavedPalettes());
  const [newPalName, setNewPalName] = useState("");
  const [newAccent, setNewAccent] = useState("#0ea5e9");
  const [newAccent2, setNewAccent2] = useState("#a855f7");

  // Global search
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setData(loadInitialData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        DASH_STATE_KEY,
        JSON.stringify({ tab, layoutSubTab, academicSubTab, careerSubTab, contactSubTab })
      );
    } catch {}
  }, [tab, layoutSubTab, academicSubTab, careerSubTab, contactSubTab]);

  useEffect(() => {
    const onPal = () => setSavedPalettesState(loadSavedPalettes());
    window.addEventListener("portfolio:palettes-updated", onPal);
    return () => window.removeEventListener("portfolio:palettes-updated", onPal);
  }, []);

  const siteUrl = useMemo(() => {
    try {
      return window.location.origin + (import.meta?.env?.BASE_URL || "/");
    } catch {
      return "";
    }
  }, []);

  const st = data.siteTheme || {};
  const seo = st.seo || {};
  const analytics = st.analytics || {};
  const cf = st.contactForm || {};
  const profile = data.profile || {};
  const assets = data.assets || {};

  // Ensure section settings defaults
  const sectionsState = useMemo(() => {
    const sec = st.sections || {};
    const order = Array.isArray(sec.order) && sec.order.length ? sec.order : SECTION_DEFS.map((s) => s.id);
    const hidden = sec.hidden && typeof sec.hidden === "object" ? sec.hidden : {};
    const normalized = [
      ...order.filter((id) => SECTION_DEFS.some((s) => s.id === id)),
      ...SECTION_DEFS.map((s) => s.id).filter((id) => !order.includes(id)),
    ];
    return { order: normalized, hidden };
  }, [st.sections]);

  // ✅ history-aware setData
  const commit = (makeNext) => {
    setData((prev) => {
      const prevSnap = deepClone(prev);
      const base = deepClone(prev);
      const next = makeNext(base);

      if (!isUndoingRef.current) {
        historyRef.current.push(prevSnap);
        if (historyRef.current.length > 60) historyRef.current.shift();
        setUndoCount(historyRef.current.length);
      }
      return next;
    });
  };

  const update = (path, value) => {
    commit((next) => {
      setByPath(next, path, value);
      return next;
    });
  };

  const updateListItem = (listPath, idx, patch) => {
    const arr = [...(getByPath(data, listPath) || [])];
    arr[idx] = { ...(arr[idx] || {}), ...patch };
    update(listPath, arr);
  };

  // ✅ Draft actions
  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setHasDraft(true);
      setIsDraftLoaded(true);
      setSavedNote("Draft saved ✅");
      setTimeout(() => setSavedNote(""), 1200);
    } catch {
      setSavedNote("Draft save failed");
      setTimeout(() => setSavedNote(""), 1200);
    }
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setIsDraftLoaded(false);
      setData(loadPortfolio());
      setSavedNote("Draft discarded ✅");
      setTimeout(() => setSavedNote(""), 1200);
    } catch {
      setSavedNote("Discard failed");
      setTimeout(() => setSavedNote(""), 1200);
    }
  };

  const publishNow = () => {
    const issues = validatePortfolio(data);
    if (issues.length) {
      setSavedNote(`Fix: ${issues[0].msg}`);
      setTimeout(() => setSavedNote(""), 2400);
      const key = issues[0].key;
      if (key.startsWith("profile.")) setTab("Profile");
      else if (key.startsWith("siteTheme.seo.")) setTab("SEO Settings");
      else if (key.startsWith("siteTheme.analytics.")) setTab("Analytics");
      else if (key.startsWith("siteTheme.contactForm.")) {
        setTab("Contact");
        setContactSubTab("form");
      }
      return;
    }

    savePortfolio(data);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setHasDraft(false);
    setIsDraftLoaded(false);
    setSavedNote("Published ✅");
    setTimeout(() => setSavedNote(""), 1400);
  };

  const onSave = () => {
    const issues = validatePortfolio(data);
    if (issues.length) {
      setSavedNote(`Fix: ${issues[0].msg}`);
      setTimeout(() => setSavedNote(""), 2400);
      const key = issues[0].key;
      if (key.startsWith("profile.")) setTab("Profile");
      else if (key.startsWith("siteTheme.seo.")) setTab("SEO Settings");
      else if (key.startsWith("siteTheme.analytics.")) setTab("Analytics");
      else if (key.startsWith("siteTheme.contactForm.")) {
        setTab("Contact");
        setContactSubTab("form");
      }
      return;
    }

    savePortfolio(data);
    setSavedNote("Saved ✅");
    setTimeout(() => setSavedNote(""), 1200);
  };

  const onReset = () => {
    commit(() => deepClone(DEFAULT_DATA));
    resetPortfolio();
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setHasDraft(false);
    setIsDraftLoaded(false);

    setSavedNote("Reset ✅");
    setTimeout(() => setSavedNote(""), 1200);
  };

  const onUndo = () => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current.pop();
    setUndoCount(historyRef.current.length);
    isUndoingRef.current = true;
    setData(prev);
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 0);
    setSavedNote("Undo ✅");
    setTimeout(() => setSavedNote(""), 900);
  };

  // ✅ Auto-save: Draft if draft mode active, otherwise savePortfolio
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      try {
        if (isDraftLoaded || hasDraft) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
          setHasDraft(true);
          setIsDraftLoaded(true);
          setSavedNote("Auto-saved Draft ✅");
        } else {
          savePortfolio(data);
          setSavedNote("Auto-saved ✅");
        }
      } catch {
        setSavedNote("Auto-save failed");
      }
      setTimeout(() => setSavedNote(""), 900);
    }, 900);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [data, isDraftLoaded, hasDraft]);

  // ✅ Idle logout 15 minutes (force save before logout)
  useIdleLogout({
    enabled: true,
    idleMs: 15 * 60 * 1000,
    onIdle: () => {
      try {
        if (isDraftLoaded || hasDraft) localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        else savePortfolio(data);
      } catch {}
      onLogout?.();
    },
  });

  /* =========================================================
     ✅ Preview split behavior
  ========================================================= */
  const previewSection = useMemo(() => tabToPreviewSection(tab, academicSubTab, careerSubTab), [tab, academicSubTab, careerSubTab]);

  const previewSrc = useMemo(() => {
    if (!siteUrl) return "";
    const q = previewSection ? `?preview=1&section=${encodeURIComponent(previewSection)}` : `?preview=1`;
    return `${siteUrl}${q}`;
  }, [siteUrl, previewSection]);

  useEffect(() => {
    const onMsg = (e) => {
      const msg = e?.data;
      if (!msg || msg.type !== "portfolio-preview-ready") return;
      setPreviewReady(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    if (!previewReady) return;
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "portfolio-preview", payload: data }, "*");
    } catch {}
  }, [data, previewOpen, previewReady]);

  useEffect(() => {
    if (!previewOpen) return;
    setPreviewReady(false);
    setIframeKey((k) => k + 1);
  }, [tab, academicSubTab, careerSubTab, previewOpen]);

  /* =========================================================
     ✅ Palettes
  ========================================================= */
  const choosePalette = (id, accent, accent2) => {
    update("siteTheme.palette", id);
    if (accent && accent2) {
      update("siteTheme.custom.accent", accent);
      update("siteTheme.custom.accent2", accent2);
    }
  };

  const saveNewPalette = () => {
    const name = String(newPalName || "").trim();
    if (!name) {
      setSavedNote("Palette name required");
      setTimeout(() => setSavedNote(""), 1200);
      return;
    }
    const next = [
      ...savedPalettes.filter((p) => p.name.toLowerCase() !== name.toLowerCase()),
      { name, accent: String(newAccent).trim(), accent2: String(newAccent2).trim() },
    ];
    setSavedPalettesState(next);
    saveSavedPalettes(next);

    choosePalette(`saved:${name}`, newAccent, newAccent2);
    setNewPalName("");
    setSavedNote("Palette saved ✅");
    setTimeout(() => setSavedNote(""), 1200);
  };

  const deleteSavedPalette = (name) => {
    const next = savedPalettes.filter((p) => p.name.toLowerCase() !== String(name).toLowerCase());
    setSavedPalettesState(next);
    saveSavedPalettes(next);

    if (String(st.palette || "") === `saved:${name}`) {
      choosePalette("ocean", "#0ea5e9", "#2563eb");
    }
  };

  /* =========================================================
     ✅ Backup/Restore
  ========================================================= */
  const exportJSON = () => {
    const txt = JSON.stringify(data, null, 2);
    setBackupText(txt);
    setSavedNote("Exported ✅");
    setTimeout(() => setSavedNote(""), 1200);
  };

  const copyBackup = async () => {
    try {
      await navigator.clipboard.writeText(backupText || JSON.stringify(data, null, 2));
      setSavedNote("Copied ✅");
      setTimeout(() => setSavedNote(""), 1200);
    } catch {
      setSavedNote("Copy failed");
      setTimeout(() => setSavedNote(""), 1200);
    }
  };

  const importJSON = () => {
    try {
      const parsed = JSON.parse(backupText);
      commit(() => parsed);
      setSavedNote("Imported ✅");
      setTimeout(() => setSavedNote(""), 1400);
    } catch {
      setSavedNote("Invalid JSON ❌");
      setTimeout(() => setSavedNote(""), 1400);
    }
  };

  const downloadBackup = () => {
    try {
      const txt = backupText || JSON.stringify(data, null, 2);
      const blob = new Blob([txt], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "portfolio-backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSavedNote("Downloaded ✅");
      setTimeout(() => setSavedNote(""), 1200);
    } catch {
      setSavedNote("Download failed");
      setTimeout(() => setSavedNote(""), 1200);
    }
  };

  // ✅ Export a "published" file (portfolio.json) to put into src/data/portfolio.json then commit
  const exportPublishedFile = () => {
    exportPortfolioJson(data, "portfolio.json");
    setSavedNote("Exported portfolio.json ✅");
    setTimeout(() => setSavedNote(""), 1200);
  };

  /* =========================================================
     ✅ Home helpers
  ========================================================= */
  const counts = useMemo(() => {
    const safeLen = (x) => (Array.isArray(x) ? x.length : 0);
    return {
      education: safeLen(data.education),
      technicalSkills: safeLen(data.technicalSkills),
      softSkills: safeLen(data.softSkills),
      businessDomains: safeLen(data.businessDomains),
      aboutCertifications: safeLen(data.aboutCertifications),
      toolkit: safeLen(data.toolkit),
      workExperience: safeLen(data.workExperience),
      projects: safeLen(data.projects),
      certificates: safeLen(data.certificates),
      contactCards: safeLen(data.contactCards),
      floatingButtons: safeLen(data.floatingButtons),
    };
  }, [data]);

  const validationIssues = useMemo(() => validatePortfolio(data), [data]);

  const goAcademic = (sub) => {
    setTab("Academic");
    setAcademicSubTab(sub);
  };

  const goToolkit = () => setTab("Expertise & Toolkit");

  const goCareer = (sub) => {
    setTab("Career");
    setCareerSubTab(sub);
  };

  // Search index + results
  const searchIndex = useMemo(() => buildSearchIndex(data), [data]);
  const searchResults = useMemo(() => {
    const q = String(searchQ || "").trim().toLowerCase();
    if (!q) return [];
    const hits = searchIndex
      .map((it) => {
        const hay = `${it.label} ${it.value}`.toLowerCase();
        const score = hay.includes(q) ? 1 : 0;
        return score ? it : null;
      })
      .filter(Boolean);
    return hits.slice(0, 12);
  }, [searchIndex, searchQ]);

  const jumpTo = (nav) => {
    if (!nav) return;
    setSearchOpen(false);
    setSearchQ("");
    if (nav.tab) setTab(nav.tab);
    if (nav.academicSubTab) setAcademicSubTab(nav.academicSubTab);
    if (nav.careerSubTab) setCareerSubTab(nav.careerSubTab);
    if (nav.contactSubTab) setContactSubTab(nav.contactSubTab);
  };

  /* =========================================================
     ✅ Section Manager actions + Drag & Drop FIX
  ========================================================= */
  const setSectionOrder = (nextOrder) => update("siteTheme.sections.order", nextOrder);

  const toggleSectionHidden = (id, hidden) => {
    const nextHidden = { ...(sectionsState.hidden || {}) };
    nextHidden[id] = !!hidden;
    update("siteTheme.sections.hidden", nextHidden);
  };

  const [secDragIndex, setSecDragIndex] = useState(null);
  const [secOverIndex, setSecOverIndex] = useState(null);

  const onSecDragStart = (idx) => setSecDragIndex(idx);
  const onSecDragOver = (idx, e) => {
    e.preventDefault();
    setSecOverIndex(idx);
  };
  const onSecDrop = (idx) => {
    if (secDragIndex === null || secDragIndex === undefined) return;
    if (idx === secDragIndex) return;
    setSectionOrder(reorder(sectionsState.order, secDragIndex, idx));
    setSecDragIndex(null);
    setSecOverIndex(null);
  };

  return (
    <div className="admin-root">
      {/* hidden file input for importing json file */}
      <input
        ref={importFileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      <div className="dash-wrap">
        <header className="dash-header">
          <div className="dash-brand">
            <div className="dash-title" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              Admin Dashboard
              {isDraftLoaded || hasDraft ? (
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(255,180,0,0.14)",
                    border: "1px solid rgba(255,180,0,0.24)",
                    opacity: 0.95,
                  }}
                  title="You are editing a Draft (safe). Publish when ready."
                >
                  DRAFT
                </span>
              ) : null}
            </div>
            <div className="dash-sub">Auto-Save + Undo + Split Preview. Draft/Publish + Validation + Section Manager + Global Search.</div>
          </div>

          <div className="dash-actions">
            {savedNote ? <div className="dash-saved">{savedNote}</div> : null}

            <SmallBtn onClick={() => setSearchOpen((v) => !v)} title="Search & jump to fields">
              Search
            </SmallBtn>

            <SmallBtn onClick={onUndo} disabled={!undoCount}>
              Undo
            </SmallBtn>

            <SmallBtn onClick={onReset} variant="danger">
              Reset
            </SmallBtn>

            <SmallBtn onClick={saveDraft} title="Save changes as Draft (safe)">
              Save Draft
            </SmallBtn>

            <SmallBtn onClick={publishNow} variant="primary" title="Publish (validates first)">
              Publish
            </SmallBtn>

            <SmallBtn onClick={onSave} title="Save to main storage (blocked by validation)">
              Save
            </SmallBtn>

            <SmallBtn onClick={exportPublishedFile} title="Download portfolio.json to commit into src/data/portfolio.json">
              Export Published JSON
            </SmallBtn>

            <SmallBtn onClick={openImportPicker} title="Import JSON file into dashboard (saved as Draft)">
              Import JSON File
            </SmallBtn>

            <SmallBtn
              onClick={() => {
                setPreviewOpen((v) => !v);
                setPreviewReady(false);
                setIframeKey((k) => k + 1);
              }}
            >
              {previewOpen ? "Close Preview" : "Preview (Split)"}
            </SmallBtn>

            <a className="dash-btn" href={siteUrl} target="_blank" rel="noreferrer">
              Open Site
            </a>
          </div>
        </header>

        {/* Search panel */}
        {searchOpen ? (
          <div className="dash-card" style={{ marginBottom: 14 }}>
            <div className="dash-card-head">
              <div className="dash-card-title">Global Search</div>
              <div style={{ display: "flex", gap: 8 }}>
                <SmallBtn onClick={() => setSearchOpen(false)} variant="danger">
                  Close
                </SmallBtn>
              </div>
            </div>
            <div className="dash-card-body">
              <TextInput label="Search" value={searchQ} onChange={(v) => setSearchQ(v)} placeholder='Type like: "jira", "gmail", "project", "G-XXXX"...' />
              {searchQ && searchResults.length === 0 ? <div className="dash-empty" style={{ marginTop: 10 }}>No results.</div> : null}
              {searchResults.length ? (
                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {searchResults.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.10)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, opacity: 0.95 }}>{r.label}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.value}
                        </div>
                      </div>
                      <SmallBtn onClick={() => jumpTo(r.nav)} variant="primary">
                        Go
                      </SmallBtn>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="dash-hint" style={{ marginTop: 10 }}>Search بيوديك بسرعة للـ Tab/SubTab اللي فيه القيمة.</div>
            </div>
          </div>
        ) : null}

        {/* ✅ split layout */}
        <div className={`dash-main ${previewOpen ? "is-split" : ""}`} style={previewOpen ? { display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 16 } : undefined}>
          <aside className="dash-tabs">
            {TABS.map((t) => (
              <button key={t} className={`dash-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} type="button">
                {t}
              </button>
            ))}
          </aside>

          <section className="dash-content">
            {/* ========================= Home ========================= */}
            {tab === "Home" && (
              <>
                <Card
                  title="Quick Actions"
                  right={
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <SmallBtn variant="primary" onClick={publishNow} title="Validate then publish">
                        Publish
                      </SmallBtn>
                      <SmallBtn onClick={saveDraft} title="Save as Draft (safe)">
                        Save Draft
                      </SmallBtn>
                      {hasDraft || isDraftLoaded ? (
                        <SmallBtn onClick={discardDraft} variant="danger" title="Discard draft and reload published">
                          Discard Draft
                        </SmallBtn>
                      ) : null}
                      <SmallBtn onClick={exportJSON}>Export JSON</SmallBtn>
                      <SmallBtn onClick={copyBackup}>Copy JSON</SmallBtn>

                      {/* ✅ NEW */}
                      <SmallBtn onClick={exportPublishedFile} title="Download portfolio.json to commit into src/data/portfolio.json">
                        Export Published JSON
                      </SmallBtn>
                      <SmallBtn onClick={openImportPicker} title="Import JSON file into dashboard (saved as Draft)">
                        Import JSON File
                      </SmallBtn>
                    </div>
                  }
                >
                  <div className="dash-grid">
                    <div className="dash-empty">
                      ✅ Auto-Save شغال — لو Draft Mode شغال، الـ Auto-Save بيحفظ Draft (آمن). لو مش شغال، بيحفظ مباشرة.
                    </div>
                    <div className="dash-empty">
                      Preview بيعرض Live تغييراتك فورًا (حتى قبل Publish). <br />
                      Open Site بيفتح النسخة المنشورة.
                    </div>
                  </div>

                  <div className="mt-4" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <SmallBtn onClick={() => setTab("Profile")}>Go: Profile</SmallBtn>

                    <SmallBtn onClick={() => goAcademic("education")}>Go: Academic → Education</SmallBtn>
                    <SmallBtn onClick={() => goAcademic("skills")}>Go: Academic → Skills</SmallBtn>

                    {/* ✅ NEW */}
                    <SmallBtn onClick={goToolkit}>Go: Expertise & Toolkit</SmallBtn>

                    <SmallBtn onClick={() => goCareer("experience")}>Go: Career → Experience</SmallBtn>
                    <SmallBtn onClick={() => goCareer("projects")}>Go: Career → Projects</SmallBtn>
                    <SmallBtn onClick={() => goCareer("certificates")}>Go: Career → Certificates</SmallBtn>

                    <SmallBtn
                      onClick={() => {
                        setTab("Layout");
                        setLayoutSubTab("design");
                      }}
                    >
                      Go: Layout
                    </SmallBtn>

                    <SmallBtn onClick={() => setTab("SEO Settings")}>Go: SEO</SmallBtn>
                    <SmallBtn onClick={() => setTab("Analytics")}>Go: Analytics</SmallBtn>
                    <SmallBtn onClick={() => setTab("Backup / Restore (JSON)")}>Go: Backup</SmallBtn>
                    <SmallBtn onClick={() => setTab("Sections")}>Go: Sections Setting</SmallBtn>

                    <SmallBtn variant="danger" onClick={onLogout}>
                      Logout
                    </SmallBtn>
                  </div>

                  <div className="dash-hint" style={{ marginTop: 10 }}>
                    ✅ عشان الداتا تظهر لكل الأجهزة: اضغط <b>Export Published JSON</b> ثم خُد الملف وحطّه في <b>src/data/portfolio.json</b> واعمل commit + push.
                  </div>
                </Card>

                <Card title="Current Summary">
                  <div className="dash-grid">
                    <div className="dash-empty">
                      <b>Name:</b> {profile.name || "(empty)"}
                    </div>
                    <div className="dash-empty">
                      <b>Title:</b> {profile.title || "(empty)"}
                    </div>
                    <div className="dash-empty">
                      <b>Email:</b> {profile.email || "(empty)"}
                    </div>
                  </div>
                </Card>

                <Card title="Quick Stats">
                  <div className="dash-grid">
                    <div className="dash-empty">
                      <b>Education:</b> {counts.education}
                    </div>
                    <div className="dash-empty">
                      <b>Skills (Tech / Soft / Domains):</b> {counts.technicalSkills} / {counts.softSkills} / {counts.businessDomains}
                    </div>
                    <div className="dash-empty">
                      <b>Toolkit:</b> {counts.toolkit}
                    </div>
                    <div className="dash-empty">
                      <b>Experience:</b> {counts.workExperience}
                    </div>
                    <div className="dash-empty">
                      <b>Projects:</b> {counts.projects}
                    </div>
                    <div className="dash-empty">
                      <b>Certificates:</b> {counts.certificates}
                    </div>
                    <div className="dash-empty">
                      <b>Contact Cards / Floating Buttons:</b> {counts.contactCards} / {counts.floatingButtons}
                    </div>
                  </div>
                </Card>

                <Card title="Validation (Blocks Save/Publish)">
                  {validationIssues.length === 0 ? (
                    <div className="dash-empty">✅ No blocking issues.</div>
                  ) : (
                    <div className="dash-empty">
                      <b>Fix these first:</b>
                      <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                        {validationIssues.slice(0, 8).map((x, i) => (
                          <li key={i}>{x.msg}</li>
                        ))}
                      </ul>
                      <div className="dash-hint">Save / Publish مش هيشتغلوا لو فيه errors.</div>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* ========================= Profile ========================= */}
            {tab === "Profile" && (
              <>
                <Card title="Profile Info">
                  <div className="dash-grid">
                    <TextInput label="Name" value={profile.name} onChange={(v) => update("profile.name", v)} />
                    <TextInput label="Title" value={profile.title} onChange={(v) => update("profile.title", v)} />
                    <TextInput label="Location" value={profile.location} onChange={(v) => update("profile.location", v)} />
                    <TextInput label="Email" value={profile.email} onChange={(v) => update("profile.email", v)} />

                    <TextInput label="WhatsApp" value={profile.whatsapp} onChange={(v) => update("profile.whatsapp", v)} placeholder="+20..." />
                    <TextInput label="LinkedIn URL" value={profile.linkedin} onChange={(v) => update("profile.linkedin", v)} />
                    <TextInput label="GitHub URL" value={profile.github} onChange={(v) => update("profile.github", v)} />

                    <TextInput label="Instagram URL" value={profile.instagram} onChange={(v) => update("profile.instagram", v)} />
                    <TextInput label="Facebook URL" value={profile.facebook} onChange={(v) => update("profile.facebook", v)} />
                    <TextInput label="Telegram URL" value={profile.telegram} onChange={(v) => update("profile.telegram", v)} />
                    <TextInput label="TikTok URL" value={profile.tiktok} onChange={(v) => update("profile.tiktok", v)} />
                  </div>

                  <div className="mt-4">
                    <TextArea label="Summary" value={profile.summary} onChange={(v) => update("profile.summary", v)} rows={5} />
                  </div>
                </Card>

                <Card title="Assets (Upload from dashboard)">
                  <div className="dash-grid">
                    <ImageDropInput label="Photo (Upload / Drag & Drop)" value={assets.photo} onChange={(v) => update("assets.photo", v)} />
                    <ImageDropInput label="OG Image (Upload / Drag & Drop)" value={assets.ogImage} onChange={(v) => update("assets.ogImage", v)} />

                    <FileDropInput
                      label="CV (PDF) — Upload or Path/URL"
                      value={assets.cv}
                      onChange={(v) => update("assets.cv", v)}
                      accept="application/pdf"
                      maxSizeMB={5}
                      hint="Drag & drop CV.pdf (<= 5MB) or click to pick. For bigger files, use a path/URL."
                    />
                  </div>
                </Card>
              </>
            )}

            {/* ========================= Academic ========================= */}
            {tab === "Academic" && (
              <>
                <div className="dash-subtabs" style={{ marginBottom: 10 }}>
                  {ACADEMIC_SUBTABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dash-subtab ${academicSubTab === t.id ? "active" : ""}`}
                      onClick={() => setAcademicSubTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {academicSubTab === "education" && (
                  <ListEditor
                    title="Education"
                    items={data.education || []}
                    setItems={(v) => update("education", v)}
                    makeDefaultItem={() => ({ degree: "", institution: "", details: "", date: "", hidden: false })}
                    renderItem={(it, idx) => (
                      <>
                        <div className="dash-grid">
                          <TextInput
                            label="Degree"
                            value={it.degree}
                            onChange={(v) => updateListItem("education", idx, { degree: v })}
                            placeholder="Bachelor of ..."
                          />
                          <TextInput
                            label="Institution"
                            value={it.institution}
                            onChange={(v) => updateListItem("education", idx, { institution: v })}
                            placeholder="University / Institute"
                          />
                          <TextInput label="Date" value={it.date} onChange={(v) => updateListItem("education", idx, { date: v })} placeholder="2019 - 2023" />
                        </div>
                        <div className="mt-4">
                          <TextArea
                            label="Details (optional)"
                            value={it.details}
                            onChange={(v) => updateListItem("education", idx, { details: v })}
                            rows={3}
                            placeholder="Major, GPA, notes..."
                          />
                        </div>
                      </>
                    )}
                  />
                )}

                {academicSubTab === "skills" && (
                  <>
                    <ListEditor
                      title="Technical Skills"
                      items={data.technicalSkills || []}
                      setItems={(v) => update("technicalSkills", v)}
                      makeDefaultItem={() => ({ text: "", hidden: false })}
                      renderItem={(it, idx) => (
                        <TextInput
                          label={`Skill #${idx + 1}`}
                          value={it.text ?? ""}
                          onChange={(v) => {
                            const arr = [...(data.technicalSkills || [])];
                            arr[idx] = { ...(arr[idx] || {}), text: v };
                            update("technicalSkills", arr);
                          }}
                        />
                      )}
                    />

                    <ListEditor
                      title="Soft Skills"
                      items={data.softSkills || []}
                      setItems={(v) => update("softSkills", v)}
                      makeDefaultItem={() => ({ text: "", hidden: false })}
                      renderItem={(it, idx) => (
                        <TextInput
                          label={`Soft Skill #${idx + 1}`}
                          value={it.text ?? ""}
                          onChange={(v) => {
                            const arr = [...(data.softSkills || [])];
                            arr[idx] = { ...(arr[idx] || {}), text: v };
                            update("softSkills", arr);
                          }}
                        />
                      )}
                    />

                    <ListEditor
                      title="Business Domains"
                      items={data.businessDomains || []}
                      setItems={(v) => update("businessDomains", v)}
                      makeDefaultItem={() => ({ text: "", hidden: false })}
                      renderItem={(it, idx) => (
                        <TextInput
                          label={`Domain #${idx + 1}`}
                          value={it.text ?? ""}
                          onChange={(v) => {
                            const arr = [...(data.businessDomains || [])];
                            arr[idx] = { ...(arr[idx] || {}), text: v };
                            update("businessDomains", arr);
                          }}
                        />
                      )}
                    />

                    <ListEditor
                      title="About Certifications"
                      items={data.aboutCertifications || []}
                      setItems={(v) => update("aboutCertifications", v)}
                      makeDefaultItem={() => ({ title: "", date: "", hidden: false })}
                      renderItem={(it, idx) => (
                        <div className="dash-grid">
                          <TextInput label="Title" value={it.title} onChange={(v) => updateListItem("aboutCertifications", idx, { title: v })} />
                          <TextInput label="Date" value={it.date} onChange={(v) => updateListItem("aboutCertifications", idx, { date: v })} />
                        </div>
                      )}
                    />
                  </>
                )}
              </>
            )}

            {/* ========================= Expertise & Toolkit (NEW MAIN TAB) ========================= */}
            {tab === "Expertise & Toolkit" && (
              <ListEditor
                title="Expertise & Toolkit (Logos Slider)"
                items={data.toolkit || []}
                setItems={(v) => update("toolkit", v)}
                makeDefaultItem={() => ({ label: "", icon: "", hidden: false })}
                renderItem={(it, idx) => (
                  <div className="dash-grid">
                    <TextInput
                      label="Tool Label"
                      value={it.label}
                      onChange={(v) => updateListItem("toolkit", idx, { label: v })}
                      placeholder="Jira / Postman / Cypress ..."
                    />

                    <ImageDropInput
                      label="Icon / Logo (Upload)"
                      value={it.icon}
                      onChange={(v) => updateListItem("toolkit", idx, { icon: v })}
                      hint="Drop an icon/logo (png/svg via image) or click."
                    />
                  </div>
                )}
              />
            )}

            {/* ========================= Career ========================= */}
            {tab === "Career" && (
              <>
                <div className="dash-subtabs" style={{ marginBottom: 10 }}>
                  {CAREER_SUBTABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dash-subtab ${careerSubTab === t.id ? "active" : ""}`}
                      onClick={() => setCareerSubTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {careerSubTab === "experience" && (
                  <ListEditor
                    title="Work Experience"
                    items={data.workExperience || []}
                    setItems={(v) => update("workExperience", v)}
                    makeDefaultItem={() => ({
                      company: "",
                      role: "",
                      date: "",
                      location: "",
                      type: "",
                      desc: "",
                      align: "left",
                      hidden: false,
                    })}
                    renderItem={(it, idx) => (
                      <>
                        <div className="dash-grid">
                          <TextInput label="Company" value={it.company} onChange={(v) => updateListItem("workExperience", idx, { company: v })} />
                          <TextInput label="Role" value={it.role} onChange={(v) => updateListItem("workExperience", idx, { role: v })} />
                          <TextInput label="Date" value={it.date} onChange={(v) => updateListItem("workExperience", idx, { date: v })} />
                          <TextInput label="Location" value={it.location} onChange={(v) => updateListItem("workExperience", idx, { location: v })} />
                          <TextInput label="Type" value={it.type} onChange={(v) => updateListItem("workExperience", idx, { type: v })} />
                          <TextInput label="Align (left/right)" value={it.align} onChange={(v) => updateListItem("workExperience", idx, { align: v })} placeholder="left" />
                        </div>
                        <div className="mt-4">
                          <TextArea label="Description" value={it.desc} onChange={(v) => updateListItem("workExperience", idx, { desc: v })} rows={4} />
                        </div>
                      </>
                    )}
                  />
                )}

                {careerSubTab === "projects" && (
                  <ListEditor
                    title="Projects (✅ Tags supported)"
                    items={data.projects || []}
                    setItems={(v) => update("projects", v)}
                    makeDefaultItem={() => ({ title: "", desc: "", image: "", link: "", tags: [], hidden: false })}
                    renderItem={(it, idx) => (
                      <>
                        <div className="dash-grid">
                          <TextInput label="Title" value={it.title} onChange={(v) => updateListItem("projects", idx, { title: v })} />
                          <TextInput label="Link" value={it.link} onChange={(v) => updateListItem("projects", idx, { link: v })} placeholder="https://..." />

                          <ImageDropInput
                            label="Project Image (Upload)"
                            value={it.image}
                            onChange={(v) => updateListItem("projects", idx, { image: v })}
                            hint="Drop project cover image or click."
                          />

                          <TextInput
                            label="Tags (comma separated)"
                            value={Array.isArray(it.tags) ? it.tags.join(", ") : it.tags || ""}
                            onChange={(v) => {
                              const tags = v.split(",").map((x) => x.trim()).filter(Boolean);
                              updateListItem("projects", idx, { tags });
                            }}
                            placeholder="Manual, API, Web, Mobile"
                          />
                        </div>
                        <div className="mt-4">
                          <TextArea label="Description" value={it.desc} onChange={(v) => updateListItem("projects", idx, { desc: v })} rows={4} />
                        </div>
                      </>
                    )}
                  />
                )}

                {careerSubTab === "certificates" && (
                  <ListEditor
                    title="Certificates"
                    items={data.certificates || []}
                    setItems={(v) => update("certificates", v)}
                    makeDefaultItem={() => ({ title: "", meta: "", img: "", hidden: false })}
                    renderItem={(it, idx) => (
                      <div className="dash-grid">
                        <TextInput label="Title" value={it.title} onChange={(v) => updateListItem("certificates", idx, { title: v })} />
                        <TextInput label="Meta" value={it.meta} onChange={(v) => updateListItem("certificates", idx, { meta: v })} />
                        <ImageDropInput
                          label="Certificate Image (Upload)"
                          value={it.img}
                          onChange={(v) => updateListItem("certificates", idx, { img: v })}
                          hint="Drop certificate image or click."
                        />
                      </div>
                    )}
                  />
                )}
              </>
            )}

            {/* ========================= Contact ========================= */}
            {tab === "Contact" && (
              <>
                <div className="dash-subtabs" style={{ marginBottom: 10 }}>
                  {CONTACT_SUBTABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dash-subtab ${contactSubTab === t.id ? "active" : ""}`}
                      onClick={() => setContactSubTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {contactSubTab === "cards" && (
                  <>
                    <ListEditor
                      title="Contact Cards (✅ Drag & Drop reorder)"
                      items={data.contactCards || []}
                      setItems={(v) => update("contactCards", v)}
                      makeDefaultItem={() => ({
                        title: "",
                        button: "Open",
                        btnClass: "btn glass",
                        url: "",
                        iconUrl: "",
                        hidden: false,
                      })}
                      renderItem={(it, idx) => (
                        <>
                          <div className="dash-grid">
                            <TextInput label="Title" value={it.title} onChange={(v) => updateListItem("contactCards", idx, { title: v })} />
                            <TextInput label="Button Text" value={it.button} onChange={(v) => updateListItem("contactCards", idx, { button: v })} />
                            <TextInput label="URL" value={it.url} onChange={(v) => updateListItem("contactCards", idx, { url: v })} />
                          </div>

                          <div className="mt-4 dash-grid">
                            <ButtonClassPicker
                              value={it.btnClass}
                              onChange={(v) => updateListItem("contactCards", idx, { btnClass: v })}
                            />

                            <ImageDropInput
                              label="Icon (Upload)"
                              value={it.iconUrl}
                              onChange={(v) => updateListItem("contactCards", idx, { iconUrl: v })}
                              hint="Drop an icon/logo image or click."
                            />
                          </div>
                        </>
                      )}
                    />

                    <ListEditor
                      title="Floating Buttons (✅ Drag & Drop reorder)"
                      items={data.floatingButtons || []}
                      setItems={(v) => update("floatingButtons", v)}
                      makeDefaultItem={() => ({ title: "", url: "", iconUrl: "", hidden: false })}
                      renderItem={(it, idx) => (
                        <>
                          <div className="dash-grid">
                            <TextInput label="Title" value={it.title} onChange={(v) => updateListItem("floatingButtons", idx, { title: v })} />
                            <TextInput label="URL" value={it.url} onChange={(v) => updateListItem("floatingButtons", idx, { url: v })} />
                          </div>

                          <div className="mt-4">
                            <ImageDropInput
                              label="Icon (Upload)"
                              value={it.iconUrl}
                              onChange={(v) => updateListItem("floatingButtons", idx, { iconUrl: v })}
                              hint="Drop an icon/logo image or click."
                            />
                          </div>
                        </>
                      )}
                    />
                  </>
                )}

                {contactSubTab === "form" && (
                  <Card title="✅ Contact Form Settings">
                    <div className="dash-grid">
                      <TextInput
                        label="To Email (optional)"
                        value={cf.toEmail}
                        onChange={(v) => update("siteTheme.contactForm.toEmail", v)}
                        placeholder="leave empty to use profile email"
                      />
                      <TextInput
                        label="Subject"
                        value={cf.subject}
                        onChange={(v) => update("siteTheme.contactForm.subject", v)}
                        placeholder="Portfolio Contact"
                      />
                    </div>

                    <div className="mt-4 dash-grid">
                      <label className="dash-field">
                        <div className="dash-label">Mode</div>
                        <select className="dash-input" value={cf.mode || "mailto"} onChange={(e) => update("siteTheme.contactForm.mode", e.target.value)}>
                          <option value="mailto">mailto (default)</option>
                          <option value="formspree">Formspree</option>
                        </select>
                      </label>

                      <TextInput
                        label="Formspree Endpoint"
                        value={cf.formspreeEndpoint}
                        onChange={(v) => update("siteTheme.contactForm.formspreeEndpoint", v)}
                        placeholder="https://formspree.io/f/xxxxxxx"
                      />
                    </div>

                    <div className="dash-hint">If you choose Formspree, create a form there and paste the endpoint.</div>
                  </Card>
                )}
              </>
            )}

            {/* ========================= Layout ========================= */}
            {tab === "Layout" && (
              <>
                <div className="dash-subtabs" style={{ marginBottom: 10 }}>
                  {LAYOUT_SUBTABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dash-subtab ${layoutSubTab === t.id ? "active" : ""}`}
                      onClick={() => setLayoutSubTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {layoutSubTab === "design" && (
                  <Card title="Design / Layout (Preview shows full site here)">
                    <div className="dash-grid">
                      <label className="dash-field">
                        <div className="dash-label">Avatar Style</div>
                        <select className="dash-input" value={st.avatarStyle || "circle"} onChange={(e) => update("siteTheme.avatarStyle", e.target.value)}>
                          <option value="circle">circle</option>
                          <option value="rounded">rounded</option>
                          <option value="square">square</option>
                          <option value="hex">hex</option>
                          <option value="soft">soft</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Style Preset</div>
                        <select className="dash-input" value={st.style?.preset || "default"} onChange={(e) => update("siteTheme.style.preset", e.target.value)}>
                          <option value="default">default</option>
                          <option value="minimal">minimal</option>
                          <option value="bold">bold</option>
                          <option value="modern">modern</option>
                          <option value="neon">neon</option>
                          <option value="elegant">elegant</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Cards</div>
                        <select className="dash-input" value={st.style?.cards || "glass"} onChange={(e) => update("siteTheme.style.cards", e.target.value)}>
                          <option value="glass">glass</option>
                          <option value="solid">solid</option>
                          <option value="outline">outline</option>
                          <option value="soft">soft</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Density</div>
                        <select className="dash-input" value={st.density || "comfortable"} onChange={(e) => update("siteTheme.density", e.target.value)}>
                          <option value="comfortable">comfortable</option>
                          <option value="compact">compact</option>
                          <option value="spacious">spacious</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Projects Layout</div>
                        <select className="dash-input" value={st.layout?.projects || "grid"} onChange={(e) => update("siteTheme.layout.projects", e.target.value)}>
                          <option value="grid">grid</option>
                          <option value="list">list</option>
                          <option value="masonry">masonry</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Certificates Layout</div>
                        <select className="dash-input" value={st.layout?.certificates || "grid"} onChange={(e) => update("siteTheme.layout.certificates", e.target.value)}>
                          <option value="grid">grid</option>
                          <option value="list">list</option>
                          <option value="carousel">carousel</option>
                        </select>
                      </label>

                      <label className="dash-field">
                        <div className="dash-label">Experience Layout</div>
                        <select className="dash-input" value={st.layout?.experience || "timeline"} onChange={(e) => update("siteTheme.layout.experience", e.target.value)}>
                          <option value="timeline">timeline</option>
                          <option value="cards">cards</option>
                          <option value="compact">compact</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-5 dash-grid">
                      <ColorInput label="BG Light 1" value={st.background?.light1} onChange={(v) => update("siteTheme.background.light1", v)} placeholder="#f6fbff" />
                      <ColorInput label="BG Light 2" value={st.background?.light2} onChange={(v) => update("siteTheme.background.light2", v)} placeholder="#eef6ff" />
                      <ColorInput label="BG Dark 1" value={st.background?.dark1} onChange={(v) => update("siteTheme.background.dark1", v)} placeholder="#070b14" />
                      <ColorInput label="BG Dark 2" value={st.background?.dark2} onChange={(v) => update("siteTheme.background.dark2", v)} placeholder="#0a1022" />
                    </div>

                    <div className="dash-hint">
                      Preview في Layout → Design بيعرض الموقع كله عشان تشوف تأثير الألوان/اللاي آوت على كل السيكشنز.
                      <br />
                      ملاحظة: بعض الـ options الجديدة تحتاج CSS/renderer في App.jsx عشان تبان.
                    </div>
                  </Card>
                )}

                {layoutSubTab === "theme" && (
                  <Card title="Theme Colors (Pick by clicking)">
                    <div className="palette-grid">
                      {PRESET_PALETTES.map((p) => (
                        <PaletteTile
                          key={p.id}
                          name={p.name || p.id}
                          accent={p.accent}
                          accent2={p.accent2}
                          selected={String(st.palette || "") === p.id}
                          onClick={() => choosePalette(p.id, p.accent, p.accent2)}
                        />
                      ))}
                    </div>

                    <div className="dash-divider" />

                    <div className="dash-label" style={{ marginBottom: 8 }}>
                      Saved Palettes
                    </div>

                    {savedPalettes.length === 0 ? (
                      <div className="dash-empty">No saved palettes yet.</div>
                    ) : (
                      <div className="palette-grid">
                        {savedPalettes.map((p) => (
                          <div key={p.name} className="palette-saved-wrap">
                            <PaletteTile
                              name={p.name}
                              accent={p.accent}
                              accent2={p.accent2}
                              selected={String(st.palette || "") === `saved:${p.name}`}
                              onClick={() => choosePalette(`saved:${p.name}`, p.accent, p.accent2)}
                              badge="saved"
                            />
                            <button type="button" className="palette-del" onClick={() => deleteSavedPalette(p.name)}>
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="dash-divider" />

                    <div className="dash-label" style={{ marginBottom: 8 }}>
                      Add New Palette (and keep it)
                    </div>

                    <div className="dash-grid">
                      <TextInput label="Palette Name" value={newPalName} onChange={setNewPalName} placeholder="My Colors" />
                      <div className="dash-color-row">
                        <label className="dash-field">
                          <div className="dash-label">Accent</div>
                          <div className="dash-color-pick">
                            <input type="color" value={newAccent} onChange={(e) => setNewAccent(e.target.value)} />
                            <input className="dash-input" value={newAccent} onChange={(e) => setNewAccent(e.target.value)} placeholder="#0ea5e9" />
                          </div>
                        </label>

                        <label className="dash-field">
                          <div className="dash-label">Accent 2</div>
                          <div className="dash-color-pick">
                            <input type="color" value={newAccent2} onChange={(e) => setNewAccent2(e.target.value)} />
                            <input className="dash-input" value={newAccent2} onChange={(e) => setNewAccent2(e.target.value)} placeholder="#a855f7" />
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="mt-3">
                      <SmallBtn variant="primary" onClick={saveNewPalette}>
                        Save Palette
                      </SmallBtn>
                      <SmallBtn onClick={() => choosePalette("custom", newAccent, newAccent2)}>Preview as Custom</SmallBtn>
                    </div>

                    <div className="dash-hint">Saved palettes are stored in your browser localStorage and will remain available later.</div>
                  </Card>
                )}
              </>
            )}

            {/* ========================= SEO Settings ========================= */}
            {tab === "SEO Settings" && (
              <Card title="✅ SEO Settings">
                <div className="dash-grid">
                  <TextInput label="Site Title" value={seo.siteTitle} onChange={(v) => update("siteTheme.seo.siteTitle", v)} placeholder="Your Name | QA Engineer" />
                  <TextInput label="Description" value={seo.description} onChange={(v) => update("siteTheme.seo.description", v)} placeholder="Short SEO description..." />
                  <ImageDropInput
                    label="OG Image (Upload) or Path"
                    value={seo.ogImage}
                    onChange={(v) => update("siteTheme.seo.ogImage", v)}
                    hint="Drop OG image or click."
                  />
                </div>
                <div className="dash-hint">These update meta tags dynamically (OpenGraph + Twitter).</div>
              </Card>
            )}

            {/* ========================= Analytics ========================= */}
            {tab === "Analytics" && (
              <Card title="✅ Analytics">
                <Switch label="Enable Analytics" checked={analytics.enabled} onChange={(v) => update("siteTheme.analytics.enabled", v)} />

                <div className="mt-4 dash-grid">
                  <label className="dash-field">
                    <div className="dash-label">Provider</div>
                    <select className="dash-input" value={analytics.provider || "plausible"} onChange={(e) => update("siteTheme.analytics.provider", e.target.value)}>
                      <option value="plausible">Plausible</option>
                      <option value="ga4">Google Analytics 4</option>
                    </select>
                  </label>

                  <TextInput label="Plausible Domain" value={analytics.plausibleDomain} onChange={(v) => update("siteTheme.analytics.plausibleDomain", v)} placeholder="yourdomain.com" />
                  <TextInput label="GA4 Measurement ID" value={analytics.gaMeasurementId} onChange={(v) => update("siteTheme.analytics.gaMeasurementId", v)} placeholder="G-XXXXXXXXXX" />
                </div>

                <div className="dash-hint">When enabled, the site injects analytics script automatically.</div>
              </Card>
            )}

            {/* ========================= Backup / Restore ========================= */}
            {tab === "Backup / Restore (JSON)" && (
              <Card
                title="✅ Backup / Restore (JSON)"
                right={
                  <div className="dash-backup-actions">
                    <SmallBtn onClick={exportJSON}>Export</SmallBtn>
                    <SmallBtn onClick={copyBackup}>Copy</SmallBtn>
                    <SmallBtn onClick={downloadBackup}>Download</SmallBtn>
                    <SmallBtn variant="primary" onClick={importJSON}>
                      Import to Editor
                    </SmallBtn>

                    {/* ✅ NEW */}
                    <SmallBtn onClick={exportPublishedFile} title="Download portfolio.json to commit into src/data/portfolio.json">
                      Export Published JSON
                    </SmallBtn>
                    <SmallBtn onClick={openImportPicker} title="Import JSON file into dashboard (saved as Draft)">
                      Import JSON File
                    </SmallBtn>
                  </div>
                }
              >
                <TextArea label="Paste JSON here to restore, or export current state" value={backupText} onChange={setBackupText} rows={12} placeholder='{"profile": {...}}' />
                <div className="dash-hint">
                  Import بيحط البيانات داخل الداشبورد فورًا (وكمان Auto-Save هيحفظها).  
                  <br />
                  ✅ للنشر لكل الأجهزة: Export Published JSON → احفظه كـ <b>src/data/portfolio.json</b> → commit + push.
                </div>
              </Card>
            )}

            {/* ========================= Sections (Section Manager) ========================= */}
            {tab === "Sections" && (
              <Card
                title="Section Manager (Order + Hide/Show) ✅ Drag & Drop fixed"
                right={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <SmallBtn onClick={() => setSectionOrder(SECTION_DEFS.map((s) => s.id))} title="Reset section order">
                      Reset Order
                    </SmallBtn>
                    <SmallBtn onClick={() => setTab("Layout")} title="Go to theme/layout">
                      Go: Layout
                    </SmallBtn>
                  </div>
                }
              >
                <div className="dash-hint" style={{ marginBottom: 12 }}>
                  ده بيخزن Order/Hidden في <b>siteTheme.sections</b>. عشان يظهر في الموقع لازم الـ site renderer يستخدمهم.
                </div>

                <div className="dash-list">
                  {sectionsState.order.map((id, idx) => {
                    const def = SECTION_DEFS.find((s) => s.id === id) || { id, label: id };
                    const hidden = !!sectionsState.hidden?.[id];

                    return (
                      <div
                        key={id}
                        className={`dash-list-item ${secOverIndex === idx ? "is-over" : ""}`}
                        draggable
                        onDragStart={() => onSecDragStart(idx)}
                        onDragOver={(e) => onSecDragOver(idx, e)}
                        onDrop={() => onSecDrop(idx)}
                      >
                        <div className="dash-list-item-actions">
                          <div className="dash-drag-handle" title="Drag to reorder">
                            ⠿
                          </div>

                          <div className="dash-actions-right">
                            <SmallBtn onClick={() => idx > 0 && setSectionOrder(reorder(sectionsState.order, idx, idx - 1))}>↑</SmallBtn>
                            <SmallBtn onClick={() => idx < sectionsState.order.length - 1 && setSectionOrder(reorder(sectionsState.order, idx, idx + 1))}>↓</SmallBtn>

                            <Switch label="Hidden" checked={hidden} onChange={(v) => toggleSectionHidden(id, v)} />

                            <SmallBtn
                              onClick={() => {
                                setPreviewOpen(true);
                                setPreviewReady(false);
                                setIframeKey((k) => k + 1);
                              }}
                              title="Open preview"
                            >
                              Preview
                            </SmallBtn>
                          </div>
                        </div>

                        <div className="dash-grid">
                          <div className="dash-empty" style={{ margin: 0 }}>
                            <b>{def.label}</b>
                            <div style={{ opacity: 0.7, marginTop: 4 }}>id: {id}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="dash-hint">Drag بالماوس على (⠿) أو استخدم ↑ ↓.</div>
              </Card>
            )}

            {/* Draft controls (small tip) */}
            {hasDraft || isDraftLoaded ? (
              <Card title="Draft Mode">
                <div className="dash-empty">
                  أنت حالياً بتعدل Draft (آمن). لما تخلص اضغط <b>Publish</b> عشان تنشر على النسخة الأساسية.
                </div>
                <div className="mt-3" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <SmallBtn onClick={publishNow} variant="primary">
                    Publish
                  </SmallBtn>
                  <SmallBtn onClick={discardDraft} variant="danger">
                    Discard Draft
                  </SmallBtn>
                </div>
              </Card>
            ) : null}
          </section>

          {/* ✅ Preview Pane */}
          {previewOpen ? (
            <aside className="dash-preview" style={{ minHeight: 680 }}>
              <div className="dash-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="dash-card-head">
                  <div className="dash-card-title">Live Preview {previewSection ? `• ${previewSection}` : "• full site"}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <SmallBtn
                      onClick={() => {
                        setPreviewReady(false);
                        setIframeKey((k) => k + 1);
                      }}
                    >
                      Refresh
                    </SmallBtn>
                    <SmallBtn variant="danger" onClick={() => setPreviewOpen(false)}>
                      Close
                    </SmallBtn>
                  </div>
                </div>

                <div className="dash-card-body" style={{ padding: 0, height: "100%" }}>
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    title="Portfolio Preview"
                    src={previewSrc}
                    style={{ width: "100%", height: "100%", border: 0, borderRadius: 16 }}
                    onLoad={() => setPreviewReady(false)}
                  />
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
