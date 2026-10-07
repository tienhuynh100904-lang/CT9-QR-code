"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { buildLayout, encodeText, K } from "@/lib/qr/matrix";
import { kindMeta, PAPER, INK } from "@/lib/qr/render";
import { alignmentPositions, capacity, ECC_LEVELS, sizeOf, totalCodewords } from "@/lib/qr/tables";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Callout, Section, SectionHeading, SubHeading } from "../ui/Section";
import Counter from "../ui/Counter";

function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function VersionExplorer() {
  const [v, setV] = useState(7);
  const [playing, setPlaying] = useState(false);
  const layout = useMemo(() => buildLayout(v), [v]);
  const size = sizeOf(v);
  const pos = alignmentPositions(v);
  const alignCount = pos.length ? pos.length * pos.length - 3 : 0;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setV((x) => (x >= 40 ? 1 : x + 1)), 380);
    return () => clearInterval(id);
  }, [playing]);

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      const rnd = seeded(v);
      for (let i = 0; i < size * size; i++) {
        const k = layout.kind[i];
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        if (k === K.data) {
          ctx.fillStyle = rnd() < 0.5 ? INK : PAPER;
        } else {
          const m = kindMeta(k);
          ctx.fillStyle = k === K.format || k === K.version ? m.dark : layout.fixed[i] ? m.dark : m.light;
        }
        ctx.fillRect(x, y, w, h);
      }
    },
    [v, size, layout],
  );

  return (
    <div className="card spot grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="mx-auto max-w-sm overflow-hidden rounded-xl">
          <GridCanvas size={size} quiet={2} draw={draw} label={`Khung mã QR phiên bản ${v}`} />
        </div>
        <p className="mt-3 text-center text-xs text-dim">Màu: mẫu định vị, thời gian, căn chỉnh, định dạng, phiên bản; xám-đen: dữ liệu</p>
      </div>
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm text-muted">Phiên bản</div>
            <div className="mono text-6xl font-extrabold text-mint">{v}</div>
          </div>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm transition hover:bg-panel-2"
          >
            {playing ? (
              <>
                <Pause size={16} aria-hidden />
                Dừng
              </>
            ) : (
              <>
                <Play size={16} aria-hidden />
                Chạy 1 → 40
              </>
            )}
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={40}
          value={v}
          onChange={(e) => {
            setV(+e.target.value);
            setPlaying(false);
          }}
          className="mt-4 w-full"
          aria-label="Chọn phiên bản"
        />
        <div className="mono mt-5 rounded-xl bg-bg-soft p-4 text-center text-lg">
          4 × <span className="text-mint">{v}</span> + 17 = <span className="font-bold text-ink">{size}</span>
          <span className="text-dim"> → {size}×{size} = {(size * size).toLocaleString("vi-VN")} module</span>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border border-line p-3">
            <dt className="text-xs text-dim">Mẫu căn chỉnh</dt>
            <dd className="mono text-2xl font-bold text-[#1fae63]">{alignCount}</dd>
          </div>
          <div className="rounded-xl border border-line p-3">
            <dt className="text-xs text-dim">Thông tin phiên bản</dt>
            <dd className="mono text-2xl font-bold text-[#f76b15]">{v >= 7 ? "Có" : "Không"}</dd>
          </div>
          <div className="rounded-xl border border-line p-3">
            <dt className="text-xs text-dim">Tổng codeword</dt>
            <dd className="mono text-2xl font-bold">{totalCodewords(v).toLocaleString("vi-VN")}</dd>
          </div>
        </dl>
        <div className="mt-5 overflow-hidden rounded-xl border border-line text-sm">
          <div className="grid grid-cols-5 bg-panel-2/70 font-semibold">
            <div className="p-2.5">Dung lượng</div>
            {ECC_LEVELS.map((e) => (
              <div key={e} className="mono p-2.5 text-center">
                {e}
              </div>
            ))}
          </div>
          {(
            [
              ["Số", "numeric"],
              ["Chữ-số", "alphanumeric"],
              ["Byte", "byte"],
            ] as const
          ).map(([label, mode]) => (
            <div key={mode} className="grid grid-cols-5 border-t border-line">
              <div className="p-2.5 text-muted">{label}</div>
              {ECC_LEVELS.map((e) => (
                <div key={e} className="mono p-2.5 text-center">
                  {capacity(v, e, mode).toLocaleString("vi-VN")}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SizeCompare() {
  const versions = [1, 5, 10, 20, 40];
  const max = sizeOf(40);
  return (
    <div className="card spot p-6 sm:p-8">
      <svg viewBox={`-2 -2 ${max + 4} ${max + 4}`} className="mx-auto w-full max-w-xs" aria-label="So sánh kích thước các phiên bản">
        {versions
          .slice()
          .reverse()
          .map((v, i) => {
            const s = sizeOf(v);
            const colors = ["#8b7bff", "#4cc9f0", "#5ef2c2", "#ffc857", "#ff6fae"];
            return (
              <g key={v}>
                <rect
                  x={0}
                  y={max - s}
                  width={s}
                  height={s}
                  fill={colors[i]}
                  fillOpacity={0.12}
                  stroke={colors[i]}
                  strokeWidth={1.2}
                  rx={1.5}
                />
                <text x={s - 3} y={max - s + 9} textAnchor="end" fontSize="8" fill={colors[i]} fontFamily="monospace">
                  V{v}
                </text>
              </g>
            );
          })}
      </svg>
      <p className="mt-4 text-center text-sm text-muted">Kích thước thực tương đối: V1 (21×21) so với V40 (177×177)</p>
    </div>
  );
}

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

function DiacriticsDemo() {
  const [text, setText] = useState("Chúc mừng năm mới, an khang thịnh vượng!");
  const plain = strip(text);
  const a = useMemo(() => encodeText(text || " ", "M"), [text]);
  const b = useMemo(() => encodeText(plain || " ", "M"), [plain]);
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  return (
    <div className="card spot p-6 sm:p-8">
      <h4 className="text-lg font-semibold">Thử nghiệm: tiếng Việt có dấu “nặng” hơn bao nhiêu?</h4>
      <input
        value={text}
        maxLength={150}
        onChange={(e) => setText(e.target.value)}
        className="mt-4 w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-3 outline-none focus:border-mint/70"
        aria-label="Văn bản tiếng Việt"
      />
      <div className="mt-6 grid grid-cols-2 gap-5">
        {[
          { label: "Có dấu", s: text, q: a },
          { label: "Không dấu", s: plain, q: b },
        ].map(({ label, s, q }) => (
          <div key={label}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-semibold">{label}</span>
              <span className="mono text-xs text-dim">{bytes(s)} byte</span>
            </div>
            <div className="mx-auto max-w-[180px]">{q && <MiniQr modules={q.modules} size={q.size} />}</div>
            <div className="mono mt-2 text-center text-sm">
              {q ? (
                <>
                  V{q.plan.version} · {q.size}×{q.size}
                </>
              ) : (
                "quá dài"
              )}
            </div>
            <div className="mt-1 truncate text-center text-xs text-dim">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const V40 = [
  ["Số (Numeric)", 7089, 5596, 3993, 3057],
  ["Chữ-số (Alphanumeric)", 4296, 3391, 2420, 1852],
  ["Byte (8-bit)", 2953, 2331, 1663, 1273],
  ["Kanji/Kana", 1817, 1435, 1024, 784],
] as const;

export default function Versions() {
  return (
    <Section id="phien-ban">
      <SectionHeading
        n={3}
        kicker="Versions & Capacity"
        title="Phiên bản và dung lượng"
        lead={
          <>
            Mã QR có <strong className="text-ink">40 phiên bản</strong>. Phiên bản 1 có kích thước 21×21 module, mỗi phiên
            bản tiếp theo tăng thêm 4 module mỗi cạnh, đến phiên bản 40 là 177×177 module.
          </>
        }
      />
      <Reveal>
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="mono rounded-2xl border border-mint/40 bg-mint/10 px-6 py-3 text-xl font-bold text-mint sm:text-2xl">
            Số module mỗi cạnh = 4 × V + 17
          </span>
        </div>
      </Reveal>
      <Reveal>
        <SubHeading n="3.1">40 phiên bản kích thước</SubHeading>
        <VersionExplorer />
      </Reveal>

      <div className="mt-16">
        <Reveal>
          <SubHeading n="3.2">Dung lượng tối đa</SubHeading>
          <p className="mb-6 max-w-3xl leading-relaxed text-muted">
            Dung lượng phụ thuộc vào ba yếu tố: <b className="text-ink">phiên bản</b>,{" "}
            <b className="text-ink">mức sửa lỗi</b> và <b className="text-ink">chế độ mã hóa</b>. Bảng dưới đây là dung
            lượng tối đa của phiên bản 40:
          </p>
        </Reveal>
        <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="card overflow-hidden">
            <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] bg-panel-2/70 text-sm font-semibold">
              <div className="p-3">Chế độ</div>
              {ECC_LEVELS.map((e) => (
                <div key={e} className="mono p-3 text-right">
                  Mức {e}
                </div>
              ))}
            </div>
            {V40.map(([name, ...vals]) => (
              <div key={name} className="grid grid-cols-[1.6fr_repeat(4,1fr)] border-t border-line text-sm hover:bg-panel-2/40">
                <div className="p-3 text-muted">{name}</div>
                {vals.map((x, i) => (
                  <div key={i} className={`mono p-3 text-right ${i === 0 ? "font-bold text-mint" : ""}`}>
                    <Counter to={x} />
                  </div>
                ))}
              </div>
            ))}
          </Reveal>
          <Reveal delay={120}>
            <SizeCompare />
          </Reveal>
        </div>
        <Reveal className="mt-6">
          <p className="mb-3 text-sm text-muted">Dung lượng ở chế độ Byte của một số phiên bản tiêu biểu (đơn vị: ký tự/byte):</p>
          <div className="card thin-scroll overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-panel-2/70">
                <tr>
                  {["Phiên bản", "Kích thước", ...ECC_LEVELS].map((h) => (
                    <th key={h} className="p-3 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 5, 10, 20, 40].map((v) => (
                  <tr key={v} className="border-t border-line hover:bg-panel-2/40">
                    <td className="mono p-3 font-bold text-mint">{v}</td>
                    <td className="mono p-3 text-muted">
                      {sizeOf(v)}×{sizeOf(v)}
                    </td>
                    {ECC_LEVELS.map((e) => (
                      <td key={e} className="mono p-3">
                        {capacity(v, e, "byte").toLocaleString("vi-VN")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <Reveal className="mt-6">
          <Callout tone="warn" title="Lưu ý về tiếng Việt">
            Tiếng Việt có dấu được mã hóa bằng UTF-8 ở chế độ Byte, mỗi chữ có dấu thường chiếm 2–3 byte. Vì vậy cùng một
            đoạn văn, bản có dấu sẽ cần phiên bản lớn hơn bản không dấu.
          </Callout>
        </Reveal>
        <Reveal className="mt-6">
          <DiacriticsDemo />
        </Reveal>
      </div>
    </Section>
  );
}
