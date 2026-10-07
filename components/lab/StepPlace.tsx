"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCw, SkipForward } from "lucide-react";
import { K, type QrBuild } from "@/lib/qr/matrix";
import { BLOCK_COLORS, PAPER, bin8 } from "@/lib/qr/render";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import { drawGridLines } from "./StepFunction";
import { Panel } from "./shared";

const SPEEDS = [
  { label: "Chậm", v: 40 },
  { label: "Vừa", v: 220 },
  { label: "Nhanh", v: 1200 },
];

export default function StepPlace({ build }: { build: QrBuild }) {
  const { layout, placement, plan } = build;
  const { size, zigzag, kind, fixed } = layout;
  const total = zigzag.length;
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [hover, setHover] = useState<number | null>(null);
  const nRef = useRef(0);

  const isPlaying = playing && n < total;
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    let acc = nRef.current;
    const tick = (now: number) => {
      acc = Math.min(total, acc + ((now - last) / 1000) * SPEEDS[speed].v);
      last = now;
      nRef.current = acc;
      setN(Math.floor(acc));
      if (acc < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, total]);

  const seek = (v: number) => {
    nRef.current = v;
    setN(v);
  };

  // module → vị trí trong thứ tự zíc-zắc, và codeword → các module của nó
  const { orderOf, cwModules } = useMemo(() => {
    const orderOf = new Int32Array(size * size).fill(-1);
    const cwModules: number[][] = plan.interleaved.map(() => []);
    zigzag.forEach((idx, k) => {
      orderOf[idx] = k;
      const cw = placement.codewordAt[idx];
      if (cw >= 0) cwModules[cw].push(idx);
    });
    return { orderOf, cwModules };
  }, [size, zigzag, placement, plan.interleaved]);

  const hoverCw = hover !== null && kind[hover] === K.data ? placement.codewordAt[hover] : -1;
  const hoverOrder = hover !== null ? orderOf[hover] : -1;

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      drawGridLines(ctx, g);
      for (let i = 0; i < size * size; i++) {
        if (kind[i] === K.data) continue;
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        ctx.fillStyle = kind[i] === K.format || kind[i] === K.version ? "#e9e3f3" : fixed[i] ? "#9aa1bd" : "#e3e6ef";
        ctx.fillRect(x, y, w, h);
      }
      for (let k = 0; k < n; k++) {
        const i = zigzag[k];
        const cw = placement.codewordAt[i];
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        const bit = placement.raw[i];
        if (cw < 0) {
          ctx.fillStyle = "#d4d7e3";
        } else {
          const ref = plan.interleaved[cw];
          if (ref.isEcc) ctx.fillStyle = bit ? "#b5480f" : "#ffe1cc";
          else ctx.fillStyle = bit ? "#0e1430" : "#d6e6ff";
        }
        ctx.fillRect(x, y, w, h);
      }
      // vệt đường zíc-zắc gần đầu rắn
      const tail = n < total ? Math.min(n, 40) : 0;
      if (tail > 1) {
        ctx.lineWidth = Math.max(1.5, g.cell * 0.18);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let k = n - tail; k < n - 1; k++) {
          const a = zigzag[k];
          const b = zigzag[k + 1];
          const [ax, ay, aw] = cellBox(g, Math.floor(a / size), a % size);
          const [bx, by, bw] = cellBox(g, Math.floor(b / size), b % size);
          ctx.strokeStyle = `rgba(94,242,194,${0.15 + (0.85 * (k - (n - tail))) / tail})`;
          ctx.beginPath();
          ctx.moveTo(ax + aw / 2, ay + aw / 2);
          ctx.lineTo(bx + bw / 2, by + bw / 2);
          ctx.stroke();
        }
      }
      if (n > 0 && n < total) {
        const i = zigzag[n - 1];
        const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
        ctx.fillStyle = "#5ef2c2";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.max(3, w * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      if (hoverCw >= 0) {
        ctx.strokeStyle = BLOCK_COLORS[plan.interleaved[hoverCw].block % BLOCK_COLORS.length];
        ctx.lineWidth = 2.5;
        for (const i of cwModules[hoverCw]) {
          const [x, y, w, h] = cellBox(g, Math.floor(i / size), i % size);
          ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        }
      }
    },
    [size, kind, fixed, n, zigzag, placement, plan.interleaved, total, hoverCw, cwModules],
  );

  const ref = hoverCw >= 0 ? plan.interleaved[hoverCw] : null;
  const bitPos = hoverOrder >= 0 ? hoverOrder % 8 : -1;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl">
          <GridCanvas size={size} quiet={1} draw={draw} background={PAPER} label="Đặt bit dữ liệu theo đường zíc-zắc" onHover={setHover} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => {
              if (n >= total) seek(0);
              setPlaying(!isPlaying);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-1.5 font-semibold text-bg"
          >
            {isPlaying ? (
              <>
                <Pause size={14} aria-hidden />
                Dừng
              </>
            ) : n >= total ? (
              <>
                <RotateCw size={14} aria-hidden />
                Chạy lại
              </>
            ) : (
              <>
                <Play size={14} aria-hidden />
                Chạy
              </>
            )}
          </button>
          <div className="flex overflow-hidden rounded-lg border border-line-strong">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setSpeed(i)}
                className={`px-3 py-1.5 ${speed === i ? "bg-panel-2 text-mint" : "text-muted hover:bg-panel-2/50"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { seek(total); setPlaying(false); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 hover:bg-panel-2"
          >
            <SkipForward size={14} aria-hidden />
            Tất cả
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={n}
          onChange={(e) => {
            seek(+e.target.value);
            setPlaying(false);
          }}
          className="mt-3 w-full"
          aria-label="Tua quá trình đặt bit"
        />
        <div className="mono text-xs text-dim">
          Đã đặt {n}/{total} bit
        </div>
      </div>
      <div className="space-y-4">
        <Panel title="Luật đi của “con rắn”">
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted">
            <li>Bắt đầu ở góc dưới-phải, xử lý từng <b className="text-ink">cột đôi</b> (rộng 2 module).</li>
            <li>Trong cột đôi: ô phải trước, ô trái sau, rồi lên một hàng.</li>
            <li>Chạm mép trên thì dịch sang cột đôi bên trái và <b className="text-ink">đi xuống</b> — cứ thế zíc-zắc.</li>
            <li>Bỏ qua mọi ô thuộc mẫu chức năng; bỏ qua hẳn cột 6 (mẫu thời gian).</li>
            <li>Bit 1 → module tối, bit 0 → module sáng.</li>
          </ol>
        </Panel>
        <Panel title="Soi một module">
          {hover === null ? (
            <p className="text-sm text-dim">Rê chuột lên một ô dữ liệu trên lưới…</p>
          ) : kind[hover] !== K.data ? (
            <p className="text-sm text-muted">
              Hàng {Math.floor(hover / size)}, cột {hover % size}: ô chức năng — rắn đi vòng qua.
            </p>
          ) : ref ? (
            <div className="space-y-1.5 text-sm">
              <div className="mono text-dim">
                hàng {Math.floor(hover / size)}, cột {hover % size} · bit #{hoverOrder}
              </div>
              <div>
                Codeword <b>#{hoverCw}</b> ={" "}
                <span className="mono">
                  {Array.from(bin8(ref.value)).map((b, i) => (
                    <span key={i} className={i === bitPos ? "rounded bg-mint px-0.5 text-bg" : ""}>
                      {b}
                    </span>
                  ))}
                </span>{" "}
                ({ref.value})
              </div>
              <div className="text-muted">
                Thuộc <b style={{ color: BLOCK_COLORS[ref.block % BLOCK_COLORS.length] }}>khối {ref.block + 1}</b>,{" "}
                {ref.isEcc ? "phần sửa lỗi" : "phần dữ liệu"} #{ref.indexInBlock + 1}. Viền màu = 8 module của codeword này.
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Bit dư (remainder) — luôn bằng 0.</p>
          )}
        </Panel>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#0e1430] ring-1 ring-white/30" />
            <span className="h-3 w-3 rounded-sm bg-[#d6e6ff]" />
            dữ liệu (1/0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#b5480f]" />
            <span className="h-3 w-3 rounded-sm bg-[#ffe1cc]" />
            sửa lỗi (1/0)
          </span>
        </div>
      </div>
    </div>
  );
}
