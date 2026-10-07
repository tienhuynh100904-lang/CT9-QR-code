"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import jsQR from "jsqr";
import { ArrowRight, Bandage, Check, CircleCheck, CircleX, Eraser, Pencil, Tag, X, Zap } from "lucide-react";
import { encodeText, K } from "@/lib/qr/matrix";
import { BLOCK_COLORS, INK, PAPER } from "@/lib/qr/render";
import { ECC_INFO, ECC_LEVELS, type Ecc } from "@/lib/qr/tables";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";

type Qr = NonNullable<ReturnType<typeof encodeText>>;
const QUIET = 3;

function logoRect(size: number, percent: number) {
  // cạnh logo (module) để chiếm khoảng percent% diện tích mã
  const side = Math.round(Math.sqrt((percent / 100) * size * size));
  const start = Math.floor((size - side) / 2);
  return { start, end: start + side, side };
}

function DamageBoard({ qr, ecc }: { qr: Qr; ecc: Ecc }) {
  const { size, modules, layout, placement, plan } = qr;
  const n = size * size;
  const [paint, setPaint] = useState(() => new Int8Array(n).fill(-1));
  const [tool, setTool] = useState<1 | 0>(1);
  const [brush, setBrush] = useState(1);
  const [logo, setLogo] = useState(0);
  const [showCw, setShowCw] = useState(true);
  const [decoded, setDecoded] = useState<{ ok: boolean; text?: string } | null>(null);

  const lr = logoRect(size, logo);
  const inLogo = useCallback(
    (r: number, c: number) => logo > 0 && r >= lr.start && r < lr.end && c >= lr.start && c < lr.end,
    [logo, lr.start, lr.end],
  );

  const effective = useMemo(() => {
    const eff = new Uint8Array(modules);
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / size);
      const c = i % size;
      if (inLogo(r, c)) eff[i] = 0;
      else if (paint[i] >= 0) eff[i] = paint[i];
    }
    return eff;
  }, [modules, paint, n, size, inLogo]);

  const report = useMemo(() => {
    const bad = new Set<number>();
    let changed = 0;
    const finder = [0, 0, 0];
    let fmt1 = 0;
    let fmt2 = 0;
    for (let i = 0; i < n; i++) {
      if (effective[i] === modules[i]) continue;
      changed++;
      const r = Math.floor(i / size);
      const c = i % size;
      const k = layout.kind[i];
      if (k === K.data && placement.codewordAt[i] >= 0) bad.add(placement.codewordAt[i]);
      if (k === K.finder) finder[r < 9 && c < 9 ? 0 : r < 9 ? 1 : 2]++;
      if (k === K.format) {
        if (r < 9 && c < 9) fmt1++;
        else fmt2++;
      }
    }
    const perBlock = plan.blocks.map(() => 0);
    bad.forEach((cw) => perBlock[plan.interleaved[cw].block]++);
    const cap = Math.floor(plan.eccPerBlock / 2);
    const dataOk = perBlock.every((x) => x <= cap);
    const formatOk = Math.min(fmt1, fmt2) <= 3;
    const finderOk = finder.every((x) => x <= 8);
    return { bad, changed, perBlock, cap, dataOk, formatOk, finderOk, finder, fmt1, fmt2 };
  }, [effective, modules, n, size, layout, placement, plan]);

  // Thử giải mã thật bằng jsQR (chậm một nhịp để không giật khi đang tô)
  useEffect(() => {
    const id = setTimeout(() => {
      const scale = 6;
      const q = 4;
      const w = (size + q * 2) * scale;
      const data = new Uint8ClampedArray(w * w * 4).fill(255);
      for (let i = 0; i < n; i++) {
        if (!effective[i]) continue;
        const r = Math.floor(i / size) + q;
        const c = (i % size) + q;
        for (let y = 0; y < scale; y++) {
          for (let x = 0; x < scale; x++) {
            const o = ((r * scale + y) * w + c * scale + x) * 4;
            data[o] = data[o + 1] = data[o + 2] = 0;
          }
        }
      }
      const res = jsQR(data, w, w, { inversionAttempts: "dontInvert" });
      setDecoded(res ? { ok: true, text: res.data } : { ok: false });
    }, 150);
    return () => clearTimeout(id);
  }, [effective, n, size]);

  const onPaint = useCallback(
    (i: number) => {
      const r0 = Math.floor(i / size);
      const c0 = i % size;
      setPaint((prev) => {
        const next = new Int8Array(prev);
        for (let dr = -brush; dr <= brush; dr++) {
          for (let dc = -brush; dc <= brush; dc++) {
            if (dr * dr + dc * dc > brush * brush + 0.5) continue;
            const r = r0 + dr;
            const c = c0 + dc;
            if (r < 0 || c < 0 || r >= size || c >= size) continue;
            next[r * size + c] = tool;
          }
        }
        return next;
      });
    },
    [brush, size, tool],
  );

  const splash = () => {
    setPaint((prev) => {
      const next = new Int8Array(prev);
      const cr = 2 + Math.random() * (size - 4);
      const cc = 2 + Math.random() * (size - 4);
      const rad = 1.5 + Math.random() * 2.5;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const d = Math.hypot(r - cr, (c - cc) * (0.7 + Math.random() * 0.6));
          if (d < rad) next[r * size + c] = Math.random() < 0.8 ? 1 : 0;
        }
      }
      return next;
    });
  };

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / size);
        const c = i % size;
        const [x, y, w, h] = cellBox(g, r, c);
        const painted = paint[i] >= 0 && !inLogo(r, c);
        ctx.fillStyle = painted ? (paint[i] ? "#5b3a29" : "#fffdf4") : effective[i] ? INK : PAPER;
        ctx.fillRect(x, y, w, h);
        if (showCw && layout.kind[i] === K.data && report.bad.has(placement.codewordAt[i])) {
          ctx.fillStyle = "rgba(255,93,108,0.38)";
          ctx.fillRect(x, y, w, h);
        }
      }
      if (logo > 0) {
        const [x, y] = cellBox(g, lr.start, lr.start);
        const side = lr.side * g.cell;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#8b7bff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, side - 2, side - 2, side * 0.18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#8b7bff";
        ctx.font = `700 ${Math.max(10, side * 0.28)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("LOGO", x + side / 2, y + side / 2);
      }
    },
    [n, size, paint, inLogo, effective, showCw, layout, report.bad, placement, logo, lr.start, lr.side],
  );

  const theoryOk = report.dataOk && report.formatOk && report.finderOk;

  // Logo vuông ở giữa lớn nhất (theo % diện tích) mà mọi khối vẫn tự sửa được
  const maxLogo = useMemo(() => {
    const cap = Math.floor(plan.eccPerBlock / 2);
    let best = 0;
    for (let p = 1; p <= 40; p++) {
      const { start, end } = logoRect(size, p);
      const bad = new Set<number>();
      for (let r = start; r < end; r++) {
        for (let c = start; c < end; c++) {
          const i = r * size + c;
          if (modules[i] && layout.kind[i] === K.data && placement.codewordAt[i] >= 0) bad.add(placement.codewordAt[i]);
        }
      }
      const per = plan.blocks.map(() => 0);
      bad.forEach((cw) => per[plan.interleaved[cw].block]++);
      if (per.some((x) => x > cap)) break;
      best = p;
    }
    return best;
  }, [plan, size, modules, layout, placement]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <div
          className={`overflow-hidden rounded-2xl border-4 transition ${
            decoded === null ? "border-transparent" : decoded.ok ? "border-mint/70" : "border-red/70"
          } ${decoded && !decoded.ok ? "shake" : ""}`}
          style={{ cursor: "crosshair" }}
        >
          <GridCanvas size={size} quiet={QUIET} draw={draw} label="Mã QR để thử phá hỏng" onPaint={onPaint} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button
            onClick={() => setTool(1)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${tool === 1 ? "border-mint bg-mint/15 text-mint" : "border-line-strong"}`}
          >
            <Pencil size={16} aria-hidden />
            Vết bẩn (tô đen)
          </button>
          <button
            onClick={() => setTool(0)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${tool === 0 ? "border-mint bg-mint/15 text-mint" : "border-line-strong"}`}
          >
            <Bandage size={16} aria-hidden />
            Trầy xước (tô trắng)
          </button>
          <button onClick={splash} className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2 hover:bg-panel-2">
            <Zap size={16} aria-hidden />
            Vết bẩn ngẫu nhiên
          </button>
          <button
            onClick={() => {
              setPaint(new Int8Array(n).fill(-1));
              setLogo(0);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2 hover:bg-panel-2"
          >
            <Eraser size={16} aria-hidden />
            Làm sạch
          </button>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <label className="flex items-center gap-3">
            <span className="w-24 text-muted">Cỡ bút: {brush + 1}</span>
            <input type="range" min={0} max={3} value={brush} onChange={(e) => setBrush(+e.target.value)} className="flex-1" />
          </label>
          <label className="flex items-center gap-3">
            <span className="w-24 text-muted">Logo: {logo}%</span>
            <input type="range" min={0} max={40} value={logo} onChange={(e) => setLogo(+e.target.value)} className="flex-1" />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className={`rounded-2xl border p-5 transition ${
            decoded?.ok ? "border-mint/50 bg-mint/[0.07]" : "border-red/50 bg-red/[0.07]"
          }`}
        >
          <div className="text-sm text-muted">Máy quét thật (thư viện jsQR) đọc thử:</div>
          {decoded === null ? (
            <div className="mt-1 text-dim">Đang thử…</div>
          ) : decoded.ok ? (
            <div className="mt-1">
              <div className="flex items-center gap-2 text-xl font-bold text-mint">
                <CircleCheck size={22} aria-hidden />
                Đọc được!
              </div>
              <div className="mono mt-1 text-sm break-all text-ink/90">{decoded.text}</div>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-xl font-bold text-red">
              <CircleX size={22} aria-hidden />
              Không đọc được
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-bg-soft p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">Phân tích theo lý thuyết</span>
            <span className={`text-sm font-semibold ${theoryOk ? "text-mint" : "text-red"}`}>
              {theoryOk ? "Có thể khôi phục" : "Vượt khả năng sửa"}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Module bị thay đổi</span>
              <span className="mono">{report.changed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Mẫu định vị (3 góc)</span>
              <span className={`mono inline-flex items-center gap-1 ${report.finderOk ? "text-mint" : "text-red"}`}>
                {report.finder.join(" · ")} module hỏng {report.finderOk ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Thông tin định dạng (2 bản sao)</span>
              <span className={`mono inline-flex items-center gap-1 ${report.formatOk ? "text-mint" : "text-red"}`}>
                {report.fmt1} · {report.fmt2} bit lỗi {report.formatOk ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
              </span>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted">
            Codeword lỗi trong từng khối (sửa tối đa <b className="text-ink">{report.cap}</b>/khối):
          </div>
          <div className="mt-2 space-y-1.5">
            {report.perBlock.map((x, b) => (
              <div key={b} className="flex items-center gap-2">
                <span className="mono w-14 text-xs" style={{ color: BLOCK_COLORS[b % BLOCK_COLORS.length] }}>
                  Khối {b + 1}
                </span>
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className={`h-full rounded-full transition-all ${x > report.cap ? "bg-red" : "bg-mint"}`}
                    style={{ width: `${Math.min(100, (x / Math.max(1, report.cap)) * 100)}%` }}
                  />
                </div>
                <span className={`mono w-12 text-right text-xs ${x > report.cap ? "text-red" : "text-muted"}`}>
                  {x}/{report.cap}
                </span>
              </div>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showCw} onChange={(e) => setShowCw(e.target.checked)} />
            Tô đỏ các codeword bị ảnh hưởng
          </label>
        </div>
        <div className="rounded-xl border border-violet/30 bg-violet/[0.07] px-4 py-3 text-sm text-muted">
          <Tag size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />Với mã này (phiên bản {plan.version}, mức {ecc}), logo vuông đặt giữa che được tối đa khoảng{" "}
          <b className="text-ink">{maxLogo}%</b> diện tích mà vẫn khôi phục được.
        </div>
        <p className="text-xs leading-relaxed text-dim">
          Mức {ecc} có {plan.eccPerBlock} codeword sửa lỗi mỗi khối nên sửa được tối đa {report.cap} codeword sai ở vị trí
          chưa biết. Lưu ý: một vết bẩn nhỏ có thể chạm vào nhiều codeword cùng lúc.
        </p>
      </div>
    </div>
  );
}

export default function DamageLab() {
  const [ecc, setEcc] = useState<Ecc>("H");
  const [content, setContent] = useState("https://vi.wikipedia.org/wiki/Mã_QR");
  const qr = useMemo(() => encodeText(content || " ", ecc), [content, ecc]);
  return (
    <div className="card p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="min-w-[220px] flex-1">
          <span className="text-sm text-muted">Nội dung</span>
          <input
            value={content}
            maxLength={100}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-2.5 outline-none focus:border-mint/70"
          />
        </label>
        <div>
          <span className="text-sm text-muted">Mức sửa lỗi</span>
          <div className="mt-1 flex gap-1">
            {ECC_LEVELS.map((e) => (
              <button
                key={e}
                onClick={() => setEcc(e)}
                title={`~${ECC_INFO[e].percent}%`}
                className={`mono rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  ecc === e ? "border-mint bg-mint text-bg" : "border-line-strong hover:bg-panel-2"
                }`}
              >
                {e} · {ECC_INFO[e].percent}%
              </button>
            ))}
          </div>
        </div>
      </div>
      {qr ? <DamageBoard key={`${content}|${ecc}`} qr={qr} ecc={ecc} /> : <p className="text-red">Nội dung quá dài.</p>}
      <p className="mt-6 text-sm text-dim">
        <ArrowRight size={14} className="mr-1.5 inline-block align-text-bottom" aria-hidden />Kéo chuột (hoặc ngón tay) trên mã để làm bẩn. Thử tô vào một mẫu định vị, hoặc kéo thanh “Logo” lên dần với mức L
        và H để so sánh!
      </p>
    </div>
  );
}
