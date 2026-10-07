import { alignmentPositions, ECC_INFO, sizeOf, type Ecc } from "./tables";
import { makePlan, type Plan } from "./encoder";

/** Loại module trên lưới */
export const K = {
  data: 0,
  finder: 1,
  separator: 2,
  timing: 3,
  alignment: 4,
  dark: 5,
  format: 6,
  version: 7,
} as const;
export type Kind = (typeof K)[keyof typeof K];

export interface Layout {
  version: number;
  size: number;
  /** Loại của từng module (chỉ số = hàng * size + cột) */
  kind: Uint8Array;
  /** Giá trị (1 = tối) của các module chức năng cố định */
  fixed: Uint8Array;
  /** Thứ tự các bước vẽ mẫu chức năng (để tạo hoạt ảnh) */
  drawOrder: number[];
  /** Vị trí bit thông tin định dạng (0–14, tính từ bit thấp) hoặc -1 */
  formatBit: Int8Array;
  /** Vị trí bit thông tin phiên bản (0–17) hoặc -1 */
  versionBit: Int8Array;
  /** Thứ tự zíc-zắc của các module dữ liệu */
  zigzag: number[];
}

const layoutCache = new Map<number, Layout>();

export function buildLayout(version: number): Layout {
  const cached = layoutCache.get(version);
  if (cached) return cached;
  const size = sizeOf(version);
  const n = size * size;
  const kind = new Uint8Array(n);
  const fixed = new Uint8Array(n);
  const formatBit = new Int8Array(n).fill(-1);
  const versionBit = new Int8Array(n).fill(-1);
  const drawOrder: number[] = [];
  const isFn = new Uint8Array(n);

  const set = (r: number, c: number, k: Kind, dark: boolean) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    const i = r * size + c;
    if (!isFn[i]) drawOrder.push(i);
    isFn[i] = 1;
    kind[i] = k;
    fixed[i] = dark ? 1 : 0;
  };

  // Mẫu định vị + vùng phân tách
  for (const [cr, cc] of [
    [3, 3],
    [3, size - 4],
    [size - 4, 3],
  ]) {
    for (let d = 0; d <= 4; d++) {
      for (let dr = -4; dr <= 4; dr++) {
        for (let dc = -4; dc <= 4; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          if (dist !== d) continue;
          set(cr + dr, cc + dc, dist === 4 ? K.separator : K.finder, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  // Mẫu thời gian
  for (let i = 8; i < size - 8; i++) {
    set(6, i, K.timing, i % 2 === 0);
    set(i, 6, K.timing, i % 2 === 0);
  }

  // Mẫu căn chỉnh
  const pos = alignmentPositions(version);
  const last = pos.length - 1;
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          // có thể ghi đè lên mẫu thời gian khi trùng vị trí
          set(pos[i] + dr, pos[j] + dc, K.alignment, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  // Module tối cố định
  set(4 * version + 9, 8, K.dark, true);

  // Vùng dành cho thông tin định dạng (2 bản sao)
  const fmt = (r: number, c: number, bit: number) => {
    set(r, c, K.format, false);
    formatBit[r * size + c] = bit;
  };
  for (let i = 0; i <= 5; i++) fmt(i, 8, i);
  fmt(7, 8, 6);
  fmt(8, 8, 7);
  fmt(8, 7, 8);
  for (let i = 9; i < 15; i++) fmt(8, 14 - i, i);
  for (let i = 0; i < 8; i++) fmt(8, size - 1 - i, i);
  for (let i = 8; i < 15; i++) fmt(size - 15 + i, 8, i);

  // Thông tin phiên bản (phiên bản ≥ 7)
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(b, a, K.version, false);
      versionBit[b * size + a] = i;
      set(a, b, K.version, false);
      versionBit[a * size + b] = i;
    }
  }

  // Thứ tự zíc-zắc: cột đôi, từ góc dưới-phải đi lên, bỏ qua cột 6
  const zigzag: number[] = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const r = upward ? size - 1 - vert : vert;
        const i = r * size + c;
        if (!isFn[i]) zigzag.push(i);
      }
    }
  }

  const layout: Layout = { version, size, kind, fixed, drawOrder, formatBit, versionBit, zigzag };
  layoutCache.set(version, layout);
  return layout;
}

export interface Placement {
  /** Giá trị module chưa áp mặt nạ (định dạng/phiên bản để trống) */
  raw: Uint8Array;
  /** Với mỗi vị trí trong zigzag: chỉ số bit trong luồng (-1 = bit dư) */
  bitIndex: Int32Array;
  /** Với mỗi module: chỉ số codeword (đã đan xen), -1 nếu không phải dữ liệu hoặc bit dư */
  codewordAt: Int32Array;
}

export function placeData(layout: Layout, codewords: number[]): Placement {
  const { size, zigzag, fixed } = layout;
  const raw = new Uint8Array(fixed);
  const bitIndex = new Int32Array(zigzag.length);
  const codewordAt = new Int32Array(size * size).fill(-1);
  const total = codewords.length * 8;
  zigzag.forEach((idx, k) => {
    if (k < total) {
      raw[idx] = (codewords[k >> 3] >> (7 - (k & 7))) & 1;
      bitIndex[k] = k;
      codewordAt[idx] = k >> 3;
    } else {
      raw[idx] = 0;
      bitIndex[k] = -1;
    }
  });
  return { raw, bitIndex, codewordAt };
}

