import { Check, X } from "lucide-react";
import { bitsNeeded, type Plan } from "@/lib/qr/encoder";
import { charCountBits, dataBitLength, dataCodewordCount, ECC_INFO, ECC_LEVELS, sizeOf, type Ecc } from "@/lib/qr/tables";
import { Panel } from "./shared";

export default function StepVersion({ plan, setEcc }: { plan: Plan; setEcc: (e: Ecc) => void }) {
  const a = plan.analysis;
  const v = plan.version;
  const cc = charCountBits(a.mode, v);
  const dataBits = dataBitLength(a.mode, plan.count);
  const total = bitsNeeded(a, v, plan.eci);
  const last = Math.min(40, Math.max(v + 2, 5));
  const rows = Array.from({ length: last }, (_, i) => {
    const ver = i + 1;
    return { ver, cap: dataCodewordCount(ver, plan.ecc) * 8, need: bitsNeeded(a, ver, plan.eci) };
  });
  const maxCap = Math.max(...rows.map((r) => r.cap));
  const size = sizeOf(v);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ECC_LEVELS.map((e) => (
          <button
            key={e}
            onClick={() => setEcc(e)}
            className={`rounded-2xl border p-3 text-left transition ${
              plan.ecc === e ? "border-mint bg-mint/[0.08]" : "border-line-strong hover:bg-panel-2"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className={`mono text-2xl font-extrabold ${plan.ecc === e ? "text-mint" : ""}`}>{e}</span>
              <span className="text-xs text-dim">~{ECC_INFO[e].percent}%</span>
            </div>
            <div className="mt-1 text-xs leading-snug text-muted">{ECC_INFO[e].use}</div>
          </button>
        ))}
      </div>

      <Panel title="Cần bao nhiêu bit?">
        <div className="mono flex flex-wrap items-center gap-2 text-sm">
          {plan.eci && (
            <>
              <span className="rounded-md bg-pink/20 px-2 py-1 text-pink">12 ECI</span>+
            </>
          )}
          <span className="rounded-md bg-orange/20 px-2 py-1 text-orange">4 chế độ</span>+
          <span className="rounded-md bg-amber/20 px-2 py-1 text-amber">{cc} đếm ký tự</span>+
          <span className="rounded-md bg-mint/20 px-2 py-1 text-mint">{dataBits} dữ liệu</span>=
          <span className="rounded-md bg-ink px-2 py-1 font-bold text-bg">{total} bit</span>
        </div>
        <p className="mt-2 text-xs text-dim">
          Độ dài trường đếm ký tự phụ thuộc phiên bản (1–9, 10–26, 27–40), nên số bit cần có thể nhích lên ở phiên bản lớn.
        </p>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={`Dung lượng dữ liệu từng phiên bản ở mức ${plan.ecc}`}>
          <div className="space-y-1.5">
            {rows.map((r) => {
              const fits = r.need <= r.cap;
              const chosen = r.ver === v;
              return (
                <div key={r.ver} className="flex items-center gap-2 text-xs">
                  <span className={`mono w-8 font-semibold ${chosen ? "text-mint" : "text-muted"}`}>V{r.ver}</span>
                  <div className="relative h-5 flex-1 rounded bg-panel-2">
                    <div
                      className={`absolute inset-y-0 left-0 rounded transition-all duration-700 ${
                        chosen ? "bg-mint/70" : fits ? "bg-cyan/30" : "bg-red/40"
                      }`}
                      style={{ width: `${(r.cap / maxCap) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-[-3px] w-0.5 bg-ink"
                      style={{ left: `${Math.min(100, (r.need / maxCap) * 100)}%` }}
                      title="số bit cần"
                    />
                  </div>
                  <span className="mono w-16 text-right text-dim">{r.cap} bit</span>
                  <span className="w-20 text-right">
                    {chosen ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-mint">
                        <Check size={12} aria-hidden />
                        chọn
                      </span>
                    ) : fits ? (
                      <span className="text-dim">dư thừa</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red">
                        <X size={12} aria-hidden />
                        thiếu
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-dim">Vạch trắng = số bit cần. Chọn phiên bản nhỏ nhất đủ chứa dữ liệu.</p>
        </Panel>

        <Panel title="Kích thước lưới">
          <div className="mono text-center text-lg">
            4 × <span className="text-mint">{v}</span> + 17 = <b>{size}</b>
          </div>
          <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-3 w-full max-w-[220px] rounded-lg bg-paper" aria-hidden>
            <defs>
              <pattern id="grid-cell" width="1" height="1" patternUnits="userSpaceOnUse">
                <path d="M1 0H0V1" fill="none" stroke="#c7cce0" strokeWidth="0.08" />
              </pattern>
            </defs>
            <rect width={size} height={size} fill="url(#grid-cell)" />
          </svg>
          <div className="mt-3 text-center text-sm text-muted">
            Lưới trống <b className="text-ink">{size}×{size}</b> = {(size * size).toLocaleString("vi-VN")} module
          </div>
        </Panel>
      </div>
    </div>
  );
}
