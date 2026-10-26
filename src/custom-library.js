// Local user library: storage, validation, image helpers and duplicate checks.
// This module is intentionally independent from data.js so it can be used by
// both the renderer and the desktop bridge without a circular dependency.

export const CUSTOM_STORAGE_KEY = "style-orbit:custom-library:v1";
export const CUSTOM_SCHEMA_VERSION = 1;
export const SKILL_CATEGORIES = [
  "portrait",
  "kid",
  "scene",
  "space",
  "object",
  "lab",
  "graphic",
];
const MAX_IMAGE_CHARS = 8_000_000;
const MAX_PROMPT_CHARS = 30_000;

let cachedEntries = null;

function asString(value, max = 500) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

function asTags(value) {
  const input = Array.isArray(value) ? value : String(value ?? "").split(/[,，]/);
  const tags = [];
  for (const raw of input) {
    const tag = asString(raw, 28);
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= 8) break;
  }
  return tags;
}

function asSlug(value) {
  return asString(value, 80)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function newId() {
  if (globalThis.crypto?.randomUUID) return `local-${globalThis.crypto.randomUUID()}`;
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeHttpUrl(value) {
  const text = asString(value, 600);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function safeImage(value) {
  const text = String(value ?? "");
  if (!text.startsWith("data:image/")) return "";
  if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(text)) return "";
  if (text.length > MAX_IMAGE_CHARS) return "";
  return text;
}

function sanitizeEntry(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const zh = asString(raw.zh, 80);
  if (!zh) return null;
  const kind = raw.kind === "prompt" ? "prompt" : "skill";
  const en = asString(raw.en, 160) || zh;
  const cat =
    kind === "prompt"
      ? "prompt"
      : SKILL_CATEGORIES.includes(raw.cat)
        ? raw.cat
        : "scene";
  const prompt = asString(raw.prompt, MAX_PROMPT_CHARS);
  const createdAt = asString(raw.createdAt, 40) || new Date().toISOString();
  const updatedAt = asString(raw.updatedAt, 40) || createdAt;
  const customId = /^[a-zA-Z0-9_-]{4,120}$/.test(String(raw.customId || ""))
    ? String(raw.customId)
    : newId();
  const slug =
    asSlug(raw.slug) ||
    asSlug(en) ||
    `local-${createdAt.replace(/\D/g, "").slice(0, 14)}-${String(index + 1).padStart(2, "0")}`;

  return {
    schemaVersion: CUSTOM_SCHEMA_VERSION,
    customId,
    isCustom: true,
    sourceType: "local",
    kind,
    zh,
    en,
    slug,
    cat,
    description: asString(raw.description, 1200),
    bestFor: asString(raw.bestFor, 400),
    tags: asTags(raw.tags),
    creator: asString(raw.creator, 80) || "我",
    collection: asString(raw.collection, 100) || "我的本机收藏",
    sourceUrl: safeHttpUrl(raw.sourceUrl),
    prompt,
    image: safeImage(raw.image),
    createdAt,
    updatedAt,
  };
}

export function sanitizeCustomEntries(input) {
  if (!Array.isArray(input)) return [];
  const seenIds = new Set();
  const result = [];
  for (let index = 0; index < input.length; index += 1) {
    const entry = sanitizeEntry(input[index], index);
    if (!entry) continue;
    let id = entry.customId;
    let suffix = 2;
    while (seenIds.has(id)) {
      id = `${entry.customId}-${suffix}`;
      suffix += 1;
    }
    seenIds.add(id);
    result.push({ ...entry, customId: id });
  }
  return result;
}

function readRawStorage() {
  if (typeof window !== "undefined") {
    const desktop = window.desktopAPI;
    if (desktop?.isDesktop) {
      return Array.isArray(desktop.initialLibrary) ? desktop.initialLibrary : [];
    }
    try {
      const stored = window.localStorage?.getItem(CUSTOM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Local library read failed", error);
      return [];
    }
  }
  return [];
}

export function getStoredCustomEntries() {
  if (cachedEntries) return cachedEntries.map((entry) => ({ ...entry }));
  cachedEntries = sanitizeCustomEntries(readRawStorage());
  return cachedEntries.map((entry) => ({ ...entry }));
}

export function isDesktopApp() {
  return Boolean(window.desktopAPI?.isDesktop);
}

export function getDesktopDataPath() {
  return window.desktopAPI?.dataPath || "";
}

export async function persistCustomEntries(entries) {
  const sanitized = sanitizeCustomEntries(entries);
  if (window.desktopAPI?.isDesktop) {
    if (typeof window.desktopAPI.saveLibrary !== "function") {
      throw new Error("桌面保存接口不可用，请重启应用。");
    }
    const result = await window.desktopAPI.saveLibrary(sanitized);
    if (!result?.ok) throw new Error(result?.error || "写入本地库失败。");
    cachedEntries = sanitized;
    return { storage: "desktop", count: sanitized.length, path: result.dataPath || "" };
  }

  try {
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    throw new Error(
      "浏览器本地存储空间不足。建议使用桌面版，或删除几张较大的本地示例图后重试。"
    );
  }
  cachedEntries = sanitized;
  return { storage: "browser", count: sanitized.length };
}

export async function upsertCustomEntry(entry) {
  const list = getStoredCustomEntries();
  const index = list.findIndex((item) => item.customId === entry.customId);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      ...entry,
      customId: list[index].customId,
      createdAt: list[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
  } else {
    list.push({
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await persistCustomEntries(list);
  return list.find((item) => item.customId === entry.customId) || entry;
}

export async function deleteCustomEntry(customId) {
  const list = getStoredCustomEntries().filter((item) => item.customId !== customId);
  await persistCustomEntries(list);
  return list.length;
}

export function makeCustomId() {
  return newId();
}

export function makeSlug(value) {
  return asSlug(value);
}

export function makeUniqueSlug(base, usedSlugs, preferred = "local") {
  const safeBase = asSlug(base) || `${preferred}-${Date.now().toString(36)}`;
  let candidate = safeBase;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${safeBase}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function normalizeForDuplicate(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function bigramSet(value) {
  const text = normalizeForDuplicate(value);
  const set = new Set();
  if (text.length < 2) {
    if (text) set.add(text);
    return set;
  }
  for (let i = 0; i < text.length - 1; i += 1) set.add(text.slice(i, i + 2));
  return set;
}

export function nameSimilarity(a, b) {
  const na = normalizeForDuplicate(a);
  const nb = normalizeForDuplicate(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.length >= 3 && nb.length >= 3) {
    if (na.includes(nb) || nb.includes(na)) {
      const diff = Math.abs(na.length - nb.length);
      if (diff <= 8) return 0.94 - diff * 0.015;
    }
  }
  const setA = bigramSet(na);
  const setB = bigramSet(nb);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const gram of setA) if (setB.has(gram)) intersection += 1;
  return intersection / (setA.size + setB.size - intersection);
}

function itemLabels(item) {
  return {
    zh: String(item.zh || ""),
    en: String(item.en || ""),
    slug: String(item.slug || ""),
    prompt: String(item.prompt || ""),
    kind: item.kind === "prompt" ? "Prompt" : "Skill",
  };
}

/**
 * Checks the local form against every item in the current gallery (built-in and
 * already-added local entries). Exact matches block adding. Near matches are
 * surfaced for explicit confirmation.
 */
export function findDuplicates(candidate, allItems, editingId = null) {
  const zhNorm = normalizeForDuplicate(candidate.zh);
  const enNorm = normalizeForDuplicate(candidate.en);
  const promptNorm = normalizeForDuplicate(candidate.prompt);
  const sourceNorm = String(candidate.sourceUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
  const exact = [];
  const similar = [];

  for (const item of allItems || []) {
    if (editingId && item.customId === editingId) continue;
    const fields = [];
    if (zhNorm && normalizeForDuplicate(item.zh) === zhNorm) fields.push("中文名");
    if (enNorm && normalizeForDuplicate(item.en) === enNorm) fields.push("英文名");
    if (promptNorm && promptNorm.length > 20 && normalizeForDuplicate(item.prompt) === promptNorm) {
      fields.push("提示词全文");
    }
    if (fields.length) {
      exact.push({ item, fields });
      continue;
    }

    let score = Math.max(nameSimilarity(candidate.zh, item.zh), nameSimilarity(candidate.en, item.en));
    const reasons = [];
    if (score >= 0.84) reasons.push("名称高度相似");
    if (promptNorm && promptNorm.length > 40 && item.prompt) {
      const promptScore = nameSimilarity(candidate.prompt, item.prompt);
      if (promptScore >= 0.9) {
        score = Math.max(score, promptScore);
        reasons.push("提示词高度相似");
      }
    }
    if (
      sourceNorm &&
      String(item.sourceUrl || "").replace(/\/+$/, "").toLowerCase() === sourceNorm
    ) {
      score = Math.max(score, 0.86);
      reasons.push("来源链接相同");
    }
    if (score >= 0.84) {
      similar.push({ item, score, reasons: [...new Set(reasons)] });
    }
  }

  similar.sort((a, b) => b.score - a.score);
  return {
    exact: exact.slice(0, 5),
    similar: similar.slice(0, 4),
    clear: exact.length === 0 && similar.length === 0,
  };
}

export function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function makePlaceholderSvg(zh, accent = "#cbff45", kind = "skill") {
  const title = escapeXml(String(zh || "NEW ITEM").slice(0, 12));
  const kicker = kind === "prompt" ? "LOCAL PROMPT" : "LOCAL SKILL";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c0e14"/>
      <stop offset=".55" stop-color="#11141b"/>
      <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity=".16"/>
    </linearGradient>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
      <path d="M34 0H0V34" fill="none" stroke="#f2ecdf" stroke-opacity=".06"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <rect width="600" height="800" fill="url(#grid)"/>
  <circle cx="300" cy="330" r="156" fill="none" stroke="${escapeXml(accent)}" stroke-opacity=".55" stroke-width="1.5"/>
  <circle cx="300" cy="330" r="196" fill="none" stroke="#f2ecdf" stroke-opacity=".1" stroke-dasharray="2 9"/>
  <path d="M300 126l13 57 57 13-57 13-13 57-13-57-57-13 57-13z" fill="${escapeXml(accent)}"/>
  <text x="46" y="90" fill="#f2ecdf" fill-opacity=".55" font-family="Consolas, monospace" font-size="13" letter-spacing="4">${kicker}</text>
  <text x="46" y="666" fill="#f2ecdf" font-family="Arial, sans-serif" font-size="54" font-weight="800">${title}</text>
  <text x="46" y="712" fill="${escapeXml(accent)}" fill-opacity=".82" font-family="Consolas, monospace" font-size="13" letter-spacing="2">STYLE / ORBIT · LOCAL LIBRARY</text>
  <rect x="46" y="742" width="86" height="2" fill="${escapeXml(accent)}"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("没有选择图片。"));
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      return reject(new Error("请选择 PNG、JPG 或 WebP 图片。"));
    }
    if (file.size > 20 * 1024 * 1024) {
      return reject(new Error("图片超过 20MB，请换一张更小的图片。"));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片失败。"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("无法解析这张图片。"));
      image.onload = () => {
        const maxW = 900;
        const maxH = 1200;
        const scale = Math.min(1, maxW / image.width, maxH / image.height);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.84);
        if (!dataUrl.startsWith("data:image/")) {
          return reject(new Error("图片压缩失败。"));
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function describeStorage() {
  return isDesktopApp()
    ? "保存在这台电脑的本地库（不会上传网络）"
    : "保存在浏览器本地存储（不会上传网络）";
}