export const MASKS: { formula: string; fn: (r: number, c: number) => boolean }[] = [
  { formula: "(r + c) mod 2 = 0", fn: (r, c) => (r + c) % 2 === 0 },
  { formula: "r mod 2 = 0", fn: (r) => r % 2 === 0 },
  { formula: "c mod 3 = 0", fn: (_r, c) => c % 3 === 0 },
  { formula: "(r + c) mod 3 = 0", fn: (r, c) => (r + c) % 3 === 0 },
  { formula: "(⌊r/2⌋ + ⌊c/3⌋) mod 2 = 0", fn: (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0 },
  { formula: "(r·c) mod 2 + (r·c) mod 3 = 0", fn: (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0 },
  { formula: "((r·c) mod 2 + (r·c) mod 3) mod 2 = 0", fn: (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0 },
  { formula: "((r + c) mod 2 + (r·c) mod 3) mod 2 = 0", fn: (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0 },
];

/** 15 bit định dạng: 2 bit mức sửa lỗi + 3 bit mặt nạ + 10 bit BCH, XOR 101010000010010 */
export function formatInfo(ecc: Ecc, mask: number) {
  const data = (parseInt(ECC_INFO[ecc].bits, 2) << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const beforeMask = (data << 10) | (rem & 0x3ff);
  return { data, bch: rem & 0x3ff, beforeMask, bits: beforeMask ^ 0x5412 };
}

/** 18 bit phiên bản: 6 bit số phiên bản + 12 bit Golay */
export function versionInfo(version: number) {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | (rem & 0xfff);
}

/** Áp mặt nạ lên vùng dữ liệu và ghi thông tin định dạng/phiên bản */
export function finalize(layout: Layout, raw: Uint8Array, ecc: Ecc, mask: number): Uint8Array {
  const { size, kind, formatBit, versionBit } = layout;
  const out = new Uint8Array(raw);
  const fn = MASKS[mask].fn;
  const fmt = formatInfo(ecc, mask).bits;
  const ver = layout.version >= 7 ? versionInfo(layout.version) : 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const i = r * size + c;
      if (kind[i] === K.data) {
        if (fn(r, c)) out[i] ^= 1;
      } else if (kind[i] === K.format) {
        out[i] = (fmt >> formatBit[i]) & 1;
      } else if (kind[i] === K.version) {
        out[i] = (ver >> versionBit[i]) & 1;
      }
    }
  }
  return out;
}

export interface Penalty {
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  total: number;
  darkPercent: number;
}

const P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
const P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

export function penalty(m: Uint8Array, size: number): Penalty {
  let r1 = 0;
  let r2 = 0;
  let r3 = 0;
  let dark = 0;
  const at = (r: number, c: number) => m[r * size + c];
  for (let line = 0; line < size; line++) {
    for (const horizontal of [true, false]) {
      const get = (k: number) => (horizontal ? at(line, k) : at(k, line));
      let run = 1;
      for (let k = 1; k <= size; k++) {
        if (k < size && get(k) === get(k - 1)) run++;
        else {
          if (run >= 5) r1 += 3 + (run - 5);
          run = 1;
        }
      }
      for (let k = 0; k + 11 <= size; k++) {
        let a = true;
        let b = true;
        for (let t = 0; t < 11 && (a || b); t++) {
          const v = get(k + t);
          if (v !== P1[t]) a = false;
          if (v !== P2[t]) b = false;
        }
        if (a) r3 += 40;
        if (b) r3 += 40;
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      dark += at(r, c);
      if (r < size - 1 && c < size - 1) {
        const v = at(r, c);
        if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) r2 += 3;
      }
    }
  }
  const darkPercent = (dark * 100) / (size * size);
  const r4 = Math.floor(Math.abs(darkPercent - 50) / 5) * 10;
  return { r1, r2, r3, r4, total: r1 + r2 + r3 + r4, darkPercent };
}

export interface MaskResult {
  mask: number;
  modules: Uint8Array;
  penalty: Penalty;
}

export interface QrBuild {
  plan: Plan;
  layout: Layout;
  placement: Placement;
  masks: MaskResult[];
  best: number;
}

export function buildQr(plan: Plan): QrBuild {
  const layout = buildLayout(plan.version);
  const placement = placeData(
    layout,
    plan.interleaved.map((c) => c.value),
  );
  const masks = MASKS.map((_, mask) => {
    const modules = finalize(layout, placement.raw, plan.ecc, mask);
    return { mask, modules, penalty: penalty(modules, layout.size) };
  });
  let best = 0;
  masks.forEach((m, i) => {
    if (m.penalty.total < masks[best].penalty.total) best = i;
  });
  return { plan, layout, placement, masks, best };
}

/** Tạo nhanh ma trận cuối cùng cho một chuỗi */
export function encodeText(text: string, ecc: Ecc = "M", opts: { minVersion?: number; mask?: number } = {}) {
  const plan = makePlan(text, ecc, "auto", opts.minVersion ?? 1);
  if (!plan) return null;
  const build = buildQr(plan);
  const mask = opts.mask ?? build.best;
  return { ...build, mask, modules: build.masks[mask].modules, size: build.layout.size };
}
