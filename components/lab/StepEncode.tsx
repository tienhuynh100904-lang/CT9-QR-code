"use client";

import { useMemo, useState } from "react";
import type { Plan, SegmentKind } from "@/lib/qr/encoder";
import { Panel, SEG_STYLE, segColor } from "./shared";

export default function StepEncode({ plan }: { plan: Plan }) {
  const [active, setActive] = useState<number | null>(null);
  const segs = plan.segments;

  // Màu của từng bit trong luồng (để tô các codeword 8 bit)
  const bitInfo = useMemo(() => {
    const out: { color: string; seg: number }[] = [];
    let dataIdx = 0;
    segs.forEach((s, si) => {
      const color = segColor(s.kind, s.kind === "data" ? dataIdx++ : 0);
      for (let k = 0; k < s.bits.length; k++) out.push({ color, seg: si });
    });
    return out;
  }, [segs]);

  const kinds = Array.from(new Set(segs.map((s) => s.kind))) as SegmentKind[];
  let dataIdx = 0;
  const activeSeg = active !== null ? segs[active] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-xs">
        {kinds.map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-muted">
            <span className="h-3 w-3 rounded-sm" style={{ background: SEG_STYLE[k].color }} />
            {SEG_STYLE[k].name}
          </span>
        ))}
      </div>

      <Panel title="Chuỗi bit — rê chuột lên từng nhóm để xem cách tính">
        <div className="thin-scroll flex max-h-80 flex-wrap gap-1.5 overflow-y-auto pr-1" onMouseLeave={() => setActive(null)}>
          {segs.map((s, i) => {
            const color = segColor(s.kind, s.kind === "data" ? dataIdx++ : 0);
            return (
              <button
                key={i}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`pop flex flex-col items-start rounded-lg border px-1.5 py-1 text-left transition ${
                  active === i ? "scale-105 bg-white/10" : ""
                }`}
                style={{ borderColor: `${color}88`, animationDelay: `${Math.min(i, 80) * 15}ms` }}
              >
                <span className="text-[10px] leading-tight font-semibold" style={{ color }}>
                  {s.label}
                </span>
                <span className="mono text-xs tracking-wider text-ink/90">{s.bits}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 min-h-10 rounded-xl bg-panel/80 px-4 py-2.5 text-sm">
          {activeSeg ? (
            <span>
              <b style={{ color: SEG_STYLE[activeSeg.kind].color }}>{SEG_STYLE[activeSeg.kind].name}</b>
              <span className="text-muted"> · {activeSeg.note}</span>{" "}
              <span className="mono text-dim">({activeSeg.bits.length} bit)</span>
            </span>
          ) : (
            <span className="text-dim">
              Ghép: {plan.eci ? "ECI → " : ""}chỉ báo chế độ → trường đếm → dữ liệu → bit kết thúc → bit đệm → byte đệm 236/17
              xen kẽ.
            </span>
          )}
        </div>
      </Panel>

      <Panel
        title={
          <>
            Cắt thành <span className="text-ink">{plan.dataCodewords.length}</span> codeword 8 bit ({plan.usedBits} bit nội
            dung + {plan.capacityBits - plan.usedBits} bit đệm = {plan.capacityBits} bit)
          </>
        }
      >
        <div className="thin-scroll grid max-h-80 grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 overflow-y-auto pr-1">
          {plan.dataCodewords.map((cw, i) => (
            <div
              key={i}
              className={`pop rounded-lg border bg-panel/60 p-1.5 text-center transition ${
                active !== null && bitInfo.slice(i * 8, i * 8 + 8).some((b) => b.seg === active)
                  ? "border-white/60"
                  : "border-line"
              }`}
              style={{ animationDelay: `${Math.min(i, 60) * 20 + 200}ms` }}
            >
              <div className="mono flex justify-center text-[11px] font-semibold">
                {Array.from(cw.toString(2).padStart(8, "0")).map((b, k) => (
                  <span key={k} style={{ color: bitInfo[i * 8 + k]?.color }}>
                    {b}
                  </span>
                ))}
              </div>
              <div className="mono mt-0.5 text-sm font-bold">{cw}</div>
              <div className="text-[9px] text-dim">#{i}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
