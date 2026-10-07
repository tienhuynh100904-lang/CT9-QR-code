"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { K, MASKS, type QrBuild } from "@/lib/qr/matrix";
import { INK, PAPER } from "@/lib/qr/render";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import { Panel } from "./shared";

type View = "before" | "after" | "pattern";

function MiniMask({ build, mask }: { build: QrBuild; mask: number }) {
  const { size, kind } = build.layout;
  const m = build.masks[mask].modules;
  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      for (let i = 0; i < size * size; i++) {
        if (!m[i]) continue;
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        ctx.fillStyle = kind[i] === K.data ? INK : "#7d84a3";
        ctx.fillRect(x, y, w, h);
      }
    },
    [m, size, kind],
  );
  return <GridCanvas size={size} quiet={1} draw={draw} label={`Mặt nạ ${mask}`} />;
}

export default function StepMask({ build, mask, setMask }: { build: QrBuild; mask: number; setMask: (m: number) => void }) {
  const { layout, placement } = build;
  const { size, kind, fixed } = layout;
  const [view, setView] = useState<View>("after");
  const [wave, setWave] = useState(1);
  const fn = MASKS[mask].fn;

  // hiệu ứng "sóng" quét chéo mỗi khi đổi mặt nạ hoặc chế độ xem
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 700);
      setWave(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mask, view]);

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      for (let i = 0; i < size * size; i++) {
        const r = Math.floor(i / size);
        const c = i % size;
        const [x, y, w, h] = cellBox(g, r, c);
        const k = kind[i];
        const swept = (r + c) / (2 * size - 2) <= wave;
        if (k !== K.data) {
          ctx.fillStyle = k === K.format || k === K.version ? "#e9e3f3" : fixed[i] ? "#7d84a3" : "#e3e6ef";
          ctx.fillRect(x, y, w, h);
          continue;
        }
        const flip = fn(r, c);
        const raw = placement.raw[i];
        let color: string;
        if (view === "pattern") color = flip && swept ? "#ff6fae" : PAPER;
        else if (view === "before" || !swept) color = raw ? INK : PAPER;
        else color = raw ^ (flip ? 1 : 0) ? INK : PAPER;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        if (view === "after" && wave < 1 && flip && swept && (r + c) / (2 * size - 2) > wave - 0.08) {
          ctx.fillStyle = "rgba(255,111,174,0.55)";
          ctx.fillRect(x, y, w, h);
        }
      }
    },
    [size, kind, fixed, fn, placement, view, wave],
  );

  const best = build.best;
  const p = build.masks[mask].penalty;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="mb-3 flex overflow-hidden rounded-lg border border-line-strong text-sm">
            {(
              [
                ["before", "Trước mặt nạ"],
                ["pattern", `Mẫu mặt nạ ${mask}`],
                ["after", "Sau khi XOR"],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 px-3 py-2 ${view === v ? "bg-panel-2 font-semibold text-mint" : "text-muted hover:bg-panel-2/50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl">
            <GridCanvas size={size} quiet={1} draw={draw} label="Áp mặt nạ lên vùng dữ liệu" />
          </div>
          <p className="mono mt-3 text-center text-sm text-pink">Đảo màu khi {MASKS[mask].formula}</p>
        </div>
        <div className="space-y-4">
          <Panel
            title={
              <span className="inline-flex items-center gap-1.5">
                {`Điểm phạt của mặt nạ ${mask}`}
                {mask === best && (
                  <>
                    <Trophy size={16} className="text-amber" aria-hidden />
                    (thấp nhất)
                  </>
                )}
              </span>
            }
          >
            <div className="space-y-2 text-sm">
              {[
                ["1 · dãy ≥ 5 module cùng màu", p.r1],
                ["2 · khối 2×2 cùng màu", p.r2],
                ["3 · giống mẫu định vị", p.r3],
                [`4 · tỉ lệ tối ${p.darkPercent.toFixed(1)}%`, p.r4],
              ].map(([label, v]) => (
                <div key={label as string} className="flex justify-between gap-2">
                  <span className="text-muted">Quy tắc {label}</span>
                  <span className="mono">{v}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <span>Tổng</span>
                <span className="mono text-lg">{p.total}</span>
              </div>
            </div>
          </Panel>
          <p className="text-sm leading-relaxed text-muted">
            Máy tính thử <b className="text-ink">cả 8 mặt nạ</b> và giữ mặt nạ có tổng điểm phạt thấp nhất. Bạn có thể bấm chọn
            mặt nạ khác — mã vẫn hợp lệ và quét được, chỉ là “xấu” hơn một chút với máy quét.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {build.masks.map((m) => {
          const maxTotal = Math.max(...build.masks.map((x) => x.penalty.total));
          return (
            <button
              key={m.mask}
              onClick={() => setMask(m.mask)}
              className={`relative rounded-2xl border p-2.5 text-left transition ${
                mask === m.mask ? "border-mint bg-mint/[0.07]" : "border-line hover:border-line-strong"
              }`}
            >
              {m.mask === best && <Trophy size={20} className="absolute -top-2.5 -right-2 text-amber" aria-hidden />}
              <div className="overflow-hidden rounded-lg">
                <MiniMask build={build} mask={m.mask} />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-semibold">Mặt nạ {m.mask}</span>
                <span className={`mono text-sm ${m.mask === best ? "font-bold text-mint" : "text-muted"}`}>{m.penalty.total}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2">
                <div
                  className={`h-full rounded-full ${m.mask === best ? "bg-mint" : "bg-amber/70"}`}
                  style={{ width: `${(m.penalty.total / maxTotal) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
