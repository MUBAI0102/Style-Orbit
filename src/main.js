import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  SKILLS,
  CATEGORIES,
  CATEGORY_COUNTS,
  TOTAL_COUNT,
  WIBI_COUNT,
  DOUYIN_COUNT,
  LOCAL_COUNT,
  getSkillBySlug,
} from "./data.js";
import {
  compressImageFile,
  deleteCustomEntry,
  findDuplicates,
  getDesktopDataPath,
  isDesktopApp,
  makeCustomId,
  makePlaceholderSvg,
  makeUniqueSlug,
  upsertCustomEntry,
} from "./custom-library.js";

/* -------------------------------------------------------------------------
   The page is intentionally a single, dependency-light interaction:
   3D field <=> DOM interface. The photos are textured canvases and the only
   external content is the author's sample imagery, inlined above.
------------------------------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
if (isTouch) document.body.classList.add("is-touch");

const COLORS = {
  ink: 0x06070a,
  paper: 0xf2ecdf,
  pink: 0xff4f8b,
  cyan: 0x45e5ff,
  acid: 0xcbff45,
};

const state = {
  booted: false,
  auto: !reduceMotion,
  autoFactor: 1,
  hovered: null,
  selected: null,
  pointer: { x: 0, y: 0, inside: false, down: false, downX: 0, downY: 0, moved: 0 },
  dragging: false,
  modal: null,
  modalOpener: null,
  detailOpen: false,
  detailSlug: null,
  clickLock: false,
  flashCard: null,
  cameraTween: null,
  lastInteraction: performance.now(),
  catalogFilter: "all",
  catalogQuery: "",
  coachTimer: null,
  coachDismissed: false,
  toastTimer: null,
  addOpen: false,
  addEditingId: null,
  addKind: "skill",
  addImageData: null,
  addSaving: false,
  addDuplicateResult: null,
  addCheckTimer: null,
};

const dom = {
  site: $("#siteShell"),
  canvas: $("#scene"),
  boot: $("#bootScreen"),
  bootFill: $("#bootFill"),
  bootPercent: $("#bootPercent"),
  bootStatus: $("#bootStatus"),
  hover: $("#hoverLabel"),
  hoverIndex: $("#hoverIndex"),
  hoverCat: $("#hoverCat"),
  hoverName: $("#hoverName"),
  hoverEn: $("#hoverEn"),
  orbitNo: $("#orbitNo"),
  readout: $(".orbit-readout"),
  coach: $("#coachmark"),
  flash: $("#clickFlash"),
  toast: $("#toast"),
  detail: $("#detailPage"),
  detailScroll: $("#detailScroll"),
  detailImage: $("#detailImage"),
  detailBackdrop: $("#detailBackdrop"),
  detailTitle: $("#detailTitle"),
  detailEn: $("#detailEn"),
  detailCredit: $("#detailCredit"),
  detailDescription: $("#detailDescription"),
  detailCat: $("#detailCat"),
  detailBadge: $("#detailBadge"),
  detailBestFor: $("#detailBestFor"),
  detailGroup: $("#detailGroup"),
  detailTags: $("#detailTags"),
  detailCommand: $("#detailCommand"),
  commandHeading: $("#commandHeading"),
  copyUsageLabel: $("#copyUsageLabel"),
  commandHint: $("#commandHint"),
  detailGithub: $("#detailGithub"),
  detailRepo: $("#detailRepo"),
  promptPanel: $("#promptPanel"),
  promptKicker: $("#promptKicker"),
  detailPrompt: $("#detailPrompt"),
  promptExpand: $("#promptExpand"),
  detailIndex: $("#detailIndex"),
  detailGhost: $("#detailGhost"),
  detailProgress: $("#detailProgressBar"),
  detailNextName: $("#nextSkillName"),
  detailCaptionCredit: $("#detailCaptionCredit"),
  detailRights: $("#detailRights"),
  artTag: $("#artTag"),
  artCategory: $("#artCategory"),
  guide: $("#guideModal"),
  catalog: $("#catalogModal"),
  catalogGrid: $("#catalogGrid"),
  catalogEmpty: $("#catalogEmpty"),
  catalogSearch: $("#catalogSearch"),
  filterChips: $("#filterChips"),
  autoToggle: $("#autoToggle"),
  resetView: $("#resetView"),
  addBtn: $("#addBtn"),
  add: $("#addModal"),
  addPanel: $(".add-panel"),
  addForm: $("#addForm"),
  addKicker: $("#addKicker"),
  addHeading: $("#addHeading"),
  addKindSkill: $('[data-add-kind="skill"]'),
  addKindPrompt: $('[data-add-kind="prompt"]'),
  addZh: $("#addZh"),
  addEn: $("#addEn"),
  addSlug: $("#addSlug"),
  addCategory: $("#addCategory"),
  addDescription: $("#addDescription"),
  addBestFor: $("#addBestFor"),
  addTags: $("#addTags"),
  addPrompt: $("#addPrompt"),
  addPromptLabel: $("#addPromptLabel"),
  addSourceUrl: $("#addSourceUrl"),
  addCreator: $("#addCreator"),
  addImageInput: $("#addImageInput"),
  addImagePick: $("#addImagePick"),
  addImagePreview: $("#addImagePreview"),
  addImageName: $("#addImageName"),
  addImageClear: $("#addImageClear"),
  addDuplicate: $("#addDuplicate"),
  addDuplicateBody: $("#addDuplicateBody"),
  addConfirmWrap: $("#addConfirmWrap"),
  addConfirmUnique: $("#addConfirmUnique"),
  addFormError: $("#addFormError"),
  addSubmit: $("#addSubmit"),
  addStorageNote: $("#addStorageNote"),
  addOpenData: $("#addOpenData"),
  addLocalCount: $("#addLocalCount"),
  detailLocalActions: $("#detailLocalActions"),
  detailEditLocal: $("#detailEditLocal"),
  detailDeleteLocal: $("#detailDeleteLocal"),
};

/* ------------------------------------------------------------------ photos */

function loadPhoto(skill) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve({ skill, image });
    image.onerror = () => resolve({ skill, image: null });
    image.src = skill.image;
  });
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function makeCardTexture(skill, image) {
  const width = 384;
  const height = 540;
  const textureScale = isTouch ? 0.8 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * textureScale);
  canvas.height = Math.round(height * textureScale);
  const ctx = canvas.getContext("2d");
  if (textureScale !== 1) ctx.scale(textureScale, textureScale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.clearRect(0, 0, width, height);
  roundedRect(ctx, 0, 0, width, height, 12);
  ctx.fillStyle = "#ede4d5";
  ctx.fill();

  const imageX = 9;
  const imageY = 9;
  const imageW = width - 18;
  const imageH = 488;

  ctx.save();
  roundedRect(ctx, imageX, imageY, imageW, imageH, 5);
  ctx.clip();
  if (image) {
    ctx.filter = "saturate(1.045) contrast(1.055)";
    ctx.drawImage(image, imageX, imageY, imageW, imageH);
    ctx.filter = "none";
  } else {
    const fallback = ctx.createLinearGradient(imageX, imageY, imageW, imageH);
    fallback.addColorStop(0, skill.accent);
    fallback.addColorStop(1, "#171923");
    ctx.fillStyle = fallback;
    ctx.fillRect(imageX, imageY, imageW, imageH);
    ctx.fillStyle = "#f2ecdf";
    ctx.font = '900 118px "Arial Black", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(skill.id, width / 2, imageY + imageH / 2 + 35);
    ctx.textAlign = "left";
  }
  const shade = ctx.createLinearGradient(0, imageH - 70, 0, imageY + imageH);
  shade.addColorStop(0, "rgba(5, 6, 9, 0)");
  shade.addColorStop(1, "rgba(5, 6, 9, .24)");
  ctx.fillStyle = shade;
  ctx.fillRect(imageX, imageY + imageH - 74, imageW, 74);
  ctx.restore();

  ctx.strokeStyle = "rgba(9, 10, 14, .34)";
  ctx.lineWidth = 1;
  roundedRect(ctx, imageX + 0.5, imageY + 0.5, imageW - 1, imageH - 1, 5);
  ctx.stroke();

  /* Footer strip: physical print details, intentionally tiny. */
  ctx.fillStyle = skill.accent;
  ctx.fillRect(13, 513, 25, 2);
  ctx.fillStyle = "#17181c";
  ctx.font = '700 17px "Cascadia Mono", "Consolas", monospace';
  ctx.fillText(skill.id, 13, 532);
  ctx.fillStyle = "rgba(23, 24, 28, .52)";
  ctx.font = '600 8px "Cascadia Mono", "Consolas", monospace';
  ctx.textAlign = "left";
  ctx.fillText(skill.categoryEn, 48, 530);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(23, 24, 28, .4)";
  const sourceMark =
    skill.sourceType === "local"
      ? skill.kind === "prompt"
        ? "LOCAL / PROMPT"
        : "LOCAL / SKILL"
      : skill.sourceType === "douyin"
        ? skill.kind === "prompt"
          ? "DOUYIN / PROMPT"
          : "DOUYIN / SKILL"
        : "WIBI / SKILL";
  ctx.fillText(sourceMark, 370, 530);
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(255, 255, 255, .38)";
  ctx.lineWidth = 1;
  roundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 12);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeBorderTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 384, 540);
  ctx.strokeStyle = "rgba(255, 255, 255, .92)";
  ctx.shadowColor = "rgba(255, 255, 255, .9)";
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3;
  roundedRect(ctx, 2, 2, 380, 536, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.lineWidth = 1;
  roundedRect(ctx, 1.5, 1.5, 381, 537, 12);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeRadialTexture(size = 256, stops = [[0, 1], [0.45, 0.38], [1, 0]]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [offset, alpha] of stops) {
    gradient.addColorStop(offset, `rgba(255,255,255,${alpha})`);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCloudTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  const lobes = [
    [0.5, 0.5, 0.42, 0.7],
    [0.35, 0.42, 0.34, 0.52],
    [0.66, 0.58, 0.3, 0.42],
    [0.55, 0.3, 0.22, 0.3],
  ];
  for (const [cx, cy, radius, alpha] of lobes) {
    const g = ctx.createRadialGradient(
      size * cx,
      size * cy,
      0,
      size * cx,
      size * cy,
      size * radius
    );
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.36})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSparkTexture(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,.92)");
  gradient.addColorStop(0.5, "rgba(255,255,255,.22)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ----------------------------------------------------------------- helpers */

function setBoot(progress, status) {
  const pct = clamp(Math.round(progress), 0, 100);
  dom.bootFill.style.width = `${pct}%`;
  dom.bootPercent.textContent = `${pct}%`;
  if (status) dom.bootStatus.textContent = status;
}

function hideBoot() {
  state.booted = true;
  dom.boot.classList.add("is-done");
  dom.boot.setAttribute("aria-hidden", "true");
  document.body.classList.add("is-ready");
  startIntro();
  window.setTimeout(() => {
    dom.boot.style.display = "none";
  }, 900);
  window.setTimeout(() => {
    if (!isTouch) showCoach();
  }, 2600);
}

function showCoach() {
  if (!dom.coach || state.coachDismissed || state.detailOpen || state.modal) return;
  dom.coach.classList.add("is-visible");
  dom.coach.classList.remove("is-hidden");
  window.clearTimeout(state.coachTimer);
  state.coachTimer = window.setTimeout(hideCoach, 9000);
}

function hideCoach() {
  if (!dom.coach) return;
  state.coachDismissed = true;
  window.clearTimeout(state.coachTimer);
  dom.coach.classList.remove("is-visible");
  dom.coach.classList.add("is-hidden");
}

function showToast(message, duration = 1900) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, duration);
}

