import { rsEncode } from "./gf";
import {
  ALNUM_CHARS,
  charCountBits,
  dataBitLength,
  dataCodewordCount,
  eccPerBlock,
  MODE_INFO,
  numBlocks,
  remainderBits,
  totalCodewords,
  type Ecc,
  type Mode,
} from "./tables";

export interface CharInfo {
  ch: string;
  numeric: boolean;
  alnum: boolean;
  bytes: number[];
}

export interface Analysis {
  text: string;
  chars: CharInfo[];
  mode: Mode;
  bytes: number[];
  nonAscii: boolean;
}

const encoder = new TextEncoder();

export function analyze(text: string): Analysis {
  const chars: CharInfo[] = Array.from(text).map((ch) => ({
    ch,
    numeric: /^[0-9]$/.test(ch),
    alnum: ALNUM_CHARS.includes(ch),
    bytes: Array.from(encoder.encode(ch)),
  }));
  const bytes = chars.flatMap((c) => c.bytes);
  const mode: Mode =
    chars.length > 0 && chars.every((c) => c.numeric)
      ? "numeric"
      : chars.length > 0 && chars.every((c) => c.alnum)
        ? "alphanumeric"
        : "byte";
  return { text, chars, mode, bytes, nonAscii: bytes.some((b) => b >= 0x80) };
}

export function countFor(a: Analysis, mode: Mode = a.mode) {
  return mode === "byte" ? a.bytes.length : a.chars.length;
}

/** Tổng số bit cần (chưa tính bit kết thúc/đệm) cho một phiên bản */
export function bitsNeeded(a: Analysis, version: number, eci: boolean, mode: Mode = a.mode) {
  return (eci ? 12 : 0) + 4 + charCountBits(mode, version) + dataBitLength(mode, countFor(a, mode));
}

export function chooseVersion(a: Analysis, ecc: Ecc, eci: boolean): number | null {
  for (let v = 1; v <= 40; v++) {
    if (bitsNeeded(a, v, eci) <= dataCodewordCount(v, ecc) * 8) return v;
  }
  return null;
}

export type SegmentKind = "eci" | "mode" | "count" | "data" | "terminator" | "bitpad" | "padbyte";

export interface Segment {
  kind: SegmentKind;
  bits: string;
  label: string;
  note?: string;
}

const bin = (value: number, len: number) => value.toString(2).padStart(len, "0");

function dataSegments(a: Analysis): Segment[] {
  const segs: Segment[] = [];
  if (a.mode === "numeric") {
    const digits = a.chars.map((c) => c.ch).join("");
    for (let i = 0; i < digits.length; i += 3) {
      const group = digits.slice(i, i + 3);
      const len = [0, 4, 7, 10][group.length];
      const v = parseInt(group, 10);
      segs.push({ kind: "data", bits: bin(v, len), label: group, note: `"${group}" = ${v} → ${len} bit` });
    }
  } else if (a.mode === "alphanumeric") {
    const s = a.chars.map((c) => c.ch);
    for (let i = 0; i < s.length; i += 2) {
      const v1 = ALNUM_CHARS.indexOf(s[i]);
      const show = (ch: string) => (ch === " " ? "␣" : ch);
      if (i + 1 < s.length) {
        const v2 = ALNUM_CHARS.indexOf(s[i + 1]);
        const v = 45 * v1 + v2;
        segs.push({
          kind: "data",
          bits: bin(v, 11),
          label: show(s[i]) + show(s[i + 1]),
          note: `45 × ${v1} + ${v2} = ${v} → 11 bit`,
        });
      } else {
        segs.push({ kind: "data", bits: bin(v1, 6), label: show(s[i]), note: `ký tự lẻ "${show(s[i])}" = ${v1} → 6 bit` });
      }
    }
  } else {
    for (const c of a.chars) {
      c.bytes.forEach((b, k) => {
        const hex = b.toString(16).toUpperCase().padStart(2, "0");
        segs.push({
          kind: "data",
          bits: bin(b, 8),
          label: k === 0 ? (c.ch === " " ? "␣" : c.ch) : "·",
          note:
            c.bytes.length > 1
              ? `"${c.ch}" (UTF-8 byte ${k + 1}/${c.bytes.length}) = 0x${hex}`
              : `"${c.ch === " " ? "␣" : c.ch}" = 0x${hex} = ${b}`,
        });
      });
    }
  }
  return segs;
}

