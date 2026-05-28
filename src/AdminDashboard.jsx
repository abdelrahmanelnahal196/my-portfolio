// src/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_DATA,
  loadPortfolio,
  resetPortfolio,
  savePortfolio,
} from "./portfolioStore";

const BASE = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, "/");
const withBase = (hashPath) => `${BASE}${String(hashPath || "").replace(/^\/+/, "")}`;

/* =========================
   ✅ Theme (dashboard toggle)
========================= */
const THEME_KEY = "theme";

function getTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {}
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

/* =========================
   ✅ Safe clone
========================= */
function cloneDeep(obj) {
  try {
    // eslint-disable-next-line no-undef
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj ?? null));
  }
}

/* =========================
   ✅ Theme Palettes
========================= */
const PALETTES = [
  { id: "ocean", name: "Ocean (Sky → Blue)", accent: "#0ea5e9", accent2: "#2563eb" },
  { id: "purple", name: "Purple (Violet → Purple)", accent: "#8b5cf6", accent2: "#a855f7" },
  { id: "emerald", name: "Emerald (Green → Teal)", accent: "#10b981", accent2: "#14b8a6" },
  { id: "rose", name: "Rose (Rose → Pink)", accent: "#f43f5e", accent2: "#ec4899" },
  { id: "amber", name: "Amber (Amber → Orange)", accent: "#f59e0b", accent2: "#f97316" },
  { id: "cyan", name: "Cyan (Cyan → Blue)", accent: "#06b6d4", accent2: "#3b82f6" },
  { id: "lime", name: "Lime (Lime → Emerald)", accent: "#84cc16", accent2: "#10b981" },
  { id: "fuchsia", name: "Fuchsia (Fuchsia → Indigo)", accent: "#d946ef", accent2: "#6366f1" },
  { id: "red", name: "Red (Red → Orange)", accent: "#ef4444", accent2: "#f97316" },
  { id: "slate", name: "Slate (Slate → Gray)", accent: "#64748b", accent2: "#94a3b8" },
  { id: "sunset", name: "Sunset (Rose → Amber)", accent: "#fb7185", accent2: "#f59e0b" },
  { id: "aurora", name: "Aurora (Green → Cyan)", accent: "#22c55e", accent2: "#06b6d4" },
  { id: "mono", name: "Mono (Light → Gray)", accent: "#e5e7eb", accent2: "#94a3b8" },
  { id: "custom", name: "Custom (Pick your colors)", accent: "", accent2: "" },
];

function applyPaletteToRoot(paletteId, custom) {
  if (typeof document === "undefined") return;

  let p = PALETTES.find((x) => x.id === paletteId) || PALETTES[0];

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
  root.style.setProperty("--accent", p.accent || "#0ea5e9");
  root.style.setProperty("--accent2", p.accent2 || "#2563eb");
  root.setAttribute("data-palette", p.id);
}

/* =========================
   ✅ Background apply (Light/Dark)
========================= */
function applyBackgroundToRoot(background) {
  if (typeof document === "undefined") return;
  const bg = background || {};
  const root = document.documentElement;

  root.style.setProperty("--bg1-light", bg.light1 || "#f6fbff");
  root.style.setProperty("--bg2-light", bg.light2 || "#eef6ff");
  root.style.setProperty("--bg1-dark", bg.dark1 || "#070b14");
  root.style.setProperty("--bg2-dark", bg.dark2 || "#0a1022");
}

/* =========================
   ✅ Style preset apply
========================= */
function applyStylePresetToRoot(presetId) {
  if (typeof document === "undefined") return;
  const preset = String(presetId || "default").trim() || "default";
  document.documentElement.setAttribute("data-style", preset);
}

/* =========================
   ✅ Avatar style apply
========================= */
function applyAvatarStyleToRoot(id) {
  if (typeof document === "undefined") return;
  const v = String(id || "circle").trim() || "circle";
  document.documentElement.setAttribute("data-avatar", v);
}

/* =========================
   Helpers
========================= */
function isRemoteOrData(p) {
  const s = String(p || "").trim();
  return s.startsWith("data:") || s.startsWith("http://") || s.startsWith("https://");
}