async function copyText(text, success = "已复制到剪贴板") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(success);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      showToast(success);
    } catch {
      showToast("复制失败，请手动选择文本");
    }
    input.remove();
  }
}

function trapFocus(event, container) {
  if (event.key !== "Tab" || !container) return;
  const focusable = $$(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container
  ).filter((node) => node.offsetParent !== null || node === document.activeElement);
  if (focusable.length < 1) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setSceneEnabled(enabled) {
  if (!window.styleOrbit) return;
  window.styleOrbit.controls.enabled = enabled;
  if (!enabled) {
    setHovered(null);
    state.pointer.inside = false;
    dom.canvas.classList.remove("is-hovering");
  }
}

/* ------------------------------------------------------------------- catalog */

function buildCatalog() {
  const chips = [
    { key: "all", label: `全部 ${SKILLS.length}`, color: "#f2ecdf" },
    { key: "local", label: `本地 ${LOCAL_COUNT}`, color: "#9dffd0" },
    { key: "douyin", label: `抖音 ${DOUYIN_COUNT}`, color: "#ffd4a3" },
    ...Object.entries(CATEGORIES).map(([key, value]) => ({
      key,
      label: `${value.label} ${CATEGORY_COUNTS[key]}`,
      color: value.color,
    })),
  ];
  dom.filterChips.innerHTML = chips
    .map(
      (chip) =>
        `<button type="button" class="filter-chip${chip.key === "all" ? " is-active" : ""}" data-filter="${chip.key}" style="--chip-color:${chip.color}"><span class="chip-dot"></span>${chip.label}</button>`
    )
    .join("");

  dom.catalogGrid.innerHTML = SKILLS.map((skill) => {
    const sourceMark =
      skill.kind === "prompt"
        ? "PROMPT"
        : skill.sourceType === "local"
          ? "LOCAL"
          : skill.sourceType === "douyin"
            ? "DOUYIN"
            : "";
    return `
      <button type="button" class="catalog-card" data-slug="${escapeHtml(skill.slug)}" style="--card-accent:${skill.accent}" aria-label="查看 ${escapeHtml(skill.zh)} · ${escapeHtml(skill.en)} · ${escapeHtml(skill.sourceLabel)}">
        <span class="catalog-card__image">
          <span class="catalog-card__no">NO. ${skill.id}</span>
          ${sourceMark ? `<span class="catalog-card__source">${sourceMark}</span>` : ""}
          <img src="${skill.image}" alt="${escapeHtml(skill.zh)}风格示例" loading="lazy" draggable="false">
          <span class="catalog-card__arrow" aria-hidden="true">↗</span>
        </span>
        <span class="catalog-card__meta">
          <strong>${escapeHtml(skill.zh)}</strong>
          <span>${skill.categoryEn} · ${escapeHtml(skill.en)}</span>
        </span>
      </button>`;
  }).join("");

  dom.filterChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (!chip) return;
    state.catalogFilter = chip.dataset.filter;
    $$(".filter-chip", dom.filterChips).forEach((button) =>
      button.classList.toggle("is-active", button === chip)
    );
    applyCatalogFilter();
  });

  dom.catalogGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-slug]");
    if (!card) return;
    const skill = getSkillBySlug(card.dataset.slug);
    if (!skill) return;
    closeModal(dom.catalog, { restoreFocus: false });
    openDetail(skill, { enterX: window.innerWidth / 2, enterY: window.innerHeight * 0.42 });
  });

  let searchTimer = 0;
  dom.catalogSearch.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.catalogQuery = dom.catalogSearch.value.trim().toLowerCase();
      applyCatalogFilter();
    }, 90);
  });
}