export interface Block {
  index: number;
  data: number[];
  ecc: number[];
}

export interface CodewordRef {
  value: number;
  block: number;
  isEcc: boolean;
  indexInBlock: number;
}

export interface Plan {
  analysis: Analysis;
  ecc: Ecc;
  version: number;
  eci: boolean;
  count: number;
  capacityBits: number;
  usedBits: number;
  segments: Segment[];
  dataCodewords: number[];
  eccPerBlock: number;
  blocks: Block[];
  interleaved: CodewordRef[];
  remainderBits: number;
}

export function makePlan(text: string, ecc: Ecc, eciPref: boolean | "auto" = "auto", minVersion = 1): Plan | null {
  const a = analyze(text);
  const eci = eciPref === "auto" ? a.nonAscii : eciPref && a.mode === "byte";
  let version = chooseVersion(a, ecc, eci);
  if (version === null) return null;
  version = Math.max(version, minVersion);

  const capacityBits = dataCodewordCount(version, ecc) * 8;
  const count = countFor(a);
  const segments: Segment[] = [];
  if (eci) segments.push({ kind: "eci", bits: "0111" + bin(26, 8), label: "ECI 26", note: "Khai báo bảng mã UTF-8 (ECI 26)" });
  segments.push({
    kind: "mode",
    bits: MODE_INFO[a.mode].indicator,
    label: "Chế độ",
    note: `Chỉ báo chế độ ${MODE_INFO[a.mode].name}`,
  });
  const ccLen = charCountBits(a.mode, version);
  segments.push({
    kind: "count",
    bits: bin(count, ccLen),
    label: `Đếm = ${count}`,
    note: `${count} ${a.mode === "byte" ? "byte" : "ký tự"} viết trên ${ccLen} bit`,
  });
  segments.push(...dataSegments(a));

  let used = segments.reduce((s, x) => s + x.bits.length, 0);
  const term = Math.min(4, capacityBits - used);
  if (term > 0) {
    segments.push({ kind: "terminator", bits: "0".repeat(term), label: "Kết thúc", note: `${term} bit 0 đánh dấu hết dữ liệu` });
    used += term;
  }
  const pad = (8 - (used % 8)) % 8;
  if (pad > 0) {
    segments.push({ kind: "bitpad", bits: "0".repeat(pad), label: "Đệm", note: `Thêm ${pad} bit 0 cho tròn byte` });
    used += pad;
  }
  const usedBits = used;
  for (let i = 0; used < capacityBits; i++) {
    const v = i % 2 === 0 ? 0xec : 0x11;
    segments.push({ kind: "padbyte", bits: bin(v, 8), label: v === 0xec ? "EC" : "11", note: `Byte đệm ${v === 0xec ? "236 (0xEC)" : "17 (0x11)"}` });
    used += 8;
  }

  const all = segments.map((s) => s.bits).join("");
  const dataCodewords: number[] = [];
  for (let i = 0; i < all.length; i += 8) dataCodewords.push(parseInt(all.slice(i, i + 8), 2));

  // Chia khối: các khối "ngắn" đứng trước, khối "dài" hơn 1 codeword dữ liệu đứng sau
  const nb = numBlocks(version, ecc);
  const epb = eccPerBlock(version, ecc);
  const raw = totalCodewords(version);
  const numShort = nb - (raw % nb);
  const shortLen = Math.floor(raw / nb);
  const blocks: Block[] = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const len = shortLen - epb + (i < numShort ? 0 : 1);
    const data = dataCodewords.slice(k, k + len);
    k += len;
    blocks.push({ index: i, data, ecc: rsEncode(data, epb).ecc });
  }

  const interleaved: CodewordRef[] = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.data.length) interleaved.push({ value: b.data[i], block: b.index, isEcc: false, indexInBlock: i });
  }
  for (let i = 0; i < epb; i++) {
    for (const b of blocks) interleaved.push({ value: b.ecc[i], block: b.index, isEcc: true, indexInBlock: i });
  }

  return {
    analysis: a,
    ecc,
    version,
    eci,
    count,
    capacityBits,
    usedBits,
    segments,
    dataCodewords,
    eccPerBlock: epb,
    blocks,
    interleaved,
    remainderBits: remainderBits(version),
  };
}
