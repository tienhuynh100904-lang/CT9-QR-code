export type Ecc = "L" | "M" | "Q" | "H";
export type Mode = "numeric" | "alphanumeric" | "byte";

export const ECC_LEVELS: Ecc[] = ["L", "M", "Q", "H"];

export const ECC_INFO: Record<Ecc, { name: string; percent: number; bits: string; use: string }> = {
  L: { name: "Low", percent: 7, bits: "01", use: "Môi trường sạch, màn hình, cần mã nhỏ nhất" },
  M: { name: "Medium", percent: 15, bits: "00", use: "Mặc định phổ biến, cân bằng cho đa số trường hợp" },
  Q: { name: "Quartile", percent: 25, bits: "11", use: "Môi trường công nghiệp, dễ bẩn, trầy xước" },
  H: { name: "High", percent: 30, bits: "10", use: "Chèn logo, in ngoài trời, bề mặt khó" },
};

export const ALNUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

export const MODE_INFO: Record<Mode, { name: string; indicator: string; ccBits: [number, number, number] }> = {
  numeric: { name: "Numeric", indicator: "0001", ccBits: [10, 12, 14] },
  alphanumeric: { name: "Alphanumeric", indicator: "0010", ccBits: [9, 11, 13] },
  byte: { name: "Byte", indicator: "0100", ccBits: [8, 16, 16] },
};

export function charCountBits(mode: Mode, version: number): number {
  const [a, b, c] = MODE_INFO[mode].ccBits;
  return version <= 9 ? a : version <= 26 ? b : c;
}

// Số codeword sửa lỗi trên mỗi khối, theo phiên bản (chỉ số 0 không dùng)
const ECC_PER_BLOCK: Record<Ecc, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};

// Số khối sửa lỗi theo phiên bản
const NUM_BLOCKS: Record<Ecc, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};

export function eccPerBlock(version: number, ecc: Ecc) {
  return ECC_PER_BLOCK[ecc][version];
}

export function numBlocks(version: number, ecc: Ecc) {
  return NUM_BLOCKS[ecc][version];
}

export function sizeOf(version: number) {
  return version * 4 + 17;
}

/** Số module dùng được cho dữ liệu + sửa lỗi (kể cả bit dư) */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

export function totalCodewords(version: number) {
  return Math.floor(rawDataModules(version) / 8);
}

export function dataCodewordCount(version: number, ecc: Ecc) {
  return totalCodewords(version) - eccPerBlock(version, ecc) * numBlocks(version, ecc);
}

export function remainderBits(version: number) {
  return rawDataModules(version) % 8;
}

export function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
  const result = [6];
  for (let pos = sizeOf(version) - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

export function dataBitLength(mode: Mode, count: number) {
  if (mode === "numeric") return 10 * Math.floor(count / 3) + [0, 4, 7][count % 3];
  if (mode === "alphanumeric") return 11 * Math.floor(count / 2) + 6 * (count % 2);
  return 8 * count;
}

/** Số ký tự tối đa (Byte: số byte) của một phiên bản/mức sửa lỗi/chế độ */
export function capacity(version: number, ecc: Ecc, mode: Mode): number {
  const bits = dataCodewordCount(version, ecc) * 8 - 4 - charCountBits(mode, version);
  if (mode === "byte") return Math.floor(bits / 8);
  if (mode === "alphanumeric") return Math.floor(bits / 11) * 2 + (bits % 11 >= 6 ? 1 : 0);
  const r = bits % 10;
  return Math.floor(bits / 10) * 3 + (r >= 7 ? 2 : r >= 4 ? 1 : 0);
}