function applyCatalogFilter() {
  if (!dom.catalogGrid) return;
  let visible = 0;
  $$(".catalog-card", dom.catalogGrid).forEach((card) => {
    const skill = getSkillBySlug(card.dataset.slug);
    const matchesCategory =
      state.catalogFilter === "all" ||
      (state.catalogFilter === "douyin"
        ? skill.sourceType === "douyin"
        : state.catalogFilter === "local"
          ? skill.sourceType === "local"
          : skill.cat === state.catalogFilter);
    const haystack = [
      skill.zh,
      skill.en,
      skill.slug,
      skill.categoryLabel,
      skill.categoryEn,
      skill.group,
      skill.collection,
      skill.creator,
      skill.sourceLabel,
      skill.kind === "prompt" ? "提示词 prompt" : "skill",
      skill.sourceType === "douyin" ? "抖音 douyin 新增" : skill.sourceType === "local" ? "本地 local 我的条目" : "github",
      skill.bestFor,
      ...skill.tags,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !state.catalogQuery || haystack.includes(state.catalogQuery);
    const show = matchesCategory && matchesQuery;
    card.hidden = !show;
    if (show) visible += 1;
  });
  dom.catalogEmpty.hidden = visible !== 0;
  dom.catalogGrid.style.display = visible === 0 ? "none" : "";
}

function openModal(element, opener = null) {
  if (!element) return;
  if (state.modal && state.modal !== element) {
    state.modal.classList.remove("is-open");
    state.modal.setAttribute("aria-hidden", "true");
  }
  state.modal = element;
  state.modalOpener = opener || document.activeElement;
  element.classList.add("is-open");
  element.setAttribute("aria-hidden", "false");
  setSceneEnabled(false);
  setHovered(null);
  hideCoach();
  window.setTimeout(() => {
    const target = $(".guide-panel, .catalog-panel, .add-panel", element);
    target?.focus({ preventScroll: true });
  }, 100);
}

function closeModal(element = state.modal, options = {}) {
  if (!element || options.skip) return;
  element.classList.remove("is-open");
  element.setAttribute("aria-hidden", "true");
  if (element === dom.add) state.addOpen = false;
  if (state.modal === element) state.modal = null;
  if (!state.detailOpen) setSceneEnabled(true);
  const opener = state.modalOpener;
  state.modalOpener = null;
  if (options.restoreFocus !== false && opener instanceof HTMLElement) {
    opener.focus({ preventScroll: true });
  }
}

/* -------------------------------------------------------------------- detail */

function setDetailContent(skill) {
  const next = SKILLS[skill.index % SKILLS.length];
  const isPrompt = skill.kind === "prompt";
  const isDouyin = skill.sourceType === "douyin";
  const isLocal = skill.sourceType === "local";
  const hasPrompt = Boolean(skill.prompt);
  dom.detail.style.setProperty("--accent", skill.accent);
  dom.detail.style.setProperty("--accent-soft", skill.accentSoft);
  dom.detailImage.src = skill.image;
  dom.detailImage.alt = `${skill.zh} · 风格化照片示例`;
  dom.detailBackdrop.src = skill.image;
  dom.detailTitle.textContent = skill.zh;
  dom.detailEn.textContent = skill.en;
  dom.detailCredit.textContent = isLocal
    ? `${skill.sourceLabel} / ${skill.collection} / 仅保存在本机`
    : isDouyin
      ? `${skill.sourceLabel} / ${skill.collection} / @${skill.creator}`
      : `WIBI STYLE / ${skill.collection.replace(/^Wibi Style · /, "")} / ${skill.creator}`;
  dom.detailDescription.textContent =
    skill.description || (isLocal ? "添加到本机收藏的自定义条目。" : "");
  dom.detailCat.textContent = `${skill.categoryLabel} / ${skill.categoryEn}`;
  dom.detailBadge.textContent = skill.beta
    ? `${skill.sourceLabel} · BETA`
    : skill.sourceLabel;
  dom.detailBadge.classList.toggle("is-beta", Boolean(skill.beta));
  dom.detailBestFor.textContent = skill.bestFor || "未填写";
  dom.detailGroup.textContent = skill.collection;
  dom.detailTags.innerHTML = skill.tags
    .map((tag) => `<span class="detail-tag">${escapeHtml(tag)}</span>`)
    .join("");
  dom.detailCommand.textContent = isPrompt
    ? "上传照片 + 完整提示词 → 生成"
    : skill.usage;
  dom.commandHeading.textContent = isPrompt
    ? "HOW TO USE / 使用提示词"
    : "HOW TO USE / 调用指令";
  dom.copyUsageLabel.textContent = isPrompt ? "复制提示词" : "复制指令";
  dom.commandHint.textContent = isPrompt
    ? "与照片一起发送给支持图像输入的模型"
    : isLocal
      ? "本地 Skill · 按调用 ID 使用"
      : isDouyin
        ? "上传一张照片 · 按 Skill 名称调用"
        : "上传一张照片 · 在 Codex 中调用";
  const hasSource = Boolean(skill.sourceUrl);
  dom.detailGithub.hidden = !hasSource;
  if (hasSource) {
    dom.detailGithub.href = skill.sourceUrl;
    dom.detailGithub.innerHTML = isLocal
      ? '打开来源链接 <span aria-hidden="true">↗</span>'
      : isDouyin
        ? '在抖音查看原作 <span aria-hidden="true">↗</span>'
        : '在 GitHub 查看 Skill <span aria-hidden="true">↗</span>';
  }
  dom.detailRepo.hidden = !isDouyin || !skill.repoUrl;
  if (!dom.detailRepo.hidden) {
    dom.detailRepo.href = skill.repoUrl;
    dom.detailRepo.innerHTML = 'GitHub Skill <span aria-hidden="true">↗</span>';
  }
  dom.detailLocalActions.hidden = !isLocal;
  dom.promptPanel.hidden = !hasPrompt;
  dom.promptKicker.textContent = hasPrompt
    ? skill.promptLabel || (isPrompt ? "PROMPT / 完整提示词" : "REFERENCE PROMPT / 参考提示词")
    : "";
  dom.detailPrompt.textContent = hasPrompt ? skill.prompt : "";
  dom.detailPrompt.classList.remove("is-expanded");
  dom.promptExpand.setAttribute("aria-expanded", "false");
  dom.promptExpand.textContent = "展开全文";
  dom.detailCaptionCredit.textContent = isLocal
    ? `LOCAL / @${skill.creator}`
    : isDouyin
      ? `SOURCE / @${skill.creator}`
      : "VISUAL SKILL BY @威比 HUNTER WEI.";
  dom.detailRights.textContent = isLocal
    ? "本机条目，仅保存在这台电脑；示例图、提示词与来源由你自行管理。"
    : isDouyin
      ? isPrompt
        ? `示例作品与提示词来自抖音 @${skill.creator}；请尊重原作者版权，仅供个人学习与展示。`
        : `示例作品来自抖音 @${skill.creator}；Skill 版权归原作者所有，本页面为个人学习展示，不作商业使用。`
      : "示例图来自开源仓库 Wibi Style，版权归原作者所有；本页面为个人非商业可视化展示。";
  dom.detailIndex.textContent = skill.id;
  dom.detailGhost.textContent = skill.id;
  dom.detailNextName.textContent = next.zh;
  dom.artTag.textContent = isLocal
    ? `${isPrompt ? "LOCAL PROMPT" : "LOCAL SKILL"} / ${skill.id}`
    : `${isPrompt ? "PROMPT" : "SAMPLE"} / ${skill.id}`;
  dom.artCategory.textContent = skill.categoryEn;
  dom.detailProgress.style.width = `${(skill.index / SKILLS.length) * 100}%`;

  dom.detailScroll.scrollTop = 0;
  dom.detailTitle.classList.toggle("is-long", skill.zh.length > 7);
  dom.detailImage.classList.remove("is-switching");
  void dom.detailImage.offsetWidth;
  dom.detailImage.classList.add("is-switching");
}

function reloadAt(hash = "") {
  const target = `${window.location.pathname}${window.location.search}${hash || ""}`;
  try {
    window.history.replaceState(null, "", target);
  } catch {
    if (hash) window.location.hash = hash;
  }
  window.location.reload();
}

function openDetail(skill, options = {}) {
  if (!skill) return;
  if (state.modal) closeModal(state.modal, { restoreFocus: false, skip: true });
  state.modal = null;

  const changing = state.detailOpen;
  state.detailOpen = true;
  state.detailSlug = skill.slug;
  state.selected = state.cardMap?.get(skill.slug) || null;

  if (!changing) {
    const enterX = options.enterX ?? window.innerWidth * 0.5;
    const enterY = options.enterY ?? window.innerHeight * 0.5;
    dom.detail.style.setProperty("--enter-x", `${enterX}px`);
    dom.detail.style.setProperty("--enter-y", `${enterY}px`);
    dom.detail.classList.add("is-open");
    dom.detail.setAttribute("aria-hidden", "false");
    setSceneEnabled(false);
    hideCoach();
    document.body.classList.add("is-detail");
    window.setTimeout(() => {
      dom.detail.focus({ preventScroll: true });
    }, 520);
  }

  setDetailContent(skill);

  if (!options.fromRoute) {
    const href = `#/skill/${skill.slug}`;
    if (changing) {
      history.replaceState(
        { view: "detail", slug: skill.slug, fromApp: true },
        "",
        href
      );
    } else {
      history.pushState(
        { view: "detail", slug: skill.slug, fromApp: true },
        "",
        href
      );
    }
  }
}

function hideDetailPage() {
  state.detailOpen = false;
  state.clickLock = false;
  dom.detail.classList.remove("is-open");
  dom.detail.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-detail");
  if (!state.modal) setSceneEnabled(true);
  state.detailSlug = null;
  if (dom.detail.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  window.setTimeout(() => {
    if (!state.detailOpen && state.selected) {
      state.selected = null;
    }
  }, 1600);
}

function closeDetail() {
  const wasOpen = state.detailOpen;
  if (!wasOpen) return;
  const shouldGoBack = history.state?.view === "detail" && history.state?.fromApp;
  hideDetailPage();
  if (shouldGoBack) {
    history.back();
  } else {
    history.replaceState({ view: "orbit" }, "", "#orbit");
  }
}

function navigateDetail(direction) {
  if (!state.detailSlug) return;
  const current = getSkillBySlug(state.detailSlug);
  if (!current) return;
  const nextIndex = (current.index - 1 + direction + SKILLS.length) % SKILLS.length;
  const nextSkill = SKILLS[nextIndex];
  openDetail(nextSkill, { fromRoute: false });
  if (window.styleOrbit) {
    state.selected = state.cardMap?.get(nextSkill.slug) || null;
  }
}

function routeFromHash() {
  const match = window.location.hash.match(/^#\/skill\/([a-z0-9-]+)/i);
  if (!match) {
    if (state.detailOpen) hideDetailPage();
    return;
  }
  const skill = getSkillBySlug(match[1].toLowerCase());
  if (!skill) {
    if (state.detailOpen) hideDetailPage();
    return;
  }
  if (state.detailOpen) {
    if (state.detailSlug !== skill.slug) {
      setDetailContent(skill);
      state.detailSlug = skill.slug;
    }
  } else {
    openDetail(skill, { fromRoute: true });
  }
}

/* ------------------------------------------------------------------- boot/UI */

/* --------------------------------------------------------------- local add */

function setAddImage(dataUrl, name = "") {
  state.addImageData = dataUrl || null;
  const image = dom.addImagePreview;
  if (!image) return;
  if (dataUrl) {
    image.src = dataUrl;
    dom.addImagePick?.classList.add("has-image");
    if (dom.addImageName) dom.addImageName.textContent = name || "已选择本地图片";
    if (dom.addImageClear) dom.addImageClear.hidden = false;
    return;
  }
  updateAddPlaceholder();
  if (dom.addImageName) dom.addImageName.textContent = "未选择图片 · 自动生成封面";
  if (dom.addImageClear) dom.addImageClear.hidden = true;
}

function updateAddPlaceholder() {
  if (!dom.addImagePreview || state.addImageData) return;
  const category = CATEGORIES[dom.addCategory?.value] || CATEGORIES.scene;
  const name = dom.addZh?.value.trim() || "NEW ITEM";
  dom.addImagePreview.src = makePlaceholderSvg(name, category.color, state.addKind);
  dom.addImagePick?.classList.remove("has-image");
}

function populateAddCategories(selected = "") {
  if (!dom.addCategory) return;
  const entries = Object.entries(CATEGORIES).filter(([key]) =>
    state.addKind === "prompt" ? key === "prompt" : key !== "prompt"
  );
  dom.addCategory.innerHTML = entries
    .map(([key, value]) => `<option value="${key}">${escapeHtml(value.label)} / ${escapeHtml(value.en)}</option>`)
    .join("");
  const fallback = state.addKind === "prompt" ? "prompt" : "scene";
  dom.addCategory.value = entries.some(([key]) => key === selected) ? selected : fallback;
}

function setAddKind(kind, selectedCategory = "") {
  state.addKind = kind === "prompt" ? "prompt" : "skill";
  dom.addKindSkill?.classList.toggle("is-active", state.addKind === "skill");
  dom.addKindPrompt?.classList.toggle("is-active", state.addKind === "prompt");
  dom.addKindSkill?.setAttribute("aria-pressed", String(state.addKind === "skill"));
  dom.addKindPrompt?.setAttribute("aria-pressed", String(state.addKind === "prompt"));
  if (dom.addPromptLabel) {
    dom.addPromptLabel.textContent =
      state.addKind === "prompt" ? "完整提示词（必填）" : "参考提示词（可选）";
  }
  if (dom.addPrompt) {
    dom.addPrompt.required = state.addKind === "prompt";
    dom.addPrompt.placeholder =
      state.addKind === "prompt"
        ? "粘贴完整提示词。它会与现有提示词全文比对，重复会被拦截。"
        : "如果是 Skill，可粘贴它的参考提示词；如果选择 Prompt，这里必填。";
  }
  populateAddCategories(selectedCategory);
  updateAddPlaceholder();
}

function clearAddError() {
  if (!dom.addFormError) return;
  dom.addFormError.hidden = true;
  dom.addFormError.textContent = "";
}

function showAddError(message) {
  if (!dom.addFormError) return;
  dom.addFormError.hidden = false;
  dom.addFormError.textContent = message;
  dom.addFormError.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function setAddDuplicateNeutral() {
  if (!dom.addDuplicate || !dom.addDuplicateBody) return;
  dom.addDuplicate.classList.remove("is-clear", "has-exact", "has-similar");
  dom.addDuplicateBody.innerHTML = `
    <strong>填写名称后自动检查</strong>
    <p>会与现有 <span data-total>${TOTAL_COUNT}</span> 个条目及本地条目比对。同名、同英文名和同一段提示词会被拦截。</p>`;
  if (dom.addConfirmWrap) dom.addConfirmWrap.hidden = true;
  if (dom.addConfirmUnique) dom.addConfirmUnique.checked = false;
  if (dom.addSubmit) dom.addSubmit.disabled = false;
}

function renderDuplicateResult(result, preserveConfirm = false) {
  if (!dom.addDuplicate || !dom.addDuplicateBody) return;
  state.addDuplicateResult = result;
  dom.addDuplicate.classList.remove("is-clear", "has-exact", "has-similar");
  if (!result) {
    setAddDuplicateNeutral();
    return;
  }
  if (result.exact.length) {
    dom.addDuplicate.classList.add("has-exact");
    dom.addDuplicateBody.innerHTML = `
      <strong>已存在，不能重复添加</strong>
      <p>匹配到 ${result.exact.length} 个已有条目的相同字段。</p>
      <ul class="add-duplicate__list">${result.exact
        .map(
          ({ item, fields }) =>
            `<li><span>${escapeHtml(item.zh)} · ${escapeHtml(fields.join(" / "))}</span><span>NO.${item.id}</span></li>`
        )
        .join("")}</ul>`;
    if (dom.addConfirmWrap) dom.addConfirmWrap.hidden = true;
    if (dom.addSubmit) dom.addSubmit.disabled = true;
    return;
  }
  if (result.similar.length) {
    dom.addDuplicate.classList.add("has-similar");
    dom.addDuplicateBody.innerHTML = `
      <strong>发现相似条目，请先确认</strong>
      <p>不是完全同名，但可能是同一种风格。</p>
      <ul class="add-duplicate__list">${result.similar
        .map(
          ({ item, score, reasons }) =>
            `<li><span>${escapeHtml(item.zh)} · ${escapeHtml(reasons.join(" / "))}</span><span>${Math.round(score * 100)}%</span></li>`
        )
        .join("")}</ul>`;
    if (dom.addConfirmWrap) dom.addConfirmWrap.hidden = false;
    if (dom.addConfirmUnique && !preserveConfirm) dom.addConfirmUnique.checked = false;
    if (dom.addSubmit) dom.addSubmit.disabled = false;
    return;
  }
  dom.addDuplicate.classList.add("is-clear");
  dom.addDuplicateBody.innerHTML = `
    <strong>没有发现重复</strong>
    <p>名称与提示词均未命中现有 ${TOTAL_COUNT} 个条目，可以继续添加。</p>`;
  if (dom.addConfirmWrap) dom.addConfirmWrap.hidden = true;
  if (dom.addSubmit) dom.addSubmit.disabled = false;
}

function collectAddCandidate() {
  const kind = state.addKind;
  const zh = dom.addZh?.value.trim() || "";
  const en = dom.addEn?.value.trim() || zh;
  const cat = kind === "prompt" ? "prompt" : dom.addCategory?.value || "scene";
  const usedSlugs = new Set(
    SKILLS.filter((skill) => skill.customId !== state.addEditingId).map((skill) => skill.slug)
  );
  const baseSlug = dom.addSlug?.value.trim() || en || zh;
  const slug = makeUniqueSlug(baseSlug, usedSlugs, "local");
  return {
    customId: state.addEditingId || makeCustomId(),
    kind,
    zh,
    en,
    slug,
    cat,
    description: dom.addDescription?.value.trim() || "",
    bestFor: dom.addBestFor?.value.trim() || "",
    tags: dom.addTags?.value
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    prompt: dom.addPrompt?.value.trim() || "",
    sourceUrl: dom.addSourceUrl?.value.trim() || "",
    creator: dom.addCreator?.value.trim() || "我",
    collection: "我的本机收藏",
    sourceType: "local",
    image: state.addImageData || "",
  };
}

function validateAddCandidate(candidate) {
  clearAddError();
  if (!candidate.zh) {
    showAddError("请先填写中文名。");
    dom.addZh?.focus();
    return false;
  }
  if (state.addKind === "prompt" && !candidate.prompt) {
    showAddError("Prompt 必须包含完整提示词。");
    dom.addPrompt?.focus();
    return false;
  }
  const rawSource = dom.addSourceUrl?.value.trim();
  if (rawSource) {
    try {
      const url = new URL(rawSource);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      showAddError("来源链接必须是 http:// 或 https:// 开头的有效地址。");
      dom.addSourceUrl?.focus();
      return false;
    }
  }
  return true;
}

function runAddDuplicateCheck() {
  if (!state.addOpen) return null;
  const candidate = collectAddCandidate();
  if (!candidate.zh) {
    renderDuplicateResult(null);
    return null;
  }
  const result = findDuplicates(candidate, SKILLS, state.addEditingId);
  renderDuplicateResult(result);
  return result;
}

function scheduleAddDuplicateCheck() {
  clearAddError();
  updateAddPlaceholder();
  window.clearTimeout(state.addCheckTimer);
  state.addCheckTimer = window.setTimeout(runAddDuplicateCheck, 180);
}

function openAddModal(skill = null) {
  if (!dom.add) return;
  state.addOpen = true;
  state.addEditingId = skill?.customId || null;
  state.addSaving = false;
  state.addImageData = null;
  state.addDuplicateResult = null;
  state.addCheckTimer = 0;
  clearAddError();
  setAddDuplicateNeutral();
  if (dom.addConfirmUnique) dom.addConfirmUnique.checked = false;
  if (dom.addSubmit) {
    dom.addSubmit.disabled = false;
    dom.addSubmit.innerHTML =
      state.addEditingId
        ? '保存修改 <span aria-hidden="true">→</span>'
        : '保存并进入轨道 <span aria-hidden="true">→</span>';
  }

  dom.addKicker.textContent = state.addEditingId
    ? "EDIT LOCAL ENTRY / 编辑本机条目"
    : "LOCAL LIBRARY / 本地新增";
  dom.addHeading.innerHTML = state.addEditingId
    ? '把这条 <em>Skill / Prompt</em><br>调整好。'
    : '把新的 <em>Skill / Prompt</em><br>放进轨道。';

  const kind = skill?.kind === "prompt" ? "prompt" : "skill";
  setAddKind(kind, skill?.cat || (kind === "prompt" ? "prompt" : "scene"));
  dom.addZh.value = skill?.zh || "";
  dom.addEn.value = skill?.en || "";
  dom.addSlug.value = skill?.slug || "";
  dom.addDescription.value = skill?.description || "";
  dom.addBestFor.value = skill?.bestFor || "";
  dom.addTags.value = skill?.tags?.join(", ") || "";
  dom.addPrompt.value = skill?.prompt || "";
  dom.addSourceUrl.value = skill?.sourceUrl || "";
  dom.addCreator.value = skill?.creator || "我";
  dom.addImageInput.value = "";

  const existingImage =
    skill?.image && !skill.image.startsWith("data:image/svg+xml") ? skill.image : null;
  setAddImage(existingImage, existingImage ? "当前本地封面" : "");
  if (dom.addLocalCount) dom.addLocalCount.textContent = String(LOCAL_COUNT);
  if (dom.addStorageNote) {
    dom.addStorageNote.textContent = isDesktopApp()
      ? "保存在这台电脑的 library.json，不会上传网络。"
      : "保存在浏览器本地存储，不会上传网络。";
  }
  if (dom.addOpenData) {
    dom.addOpenData.hidden = !isDesktopApp();
    dom.addOpenData.title = getDesktopDataPath();
  }
  dom.addPanel?.scrollTo({ top: 0 });
  openModal(dom.add, dom.addBtn);
  runAddDuplicateCheck();
  window.setTimeout(() => dom.addZh?.focus({ preventScroll: true }), 160);
}

async function handleAddImage(file) {
  if (!file) return;
  if (dom.addImageName) dom.addImageName.textContent = "正在压缩图片…";
  try {
    const dataUrl = await compressImageFile(file);
    setAddImage(dataUrl, file.name);
    clearAddError();
  } catch (error) {
    if (dom.addImageName) dom.addImageName.textContent = "图片未添加";
    showAddError(error.message || "图片处理失败。");
  } finally {
    if (dom.addImageInput) dom.addImageInput.value = "";
  }
}

async function handleAddSubmit(event) {
  event.preventDefault();
  if (state.addSaving) return;
  const candidate = collectAddCandidate();
  if (!validateAddCandidate(candidate)) return;
  const result = findDuplicates(candidate, SKILLS, state.addEditingId);
  renderDuplicateResult(result, true);
  if (result.exact.length) {
    showAddError("已有相同中文名、英文名或提示词的条目，已阻止重复添加。");
    return;
  }
  if (result.similar.length && !dom.addConfirmUnique?.checked) {
    showAddError("发现相似条目，请先勾选“确认不是重复条目”。");
    return;
  }

  state.addSaving = true;
  if (dom.addSubmit) {
    dom.addSubmit.disabled = true;
    dom.addSubmit.textContent = "保存中…";
  }
  clearAddError();
  try {
    const saved = await upsertCustomEntry({
      ...candidate,
      image: candidate.image || "",
    });
    showToast(state.addEditingId ? "本地条目已更新，正在重排轨道…" : "已添加本地条目，正在重排轨道…");
    window.setTimeout(() => {
      reloadAt(`#/skill/${saved.slug}`);
    }, 280);
  } catch (error) {
    state.addSaving = false;
    if (dom.addSubmit) {
      dom.addSubmit.disabled = false;
      dom.addSubmit.innerHTML = state.addEditingId
        ? '保存修改 <span aria-hidden="true">→</span>'
        : '保存并进入轨道 <span aria-hidden="true">→</span>';
    }
    showAddError(error.message || "保存失败，请检查本地数据目录权限。");
  }
}

function bindAddModal() {
  dom.addBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    openAddModal();
  });
  $$("[data-close-add]").forEach((node) =>
    node.addEventListener("click", () => {
      state.addOpen = false;
      closeModal(dom.add);
    })
  );
  dom.addForm?.addEventListener("submit", handleAddSubmit);
  dom.addKindSkill?.addEventListener("click", () => {
    setAddKind("skill", dom.addCategory?.value);
    scheduleAddDuplicateCheck();
  });
  dom.addKindPrompt?.addEventListener("click", () => {
    setAddKind("prompt", "prompt");
    scheduleAddDuplicateCheck();
  });
  ["addZh", "addEn", "addSlug", "addPrompt", "addSourceUrl"].forEach((key) => {
    dom[key]?.addEventListener("input", scheduleAddDuplicateCheck);
  });
  dom.addCategory?.addEventListener("change", scheduleAddDuplicateCheck);
  dom.addImagePick?.addEventListener("click", () => dom.addImageInput?.click());
  dom.addImageInput?.addEventListener("change", () => handleAddImage(dom.addImageInput.files?.[0]));
  dom.addImageClear?.addEventListener("click", () => {
    setAddImage(null);
    clearAddError();
  });
  dom.addConfirmUnique?.addEventListener("change", clearAddError);
  dom.addOpenData?.addEventListener("click", () => {
    const result = window.desktopAPI?.openDataFolder?.();
    if (result && typeof result.catch === "function") result.catch(() => {});
  });
  dom.detailEditLocal?.addEventListener("click", () => {
    const skill = getSkillBySlug(state.detailSlug);
    if (skill?.sourceType === "local") openAddModal(skill);
  });
  dom.detailDeleteLocal?.addEventListener("click", async () => {
    const skill = getSkillBySlug(state.detailSlug);
    if (!skill?.customId) return;
    const confirmed = window.confirm(`从本机库删除「${skill.zh}」？\n\n此操作会立即删除本地条目，无法撤销。`);
    if (!confirmed) return;
    try {
      await deleteCustomEntry(skill.customId);
      showToast("本地条目已删除，正在重排轨道…");
      window.setTimeout(() => {
        reloadAt("");
      }, 260);
    } catch (error) {
      showToast(error.message || "删除失败。", 5000);
    }
  });
}

function hydrateStaticCounts() {
  $$("[data-total]").forEach((node) => {
    node.textContent = String(TOTAL_COUNT);
  });
  $$("[data-local-count]").forEach((node) => {
    node.textContent = String(LOCAL_COUNT);
  });
  const catalogButton = $("#catalogBtn");
  if (catalogButton) {
    catalogButton.setAttribute(
      "aria-label",
      `打开风格目录，共 ${TOTAL_COUNT} 个条目（${WIBI_COUNT} Wibi + ${DOUYIN_COUNT} 抖音 + ${LOCAL_COUNT} 本地）`
    );
  }
  dom.canvas?.setAttribute(
    "aria-label",
    `${TOTAL_COUNT} 个风格化照片 Skill / Prompt 示例的三维环绕画廊`
  );
  document.documentElement.dataset.wibiCount = String(WIBI_COUNT);
  document.documentElement.dataset.douyinCount = String(DOUYIN_COUNT);
}

function wireInterface() {
  hydrateStaticCounts();
  buildCatalog();
  bindAddModal();
  if (!state.auto) {
    dom.autoToggle?.setAttribute("aria-pressed", "false");
    dom.autoToggle?.setAttribute("aria-label", "继续自动巡航");
    if (dom.autoToggle) {
      dom.autoToggle.innerHTML =
        '<svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg><span class="rail-tip">继续巡航</span>';
    }
  }

  $("#catalogBtn")?.addEventListener("click", (event) =>
    openModal(dom.catalog, event.currentTarget)
  );
  $("#guideBtn")?.addEventListener("click", (event) =>
    openModal(dom.guide, event.currentTarget)
  );
  $("#guideBtnDock")?.addEventListener("click", (event) =>
    openModal(dom.guide, event.currentTarget)
  );
  $$("[data-close-guide]").forEach((node) =>
    node.addEventListener("click", () => closeModal(dom.guide))
  );
  $$("[data-close-catalog]").forEach((node) =>
    node.addEventListener("click", () => closeModal(dom.catalog))
  );

  $("#detailBack")?.addEventListener("click", closeDetail);
  $("#detailPrev")?.addEventListener("click", () => navigateDetail(-1));
  $("#detailNext")?.addEventListener("click", () => navigateDetail(1));
  $("#detailNextFooter")?.addEventListener("click", () => navigateDetail(1));
  $("#copyUsage")?.addEventListener("click", () => {
    const skill = getSkillBySlug(state.detailSlug);
    if (!skill) return;
    if (skill.kind === "prompt" && skill.prompt) {
      copyText(skill.prompt, "完整提示词已复制");
    } else {
      copyText(skill.usage, "调用指令已复制");
    }
  });
  dom.detailCommand?.addEventListener("click", () => {
    const skill = getSkillBySlug(state.detailSlug);
    if (!skill) return;
    if (skill.kind === "prompt" && skill.prompt) {
      copyText(skill.prompt, "完整提示词已复制");
    } else {
      copyText(skill.usage, "调用指令已复制");
    }
  });
  $("#copyPrompt")?.addEventListener("click", () => {
    const skill = getSkillBySlug(state.detailSlug);
    if (skill?.prompt) copyText(skill.prompt, "完整提示词已复制");
  });
  dom.promptExpand?.addEventListener("click", () => {
    const expanded = dom.detailPrompt.classList.toggle("is-expanded");
    dom.promptExpand.setAttribute("aria-expanded", String(expanded));
    dom.promptExpand.textContent = expanded ? "收起全文" : "展开全文";
  });

  dom.autoToggle?.addEventListener("click", toggleAuto);
  $("#resetView")?.addEventListener("click", resetView);
  $("#fullscreenToggle")?.addEventListener("click", toggleFullscreen);
  $("#coachClose")?.addEventListener("click", hideCoach);
  $("#brandHome")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (state.detailOpen) closeDetail();
    closeModal(state.modal);
    resetView();
  });

  dom.canvas.addEventListener("pointerenter", () => {
    state.pointer.inside = true;
  });
  dom.canvas.addEventListener("pointerleave", () => {
    state.pointer.inside = false;
    if (!state.dragging) setHovered(null);
    dom.canvas.classList.remove("is-hovering");
  });
  dom.canvas.addEventListener("pointermove", (event) => {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.inside = true;
    if (state.pointer.down) {
      state.pointer.moved = Math.max(
        state.pointer.moved,
        Math.hypot(event.clientX - state.pointer.downX, event.clientY - state.pointer.downY)
      );
    }
    if (state.hovered) positionHoverLabel(event.clientX, event.clientY);
  });
  dom.canvas.addEventListener("pointerdown", (event) => {
    state.pointer.down = true;
    state.pointer.downX = event.clientX;
    state.pointer.downY = event.clientY;
    state.pointer.moved = 0;
    state.lastInteraction = performance.now();
    setHovered(null);
    hideCoach();
    if (window.styleOrbit?.controls) window.styleOrbit.controls.enabled = true;
  });
  dom.canvas.addEventListener("pointerup", (event) => {
    const wasClick =
      state.pointer.down &&
      state.pointer.moved < 8 &&
      !state.detailOpen &&
      !state.modal;
    state.pointer.down = false;
    dom.canvas.classList.remove("is-dragging");
    if (wasClick) handleCanvasClick(event);
  });
  window.addEventListener("pointerup", () => {
    if (!state.pointer.down) return;
    state.pointer.down = false;
    dom.canvas.classList.remove("is-dragging");
  });

  dom.canvas.addEventListener("wheel", () => {
    state.lastInteraction = performance.now();
    hideCoach();
  }, { passive: true });

  window.addEventListener("keydown", onKeydown);
  window.addEventListener("popstate", routeFromHash);
  window.addEventListener("hashchange", routeFromHash);
  window.addEventListener("resize", handleResize);
  window.addEventListener("blur", () => {
    state.pointer.down = false;
    state.dragging = false;
    dom.canvas.classList.remove("is-dragging");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      state.pointer.down = false;
      state.dragging = false;
    }
  });
  document.addEventListener("fullscreenchange", () => {
    const button = $("#fullscreenToggle");
    if (button) {
      button.setAttribute(
        "aria-label",
        document.fullscreenElement ? "退出全屏" : "全屏浏览"
      );
    }
  });
}

