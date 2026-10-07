"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, FlaskConical } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import { MODE_INFO } from "@/lib/qr/tables";
import { useLab } from "./LabContext";
import Counter from "./ui/Counter";

const QUIET = 2;

// Bộ sinh số giả ngẫu nhiên cố định để server và trình duyệt cho cùng kết quả
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(7);
const FLOATERS = Array.from({ length: 26 }, () => ({
  left: rand() * 100,
  size: 6 + rand() * 18,
  delay: rand() * -24,
  duration: 16 + rand() * 18,
  hue: ["#5ef2c2", "#4cc9f0", "#8b7bff", "#ff6fae", "#ffc857"][Math.floor(rand() * 5)],
}));

const TOPICS = [
  ["Lịch sử", "tong-quan"],
  ["Cấu trúc", "cau-truc"],
  ["Mã hóa", "che-do"],
  ["Sửa lỗi", "sua-loi"],
  ["Ứng dụng", "ung-dung"],
  ["Bảo mật", "bao-mat"],
  ["Thiết kế", "thiet-ke"],
  ["Lập trình", "lap-trinh"],
];

const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function HeroQr({ modules, size }: { modules: Uint8Array; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    size: 0,
    cur: new Uint8Array(0) as Uint8Array,
    prev: new Uint8Array(0) as Uint8Array,
    mode: "fly" as "fly" | "flip",
    t0: 0,
    delay: new Float32Array(0),
    ox: new Float32Array(0),
    oy: new Float32Array(0),
    pointer: null as null | { x: number; y: number },
    raf: 0,
    width: 0,
    reduced: false,
  });
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    const s = st.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const draw = (now: number) => {
      const W = s.width;
      if (!W) return false;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(W * dpr)) {
        canvas.width = canvas.height = Math.round(W * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, W);
      const n = s.size;
      const cell = W / (n + QUIET * 2);
      const t = now - s.t0;
      let busy = s.reduced ? false : s.mode === "fly" ? t < 1500 : t < 1000;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const i = r * n + c;
          let on = s.cur[i] === 1;
          let scale = 1;
          let dx = 0;
          let dy = 0;
          let alpha = 1;
          if (!s.reduced && s.mode === "fly") {
            if (!on) continue;
            const p = clamp01((t - s.delay[i]) / 700);
            const e = easeOutBack(p);
            dx = s.ox[i] * (1 - e) * cell;
            dy = s.oy[i] * (1 - e) * cell;
            scale = 0.3 + 0.7 * Math.min(1, e);
            alpha = clamp01(p * 2.5);
          } else if (!s.reduced && s.mode === "flip" && s.prev[i] !== s.cur[i]) {
            const p = clamp01((t - s.delay[i]) / 380);
            if (p < 0.5) {
              on = s.prev[i] === 1;
              scale = 1 - p * 2;
            } else scale = (p - 0.5) * 2;
          }
          if (!on) continue;
          const cx = (c + QUIET + 0.5) * cell + dx;
          const cy = (r + QUIET + 0.5) * cell + dy;
          let color = "#0e1430";
          if (s.pointer) {
            const d = Math.hypot(cx - s.pointer.x, cy - s.pointer.y) / cell;
            const boost = Math.max(0, 1 - d / 4.5);
            if (boost > 0) {
              scale *= 1 - 0.45 * boost;
              color = boost > 0.25 ? "#0a9e78" : color;
            }
          }
          const sz = cell * scale + 0.6;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(cx - sz / 2, cy - sz / 2, sz, sz, scale < 0.95 ? sz * 0.3 : cell * 0.08);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (s.pointer) busy = true;
      return busy;
    };

    const loop = (now: number) => {
      if (draw(now)) s.raf = requestAnimationFrame(loop);
      else s.raf = 0;
    };
    const kick = () => {
      if (!s.raf) s.raf = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    const ro = new ResizeObserver(([entry]) => {
      s.width = entry.contentRect.width;
      kick();
    });
    ro.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      kick();
    };
    const onLeave = () => {
      s.pointer = null;
      kick();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const s = st.current;
    const n = size * size;
    if (s.size !== size) {
      s.mode = "fly";
      s.delay = new Float32Array(n);
      s.ox = new Float32Array(n);
      s.oy = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / size);
        const c = i % size;
        const a = Math.atan2(r - size / 2, c - size / 2) + (Math.random() - 0.5);
        const dist = size * (0.6 + Math.random() * 0.9);
        s.ox[i] = Math.cos(a) * dist;
        s.oy[i] = Math.sin(a) * dist;
        s.delay[i] = Math.random() * 650;
      }
      s.prev = new Uint8Array(n);
    } else {
      s.mode = "flip";
      s.prev = s.cur;
      s.delay = new Float32Array(n);
      for (let i = 0; i < n; i++) s.delay[i] = ((Math.floor(i / size) + (i % size)) / (2 * size)) * 550;
    }
    s.size = size;
    s.cur = modules;
    s.t0 = performance.now();
    kickRef.current();
  }, [modules, size]);

  return <canvas ref={canvasRef} className="block aspect-square w-full" role="img" aria-label="Mã QR động" />;
}

