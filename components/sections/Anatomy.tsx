"use client";

import { useCallback, useMemo, useState } from "react";
import { encodeText, formatInfo, K } from "@/lib/qr/matrix";
import { KIND_META, kindMeta, PAPER } from "@/lib/qr/render";
import { ECC_LEVELS, type Ecc } from "@/lib/qr/tables";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const QUIET = 4;

const PARTS: { key: string; n: string; title: string; en: string; color: string; body: React.ReactNode }[] = [
  {
    key: "finder",
    n: "2.1",
    title: "Mẫu định vị",
    en: "Finder Pattern",
    color: "#e5484d",
    body: (
      <>
        Ba hình vuông lớn ở các góc trên-trái, trên-phải và dưới-trái. Mỗi mẫu gồm khung đen 7×7, khung trắng 5×5 và khối
        đen 3×3 ở giữa, tạo tỉ lệ đen-trắng-đen-trắng-đen là <b>1:1:3:1:1</b> khi quét theo bất kỳ đường thẳng nào đi qua
        tâm. Nhờ ba mẫu này, máy quét xác định được vị trí, kích thước và góc xoay của mã. Góc dưới-phải không có mẫu định
        vị, nên máy biết đâu là “chiều đúng” của mã.
      </>
    ),
  },
  {
    key: "separator",
    n: "2.2",
    title: "Vùng phân tách",
    en: "Separator",
    color: "#e0449b",
    body: <>Dải module trắng rộng 1 module bao quanh mỗi mẫu định vị, tách mẫu định vị khỏi vùng dữ liệu để tránh nhầm lẫn.</>,
  },
  {
    key: "timing",
    n: "2.3",
    title: "Mẫu thời gian",
    en: "Timing Pattern",
    color: "#3e7bfa",
    body: (
      <>
        Hai đường kẻ gồm các module đen-trắng xen kẽ, nằm ở hàng 6 và cột 6, nối giữa các mẫu định vị. Chúng giúp máy quét
        xác định kích thước module và tọa độ từng hàng, cột, đặc biệt khi mã bị méo hoặc in trên mặt cong.
      </>
    ),
  },
  {
    key: "alignment",
    n: "2.4",
    title: "Mẫu căn chỉnh",
    en: "Alignment Pattern",
    color: "#1fae63",
    body: (
      <>
        Các hình vuông nhỏ 5×5 (khung đen, viền trắng, chấm đen ở tâm), xuất hiện từ phiên bản 2 trở lên. Phiên bản càng
        lớn thì càng nhiều mẫu căn chỉnh (phiên bản 40 có 46 mẫu). Chúng giúp hiệu chỉnh biến dạng phối cảnh khi ảnh chụp
        bị nghiêng hoặc bề mặt cong.
      </>
    ),
  },
  {
    key: "format",
    n: "2.5",
    title: "Thông tin định dạng",
    en: "Format Information",
    color: "#8e4ec6",
    body: (
      <>
        Chuỗi 15 bit, được lưu <b>hai lần</b> (quanh mẫu định vị trên-trái và chia đôi ở hai mẫu còn lại) để tăng độ tin
        cậy: 2 bit mức sửa lỗi (L = 01, M = 00, Q = 11, H = 10), 3 bit mẫu mặt nạ (000–111) và 10 bit sửa lỗi BCH. Cuối
        cùng 15 bit này được XOR với chuỗi cố định <span className="mono">101010000010010</span> để tránh trường hợp toàn
        bit 0.
      </>
    ),
  },
  {
    key: "version",
    n: "2.6",
    title: "Thông tin phiên bản",
    en: "Version Information",
    color: "#f76b15",
    body: (
      <>
        Chỉ có ở mã từ phiên bản 7 trở lên: hai khối 6×3 module (gần mẫu định vị trên-phải và dưới-trái) chứa 18 bit, gồm 6
        bit số phiên bản và 12 bit sửa lỗi (mã Golay mở rộng).
      </>
    ),
  },
  {
    key: "dark",
    n: "2.7",
    title: "Module tối cố định",
    en: "Dark Module",
    color: "#f5b300",
    body: (
      <>
        Một module luôn luôn màu đen, nằm cạnh mẫu định vị dưới-trái, tại tọa độ <b>(hàng 4V + 9, cột 8)</b> với V là số
        phiên bản. Ở mã phiên bản 7 bên cạnh: hàng 37, cột 8.
      </>
    ),
  },
  {
    key: "data",
    n: "2.8",
    title: "Vùng dữ liệu và mã sửa lỗi",
    en: "Data + EC",
    color: "#0e1430",
    body: (
      <>
        Toàn bộ phần còn lại chứa các bit dữ liệu đã mã hóa và các codeword sửa lỗi Reed–Solomon, được sắp xếp theo đường
        zíc-zắc từ góc dưới-phải đi lên, mỗi lần xử lý cột đôi.
      </>
    ),
  },
  {
    key: "quiet",
    n: "2.9",
    title: "Vùng trống",
    en: "Quiet Zone",
    color: "#22d3ee",
    body: (
      <>
        Viền trắng bao quanh mã, theo tiêu chuẩn rộng tối thiểu <b>4 module</b> (Micro QR là 2 module). Đây là yếu tố hay
        bị bỏ qua khi thiết kế, nhưng thiếu vùng trống là một trong những nguyên nhân phổ biến nhất khiến mã không quét
        được.
      </>
    ),
  },
];