function onKeydown(event) {
  if (event.key === "Escape") {
    if (state.modal) {
      event.preventDefault();
      closeModal(state.modal);
      return;
    }
    if (state.detailOpen) {
      event.preventDefault();
      closeDetail();
      return;
    }
    hideCoach();
    return;
  }

  if (state.modal) {
    trapFocus(event, state.modal);
    return;
  }

  if (state.detailOpen) {
    trapFocus(event, dom.detail);
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateDetail(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateDetail(1);
    }
    return;
  }

  const targetTag = event.target?.tagName?.toLowerCase();
  if (["input", "textarea", "select", "button", "a"].includes(targetTag)) return;

  if (event.code === "Space") {
    event.preventDefault();
    toggleAuto();
  } else if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    resetView();
  } else if (event.key === "h" || event.key === "H" || event.key === "?") {
    event.preventDefault();
    openModal(dom.guide, document.activeElement);
  }
}

function toggleAuto() {
  state.auto = !state.auto;
  if (window.styleOrbit) window.styleOrbit.userInteracted = true;
  dom.autoToggle?.setAttribute("aria-pressed", String(state.auto));
  dom.autoToggle?.setAttribute(
    "aria-label",
    state.auto ? "暂停自动巡航" : "继续自动巡航"
  );
  if (dom.autoToggle) {
    dom.autoToggle.innerHTML = state.auto
      ? '<svg class="icon icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12"/></svg><span class="rail-tip">自动巡航</span>'
      : '<svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg><span class="rail-tip">继续巡航</span>';
  }
  showToast(state.auto ? "自动巡航已开启" : "自动巡航已暂停");
}