export default function Hero() {
  const { openInLab } = useLab();
  const [value, setValue] = useState("Xin chào! Bạn vừa giải mã một mã QR");
  const qr = useMemo(() => encodeText(value || " ", "M"), [value]);

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="pixel-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #5ef2c255, #8b7bff33, transparent)" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute bottom-[-40px] rounded-[3px]"
            style={{
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              background: f.hue,
              opacity: 0.12,
              animation: `drift ${f.duration}s linear ${f.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="pop mono mb-6 inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel/70 px-4 py-1.5 text-xs tracking-[0.18em] text-muted uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
            Quick Response Code
          </div>
          <h1 className="text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Giải mã <span className="text-gradient">Mã QR</span>
          </h1>
          <p className="mt-4 text-xl font-medium text-ink/90 sm:text-2xl">từ một dòng chữ đến hàng trăm ô vuông</p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Tổng hợp kiến thức từ cơ bản đến nâng cao về mã QR. Không chỉ để đọc: bạn sẽ tự tay biến chữ thành mã QR qua
            từng bước, thử phá hỏng nó, và xem máy quét “nhìn” thấy gì.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#lab"
              className="pulse-ring inline-flex items-center gap-2 rounded-full bg-mint px-6 py-3 font-semibold text-bg transition hover:scale-[1.03] hover:brightness-110"
            >
              <FlaskConical size={18} aria-hidden />
              Tự tạo mã QR từng bước
            </a>
            <a
              href="#tong-quan"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3 font-semibold transition hover:bg-panel-2"
            >
              Bắt đầu khám phá
              <ArrowDown size={18} aria-hidden />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {TOPICS.map(([label, id], i) => (
              <a
                key={id + label}
                href={`#${id}`}
                className="pop rounded-lg border border-line px-3 py-1 text-sm text-muted transition hover:border-mint/50 hover:text-mint"
                style={{ animationDelay: `${300 + i * 60}ms` }}
              >
                {label}
              </a>
            ))}
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: 1994, label: "năm ra đời", plain: true },
              { v: 40, label: "phiên bản kích thước" },
              { v: 7089, label: "chữ số tối đa" },
              { v: 30, label: "dữ liệu hỏng vẫn khôi phục", suffix: "%" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="mono text-3xl font-bold text-ink">
                  {s.plain ? s.v : <Counter to={s.v} suffix={s.suffix} />}
                </dd>
                <div className="mt-1 text-sm text-dim">{s.label}</div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            className="absolute -inset-6 rounded-[36px] opacity-60 blur-2xl"
            style={{ background: "conic-gradient(from 180deg, #5ef2c244, #4cc9f044, #8b7bff44, #ff6fae44, #5ef2c244)" }}
            aria-hidden
          />
          <div className="card relative p-5">
            <div className="relative overflow-hidden rounded-2xl bg-paper">
              {qr && <HeroQr modules={qr.modules} size={qr.size} />}
              <div className="scanline" aria-hidden />
            </div>
            <label htmlFor="hero-input" className="mt-5 block text-sm font-medium text-muted">
              Gõ bất cứ điều gì — mã QR biến hình ngay:
            </label>
            <input
              id="hero-input"
              value={value}
              maxLength={80}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2 w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-3 text-ink outline-none transition focus:border-mint/70 focus:ring-4 focus:ring-mint/10"
              placeholder="Nhập chữ, số hoặc đường dẫn…"
            />
            {qr && (
              <div className="mono mt-3 flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-md bg-panel-2 px-2 py-1">Phiên bản {qr.plan.version}</span>
                <span className="rounded-md bg-panel-2 px-2 py-1">
                  {qr.size}×{qr.size} module
                </span>
                <span className="rounded-md bg-panel-2 px-2 py-1">Chế độ {MODE_INFO[qr.plan.analysis.mode].name}</span>
                <span className="rounded-md bg-panel-2 px-2 py-1">Mặt nạ {qr.mask}</span>
              </div>
            )}
            <button
              onClick={() => openInLab(value || "HELLO WORLD")}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-mint to-cyan px-4 py-3 font-semibold text-bg transition hover:brightness-110"
            >
              Xem mã này được tạo ra thế nào →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
