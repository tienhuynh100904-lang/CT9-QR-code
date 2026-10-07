import { K, type Kind } from "./matrix";

export const PAPER = "#f7f8fc";
export const INK = "#0e1430";

export interface KindMeta {
  kind: Kind;
  key: string;
  name: string;
  en: string;
  dark: string;
  light: string;
}

export const KIND_META: KindMeta[] = [
  { kind: K.finder, key: "finder", name: "Mẫu định vị", en: "Finder pattern", dark: "#e5484d", light: "#ffd3d3" },
  { kind: K.separator, key: "separator", name: "Vùng phân tách", en: "Separator", dark: "#e0449b", light: "#ff7ac0" },
  { kind: K.timing, key: "timing", name: "Mẫu thời gian", en: "Timing pattern", dark: "#3e7bfa", light: "#cfe0ff" },
  { kind: K.alignment, key: "alignment", name: "Mẫu căn chỉnh", en: "Alignment pattern", dark: "#1fae63", light: "#c6f0d9" },
  { kind: K.dark, key: "dark", name: "Module tối cố định", en: "Dark module", dark: "#f5b300", light: "#f5b300" },
  { kind: K.format, key: "format", name: "Thông tin định dạng", en: "Format information", dark: "#8e4ec6", light: "#e7d6f8" },
  { kind: K.version, key: "version", name: "Thông tin phiên bản", en: "Version information", dark: "#f76b15", light: "#ffdcc4" },
  { kind: K.data, key: "data", name: "Dữ liệu + sửa lỗi", en: "Data + EC", dark: INK, light: "#e4e7f2" },
];

export const kindMeta = (k: number) => KIND_META.find((m) => m.kind === k)!;

/** Bảng màu phân biệt các khối Reed–Solomon */
export const BLOCK_COLORS = ["#4cc9f0", "#ff6fae", "#ffc857", "#8b7bff", "#5ef2c2", "#ff8a4c", "#a3e635", "#f472b6"];

export function toSvg(modules: Uint8Array, size: number, opts: { quiet?: number; dark?: string; light?: string } = {}) {
  const quiet = opts.quiet ?? 4;
  const total = size + quiet * 2;
  let d = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r * size + c]) d += `M${c + quiet},${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${opts.light ?? "#ffffff"}"/><path d="${d}" fill="${opts.dark ?? "#000000"}"/></svg>`;
}

export function toCanvas(
  modules: Uint8Array,
  size: number,
  opts: { quiet?: number; scale?: number; dark?: string; light?: string } = {},
) {
  const quiet = opts.quiet ?? 4;
  const scale = opts.scale ?? 10;
  const px = (size + quiet * 2) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = opts.light ?? "#ffffff";
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = opts.dark ?? "#000000";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r * size + c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
  return canvas;
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadPng(modules: Uint8Array, size: number, filename = "ma-qr.png", opts?: { dark?: string; light?: string }) {
  const canvas = toCanvas(modules, size, { scale: 12, ...opts });
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
}

export function downloadSvg(modules: Uint8Array, size: number, filename = "ma-qr.svg", opts?: { dark?: string; light?: string }) {
  const blob = new Blob([toSvg(modules, size, opts)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const bin8 = (v: number) => v.toString(2).padStart(8, "0");