function resetView() {
  if (!window.styleOrbit) return;
  hideCoach();
  window.styleOrbit.resetCamera();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

function positionHoverLabel(x, y) {
  if (!dom.hover.classList.contains("is-visible")) return;
  const pad = 14;
  const offset = 22;
  const rect = dom.hover.getBoundingClientRect();
  const w = rect.width || 300;
  const h = rect.height || 72;
  let left = x + offset;
  let top = y - h - offset;
  if (left + w > window.innerWidth - pad) left = x - w - offset;
  if (left < pad) left = pad;
  if (top < pad) top = y + offset;
  if (top + h > window.innerHeight - pad) top = window.innerHeight - h - pad;
  dom.hover.style.setProperty("--x", `${left}px`);
  dom.hover.style.setProperty("--y", `${top}px`);
}

function setHovered(card) {
  if (state.hovered === card) return;
  state.hovered = card;
  if (!card) {
    dom.hover.classList.remove("is-visible");
    dom.hover.setAttribute("aria-hidden", "true");
    dom.readout.classList.remove("is-active");
    dom.orbitNo.textContent = "NO. —";
    dom.canvas.classList.remove("is-hovering");
    return;
  }
  const skill = card.skill;
  dom.hover.style.setProperty("--accent", skill.accent);
  dom.hoverIndex.textContent = skill.id;
  dom.hoverCat.textContent = `${skill.sourceLabel} · ${skill.categoryLabel}`;
  dom.hoverName.textContent = skill.zh;
  dom.hoverEn.textContent = skill.en;
  dom.hover.setAttribute("aria-hidden", "false");
  if (state.pointer.inside) {
    dom.hover.classList.add("is-visible");
    positionHoverLabel(state.pointer.x, state.pointer.y);
  }
  dom.readout.classList.add("is-active");
  dom.orbitNo.textContent = `NO. ${skill.id} / ${TOTAL_COUNT}`;
  dom.canvas.classList.add("is-hovering");
  hideCoach();
}

/* ------------------------------------------------------------ Three.js field */

let scene;
let camera;
let renderer;
let composer;
let controls;
let clock;
let bloomPass;
let cardTextures = new Map();
let borderTexture;
let haloTexture;
let sparkTexture;
let cloudTexture;
let coreUniforms;
let accentA;
let accentB;
let billboardGroup;
let tickRing;
let coreHaloSprite;
let orb;
let coreWire;
let coreRings = [];
let orbParticles;
let cards = [];
let hitMeshes = [];
let rings = [];
let bursts = [];
let starGroups = [];
let nebulas = [];
let introStartedAt = 0;
let lastFrame = performance.now();
let hoverRayTime = 0;
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const defaultAccentA = new THREE.Color(COLORS.pink);
const defaultAccentB = new THREE.Color(COLORS.cyan);
let mobileBreakpoint = "";

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas: dom.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(COLORS.ink, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.ink);
  scene.fog = new THREE.FogExp2(COLORS.ink, 0.0135);

  camera = new THREE.PerspectiveCamera(39, 1, 0.1, 120);
  controls = new OrbitControls(camera, dom.canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.rotateSpeed = 0.52;
  controls.zoomSpeed = 0.7;
  controls.minPolarAngle = 0.82;
  controls.maxPolarAngle = 1.72;
  controls.minDistance = 8.2;
  controls.maxDistance = 23;
  controls.target.set(0, 0.15, 0);
  controls.addEventListener("start", () => {
    state.dragging = true;
    state.lastInteraction = performance.now();
    state.cameraTween = null;
    dom.canvas.classList.add("is-dragging");
    dom.canvas.classList.remove("is-hovering");
    hideCoach();
  });
  controls.addEventListener("end", () => {
    state.dragging = false;
    state.lastInteraction = performance.now();
    dom.canvas.classList.remove("is-dragging");
  });

  createBackground();
  createGrid();
  createCore();
  createRings();
  setViewPreset(true);
  createPostProcessing();

  clock = new THREE.Clock();
  lastFrame = performance.now();
  introStartedAt = 0;

  window.styleOrbit = {
    scene,
    camera,
    renderer,
    composer,
    controls,
    resetCamera,
    setAccentForCard,
    getCardScreen,
    cards,
    userInteracted: false,
  };

  requestAnimationFrame(renderLoop);
}

function setViewPreset(immediate = false) {
  if (!camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  const preset =
    aspect < 0.78
      ? {
          name: "mobile",
          fov: 55,
          position: new THREE.Vector3(0, 3.2, 14.6),
          target: new THREE.Vector3(0, 0.25, 0),
          scale: 0.76,
          minDistance: 9.2,
          maxDistance: 23,
        }
      : aspect < 1.18
        ? {
            name: "tablet",
            fov: 45,
            position: new THREE.Vector3(0, 3.4, 14.8),
            target: new THREE.Vector3(0, 0.2, 0),
            scale: 0.9,
            minDistance: 8.8,
            maxDistance: 23,
          }
        : {
            name: "desktop",
            fov: 39,
            position: new THREE.Vector3(0, 4.15, 14.3),
            target: new THREE.Vector3(0, 0.22, 0),
            scale: 1,
            minDistance: 8.2,
            maxDistance: 23,
          };

  const breakpointChanged = mobileBreakpoint !== preset.name;
  mobileBreakpoint = preset.name;
  camera.fov = preset.fov;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  controls.minDistance = preset.minDistance;
  controls.maxDistance = preset.maxDistance;
  if (window.styleOrbit?.world) {
    window.styleOrbit.world.scale.setScalar(preset.scale);
  } else if (scene) {
    const world = scene.getObjectByName("world-orbit");
    if (world) world.scale.setScalar(preset.scale);
  }
  if (immediate || breakpointChanged) {
    camera.position.copy(preset.position);
    controls.target.copy(preset.target);
    controls.update();
  }
  state.cameraTween = null;
}

function getViewPresetPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect < 0.78) {
    return {
      position: new THREE.Vector3(0, 3.2, 14.6),
      target: new THREE.Vector3(0, 0.25, 0),
      scale: 0.76,
    };
  }
  if (aspect < 1.18) {
    return {
      position: new THREE.Vector3(0, 3.4, 14.8),
      target: new THREE.Vector3(0, 0.2, 0),
      scale: 0.9,
    };
  }
  return {
    position: new THREE.Vector3(0, 4.15, 14.3),
    target: new THREE.Vector3(0, 0.22, 0),
    scale: 1,
  };
}

function resetCamera() {
  if (!camera || !controls) return;
  // OrbitControls keeps drag momentum in a private spherical delta.  Running
  // one undamped update with no new input clears it so the reset lands exactly.
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;

  const preset = getViewPresetPosition();
  state.cameraTween = {
    start: performance.now(),
    duration: reduceMotion ? 1 : 950,
    fromPosition: camera.position.clone(),
    toPosition: preset.position.clone(),
    fromTarget: controls.target.clone(),
    toTarget: preset.target.clone(),
  };
}

function createPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    0.62,
    0.94
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  handleResize();
}

function handleResize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  setViewPreset(false);
  if (bloomPass) {
    bloomPass.strength = width < 700 ? 0.22 : 0.3;
    bloomPass.setSize(width, height);
  }
  if (state.hovered) positionHoverLabel(state.pointer.x, state.pointer.y);
}

