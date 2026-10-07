"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, RotateCw } from "lucide-react";
import { K, type QrBuild } from "@/lib/qr/matrix";
import { KIND_META, kindMeta, PAPER } from "@/lib/qr/render";
import { alignmentPositions } from "@/lib/qr/tables";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import { Panel } from "./shared";

function Dot({ className = "" }: { className?: string }) {
  return <Circle size={12} className={`mr-1.5 inline-block fill-current align-baseline ${className}`} aria-hidden />;
}

export function useReveal(total: number, duration: number) {
  const [n, setN] = useState(0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setN(Math.round(total * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total, duration, run]);
  return [n, () => setRun((r) => r + 1)] as const;
}

export function drawGridLines(ctx: CanvasRenderingContext2D, g: { cell: number; size: number; quiet: number; width: number }) {
  if (g.cell < 5) return;
  ctx.strokeStyle = "rgba(14,20,48,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= g.size; i++) {
    const p = Math.round((i + g.quiet) * g.cell) + 0.5;
    const a = Math.round(g.quiet * g.cell);
    const b = Math.round((g.size + g.quiet) * g.cell);
    ctx.moveTo(p, a);
    ctx.lineTo(p, b);
    ctx.moveTo(a, p);
    ctx.lineTo(b, p);
  }
  ctx.stroke();
}

export default function StepFunction({ build }: { build: QrBuild }) {
  const { layout } = build;
  const { size, drawOrder, kind, fixed } = layout;
  const [revealed, replay] = useReveal(drawOrder.length, 1600);
  const [focus, setFocus] = useState<number | null>(null);

  const counts = useMemo(() => {
    const m = new Map<number, number>();
    for (const k of kind) m.set(k, (m.get(k) ?? 0) + 1);
    return m;
  }, [kind]);

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      drawGridLines(ctx, g);
      for (let j = 0; j < revealed; j++) {
        const i = drawOrder[j];
        const k = kind[i];
        const meta = kindMeta(k);
        ctx.globalAlpha = focus !== null && focus !== k ? 0.15 : 1;
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        ctx.fillStyle = k === K.format || k === K.version ? meta.light : fixed[i] ? meta.dark : meta.light;
        ctx.fillRect(x, y, w, h);
        if (k === K.format || k === K.version) {
          ctx.strokeStyle = meta.dark;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
        }
      }
      ctx.globalAlpha = 1;
    },
    [revealed, drawOrder, kind, size, fixed, focus],
  );

  const pos = alignmentPositions(layout.version);
  const v = layout.version;
  const legend = KIND_META.filter((m) => m.kind !== K.data && counts.get(m.kind));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl">
          <GridCanvas size={size} quiet={1} draw={draw} background={PAPER} label="Các mẫu chức năng trên lưới" />
        </div>
        <button
          onClick={replay}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-sm hover:bg-panel-2"
        >
          <RotateCw size={14} aria-hidden />
          Vẽ lại
        </button>
      </div>
      <div className="space-y-4">
        <Panel title="Thành phần (rê chuột để làm nổi bật)">
          <div className="space-y-1.5" onMouseLeave={() => setFocus(null)}>
            {legend.map((m) => (
              <div
                key={m.key}
                onMouseEnter={() => setFocus(m.kind)}
                className="flex cursor-default items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5"
              >
                <span className="h-4 w-4 rounded" style={{ background: m.dark }} />
                <span className="flex-1">{m.name}</span>
                <span className="mono text-xs text-dim">{counts.get(m.kind)} module</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Vị trí cố định">
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Dot className="text-red" />
              3 mẫu định vị 7×7 ở ba góc, bọc bởi vùng phân tách trắng.
            </li>
            <li>
              <Dot className="text-cyan" />
              Mẫu thời gian ở hàng 6 và cột 6, đen-trắng xen kẽ.
            </li>
            <li>
              <Dot className="text-mint" />
              {pos.length ? (
                <>
                  {pos.length * pos.length - 3} mẫu căn chỉnh tại tâm các tọa độ{" "}
                  <span className="mono text-ink">[{pos.join(", ")}]</span>.
                </>
              ) : (
                "Phiên bản 1 không có mẫu căn chỉnh."
              )}
            </li>
            <li>
              <Dot className="text-amber" />
              Module tối tại hàng 4×{v}+9 = <b className="text-ink">{4 * v + 9}</b>, cột 8.
            </li>
            <li>
              <Dot className="text-violet" />
              Dành sẵn 2 × 15 ô cho thông tin định dạng (ghi ở bước 9).
            </li>
            {v >= 7 && (
              <li>
                <Dot className="text-orange" />
                Dành sẵn 2 × 18 ô cho thông tin phiên bản.
              </li>
            )}
          </ul>
        </Panel>
        <p className="text-sm text-dim">
          Còn lại <b className="text-ink">{counts.get(K.data)}</b> ô trống dành cho dữ liệu ={" "}
          {build.plan.interleaved.length} codeword × 8 bit
          {build.plan.remainderBits ? ` + ${build.plan.remainderBits} bit dư` : ""}.
        </p>
      </div>
    </div>
  );
}