function ensureSlash(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (!s) return "";
  if (isRemoteOrData(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

function moveItem(list, from, to) {
  const arr = [...(list || [])];
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
  return arr;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function absoluteUrl(path) {
  return new URL(path, window.location.origin).href;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied ✅");
  } catch {
    prompt("Copy this link:", text);
  }
}

/* =========================
   UI atoms
========================= */
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="dashboard-label text-sm font-semibold mb-2">{label}</div>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={[
        "dashboard-field w-full rounded-xl px-4 py-3 outline-none",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={[
        "dashboard-field w-full rounded-xl px-4 py-3 outline-none min-h-[120px]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="dashboard-field w-full rounded-xl px-4 py-3 outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SectionCard({ title, children, right, className = "" }) {
  return (
    <div className={`dashboard-card glass rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="font-bold text-lg">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Tabs({ tabs, activeId, onChange }) {
  return (
    <div className="dashboard-tabs glass rounded-2xl p-2 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              "px-4 py-2 rounded-xl text-sm font-semibold transition",
              active
                ? "bg-[color:var(--accent)] text-white"
                : "dashboard-tab-idle",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================
   ✅ Upload UI (Image/PDF)
========================= */
function UploadRow({ value, onChange, accept = "image/*", label = "Upload", help, compact = false }) {
  const v = String(value || "");
  const isImg = v.startsWith("data:image/") || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(v);
  const isPdf = v.startsWith("data:application/pdf") || /\.pdf$/i.test(v);
  const input = <TextInput value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="path or dataURL..." />;
  const uploadButton = (
    <label className="dashboard-secondary-btn px-4 rounded-xl font-semibold cursor-pointer grid place-items-center">
      {label}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const maxMB = accept.includes("pdf") ? 5 : 2;
          const sizeMB = file.size / (1024 * 1024);
          if (sizeMB > maxMB) {
            alert(`File كبير (${sizeMB.toFixed(2)}MB). حاول أقل من ${maxMB}MB.`);
            e.target.value = "";
            return;
          }

          const url = await readFileAsDataURL(file);
          onChange(url);
          e.target.value = "";
        }}
      />
    </label>
  );
  const removeButton = (
    <button
      type="button"
      className="px-3 rounded-xl bg-rose-600/80 border border-white/10 font-semibold text-white"
      onClick={() => onChange("")}
      disabled={!value}
      title="Remove"
    >
      Remove
    </button>
  );

  if (compact) {
    return (
      <div className="dashboard-upload-compact">
        <div className="min-w-0">{input}</div>
        <div className="dashboard-upload-actions">
          {uploadButton}
          {removeButton}
          {isImg && (
            <div className="dashboard-thumb" title="Icon preview">
              <img src={value} alt="preview" />
            </div>
          )}
          {isPdf && <div className="dashboard-thumb text-xs font-bold">PDF</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {input}
        {uploadButton}
        {removeButton}
      </div>

      {isImg && (
        <div className="dashboard-preview rounded-xl overflow-hidden p-2">
          <img src={value} alt="preview" className="w-full max-h-24 object-contain rounded-lg" />
        </div>
      )}

      {isPdf && (
        <div className="dashboard-preview rounded-xl p-3 text-sm flex items-center justify-between gap-3">
          <div className="opacity-80">PDF ready ✅</div>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="dashboard-secondary-btn px-3 py-2 rounded-xl font-semibold"
          >
            Open PDF →
          </a>
        </div>
      )}

      <div className="text-xs opacity-70">
        {help ? (
          help
        ) : (
          <>
            ✅ تقدر تكتب path زي <b>/assets/...</b> أو ترفع من جهازك (هتتحفظ DataURL).
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   Editors
========================= */
function StringListEditor({ title, value, onChange, placeholder = "New item..." }) {
  const list = Array.isArray(value) ? value : [];
  const norm = list.map((x) => (typeof x === "string" ? { text: x, hidden: false } : { text: x?.text ?? "", hidden: !!x?.hidden }));

  const [text, setText] = useState("");

  return (
    <SectionCard
      title={title}
      right={
        <button
          type="button"
          className="dashboard-secondary-btn px-3 py-2 rounded-xl font-semibold"
          onClick={() => {
            const t = text.trim();
            if (!t) return;
            onChange([...norm, { text: t, hidden: false }]);
            setText("");
          }}
        >
          Add
        </button>
      }
    >
      <div className="flex gap-2">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
      </div>

      <div className="mt-4 grid gap-2">
        {norm.map((it, idx) => (
          <div key={`${it.text}-${idx}`} className="dashboard-list-row flex items-center gap-2 rounded-xl p-3">
            <input
              className="flex-1 bg-transparent outline-none"
              value={it.text}
              onChange={(e) => {
                const next = [...norm];
                next[idx] = { ...next[idx], text: e.target.value };
                onChange(next);
              }}
            />

            <button
              type="button"
              className="dashboard-secondary-btn px-3 py-2 rounded-xl text-sm"
              onClick={() => {
                const next = [...norm];
                next[idx] = { ...next[idx], hidden: !next[idx].hidden };
                onChange(next);
              }}
              title="Hide/Show"
            >
              {it.hidden ? "Show" : "Hide"}
            </button>

            <button
              type="button"
              className="dashboard-secondary-btn px-3 py-2 rounded-xl text-sm"
              onClick={() => onChange(moveItem(norm, idx, idx - 1))}
              disabled={idx === 0}
              title="Up"
            >
              ↑
            </button>

            <button
              type="button"
              className="dashboard-secondary-btn px-3 py-2 rounded-xl text-sm"
              onClick={() => onChange(moveItem(norm, idx, idx + 1))}
              disabled={idx === norm.length - 1}
              title="Down"
            >
              ↓
            </button>

            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-rose-600/80 border border-white/10 text-sm font-semibold text-white"
              onClick={() => onChange(norm.filter((_, i) => i !== idx))}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}

        {!norm.length && <div className="text-sm opacity-70">No items yet.</div>}
      </div>
    </SectionCard>
  );
}

function BulletsEditor({ value, onChange }) {
  const arr = Array.isArray(value) ? value : [];
  const [text, setText] = useState("");

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Add bullet..." />
        <button
          type="button"
          className="dashboard-secondary-btn px-3 py-2 rounded-xl font-semibold"
          onClick={() => {
            const t = text.trim();
            if (!t) return;
            onChange([...arr, t]);
            setText("");
          }}
        >
          Add
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {arr.map((b, idx) => (
          <div key={`${b}-${idx}`} className="dashboard-list-row flex gap-2 rounded-xl p-3">
            <input
              className="flex-1 bg-transparent outline-none"
              value={b}
              onChange={(e) => {
                const next = [...arr];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-rose-600/80 border border-white/10 font-semibold text-white"
              onClick={() => onChange(arr.filter((_, i) => i !== idx))}
            >
              ✕
            </button>
          </div>
        ))}
        {!arr.length && <div className="text-sm opacity-70">No bullets.</div>}
      </div>
    </div>
  );
}

function ObjectListBase({ title, items, onChange, renderItem, createNew, columns = false, compact = false, className = "" }) {
  const list = Array.isArray(items) ? items : [];
  const listClass = columns ? "grid grid-cols-1 xl:grid-cols-2 gap-4" : "grid gap-4";
  return (
    <SectionCard
      className={className}
      title={title}
      right={
        <button
          type="button"
          className="px-3 py-2 rounded-xl bg-[color:var(--accent)] text-white font-semibold"
          onClick={() => onChange([...list, createNew()])}
        >
          + Add
        </button>
      }
    >
      <div className={listClass}>
        {list.map((item, idx) => (
          <div key={idx} className={`dashboard-list-row rounded-2xl ${compact ? "p-3" : "p-4"}`}>
            <div className={`flex gap-2 ${compact ? "items-center justify-between" : "items-center justify-between"}`}>
              <div className="text-sm opacity-80">
                Item #{idx + 1} {item?.hidden ? " • (Hidden)" : ""}
              </div>
              <div className={`flex flex-wrap gap-2 ${compact ? "justify-end" : ""}`}>
                <button
                  type="button"
                  className={`dashboard-secondary-btn rounded-xl text-sm ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                  onClick={() => {
                    const next = [...list];
                    next[idx] = { ...next[idx], hidden: !next[idx]?.hidden };
                    onChange(next);
                  }}
                >
                  {item?.hidden ? "Show" : "Hide"}
                </button>
                <button
                  type="button"
                  className={`dashboard-secondary-btn rounded-xl text-sm ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                  onClick={() => onChange(moveItem(list, idx, idx - 1))}
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`dashboard-secondary-btn rounded-xl text-sm ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                  onClick={() => onChange(moveItem(list, idx, idx + 1))}
                  disabled={idx === list.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`rounded-xl bg-rose-600/80 border border-white/10 text-sm font-semibold text-white ${compact ? "px-2.5 py-1.5" : "px-3 py-2"}`}
                  onClick={() => onChange(list.filter((_, i) => i !== idx))}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className={compact ? "mt-3" : "mt-4"}>{renderItem(item, idx, (patch) => {
              const next = [...list];
              next[idx] = { ...(next[idx] || {}), ...patch };
              onChange(next);
            })}</div>
          </div>
        ))}

        {!list.length && <div className="text-sm opacity-70">No items yet.</div>}
      </div>
    </SectionCard>
  );
}

/* =========================
   ✅ Theme Picker + Design
========================= */
function ThemePickerAndDesign({ data, update }) {
  const current = data?.siteTheme?.palette || "ocean";
  const custom = data?.siteTheme?.custom || { accent: "#0ea5e9", accent2: "#2563eb" };

  const bg = data?.siteTheme?.background || {
    light1: "#f6fbff",
    light2: "#eef6ff",
    dark1: "#070b14",
    dark2: "#0a1022",
  };

  const cardStyle = data?.siteTheme?.style?.cards || "glass";
  const density = data?.siteTheme?.density || "comfortable";
  const layoutProjects = data?.siteTheme?.layout?.projects || "grid";
  const layoutCerts = data?.siteTheme?.layout?.certificates || "grid";
  const layoutExp = data?.siteTheme?.layout?.experience || "timeline";

  const stylePreset = data?.siteTheme?.style?.preset || "default";
  const avatarStyle = data?.siteTheme?.avatarStyle || "circle";

  const selectedPreset = PALETTES.find((p) => p.id === current) || PALETTES[0];
  const previewAccent = current === "custom" ? (custom.accent || "#0ea5e9") : (selectedPreset.accent || "#0ea5e9");
  const previewAccent2 = current === "custom" ? (custom.accent2 || "#2563eb") : (selectedPreset.accent2 || "#2563eb");

  const paletteOptions = PALETTES.map((p) => ({ value: p.id, label: p.name }));

  const setPreset = (id) => {
    update(["siteTheme", "palette"], id);
    const p = PALETTES.find((x) => x.id === id);
    if (p && id !== "custom") {
      update(["siteTheme", "custom", "accent"], p.accent);
      update(["siteTheme", "custom", "accent2"], p.accent2);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <SectionCard title="Website Colors (Palettes)">
        <div className="text-sm opacity-80 mb-4">اختر Palette — هتتطبق على ألوان الAccent في الموقع كله.</div>

        <div className="grid grid-cols-1 gap-3 mb-5">
          <Field label="Preset Palette (Dropdown)">
            <Select value={current} onChange={setPreset} options={paletteOptions} />
          </Field>

          <div className="flex items-center gap-3 text-xs opacity-80">
            <span className="inline-block w-10 h-6 rounded-lg border border-white/10" style={{ background: previewAccent }} />
            <span className="inline-block w-10 h-6 rounded-lg border border-white/10" style={{ background: previewAccent2 }} />
            <span>
              Preview: <b>{previewAccent}</b> → <b>{previewAccent2}</b>
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="font-semibold mb-2">Custom Colors</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Accent #1">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={custom.accent || "#0ea5e9"}
                  onChange={(e) => {
                    update(["siteTheme", "palette"], "custom");
                    update(["siteTheme", "custom", "accent"], e.target.value);
                  }}
                  className="dashboard-color-input w-14 h-12 rounded-xl"
                />
                <TextInput
                  value={custom.accent || ""}
                  onChange={(e) => {
                    update(["siteTheme", "palette"], "custom");
                    update(["siteTheme", "custom", "accent"], e.target.value);
                  }}
                  placeholder="#0ea5e9"
                />
              </div>
            </Field>

            <Field label="Accent #2">
              <div className="flex gap-2">
                <input
                  type="color"
                  value={custom.accent2 || "#2563eb"}
                  onChange={(e) => {
                    update(["siteTheme", "palette"], "custom");
                    update(["siteTheme", "custom", "accent2"], e.target.value);
                  }}
                  className="dashboard-color-input w-14 h-12 rounded-xl"
                />
                <TextInput
                  value={custom.accent2 || ""}
                  onChange={(e) => {
                    update(["siteTheme", "palette"], "custom");
                    update(["siteTheme", "custom", "accent2"], e.target.value);
                  }}
                  placeholder="#2563eb"
                />
              </div>
            </Field>
          </div>

          <div className="mt-3 text-xs opacity-70">✅ أول ما تغيّر أي لون هنا، هيتفعّل تلقائيًا <b>Custom</b>.</div>
        </div>
      </SectionCard>

      <SectionCard title="Style & Layout (Display)">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Style Preset (Global Look)">
            <Select
              value={stylePreset}
              onChange={(v) => update(["siteTheme", "style", "preset"], v)}
              options={[
                { value: "default", label: "Default" },
                { value: "minimal", label: "Minimal" },
                { value: "corporate", label: "Corporate" },
                { value: "neon", label: "Neon" },
                { value: "gradient", label: "Gradient" },
              ]}
            />
          </Field>

          <Field label="Profile Photo Style">
            <Select
              value={avatarStyle}
              onChange={(v) => update(["siteTheme", "avatarStyle"], v)}
              options={[
                { value: "circle", label: "Circle" },
                { value: "rounded", label: "Rounded" },
                { value: "square", label: "Square" },
                { value: "squircle", label: "Squircle" },
              ]}
            />
          </Field>

          <Field label="Cards Style">
            <Select
              value={cardStyle}
              onChange={(v) => update(["siteTheme", "style", "cards"], v)}
              options={[
                { value: "glass", label: "Glass (Default)" },
                { value: "solid", label: "Solid" },
                { value: "outline", label: "Outline" },
              ]}
            />
          </Field>

          <Field label="Density (Spacing)">
            <Select
              value={density}
              onChange={(v) => update(["siteTheme", "density"], v)}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Projects View">
              <Select
                value={layoutProjects}
                onChange={(v) => update(["siteTheme", "layout", "projects"], v)}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "list", label: "List" },
                ]}
              />
            </Field>

            <Field label="Certificates View">
              <Select
                value={layoutCerts}
                onChange={(v) => update(["siteTheme", "layout", "certificates"], v)}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "list", label: "List" },
                ]}
              />
            </Field>

            <Field label="Experience View">
              <Select
                value={layoutExp}
                onChange={(v) => update(["siteTheme", "layout", "experience"], v)}
                options={[
                  { value: "timeline", label: "Timeline" },
                  { value: "cards", label: "Cards" },
                ]}
              />
            </Field>
          </div>

          <div className="text-xs opacity-70">
            ✅ دي بتغيّر “شكل العرض”:
            <br />• <b>Preset</b> = شكل الموقع العام
            <br />• <b>Cards</b> = شكل الكروت
            <br />• <b>Density</b> = مسافات
            <br />• <b>Views</b> = طريقة العرض
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Background Colors (Light / Dark)">
        <div className="text-sm opacity-80 mb-4">
          الخلفية دي هتتطبق على <b>الموقع + الداشبورد</b> حسب الوضع.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["Light: Color #1", "light1", "#f6fbff"],
            ["Light: Color #2", "light2", "#eef6ff"],
            ["Dark: Color #1", "dark1", "#070b14"],
            ["Dark: Color #2", "dark2", "#0a1022"],
          ].map(([label, key, fallback]) => (
            <Field key={key} label={label}>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bg[key] || fallback}
                  onChange={(e) => update(["siteTheme", "background", key], e.target.value)}
                  className="dashboard-color-input w-14 h-12 rounded-xl"
                />
                <TextInput
                  value={bg[key] || ""}
                  onChange={(e) => update(["siteTheme", "background", key], e.target.value)}
                  placeholder={fallback}
                />
              </div>
            </Field>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* =========================
   Backup tools
========================= */
function BackupTools({ data, setData }) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    setData(parsed);
    alert("Imported ✅ (Remember to Save)");
  };

  return (
    <SectionCard title="Backup / Restore">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="dashboard-secondary-btn px-4 py-2 rounded-xl font-semibold"
          onClick={exportJson}
        >
          Export JSON
        </button>

        <label className="dashboard-secondary-btn px-4 py-2 rounded-xl font-semibold cursor-pointer">
          Import JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                await importJson(f);
              } catch {
                alert("Invalid JSON ❌");
              }
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-rose-600/80 border border-white/10 font-semibold text-white"
          onClick={() => {
            if (!confirm("Reset to defaults?")) return;
            setData(DEFAULT_DATA);
            resetPortfolio();
            window.dispatchEvent(new Event("portfolio:updated"));
            alert("Reset ✅");
          }}
        >
          Reset Defaults
        </button>
      </div>

      <div className="mt-4">
        <Field label="Raw JSON (Advanced)">
          <TextArea
            value={JSON.stringify(data, null, 2)}
            onChange={(e) => {
              try {
                setData(JSON.parse(e.target.value));
              } catch {
                // ignore typing errors
              }
            }}
          />
        </Field>
        <div className="text-xs opacity-70 mt-2">
          ⚠️ لو بتعدل Raw JSON: لازم يكون JSON صحيح، وبعدها اضغط Save.
        </div>
      </div>
    </SectionCard>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [data, setData] = useState(() => loadPortfolio());
  const [theme, setTheme] = useState(() => getTheme());

  useEffect(() => {
    setData(loadPortfolio());
  }, []);

  // ✅ Live apply in dashboard
  useEffect(() => {
    const st = data?.siteTheme || {};
    applyPaletteToRoot(st?.palette || "ocean", st?.custom);
    applyStylePresetToRoot(st?.style?.preset || "default");
    applyBackgroundToRoot(st?.background);
    applyAvatarStyleToRoot(st?.avatarStyle || "circle");
  }, [
    data?.siteTheme?.palette,
    data?.siteTheme?.custom?.accent,
    data?.siteTheme?.custom?.accent2,
    data?.siteTheme?.style?.preset,
    data?.siteTheme?.background?.light1,
    data?.siteTheme?.background?.light2,
    data?.siteTheme?.background?.dark1,
    data?.siteTheme?.background?.dark2,
    data?.siteTheme?.avatarStyle,
  ]);

  const tabs = useMemo(
    () => [
      { id: "general", label: "Profile" },
      { id: "skills", label: "Skills" },
      { id: "experience", label: "Experience" },
      { id: "projects", label: "Projects" },
      { id: "certs", label: "Certificates" },
      { id: "contact", label: "Contact" },
      { id: "floating", label: "Floating Buttons" },
      { id: "design", label: "Design" },
      { id: "backup", label: "Backup" },
    ],
    []
  );
  const skillTabs = useMemo(
    () => [
      { id: "technical", label: "Technical Skills" },
      { id: "soft", label: "Soft Skills" },
      { id: "domains", label: "Business Domains" },
      { id: "toolkit", label: "Toolkit" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState("general");
  const [activeSkillTab, setActiveSkillTab] = useState("technical");

  const dirty = useMemo(() => {
    try {
      return JSON.stringify(data) !== JSON.stringify(loadPortfolio());
    } catch {
      return true;
    }
  }, [data]);

  const update = (path, value) => {
    setData((prev) => {
      const next = cloneDeep(prev);
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (ref[path[i]] == null) ref[path[i]] = {};
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });
  };

  const save = () => {
    const normalized = cloneDeep(data || {});
    normalized.assets = normalized.assets || {};
    normalized.profile = normalized.profile || {};

    normalized.assets.photo = ensureSlash(normalized.assets.photo);
    normalized.assets.cv = ensureSlash(normalized.assets.cv);

    normalized.toolkit = (normalized.toolkit || []).map((t) => ({ ...t, icon: ensureSlash(t.icon) }));
    normalized.projects = (normalized.projects || []).map((p) => ({ ...p, image: p.image ? ensureSlash(p.image) : "" }));
    normalized.certificates = (normalized.certificates || []).map((c) => ({ ...c, img: c.img ? ensureSlash(c.img) : "" }));
    normalized.contactCards = (normalized.contactCards || []).map((c) => ({ ...c, iconUrl: c.iconUrl ? ensureSlash(c.iconUrl) : "" }));
    normalized.floatingButtons = (normalized.floatingButtons || []).map((b) => ({ ...b, iconUrl: b.iconUrl ? ensureSlash(b.iconUrl) : "" }));

    // ensure theme defaults exist
    normalized.siteTheme = normalized.siteTheme || {};
    normalized.siteTheme.custom = normalized.siteTheme.custom || { accent: "#0ea5e9", accent2: "#2563eb" };
    normalized.siteTheme.style = normalized.siteTheme.style || { cards: "glass", preset: "default" };
    normalized.siteTheme.layout = normalized.siteTheme.layout || { projects: "grid", certificates: "grid", experience: "timeline" };
    normalized.siteTheme.density = normalized.siteTheme.density || "comfortable";
    normalized.siteTheme.background =
      normalized.siteTheme.background || { light1: "#f6fbff", light2: "#eef6ff", dark1: "#070b14", dark2: "#0a1022" };
    normalized.siteTheme.avatarStyle = normalized.siteTheme.avatarStyle || "circle";

    savePortfolio(normalized);
    window.dispatchEvent(new Event("portfolio:updated"));
    alert("Saved ✅");
  };

  const publicPath = withBase("");

  const handleLogout = () => {
    if (!onLogout) return;
    if (!confirm("Are you sure you want to logout?")) return;
    onLogout();
  };

  return (
    <div className="min-h-screen relative px-5 sm:px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="glass rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-[color:var(--accent)] font-extrabold text-2xl">Portfolio Dashboard</div>
            <div className="text-sm opacity-80">Edit the public portfolio content and design.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="dashboard-secondary-btn px-4 py-2 rounded-xl font-semibold"
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                applyTheme(next);
              }}
              title="Toggle theme"
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <a className="dashboard-secondary-btn px-4 py-2 rounded-xl font-semibold" href={publicPath}>
              View Site
            </a>

            <button
              className="dashboard-secondary-btn px-4 py-2 rounded-xl font-semibold"
              onClick={() => copyText(absoluteUrl(publicPath))}
              type="button"
            >
              Copy Site
            </button>

            <button className="px-4 py-2 rounded-xl bg-[color:var(--accent)] text-white font-semibold" onClick={save} type="button">
              Save Changes {dirty ? "●" : ""}
            </button>

            {onLogout && (
              <button
                className="px-4 py-2 rounded-xl bg-rose-600/80 border border-white/10 font-semibold text-white"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-6 grid gap-6">
          {/* ================= GENERAL ================= */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Assets (Paths in public/assets OR Upload)">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Photo (path or upload)">
                    <UploadRow
                      value={data.assets?.photo || ""}
                      onChange={(v) => update(["assets", "photo"], v)}
                      accept="image/*"
                      label="Upload"
                    />
                  </Field>

                  <Field label="CV (PDF) path or upload">
                    <UploadRow
                      value={data.assets?.cv || ""}
                      onChange={(v) => update(["assets", "cv"], v)}
                      accept="application/pdf"
                      label="Upload PDF"
                      help={
                        <>
                          ✅ تقدر تكتب <b>/assets/cv/Your-CV.pdf</b> أو ترفع PDF (يفتح من زر CV).
                          <br />
                          ⚠️ الأفضل Path لو الـ CV كبير.
                        </>
                      }
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Profile Info">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Name">
                    <TextInput value={data.profile?.name || ""} onChange={(e) => update(["profile", "name"], e.target.value)} />
                  </Field>
                  <Field label="Title">
                    <TextInput value={data.profile?.title || ""} onChange={(e) => update(["profile", "title"], e.target.value)} />
                  </Field>
                  <Field label="Location">
                    <TextInput
                      value={data.profile?.location || ""}
                      onChange={(e) => update(["profile", "location"], e.target.value)}
                    />
                  </Field>
                  <Field label="Summary">
                    <TextArea
                      value={data.profile?.summary || ""}
                      onChange={(e) => update(["profile", "summary"], e.target.value)}
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Email">
                      <TextInput value={data.profile?.email || ""} onChange={(e) => update(["profile", "email"], e.target.value)} />
                    </Field>
                    <Field label="LinkedIn URL">
                      <TextInput
                        value={data.profile?.linkedin || ""}
                        onChange={(e) => update(["profile", "linkedin"], e.target.value)}
                      />
                    </Field>
                    <Field label="GitHub URL">
                      <TextInput value={data.profile?.github || ""} onChange={(e) => update(["profile", "github"], e.target.value)} />
                    </Field>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ================= SKILLS ================= */}
          {activeTab === "skills" && (
            <div className="grid gap-6">
              <Tabs tabs={skillTabs} activeId={activeSkillTab} onChange={setActiveSkillTab} />

              {activeSkillTab === "technical" && (
                <StringListEditor
                  title="Technical Skills"
                  value={data.technicalSkills}
                  onChange={(v) => update(["technicalSkills"], v)}
                  placeholder="e.g. API Testing"
                />
              )}

              {activeSkillTab === "soft" && (
                <StringListEditor
                  title="Soft Skills"
                  value={data.softSkills}
                  onChange={(v) => update(["softSkills"], v)}
                  placeholder="e.g. Communication"
                />
              )}

              {activeSkillTab === "domains" && (
                <StringListEditor
                  title="Business Domains"
                  value={data.businessDomains}
                  onChange={(v) => update(["businessDomains"], v)}
                  placeholder="e.g. FinTech"
                />
              )}

              {activeSkillTab === "toolkit" && (
                <ObjectListBase
                  title="Toolkit (Auto slider)"
                  items={data.toolkit}
                  onChange={(v) => update(["toolkit"], v)}
                  compact
                  createNew={() => ({ label: "New Tool", icon: "/assets/icons/tool.png", hidden: false })}
                  renderItem={(item, idx, patch) => (
                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(150px,0.75fr)_minmax(0,2.25fr)] gap-3 items-end">
                      <Field label="Label">
                        <TextInput value={item.label || ""} onChange={(e) => patch({ label: e.target.value })} />
                      </Field>
                      <Field label="Icon (path or upload)">
                        <UploadRow value={item.icon || ""} onChange={(v) => patch({ icon: v })} accept="image/*" compact />
                      </Field>
                    </div>
                  )}
                />
              )}
            </div>
          )}

          {/* ================= EXPERIENCE ================= */}
          {activeTab === "experience" && (
            <ObjectListBase
              title="Work Experience"
              items={data.workExperience}
              onChange={(v) => update(["workExperience"], v)}
              columns
              createNew={() => ({ role: "Role", company: "Company", date: "Date", bullets: [], hidden: false })}
              renderItem={(item, idx, patch) => (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Field label="Role">
                      <TextInput value={item.role || ""} onChange={(e) => patch({ role: e.target.value })} />
                    </Field>
                    <Field label="Company">
                      <TextInput value={item.company || ""} onChange={(e) => patch({ company: e.target.value })} />
                    </Field>
                    <Field label="Date">
                      <TextInput value={item.date || ""} onChange={(e) => patch({ date: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Bullets">
                    <BulletsEditor value={item.bullets} onChange={(v) => patch({ bullets: v })} />
                  </Field>
                </>
              )}
            />
          )}

          {/* ================= PROJECTS ================= */}
          {activeTab === "projects" && (
            <ObjectListBase
              title="Projects"
              items={data.projects}
              onChange={(v) => update(["projects"], v)}
              columns
              createNew={() => ({
                title: "Project Title",
                subtitle: "",
                date: "",
                image: "",
                bullets: [],
                link: "",
                hidden: false,
              })}
              renderItem={(item, idx, patch) => (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Field label="Title">
                      <TextInput value={item.title || ""} onChange={(e) => patch({ title: e.target.value })} />
                    </Field>
                    <Field label="Subtitle">
                      <TextInput value={item.subtitle || ""} onChange={(e) => patch({ subtitle: e.target.value })} />
                    </Field>
                    <Field label="Date">
                      <TextInput value={item.date || ""} onChange={(e) => patch({ date: e.target.value })} />
                    </Field>
                    <Field label="Link (optional)">
                      <TextInput value={item.link || ""} onChange={(e) => patch({ link: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Image (path or upload)">
                    <UploadRow value={item.image || ""} onChange={(v) => patch({ image: v })} accept="image/*" />
                  </Field>

                  <Field label="Bullets">
                    <BulletsEditor value={item.bullets} onChange={(v) => patch({ bullets: v })} />
                  </Field>
                </>
              )}
            />
          )}

          {/* ================= CERTIFICATES ================= */}
          {activeTab === "certs" && (
            <ObjectListBase
              title="Certificates"
              items={data.certificates}
              onChange={(v) => update(["certificates"], v)}
              columns
              createNew={() => ({ title: "Certificate", org: "", date: "", img: "", link: "", hidden: false })}
              renderItem={(item, idx, patch) => (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Field label="Title">
                      <TextInput value={item.title || ""} onChange={(e) => patch({ title: e.target.value })} />
                    </Field>
                    <Field label="Organization">
                      <TextInput value={item.org || ""} onChange={(e) => patch({ org: e.target.value })} />
                    </Field>
                    <Field label="Date">
                      <TextInput value={item.date || ""} onChange={(e) => patch({ date: e.target.value })} />
                    </Field>
                    <Field label="Link (optional)">
                      <TextInput value={item.link || ""} onChange={(e) => patch({ link: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Certificate Image (path or upload)">
                    <UploadRow value={item.img || ""} onChange={(v) => patch({ img: v })} accept="image/*" />
                  </Field>
                </>
              )}
            />
          )}

          {/* ================= CONTACT ================= */}
          {activeTab === "contact" && (
            <ObjectListBase
              title="Contact Cards"
              items={data.contactCards}
              onChange={(v) => update(["contactCards"], v)}
              columns
              createNew={() => ({ title: "Title", subtitle: "", value: "", href: "", iconUrl: "", hidden: false })}
              renderItem={(item, idx, patch) => (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Field label="Title">
                      <TextInput value={item.title || ""} onChange={(e) => patch({ title: e.target.value })} />
                    </Field>
                    <Field label="Subtitle">
                      <TextInput value={item.subtitle || ""} onChange={(e) => patch({ subtitle: e.target.value })} />
                    </Field>
                    <Field label="Value">
                      <TextInput value={item.value || ""} onChange={(e) => patch({ value: e.target.value })} />
                    </Field>
                    <Field label="Href (url / mailto / tel)">
                      <TextInput value={item.href || ""} onChange={(e) => patch({ href: e.target.value })} />
                    </Field>
                  </div>

                  <Field label="Icon (path or upload)">
                    <UploadRow value={item.iconUrl || ""} onChange={(v) => patch({ iconUrl: v })} accept="image/*" />
                  </Field>
                </>
              )}
            />
          )}

          {/* ================= FLOATING ================= */}
          {activeTab === "floating" && (
            <ObjectListBase
              title="Floating Buttons"
              items={data.floatingButtons}
              onChange={(v) => update(["floatingButtons"], v)}
              columns
              createNew={() => ({ label: "WhatsApp", href: "", iconUrl: "", hidden: false })}
              renderItem={(item, idx, patch) => (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Field label="Label">
                    <TextInput value={item.label || ""} onChange={(e) => patch({ label: e.target.value })} />
                  </Field>
                  <Field label="Href">
                    <TextInput value={item.href || ""} onChange={(e) => patch({ href: e.target.value })} />
                  </Field>
                  <Field label="Icon (path or upload)">
                    <UploadRow value={item.iconUrl || ""} onChange={(v) => patch({ iconUrl: v })} accept="image/*" />
                  </Field>
                </div>
              )}
            />
          )}

          {/* ================= DESIGN ================= */}
          {activeTab === "design" && <ThemePickerAndDesign data={data} update={update} />}

          {/* ================= BACKUP ================= */}
          {activeTab === "backup" && <BackupTools data={data} setData={setData} />}
        </div>
      </div>
    </div>
  );
}