function createBackground() {
  const world = new THREE.Group();
  world.name = "world-orbit";
  scene.add(world);
  window.styleOrbitWorld = world;

  const starTexture = makeSparkTexture(64);
  const rand = mulberry32(74019);
  const starLayers = [
    { count: 900, size: 0.05, opacity: 0.58, radius: [17, 38] },
    { count: 360, size: 0.12, opacity: 0.46, radius: [16, 33] },
    { count: 110, size: 0.26, opacity: 0.35, radius: [19, 35] },
  ];
  for (const layer of starLayers) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(layer.count * 3);
    const colors = new Float32Array(layer.count * 3);
    const palette = [
      new THREE.Color(0xf2ecdf),
      new THREE.Color(0x7fe8ff),
      new THREE.Color(0xffa9c6),
      new THREE.Color(0xd9ff89),
      new THREE.Color(0xb9b7db),
    ];
    for (let i = 0; i < layer.count; i += 1) {
      const radius = lerp(layer.radius[0], layer.radius[1], Math.pow(rand(), 0.7));
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(lerp(-0.9, 0.95, rand()));
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.78;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      const color = palette[Math.floor(rand() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      map: starTexture,
      size: layer.size,
      transparent: true,
      opacity: layer.opacity,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      alphaTest: 0.015,
      fog: false,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    world.add(points);
    starGroups.push(points);
  }

  cloudTexture = makeCloudTexture(512);

  const nebulaConfigs = [
    {
      position: new THREE.Vector3(-10, 1.5, -17),
      scale: 28,
      color: 0x812c56,
      opacity: 0.18,
    },
    {
      position: new THREE.Vector3(11, -3, -22),
      scale: 33,
      color: 0x144b65,
      opacity: 0.22,
    },
    {
      position: new THREE.Vector3(1, 8, -28),
      scale: 23,
      color: 0x423279,
      opacity: 0.14,
    },
  ];
  for (const config of nebulaConfigs) {
    const material = new THREE.SpriteMaterial({
      map: cloudTexture,
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(config.position);
    sprite.scale.set(config.scale, config.scale * 0.72, 1);
    sprite.userData.baseOpacity = config.opacity;
    world.add(sprite);
    nebulas.push(sprite);
  }

  const aura = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeRadialTexture(512, [
        [0, 0.92],
        [0.12, 0.6],
        [0.38, 0.19],
        [1, 0],
      ]),
      color: 0xff7bab,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false,
    })
  );
  aura.scale.set(7.4, 7.4, 1);
  aura.position.set(0, 0.1, 0);
  aura.renderOrder = 2;
  world.add(aura);
  starGroups.aura = aura;
  window.styleOrbitWorld = world;
}

function createGrid() {
  const geometry = new THREE.PlaneGeometry(70, 70, 1, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x45e5ff) },
      uColorB: { value: new THREE.Color(0xff4f8b) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vWorldPosition;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      float gridLine(vec2 p, float scale) {
        vec2 coord = p / scale;
        vec2 derivative = fwidth(coord);
        vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
        float line = min(grid.x, grid.y);
        return 1.0 - min(line, 1.0);
      }

      void main() {
        vec2 p = vWorldPosition.xz;
        float d = length(p);
        float fade = smoothstep(29.0, 3.0, d);
        float fine = gridLine(p, 1.0) * 0.25;
        float strong = gridLine(p, 5.0) * 0.52;
        float axis = (1.0 - smoothstep(0.0, 0.055, abs(p.x))) * 0.26;
        axis += (1.0 - smoothstep(0.0, 0.055, abs(p.y))) * 0.26;
        float pulse = 0.82 + 0.18 * sin(d * 0.55 - uTime * 0.6);
        vec3 color = mix(uColorA, uColorB, smoothstep(-24.0, 24.0, p.x));
        float alpha = (fine + strong + axis) * fade * 0.2 * pulse;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
  const grid = new THREE.Mesh(geometry, material);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -4.1;
  grid.renderOrder = 1;
  scene.add(grid);
  scene.userData.grid = grid;
}

function createCore() {
  const group = new THREE.Group();
  group.position.set(0, 0.12, 0);
  group.name = "core";
  scene.add(group);

  const glowMaterial = new THREE.SpriteMaterial({
    map: makeRadialTexture(256, [
      [0, 0.96],
      [0.18, 0.6],
      [0.5, 0.16],
      [1, 0],
    ]),
    color: 0xff73ad,
    transparent: true,
    opacity: 0.36,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
  });
  coreHaloSprite = new THREE.Sprite(glowMaterial);
  coreHaloSprite.scale.set(5.2, 5.2, 1);
  coreHaloSprite.position.z = -0.2;
  group.add(coreHaloSprite);

  const geometry = new THREE.IcosahedronGeometry(1.08, 5);
  coreUniforms = {
    uTime: { value: 0 },
    uHover: { value: 0 },
    uColorA: { value: new THREE.Color(0xff4f8b) },
    uColorB: { value: new THREE.Color(0x45e5ff) },
    uColorC: { value: new THREE.Color(0xcbff45) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    transparent: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vViewNormal;
      varying vec2 vUv;
      varying float vPulse;

      void main() {
        vUv = uv;
        vec3 p = position;
        float pulse = sin(p.y * 5.0 + uTime * 1.6) * cos(p.z * 4.4 - uTime * 1.2);
        pulse += sin((p.x - p.z) * 6.0 + uTime * 0.8) * 0.35;
        p += normal * pulse * 0.026;
        vPulse = pulse;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorldPosition = world.xyz;
        vViewNormal = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vWorldPosition;
      varying vec3 vViewNormal;
      varying vec2 vUv;
      varying float vPulse;
      uniform float uTime;
      uniform float uHover;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;

      void main() {
        vec3 normal = normalize(vViewNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 1.62);

        float silk = sin(vUv.y * 33.0 - uTime * 1.25 + sin(vUv.x * 6.0 + uTime * 0.45) * 2.3);
        float strands = smoothstep(0.78, 1.0, silk * 0.5 + 0.5);
        float swirl = smoothstep(0.58, 1.0, sin((vUv.x * 1.3 + vUv.y) * 17.0 - uTime * 0.65) * 0.5 + 0.5);

        vec3 body = mix(vec3(0.012, 0.017, 0.031), uColorA * 0.17, smoothstep(0.0, 1.0, vUv.y));
        body += uColorB * swirl * 0.055;
        body += uColorC * strands * 0.028;
        body += vec3(0.014, 0.018, 0.024) * (1.0 - fresnel);

        float crescent = smoothstep(0.18, 0.9, dot(normalize(normal.xy), normalize(vec2(-0.7, 0.45))));
        body += uColorB * crescent * fresnel * 0.2;

        vec3 rim = uColorA * pow(fresnel, 2.1) * 1.4;
        rim += uColorB * pow(fresnel, 5.4) * 0.64;
        rim += vec3(0.97, 0.92, 0.84) * pow(fresnel, 8.0) * 0.42;
        rim += uColorC * smoothstep(0.87, 1.0, fresnel) * 0.08;

        vec3 color = body + rim + uHover * 0.08;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  orb = new THREE.Mesh(geometry, material);
  group.add(orb);

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8f1ff,
    wireframe: true,
    transparent: true,
    opacity: 0.085,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.36, 2), wireMaterial);
  group.add(coreWire);

  const ringDefs = [
    {
      radius: 1.85,
      tube: 0.008,
      color: 0xff86b6,
      opacity: 0.75,
      rotation: [1.16, 0.1, 0.18],
      speed: 0.12,
    },
    {
      radius: 2.16,
      tube: 0.006,
      color: 0x72efff,
      opacity: 0.6,
      rotation: [-0.48, 0.3, -0.55],
      speed: -0.08,
    },
    {
      radius: 2.58,
      tube: 0.004,
      color: 0xd4ff7d,
      opacity: 0.3,
      rotation: [1.45, -0.16, 0.7],
      speed: 0.05,
    },
  ];
  for (const definition of ringDefs) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(definition.radius, definition.tube, 6, 180),
      new THREE.MeshBasicMaterial({
        color: definition.color,
        transparent: true,
        opacity: definition.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    ring.rotation.set(...definition.rotation);
    ring.userData.speed = definition.speed;
    group.add(ring);
    coreRings.push(ring);
  }

  billboardGroup = new THREE.Group();
  const tickMaterial = new THREE.LineBasicMaterial({
    color: 0xf4eddd,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  tickRing = new THREE.LineSegments(
    makeTickRingGeometry(2.46, 72, 0.035, 0.12),
    tickMaterial
  );
  billboardGroup.add(tickRing);

  const horizon = new THREE.Mesh(
    new THREE.RingGeometry(1.56, 1.575, 192),
    new THREE.MeshBasicMaterial({
      color: 0xf7eddc,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  horizon.userData.baseOpacity = 0.4;
  horizon.userData.phase = 1.7;
  billboardGroup.add(horizon);
  coreRings.push(horizon);

  const horizonEcho = new THREE.Mesh(
    new THREE.RingGeometry(1.7, 1.704, 192),
    new THREE.MeshBasicMaterial({
      color: 0xff6c9e,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  horizonEcho.scale.setScalar(1.1);
  horizonEcho.userData.baseOpacity = 0.22;
  horizonEcho.userData.phase = 3.2;
  billboardGroup.add(horizonEcho);
  coreRings.push(horizonEcho);

  const arcColors = [COLORS.pink, COLORS.cyan, COLORS.acid];
  for (let i = 0; i < 3; i += 1) {
    const radius = 2.86 + i * 0.16;
    const arc = new THREE.Line(
      makeArcGeometry(radius, -0.2 + i * 0.75, 1.08 + i * 0.75),
      new THREE.LineBasicMaterial({
        color: arcColors[i],
        transparent: true,
        opacity: 0.44 - i * 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    arc.userData.baseOpacity = 0.44 - i * 0.07;
    arc.userData.phase = i * 0.9;
    billboardGroup.add(arc);
    coreRings.push(arc);
  }
  group.add(billboardGroup);

  const particleCount = 180;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = mulberry32(9182);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 1.25 + random() * 2.1;
    const angle = random() * Math.PI * 2;
    const height = (random() - 0.5) * 1.1;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    const c = new THREE.Color(i % 3 === 0 ? 0xcbff45 : i % 3 === 1 ? 0xff7ba9 : 0x8beaff);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  orbParticles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      map: sparkTexture || makeSparkTexture(),
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.66,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
      fog: false,
    })
  );
  group.add(orbParticles);

  scene.userData.coreGroup = group;
  accentA = new THREE.Color(COLORS.pink);
  accentB = new THREE.Color(COLORS.cyan);
  coreUniforms.uColorA.value.copy(accentA);
  coreUniforms.uColorB.value.copy(accentB);
}

function makeTickRingGeometry(radius, count, minLength, maxLength) {
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const len = i % 6 === 0 ? maxLength : minLength;
    positions.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0,
      Math.cos(angle) * (radius + len),
      Math.sin(angle) * (radius + len),
      0
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function makeArcGeometry(radius, start, end, segments = 54) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = lerp(start, end, i / segments);
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function createRings() {
  const world = window.styleOrbitWorld;
  const ringCounts = [22, 20, 18, 15];
  const ringCaps = [30, 28, 24, 20];
  let extraCards = Math.max(0, SKILLS.length - 75);
  for (let ringIndex = 0; ringIndex < ringCounts.length && extraCards > 0; ringIndex += 1) {
    const add = Math.min(extraCards, ringCaps[ringIndex] - ringCounts[ringIndex]);
    ringCounts[ringIndex] += add;
    extraCards -= add;
  }
  if (extraCards > 0) ringCounts[0] += extraCards;

  const configs = [
    {
      count: ringCounts[0],
      radius: 6.72,
      cardWidth: 1.06,
      yBase: 0.05,
      yAmp: 0.38,
      frequency: 2.8,
      phase: 0.32,
      tiltX: 0.06,
      tiltZ: -0.035,
      speed: 0.025,
      lineColor: 0x45e5ff,
      lineOpacity: 0.18,
    },
    {
      count: ringCounts[1],
      radius: 5.4,
      cardWidth: 0.92,
      yBase: 0.08,
      yAmp: 0.24,
      frequency: 2.2,
      phase: 1.2,
      tiltX: 0.5,
      tiltZ: 0.14,
      speed: -0.034,
      lineColor: 0xff4f8b,
      lineOpacity: 0.24,
    },
    {
      count: ringCounts[2],
      radius: 4.12,
      cardWidth: 0.78,
      yBase: 0.14,
      yAmp: 0.16,
      frequency: 3,
      phase: 2.25,
      tiltX: -0.46,
      tiltZ: -0.18,
      speed: 0.044,
      lineColor: 0xcbff45,
      lineOpacity: 0.24,
    },
    {
      count: ringCounts[3],
      radius: 2.92,
      cardWidth: 0.66,
      yBase: 0.18,
      yAmp: 0.12,
      frequency: 3.4,
      phase: 3.4,
      tiltX: 0.68,
      tiltZ: 0.08,
      speed: -0.055,
      lineColor: 0x9dffd0,
      lineOpacity: 0.22,
    },
  ];

  const layoutOrder = interleaveSkills(SKILLS);
  let cursor = 0;
  borderTexture = makeBorderTexture();
  haloTexture = makeRadialTexture(256, [
    [0, 0.72],
    [0.28, 0.27],
    [0.58, 0.07],
    [1, 0],
  ]);
  sparkTexture = makeSparkTexture();

  for (let ringIndex = 0; ringIndex < configs.length; ringIndex += 1) {
    const config = configs[ringIndex];
    const ring = new THREE.Group();
    ring.rotation.x = config.tiltX;
    ring.rotation.z = config.tiltZ;
    ring.rotation.y = config.phase * 0.36;
    ring.userData.config = config;
    ring.userData.baseSpeed = config.speed;
    world.add(ring);
    rings.push(ring);

    const traceRadius = config.radius;
    const line = new THREE.LineLoop(
      makeCircleGeometry(traceRadius, 180),
      new THREE.LineBasicMaterial({
        color: config.lineColor,
        transparent: true,
        opacity: config.lineOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    ring.add(line);

    const tickGeo = makeTickRingGeometry(traceRadius + 0.02, config.count * 2, 0.015, 0.07);
    const ticks = new THREE.LineSegments(
      tickGeo,
      new THREE.LineBasicMaterial({
        color: config.lineColor,
        transparent: true,
        opacity: config.lineOpacity * 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    ticks.rotation.x = Math.PI / 2;
    ticks.position.y = 0.005;
    ring.add(ticks);

    const ringCards = layoutOrder.slice(cursor, cursor + config.count);
    cursor += config.count;

    ringCards.forEach((skill, i) => {
      const angle = (i / config.count) * Math.PI * 2 + config.phase;
      const y = config.yBase + Math.sin(angle * config.frequency + config.phase) * config.yAmp;
      const radiusOffset = i % 2 === 0 ? 0.045 : -0.045;
      const position = new THREE.Vector3(
        Math.sin(angle) * (config.radius + radiusOffset),
        y,
        Math.cos(angle) * (config.radius + radiusOffset)
      );
      const card = createCard(skill, config, ringIndex, i, position, angle);
      ring.add(card.anchor);
      cards.push(card);
    });
  }

  state.cardMap = new Map(cards.map((card) => [card.skill.slug, card]));
  hitMeshes = cards.flatMap((card) => [card.front, card.back]);
  window.styleOrbitWorld = world;
}

function getCardScreen(slug) {
  const card = state.cardMap?.get(slug);
  if (!card || !camera) return null;
  const worldPosition = new THREE.Vector3();
  card.anchor.getWorldPosition(worldPosition);
  const cameraToCard = worldPosition.clone().sub(camera.position);
  const facing = cameraToCard.dot(new THREE.Vector3().copy(camera.getWorldDirection(new THREE.Vector3())));
  const projected = worldPosition.clone().project(camera);
  const x = ((projected.x + 1) / 2) * window.innerWidth;
  const y = ((1 - projected.y) / 2) * window.innerHeight;
  return {
    x,
    y,
    onscreen: x > 24 && x < window.innerWidth - 24 && y > 100 && y < window.innerHeight - 80,
    visible: facing > 0,
  };
}

function interleaveSkills(items) {
  const buckets = new Map();
  for (const item of items) {
    if (!buckets.has(item.cat)) buckets.set(item.cat, []);
    buckets.get(item.cat).push(item);
  }
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.index - b.index);
  }
  const sequence = [
    "portrait",
    "graphic",
    "scene",
    "object",
    "kid",
    "graphic",
    "space",
    "scene",
    "lab",
    "prompt",
    "graphic",
    "portrait",
    "object",
    "scene",
  ];
  const result = [];
  let guard = 0;
  while (result.length < items.length && guard < 1000) {
    guard += 1;
    for (const key of sequence) {
      const bucket = buckets.get(key);
      if (bucket?.length) result.push(bucket.shift());
    }
  }
  for (const bucket of buckets.values()) {
    while (bucket.length) result.push(bucket.shift());
  }
  return result;
}

function makeCircleGeometry(radius, segments) {
  const points = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function createCard(skill, ringConfig, ringIndex, cardIndex, position, angle) {
  const width = ringConfig.cardWidth;
  const height = width * (540 / 384);
  const anchor = new THREE.Group();
  anchor.position.copy(position);
  anchor.rotation.y = angle;
  anchor.rotation.z = (cardIndex % 3 - 1) * 0.014;
  anchor.rotation.x = (cardIndex % 2 === 0 ? 1 : -1) * 0.012;

  const texture = cardTextures.get(skill.slug);
  const faceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.FrontSide,
    depthWrite: true,
    toneMapped: false,
  });
  faceMaterial.color.setRGB(1, 1, 1);

  const front = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMaterial);
  front.position.z = 0.012;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMaterial);
  back.rotation.y = Math.PI;
  back.position.z = -0.012;
  anchor.add(front, back);

  const borderMats = [];
  const halos = [];
  for (const side of [1, -1]) {
    const border = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.046, height * 1.034),
      new THREE.MeshBasicMaterial({
        map: borderTexture,
        color: new THREE.Color(skill.accent).multiplyScalar(1.35),
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
        toneMapped: false,
      })
    );
    border.position.z = side * 0.021;
    if (side === -1) border.rotation.y = Math.PI;
    border.renderOrder = 3;
    anchor.add(border);
    borderMats.push(border.material);

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 2.35, height * 1.75),
      new THREE.MeshBasicMaterial({
        map: haloTexture,
        color: new THREE.Color(skill.accent),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        side: THREE.FrontSide,
        toneMapped: false,
      })
    );
    halo.position.z = side * -0.006;
    if (side === -1) halo.rotation.y = Math.PI;
    halo.renderOrder = 2;
    anchor.add(halo);
    halos.push(halo.material);
  }

  const random = mulberry32(skill.index * 417 + 13);
  const card = {
    skill,
    anchor,
    front,
    back,
    width,
    height,
    ringIndex,
    cardIndex,
    basePosition: position.clone(),
    baseAngle: angle,
    hover: 0,
    flash: 0,
    intro: 0,
    baseScale: 1,
    phase: random() * Math.PI * 2,
    floatSpeed: lerp(0.45, 0.8, random()),
    floatAmount: lerp(0.022, 0.05, random()),
    borderMats,
    halos,
    faceMaterial,
    dim: 1,
    ringConfig,
    isSelected: false,
  };
  front.userData.card = card;
  back.userData.card = card;
  anchor.userData.card = card;
  anchor.scale.setScalar(0.02);
  return card;
}

function setAccentForCard(card) {
  if (!coreUniforms) return;
  if (!card) {
    accentA = defaultAccentA.clone();
    accentB = defaultAccentB.clone();
    return;
  }
  const accent = new THREE.Color(card.skill.accent);
  accentA = accent.clone();
  accentB = new THREE.Color(card.skill.accent).lerp(new THREE.Color(0x8affff), 0.55);
}

/* --------------------------------------------------------------- interactions */

function updateRaycast(dt) {
  if (!camera || !controls) return;
  if (
    !state.pointer.inside ||
    state.dragging ||
    state.pointer.down ||
    state.detailOpen ||
    state.modal ||
    !state.booted ||
    isTouch
  ) {
    if (!state.dragging) setHovered(null);
    return;
  }
  hoverRayTime += dt;
  if (hoverRayTime < 0.045) return;
  hoverRayTime = 0;

  const rect = dom.canvas.getBoundingClientRect();
  pointerNDC.x = ((state.pointer.x - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((state.pointer.y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(hitMeshes, false);
  if (hits.length) {
    setHovered(hits[0].object.userData.card);
  } else {
    setHovered(null);
  }
}

function handleCanvasClick(event) {
  if (!camera || state.clickLock || state.detailOpen || state.modal) return;
  const rect = dom.canvas.getBoundingClientRect();
  pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(hitMeshes, false);
  if (!hits.length) return;
  const card = hits[0].object.userData.card;
  if (!card) return;

  const worldPosition = new THREE.Vector3();
  card.anchor.getWorldPosition(worldPosition);
  const projected = worldPosition.clone().project(camera);
  const screenX = ((projected.x + 1) / 2) * window.innerWidth;
  const screenY = ((1 - projected.y) / 2) * window.innerHeight;

  state.clickLock = true;
  state.selected = card;
  card.flash = 1;
  setAccentForCard(card);
  setHovered(null);
  dom.flash.style.setProperty("--flash-x", `${event.clientX}px`);
  dom.flash.style.setProperty("--flash-y", `${event.clientY}px`);
  dom.flash.style.setProperty("--accent", card.skill.accent);
  dom.flash.classList.remove("is-active");
  void dom.flash.offsetWidth;
  dom.flash.classList.add("is-active");
  spawnBurst(card);

  window.setTimeout(() => {
    openDetail(card.skill, {
      enterX: screenX,
      enterY: screenY,
    });
    state.clickLock = false;
  }, reduceMotion ? 80 : 380);
}

function spawnBurst(card) {
  const worldPosition = new THREE.Vector3();
  card.anchor.getWorldPosition(worldPosition);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.88, 0.91, 80),
    new THREE.MeshBasicMaterial({
      color: card.skill.accent,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  ring.position.copy(worldPosition);
  ring.scale.setScalar(0.4);
  ring.userData.life = 0;
  ring.userData.duration = 0.74;
  scene.add(ring);
  bursts.push(ring);

  const count = 16;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];
  const rand = mulberry32(420 + card.skill.index);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = worldPosition.x;
    positions[i * 3 + 1] = worldPosition.y;
    positions[i * 3 + 2] = worldPosition.z;
    const angle = rand() * Math.PI * 2;
    const speed = 0.8 + rand() * 1.8;
    velocities.push(
      new THREE.Vector3(Math.cos(angle) * speed, (rand() - 0.35) * 1.8, Math.sin(angle) * speed)
    );
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: sparkTexture,
      color: card.skill.accent,
      size: 0.08,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true,
    })
  );
  points.userData.life = 0;
  points.userData.duration = 0.68;
  points.userData.velocities = velocities;
  points.userData.positions = positions;
  scene.add(points);
  bursts.push(points);
}

/* --------------------------------------------------------------- animation */

function startIntro() {
  introStartedAt = performance.now();
}

function renderLoop(now) {
  requestAnimationFrame(renderLoop);
  const dt = clamp((now - lastFrame) / 1000, 0.001, 0.05);
  lastFrame = now;

  if (!state.booted) return;

  updateCameraTween(now);
  controls.enabled = !state.modal && !state.detailOpen;

  const slowTarget =
    !state.auto ||
    state.hovered ||
    state.dragging ||
    state.pointer.down ||
    state.modal ||
    state.detailOpen
      ? 0
      : 1;
  state.autoFactor = damp(state.autoFactor, slowTarget, state.dragging ? 5 : 1.8, dt);

  const elapsed = now * 0.001;
  const coreGroup = scene.userData.coreGroup;
  for (let i = 0; i < rings.length; i += 1) {
    const ring = rings[i];
    ring.rotation.y += dt * ring.userData.baseSpeed * state.autoFactor;
    const line = ring.children[0];
    if (line?.material) line.material.opacity = (ring.userData.config.lineOpacity || 0.18) * (0.7 + 0.3 * Math.sin(elapsed * 0.8 + i));
  }

  starGroups.forEach((group, index) => {
    group.rotation.y += dt * (0.003 + index * 0.0018);
    group.rotation.x = Math.sin(elapsed * 0.03 + index) * 0.04;
  });
  if (starGroups.aura) {
    const pulse = 1 + Math.sin(elapsed * 0.8) * 0.045;
    starGroups.aura.scale.set(9 * pulse, 9 * pulse, 1);
  }
  nebulas.forEach((nebula, index) => {
    nebula.material.opacity =
      nebula.userData.baseOpacity * (0.82 + Math.sin(elapsed * 0.15 + index) * 0.18);
    nebula.position.x += Math.sin(elapsed * 0.06 + index) * dt * 0.006;
  });

  if (scene.userData.grid) {
    scene.userData.grid.material.uniforms.uTime.value = elapsed;
  }

  updateCards(dt, elapsed, now);
  updateCore(dt, elapsed);
  updateBursts(dt);
  updateRaycast(dt);
  controls.update();
  composer.render();
}

function updateCameraTween(now) {
  if (!state.cameraTween) return;
  const tween = state.cameraTween;
  const t = clamp((now - tween.start) / tween.duration, 0, 1);
  const eased = easeOutQuint(t);
  camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
  if (t >= 1) state.cameraTween = null;
}

function updateCards(dt, elapsed, now) {
  const introElapsed = introStartedAt ? (now - introStartedAt) / 1000 : 0;
  for (const card of cards) {
    const isHovered = state.hovered === card;
    const isSelected = state.selected === card;
    card.hover = damp(card.hover, isHovered ? 1 : 0, 10, dt);
    card.flash = Math.max(0, card.flash - dt * 2.6);
    card.isSelected = isSelected && !state.detailOpen;
    const dimTarget = state.hovered && !isHovered ? 0.62 : 1;
    card.dim = damp(card.dim, dimTarget, 6, dt);
    card.faceMaterial.color.setScalar(card.dim);

    const delay = card.ringIndex * 0.14 + card.cardIndex * 0.028;
    const rawIntro = clamp((introElapsed - delay) / (reduceMotion ? 0.12 : 0.9), 0, 1);
    card.intro = easeOutQuint(rawIntro);

    const hoverLift = card.hover * 0.24 + card.flash * 0.38 + (isSelected && !state.detailOpen ? 0.14 : 0);
    const radialLength = Math.hypot(card.basePosition.x, card.basePosition.z) || 1;
    const radialScale = 1 + hoverLift * 0.055;
    card.anchor.position.x = card.basePosition.x * radialScale;
    card.anchor.position.z = card.basePosition.z * radialScale;
    card.anchor.position.y =
      card.basePosition.y +
      Math.sin(elapsed * card.floatSpeed + card.phase) * card.floatAmount +
      card.hover * 0.075 +
      card.flash * 0.12;
    card.anchor.rotation.z =
      (card.cardIndex % 3 - 1) * 0.014 +
      Math.sin(elapsed * 0.32 + card.phase) * 0.012 +
      card.hover * 0.03;
    card.anchor.rotation.x =
      (card.cardIndex % 2 === 0 ? 1 : -1) * 0.012 -
      card.hover * 0.015 +
      card.flash * 0.06;
    const introScale = lerp(0.18, 1, card.intro);
    const hoverScale = 1 + card.hover * 0.075 + card.flash * 0.12 + (isSelected && !state.detailOpen ? 0.035 : 0);
    card.anchor.scale.setScalar(introScale * hoverScale);

    const selectedGlow = isSelected && !state.detailOpen ? 0.2 : 0;
    const haloOpacity = selectedGlow + card.hover * 0.24 + card.flash * 0.38;
    for (const material of card.halos) material.opacity = haloOpacity;
    const borderOpacity =
      0.055 + card.hover * 0.64 + card.flash * 0.82 + (isSelected ? 0.26 : 0);
    for (const material of card.borderMats) material.opacity = borderOpacity;
    card.front.material.opacity = lerp(0.05, 1, card.intro);
    card.back.material.opacity = lerp(0.05, 1, card.intro);
  }
}

function updateCore(dt, elapsed) {
  if (!coreUniforms) return;
  const targetHover = state.hovered ? 0.7 : state.detailOpen ? 1 : 0;
  coreUniforms.uHover.value = damp(coreUniforms.uHover.value, targetHover, 4, dt);
  coreUniforms.uTime.value = elapsed;
  const targetA = state.hovered
    ? new THREE.Color(state.hovered.skill.accent)
    : state.selected
      ? new THREE.Color(state.selected.skill.accent)
      : defaultAccentA;
  coreUniforms.uColorA.value.lerp(targetA, 1 - Math.exp(-1.6 * dt));
  coreUniforms.uColorB.value.lerp(
    state.hovered
      ? new THREE.Color(state.hovered.skill.accent).lerp(new THREE.Color(0x8affff), 0.5)
      : defaultAccentB,
    1 - Math.exp(-1.6 * dt)
  );
  if (coreHaloSprite) {
    const base = state.hovered ? 0.52 : 0.34;
    coreHaloSprite.material.opacity = damp(coreHaloSprite.material.opacity, base, 2, dt);
    coreHaloSprite.material.color.lerp(
      state.hovered ? new THREE.Color(state.hovered.skill.accent) : new THREE.Color(0xff73ad),
      1 - Math.exp(-1.5 * dt)
    );
    const scale = 5.2 + Math.sin(elapsed * 0.8) * 0.14 + coreUniforms.uHover.value * 0.8;
    coreHaloSprite.scale.set(scale, scale, 1);
  }
  if (orb) {
    orb.rotation.y += dt * 0.075;
    orb.rotation.z = Math.sin(elapsed * 0.16) * 0.07;
  }
  if (coreWire) {
    coreWire.rotation.y -= dt * 0.12;
    coreWire.rotation.x += dt * 0.05;
    coreWire.material.opacity = 0.075 + Math.sin(elapsed * 1.4) * 0.025;
  }
  for (const ring of coreRings) {
    if (ring.userData.speed !== undefined) {
      ring.rotation.z += dt * ring.userData.speed;
      ring.rotation.y += dt * ring.userData.speed * 0.45;
    } else {
      ring.rotation.z = Math.sin(elapsed * 0.2 + (ring.userData.phase || 0)) * 0.12;
      if (ring.material) {
        ring.material.opacity =
          (ring.userData.baseOpacity || 0.3) *
          (0.82 + Math.sin(elapsed * 0.9 + (ring.userData.phase || 0)) * 0.18);
      }
    }
  }
  if (billboardGroup) {
    billboardGroup.quaternion.copy(camera.quaternion);
  }
  if (tickRing) {
    tickRing.rotation.z += dt * 0.035;
    tickRing.material.opacity = 0.2 + Math.sin(elapsed * 0.7) * 0.06;
  }
  if (orbParticles) {
    orbParticles.rotation.y += dt * 0.1;
    orbParticles.rotation.z = Math.sin(elapsed * 0.22) * 0.12;
  }
}

function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i -= 1) {
    const burst = bursts[i];
    burst.userData.life += dt;
    const t = burst.userData.life / burst.userData.duration;
    if (t >= 1) {
      scene.remove(burst);
      if (burst.geometry) burst.geometry.dispose();
      if (burst.material) burst.material.dispose();
      bursts.splice(i, 1);
      continue;
    }
    if (burst.isMesh) {
      burst.quaternion.copy(camera.quaternion);
      burst.scale.setScalar(0.5 + easeOutCubic(t) * 3.4);
      burst.material.opacity = (1 - t) * (1 - t) * 0.9;
    } else {
      const positions = burst.geometry.attributes.position.array;
      const start = burst.userData.start;
      for (let p = 0; p < burst.userData.velocities.length; p += 1) {
        const velocity = burst.userData.velocities[p];
        positions[p * 3] += velocity.x * dt * 0.65;
        positions[p * 3 + 1] += velocity.y * dt * 0.65;
        positions[p * 3 + 2] += velocity.z * dt * 0.65;
        velocity.y -= dt * 1.2;
      }
      burst.geometry.attributes.position.needsUpdate = true;
      burst.material.opacity = (1 - t) * 0.9;
    }
  }
}

/* -------------------------------------------------------------------- boot */

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function bootstrap() {
  wireInterface();
  setBoot(2, "INITIALIZING VISUAL FIELD");
  const start = performance.now();
  const loaded = [];
  let loadedCount = 0;

  const loadPromises = SKILLS.map((skill) =>
    loadPhoto(skill).then((result) => {
      loadedCount += 1;
      setBoot(4 + (loadedCount / SKILLS.length) * 31, "DECODING SAMPLE IMAGERY");
      loaded.push(result);
      return result;
    })
  );
  await Promise.all(loadPromises);

  const imageBySlug = new Map(loaded.map(({ skill, image }) => [skill.slug, image]));
  for (let i = 0; i < SKILLS.length; i += 1) {
    const skill = SKILLS[i];
    cardTextures.set(skill.slug, makeCardTexture(skill, imageBySlug.get(skill.slug)));
    setBoot(36 + ((i + 1) / SKILLS.length) * 48, "WEAVING OFFLINE CARD TEXTURES");
    if (i % 6 === 0) await nextFrame();
  }

  setBoot(88, "IGNITING ORBIT CORE");
  await nextFrame();
  try {
    initThree();
  } catch (error) {
    console.error(error);
    showFatalError();
    return;
  }
  setBoot(100, `ORBIT READY / ${TOTAL_COUNT} SKILLS + PROMPTS ONLINE`);

  const minimumBootMs = reduceMotion ? 100 : 1250;
  const remaining = Math.max(0, minimumBootMs - (performance.now() - start));
  await new Promise((resolve) => setTimeout(resolve, remaining));
  hideBoot();

  if (window.location.hash) {
    routeFromHash();
  }
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function showFatalError() {
  const center = $(".boot-center", dom.boot);
  if (!center) return;
  dom.boot.style.display = "";
  dom.boot.classList.remove("is-done");
  dom.boot.setAttribute("aria-hidden", "false");
  center.innerHTML = `
    <p class="boot-kicker">WEBGL REQUIRED / 无法点火</p>
    <h1>轨道未能<br>启动。</h1>
    <p class="boot-error-copy">这个 3D 画廊需要 WebGL 2。请换用最新版 Chrome、Edge、Firefox 或 Safari，并确认浏览器的硬件加速已开启。</p>
    <p class="boot-error-copy"><a href="https://github.com/Vieeeeeee/wibi-style" target="_blank" rel="noreferrer">仍可前往 GitHub 查看 ${WIBI_COUNT} 个 Wibi Skill ↗</a></p>
    <p class="boot-error-copy">抖音新增的 ${DOUYIN_COUNT} 个 Skill / Prompt 可在目录页的来源链接中查看。</p>`;
  dom.bootFill.style.width = "0%";
  dom.bootPercent.textContent = "—";
  dom.bootStatus.textContent = "WEBGL UNAVAILABLE";
}

/* Start the boot sequence. */
bootstrap().catch((error) => {
  console.error(error);
  if (dom.bootStatus) dom.bootStatus.textContent = "BOOT FAILED / CHECK CONSOLE";
  showToast("页面初始化失败，请刷新重试。", 5000);
});
