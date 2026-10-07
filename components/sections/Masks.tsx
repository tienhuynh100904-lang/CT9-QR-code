"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { MASKS, penalty } from "@/lib/qr/matrix";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const N = 16;

// Dữ liệu mẫu cố ý có mảng đen lớn và hình giống mẫu định vị — đúng loại "xấu" mà mặt nạ cần phá vỡ
function sampleData() {
  const m = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let v = 0;
      if (r >= 2 && r <= 6 && c >= 2 && c <= 8) v = 1;
      if (r === 10) v = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1][c];
      if (c >= 11 && r >= 3 && r <= 13) v = 1;
      if (r >= 12 && c <= 6) v = (r + c) % 5 === 0 ? 1 : 0;
      m[r * N + c] = v;
    }
  }
  return m;
}

function MaskTile({ mask }: { mask: number }) {
  const S = 12;
  const fn = MASKS[mask].fn;
  let d = "";
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) if (fn(r, c)) d += `M${c},${r}h1v1h-1z`;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full rounded-lg bg-paper" shapeRendering="crispEdges" aria-hidden>
      <path d={d} fill="#0e1430" />
    </svg>
  );
}

function MaskPlayground() {
  const data = useMemo(() => sampleData(), []);
  const [mask, setMask] = useState<number | null>(null);
  const results = useMemo(
    () =>
      MASKS.map((m) => {
        const out = new Uint8Array(data);
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (m.fn(r, c)) out[r * N + c] ^= 1;
        return penalty(out, N);
      }),
    [data],
  );
  const base = useMemo(() => penalty(data, N), [data]);
  const best = results.reduce((b, p, i) => (p.total < results[b].total ? i : b), 0);
  const fn = mask === null ? null : MASKS[mask].fn;
  const cur = mask === null ? base : results[mask];

  return (
    <div className="card spot grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div
          className="mx-auto grid max-w-xs gap-[2px] rounded-xl bg-paper p-2"
          style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
        >
          {Array.from(data).map((v, i) => {
            const r = Math.floor(i / N);
            const c = i % N;
            const flip = fn ? fn(r, c) : false;
            const val = flip ? v ^ 1 : v;
            return (
              <span
                key={i}
                className={`mcell ${val ? "bg-paper-ink" : "bg-[#e4e7f2]"} ${flip ? "flipped" : ""}`}
                style={{ transitionDelay: `${(r + c) * 22}ms` }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-dim">Viền hồng = module bị đảo màu bởi mặt nạ</p>
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMask(null)}
            className={`rounded-lg border px-3 py-2 text-sm ${mask === null ? "border-mint bg-mint text-bg" : "border-line-strong"}`}
          >
            Chưa áp
          </button>
          {MASKS.map((_, i) => (
            <button
              key={i}
              onClick={() => setMask(i)}
              className={`mono relative rounded-lg border px-3 py-2 text-sm font-semibold ${
                mask === i ? "border-mint bg-mint text-bg" : "border-line-strong hover:bg-panel-2"
              }`}
            >
              {i}
              {i === best && <Trophy size={14} className="absolute -top-2 -right-2" aria-hidden />}
            </button>
          ))}
        </div>
        {mask !== null && <div className="mono mt-4 text-sm text-pink">Đảo màu khi: {MASKS[mask].formula}</div>}
        <div className="mt-5 space-y-2">
          {[
            ["Quy tắc 1 · dãy ≥ 5 cùng màu", cur.r1],
            ["Quy tắc 2 · khối 2×2 cùng màu", cur.r2],
            ["Quy tắc 3 · giống mẫu định vị", cur.r3],
            ["Quy tắc 4 · lệch tỉ lệ 50%", cur.r4],
          ].map(([label, v]) => (
            <div key={label as string} className="flex items-center gap-3 text-sm">
              <span className="w-48 shrink-0 text-muted">{label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber to-red transition-all duration-500"
                  style={{ width: `${Math.min(100, ((v as number) / 200) * 100)}%` }}
                />
              </div>
              <span className="mono w-10 text-right">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-baseline justify-between rounded-xl bg-bg-soft p-4">
          <span className="text-muted">Tổng điểm phạt</span>
          <span className={`mono text-3xl font-bold ${mask === best ? "text-mint" : "text-ink"}`}>{cur.total}</span>
        </div>
        <div className="mt-3 grid grid-cols-9 gap-1 text-center">
          <div className="mono text-[10px] text-dim">
            —<div className="text-xs text-muted">{base.total}</div>
          </div>
          {results.map((p, i) => (
            <div key={i} className={`mono text-[10px] ${i === best ? "text-mint" : "text-dim"}`}>
              {i}
              <div className={`text-xs ${i === best ? "font-bold text-mint" : "text-muted"}`}>{p.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleIllustration({ rule }: { rule: number }) {
  const cells: [number, number, string][] = [];
  if (rule === 1) {
    for (let c = 0; c < 8; c++) cells.push([1, c, c >= 1 && c <= 6 ? "#e5484d" : c % 2 ? "#0e1430" : "#e4e7f2"]);
  } else if (rule === 2) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) cells.push([r, c, r < 2 && c >= 3 && c <= 4 ? "#e5484d" : (r + c) % 2 ? "#0e1430" : "#e4e7f2"]);
  } else if (rule === 3) {
    const p = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
    p.forEach((v, c) => cells.push([1, c, v ? "#e5484d" : "#ffd3d3"]));
  } else {
    for (let c = 0; c < 10; c++) cells.push([1, c, c < 7 ? "#0e1430" : "#e4e7f2"]);
  }
  const cols = rule === 3 ? 11 : rule === 4 ? 10 : 8;
  const rows = rule === 2 ? 3 : 3;
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className="w-full" shapeRendering="crispEdges" aria-hidden>
      <rect width={cols} height={rows} fill="#f7f8fc" />
      {cells.map(([r, c, color], i) => (
        <rect key={i} x={c} y={r} width={1} height={1} fill={color} />
      ))}
    </svg>
  );
}

const RULES = [
  { n: 1, title: "Dãy cùng màu", text: "Mỗi dãy từ 5 module cùng màu liên tiếp trở lên trên hàng hoặc cột bị phạt 3 điểm, cộng thêm 1 điểm cho mỗi module vượt quá 5." },
  { n: 2, title: "Khối 2×2", text: "Mỗi khối 2×2 cùng màu bị phạt 3 điểm." },
  { n: 3, title: "Giống mẫu định vị", text: "Mỗi lần xuất hiện mẫu giống mẫu định vị (1:1:3:1:1 kèm 4 module trắng ở một bên) bị phạt 40 điểm." },
  { n: 4, title: "Cân bằng sáng tối", text: "Tỉ lệ module tối càng lệch khỏi 50% càng bị phạt nhiều: 10 điểm cho mỗi 5% chênh lệch." },
];

export default function Masks() {
  return (
    <Section id="mat-na">
      <SectionHeading
        n={6}
        kicker="Masking"
        title="Mặt nạ (Masking)"
        lead="Sau khi đặt dữ liệu lên lưới, mã có thể tình cờ xuất hiện những mảng đen hoặc trắng lớn, hay các hình giống mẫu định vị, gây khó khăn cho máy quét. Để tránh điều đó, vùng dữ liệu được XOR với một trong 8 mẫu mặt nạ: module tại hàng r, cột c bị đảo màu nếu điều kiện của mặt nạ đúng."
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {MASKS.map((m, i) => (
          <Reveal key={i} delay={i * 50}>
            <div className="card spot lift group h-full p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-bold">Mặt nạ {i}</span>
                <span className="mono text-xs text-dim">{i.toString(2).padStart(3, "0")}</span>
              </div>
              <div className="transition duration-500 group-hover:scale-[1.04]">
                <MaskTile mask={i} />
              </div>
              <div className="mono mt-3 text-[11px] leading-snug text-pink sm:text-xs">{m.formula}</div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-dim">Ô đen = vị trí bị đảo màu</p>

      <Reveal className="mt-14">
        <SubHeading>Thử áp mặt nạ lên một vùng dữ liệu “xấu”</SubHeading>
        <MaskPlayground />
      </Reveal>

      <div className="mt-14">
        <Reveal>
          <SubHeading n="6.1">Chọn mặt nạ tối ưu bằng điểm phạt</SubHeading>
          <p className="mb-6 max-w-3xl leading-relaxed text-muted">
            Bộ tạo mã thử cả 8 mặt nạ và chọn mặt nạ có tổng điểm phạt thấp nhất theo 4 quy tắc:
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r, i) => (
            <Reveal key={r.n} delay={i * 70}>
              <div className="card spot lift h-full p-5">
                <div className="mono text-sm text-mint">Quy tắc {r.n}</div>
                <div className="mt-1 text-lg font-bold">{r.title}</div>
                <div className="my-4 overflow-hidden rounded-lg">
                  <RuleIllustration rule={r.n} />
                </div>
                <p className="text-sm leading-relaxed text-muted">{r.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
