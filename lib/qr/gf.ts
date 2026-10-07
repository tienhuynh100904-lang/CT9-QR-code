// Số học trên trường hữu hạn GF(256) với đa thức nguyên thủy x^8 + x^4 + x^3 + x^2 + 1 (0x11D)

export const EXP = new Uint8Array(512);
export const LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function polyMul(p: number[], q: number[]): number[] {
  const out = new Array<number>(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) out[i + j] ^= gfMul(p[i], q[j]);
  }
  return out;
}

const generatorCache = new Map<number, number[]>();

/** Đa thức sinh g(x) = (x − α⁰)(x − α¹)…(x − α^(n−1)), hệ số từ bậc cao xuống thấp. */
export function generatorPoly(degree: number): number[] {
  const cached = generatorCache.get(degree);
  if (cached) return cached;
  let poly = [1];
  for (let i = 0; i < degree; i++) poly = polyMul(poly, [1, EXP[i]]);
  generatorCache.set(degree, poly);
  return poly;
}

export interface RsStep {
  /** Chỉ số hệ số đang bị khử */
  index: number;
  /** Hệ số dẫn đầu trước khi khử */
  lead: number;
  /** Số mũ α của hệ số dẫn đầu (null khi bằng 0) */
  leadExp: number | null;
  /** Cửa sổ degree+1 hệ số trước khi XOR */
  before: number[];
  /** Đa thức sinh nhân với hệ số dẫn đầu */
  product: number[];
  /** Cửa sổ sau khi XOR */
  after: number[];
}

/** Chia đa thức dữ liệu cho đa thức sinh; phần dư là các codeword sửa lỗi. */
export function rsEncode(data: number[], degree: number, withSteps = false) {
  const gen = generatorPoly(degree);
  const rem = [...data, ...new Array<number>(degree).fill(0)];
  const steps: RsStep[] = [];
  for (let i = 0; i < data.length; i++) {
    const lead = rem[i];
    const before = rem.slice(i, i + degree + 1);
    const product = gen.map((g) => gfMul(g, lead));
    if (lead !== 0) {
      for (let j = 0; j <= degree; j++) rem[i + j] ^= product[j];
    }
    if (withSteps) {
      steps.push({
        index: i,
        lead,
        leadExp: lead === 0 ? null : LOG[lead],
        before,
        product,
        after: rem.slice(i, i + degree + 1),
      });
    }
  }
  return { ecc: rem.slice(data.length), gen, steps };
}