function FinderRatio() {
  const [angle, setAngle] = useState(22);
  const rad = (angle * Math.PI) / 180;
  const m = Math.max(Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad)));
  const unit = 1 / m; // độ dài 1 "đơn vị" trên tia quét
  const runs = [1, 1, 3, 1, 1].map((k) => k * unit);
  const L = 3.5 * unit;
  const cx = 5;
  const cy = 5;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return (
    <div className="card spot grid items-center gap-6 p-6 sm:grid-cols-[220px_1fr] sm:p-8">
      <svg viewBox="0 0 10 10" className="mx-auto w-52 rounded-xl bg-paper" aria-label="Mẫu định vị với tia quét">
        <rect x="1.5" y="1.5" width="7" height="7" fill="#0e1430" />
        <rect x="2.5" y="2.5" width="5" height="5" fill="#f7f8fc" />
        <rect x="3.5" y="3.5" width="3" height="3" fill="#0e1430" />
        <line
          x1={cx - dx * (L + 0.8)}
          y1={cy - dy * (L + 0.8)}
          x2={cx + dx * (L + 0.8)}
          y2={cy + dy * (L + 0.8)}
          stroke="#5ef2c2"
          strokeWidth="0.18"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 0.3px #5ef2c2)" }}
        />
        <circle cx={cx} cy={cy} r="0.25" fill="#5ef2c2" />
      </svg>
      <div>
        <h4 className="text-lg font-semibold">Vì sao lại là 1:1:3:1:1?</h4>
        <p className="mt-2 text-muted">
          Xoay tia quét theo bất kỳ góc nào đi qua tâm — độ dài các đoạn đen/trắng thay đổi, nhưng <b>tỉ lệ</b> giữa chúng
          luôn giữ nguyên. Đó là “chữ ký” giúp máy quét nhận ra mẫu định vị dù mã bị xoay.
        </p>
        <label className="mt-5 flex items-center gap-3 text-sm">
          <span className="w-24 text-muted">Góc: {angle}°</span>
          <input type="range" min={0} max={180} value={angle} onChange={(e) => setAngle(+e.target.value)} className="flex-1" />
        </label>
        <div className="mt-5 flex h-9 overflow-hidden rounded-lg border border-line">
          {runs.map((len, i) => (
            <div
              key={i}
              className={`mono flex items-center justify-center text-xs font-semibold transition-all ${
                i % 2 === 0 ? "bg-paper-ink text-paper" : "bg-paper text-paper-ink"
              }`}
              style={{ flex: len }}
            >
              {len.toFixed(2)}
            </div>
          ))}
        </div>
        <div className="mono mt-2 flex justify-between text-xs text-dim">
          <span>độ dài đo được (module)</span>
          <span className="text-mint">
            tỉ lệ = {runs.map((r) => Math.round(r / unit)).join(" : ")}
          </span>
        </div>
      </div>
    </div>
  );
}

function FormatPlayground() {
  const [ecc, setEcc] = useState<Ecc>("M");
  const [mask, setMask] = useState(5);
  const f = formatInfo(ecc, mask);
  const b15 = (v: number) => v.toString(2).padStart(15, "0");
  const row = (label: string, bits: string, colorFor: (i: number) => string) => (
    <div>
      <span className="text-xs text-dim">{label}</span>
      <div className="mono mt-0.5 flex gap-0.5">
        {Array.from(bits).map((b, i) => (
          <span key={i} className={`flex h-7 w-5 items-center justify-center rounded text-xs font-semibold sm:w-6 ${colorFor(i)}`}>
            {b}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div className="card spot p-6 sm:p-8">
      <h4 className="text-lg font-semibold">Tự ghép 15 bit thông tin định dạng</h4>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex gap-1">
          {ECC_LEVELS.map((e) => (
            <button
              key={e}
              onClick={() => setEcc(e)}
              className={`mono h-8 w-8 rounded-lg border font-semibold transition ${
                ecc === e ? "border-mint bg-mint text-bg" : "border-line-strong hover:bg-panel-2"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-muted">Mặt nạ</span>
          <select
            value={mask}
            onChange={(e) => setMask(+e.target.value)}
            className="mono rounded-lg border border-line-strong bg-bg-soft px-2 py-1"
          >
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i} value={i}>
                {i} ({i.toString(2).padStart(3, "0")})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="thin-scroll mt-5 space-y-1.5 overflow-x-auto pb-2">
        {row("ECC + mặt nạ + BCH", b15(f.beforeMask), (i) =>
          i < 2 ? "bg-violet/30 text-violet" : i < 5 ? "bg-pink/25 text-pink" : "bg-panel-2 text-muted",
        )}
        {row("XOR", "101010000010010", () => "bg-transparent text-dim border border-line")}
        {row("Kết quả", b15(f.bits), () => "bg-[#8e4ec6] text-white")}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-dim">
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-violet/60" />2 bit mức sửa lỗi
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-pink/60" />3 bit mặt nạ
        </span>
        <span>
          <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-panel-2" />
          10 bit BCH
        </span>
      </div>
    </div>
  );
}

export default function Anatomy() {
  const qr = useMemo(() => encodeText("https://vi.wikipedia.org/wiki/Mã_QR", "M", { minVersion: 7 })!, []);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { layout, modules, size } = qr;

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      if (focus === "quiet") {
        ctx.fillStyle = "#22d3ee";
        ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, g.width, g.width);
        ctx.globalAlpha = 1;
        const [x, y] = cellBox(g, 0, 0);
        const [x2, y2, w2, h2] = cellBox(g, size - 1, size - 1);
        ctx.fillStyle = PAPER;
        ctx.fillRect(x, y, x2 + w2 - x, y2 + h2 - y);
      }
      for (let i = 0; i < size * size; i++) {
        const meta = kindMeta(layout.kind[i]);
        const faded = focus !== null && focus !== meta.key;
        ctx.globalAlpha = faded ? 0.13 : 1;
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        ctx.fillStyle = modules[i] ? meta.dark : meta.kind === K.data ? PAPER : meta.light;
        ctx.fillRect(x, y, w, h);
      }
      ctx.globalAlpha = 1;
      if (hover !== null) {
        const [x, y, w, h] = cellBox(g, Math.floor(hover / size), hover % size);
        ctx.strokeStyle = "#5ef2c2";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      }
    },
    [focus, hover, layout, modules, size],
  );

  const hoverMeta = hover !== null ? kindMeta(layout.kind[hover]) : null;

  return (
    <Section id="cau-truc">
      <SectionHeading
        n={2}
        kicker="Anatomy"
        title="Cấu trúc của mã QR"
        lead="Mỗi mã QR được tạo thành từ các module (ô vuông đơn vị). Một số vùng có vị trí cố định, giúp máy quét định vị và đọc mã; phần còn lại chứa dữ liệu và mã sửa lỗi. Rê chuột lên từng thành phần để soi chúng trên một mã QR phiên bản 7 thật (45×45 module)."
      />
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4 sm:p-5">
            <div className="overflow-hidden rounded-xl">
              <GridCanvas
                size={size}
                quiet={QUIET}
                draw={draw}
                label="Mã QR phiên bản 7 tô màu theo thành phần"
                onHover={(i) => setHover(i)}
              />
            </div>
            <div className="mt-3 flex min-h-12 items-center gap-3 rounded-xl bg-bg-soft px-4 py-2 text-sm">
              {hoverMeta && hover !== null ? (
                <>
                  <span className="h-4 w-4 shrink-0 rounded" style={{ background: hoverMeta.dark }} />
                  <span>
                    <span className="mono text-dim">
                      hàng {Math.floor(hover / size)}, cột {hover % size}
                    </span>{" "}
                    → <b>{hoverMeta.name}</b> <span className="text-dim">({hoverMeta.en})</span>
                  </span>
                </>
              ) : (
                <span className="text-dim">Rê chuột lên mã để biết từng module thuộc thành phần nào.</span>
              )}
            </div>
          </div>
        </Reveal>
        <div className="space-y-3">
          {PARTS.map((p, i) => {
            const active = focus === p.key;
            const count = p.key === "quiet" ? null : countKind(layout.kind, p.key);
            return (
              <Reveal key={p.key} delay={i * 40}>
                <button
                  onMouseEnter={() => setFocus(p.key)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(p.key)}
                  onBlur={() => setFocus(null)}
                  onClick={() => setFocus(active ? null : p.key)}
                  className={`card lift w-full p-4 text-left transition sm:p-5 ${active ? "border-white/30 bg-panel-2" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 shrink-0 rounded-md border border-white/20"
                      style={{ background: p.color }}
                      aria-hidden
                    />
                    <span className="mono text-sm text-mint">{p.n}</span>
                    <span className="font-semibold">{p.title}</span>
                    <span className="hidden text-sm text-dim sm:inline">({p.en})</span>
                    {count !== null && <span className="mono ml-auto text-xs text-dim">{count} module</span>}
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.body}</p>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <SubHeading>Thí nghiệm nhỏ: tia quét xoay</SubHeading>
          <FinderRatio />
        </Reveal>
        <Reveal delay={120}>
          <SubHeading>Thí nghiệm nhỏ: thông tin định dạng</SubHeading>
          <FormatPlayground />
        </Reveal>
      </div>
    </Section>
  );
}

function countKind(kinds: Uint8Array, key: string) {
  const k = KIND_META.find((m) => m.key === key)!.kind;
  let n = 0;
  for (const v of kinds) if (v === k) n++;
  return n;
}
