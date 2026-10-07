"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, PartyPopper, Play, SkipBack, SkipForward } from "lucide-react";
import type { Plan } from "@/lib/qr/encoder";
import { LOG, rsEncode } from "@/lib/qr/gf";
import { Alpha, Byte, CW_DATA, CW_ECC, Panel } from "./shared";

function Poly({ coeffs }: { coeffs: number[] }) {
  const deg = coeffs.length - 1;
  return (
    <span className="mono text-sm leading-loose">
      {coeffs.map((c, i) => {
        const p = deg - i;
        return (
          <span key={i} className="whitespace-nowrap">
            {i > 0 && <span className="text-dim"> + </span>}
            {i > 0 && (
              <span className="text-violet">
                <Alpha exp={LOG[c]} />
              </span>
            )}
            {p > 0 && "x"}
            {p > 1 && <sup className="text-[0.7em]">{p}</sup>}
          </span>
        );
      })}
    </span>
  );
}

export default function StepRS({ plan }: { plan: Plan }) {
  const block = plan.blocks[0];
  const e = plan.eccPerBlock;
  const k = block.data.length;
  const { steps, gen } = useMemo(() => rsEncode(block.data, e, true), [block.data, e]);
  const [s, setS] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Trạng thái mảng hệ số sau s bước chia
  const states = useMemo(() => {
    const out: number[][] = [];
    let cur = [...block.data, ...new Array<number>(e).fill(0)];
    out.push(cur);
    for (const st of steps) {
      cur = [...cur];
      for (let j = 0; j <= e; j++) cur[st.index + j] = st.after[j];
      out.push(cur);
    }
    return out;
  }, [block.data, e, steps]);

  const isPlaying = playing && s < k;
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setS((x) => Math.min(k, x + 1)), 700);
    return () => clearInterval(id);
  }, [isPlaying, k]);

  const cur = states[s];
  const step = s < k ? steps[s] : null;
  const done = s >= k;

  return (
    <div className="space-y-5">
      <Panel title="Cấu trúc khối">
        <p className="text-sm text-muted">
          Phiên bản {plan.version}-{plan.ecc} chia dữ liệu thành <b className="text-ink">{plan.blocks.length}</b> khối, mỗi
          khối có <b className="text-ink">{e}</b> codeword sửa lỗi → sửa được tối đa{" "}
          <b className="text-ink">{Math.floor(e / 2)}</b> codeword sai mỗi khối.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {plan.blocks.map((b) => (
            <span key={b.index} className="mono rounded-md bg-panel-2 px-2 py-1">
              Khối {b.index + 1}: <span style={{ color: CW_DATA }}>{b.data.length} dữ liệu</span> +{" "}
              <span style={{ color: CW_ECC }}>{b.ecc.length} sửa lỗi</span>
            </span>
          ))}
        </div>
      </Panel>

      <Panel
        title={
          <>
            Đa thức sinh bậc {e}: g(x) = (x − α<sup>0</sup>)(x − α<sup>1</sup>)…(x − α<sup>{e - 1}</sup>) =
          </>
        }
      >
        <div className="thin-scroll overflow-x-auto pb-1">
          <Poly coeffs={gen} />
        </div>
      </Panel>

      <Panel
        title={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Phép chia đa thức của khối 1 — từng bước</span>
            <div className="flex items-center gap-1">
              <button onClick={() => { setS(0); setPlaying(false); }} className="rounded-md border border-line-strong px-2 py-1 hover:bg-panel-2" aria-label="Về đầu"><SkipBack size={14} aria-hidden /></button>
              <button onClick={() => { setS((x) => Math.max(0, x - 1)); setPlaying(false); }} className="rounded-md border border-line-strong px-2 py-1 hover:bg-panel-2" aria-label="Lùi"><ChevronLeft size={14} aria-hidden /></button>
              <button
                onClick={() => {
                  if (done) setS(0);
                  setPlaying(!isPlaying);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-mint px-3 py-1 font-semibold text-bg"
                aria-label={isPlaying ? "Dừng" : "Chạy"}
              >
                {isPlaying ? (
                  <Pause size={14} aria-hidden />
                ) : (
                  <>
                    <Play size={14} aria-hidden />
                    Chạy
                  </>
                )}
              </button>
              <button onClick={() => { setS((x) => Math.min(k, x + 1)); setPlaying(false); }} className="rounded-md border border-line-strong px-2 py-1 hover:bg-panel-2" aria-label="Tiến"><ChevronRight size={14} aria-hidden /></button>
              <button onClick={() => { setS(k); setPlaying(false); }} className="rounded-md border border-line-strong px-2 py-1 hover:bg-panel-2" aria-label="Về cuối"><SkipForward size={14} aria-hidden /></button>
              <span className="mono ml-2 text-xs text-dim">
                {s}/{k}
              </span>
            </div>
          </div>
        }
      >
        <div className="thin-scroll overflow-x-auto pb-2">
          <div className="inline-block min-w-full space-y-1.5">
            <div className="flex gap-1">
              {cur.map((v, i) => {
                const gone = i < s;
                const inWin = step && i >= step.index && i <= step.index + e;
                const isEccPos = i >= k;
                return (
                  <span
                    key={i}
                    className={`mono flex h-8 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold transition-all duration-300 ${
                      gone ? "opacity-20" : ""
                    } ${inWin ? "ring-2 ring-violet" : ""}`}
                    style={{
                      background: done && isEccPos ? `${CW_ECC}33` : isEccPos ? "#ffffff0d" : `${CW_DATA}22`,
                      color: done && isEccPos ? CW_ECC : isEccPos ? "#a3acd6" : CW_DATA,
                    }}
                  >
                    {v}
                  </span>
                );
              })}
            </div>
            {step && (
              <>
                <div className="flex gap-1">
                  {cur.map((_, i) => {
                    const j = i - step.index;
                    return (
                      <span key={i} className="mono flex h-8 w-9 shrink-0 items-center justify-center rounded-md text-[11px] text-violet">
                        {j >= 0 && j <= e ? (j === 0 ? "⊕" + step.product[j] : step.product[j]) : ""}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-1 border-t border-line pt-1.5">
                  {cur.map((_, i) => {
                    const j = i - step.index;
                    return (
                      <span
                        key={i}
                        className={`mono flex h-8 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
                          j >= 0 && j <= e ? "bg-white/5 text-ink" : ""
                        }`}
                      >
                        {j >= 0 && j <= e ? step.after[j] : ""}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <div key={s} className="pop mt-3 rounded-xl bg-panel/80 px-4 py-3 text-sm leading-relaxed">
          {step ? (
            step.lead === 0 ? (
              <span className="text-muted">
                Bước {s + 1}: hệ số dẫn đầu bằng 0 → không cần trừ, chỉ dịch sang hệ số kế tiếp.
              </span>
            ) : (
              <span className="text-muted">
                Bước {s + 1}: hệ số dẫn đầu = <b className="mono text-ink">{step.lead}</b> ={" "}
                <b className="text-violet">
                  <Alpha exp={step.leadExp} />
                </b>
                . Nhân g(x) với <Alpha exp={step.leadExp} /> (cộng số mũ, lấy mod 255) rồi <b className="text-ink">XOR</b>{" "}
                vào {e + 1} hệ số đang xét → hệ số đầu thành 0 và bị loại.
              </span>
            )
          ) : (
            <span>
              <PartyPopper size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />
              Xong {k} bước! {e} hệ số còn lại chính là <b style={{ color: CW_ECC }}>{e} codeword sửa lỗi</b> của khối 1.
            </span>
          )}
        </div>
      </Panel>

      <Panel title="Kết quả: mỗi khối = dữ liệu + sửa lỗi">
        <div className="thin-scroll max-h-56 space-y-2 overflow-y-auto pr-1">
          {plan.blocks.map((b) => (
            <div key={b.index} className="flex flex-wrap items-center gap-1">
              <span className="mono mr-1 w-14 text-xs text-dim">Khối {b.index + 1}</span>
              {b.data.map((v, i) => (
                <Byte key={`d${i}`} value={v} color={CW_DATA} />
              ))}
              {b.ecc.map((v, i) => (
                <Byte key={`e${i}`} value={v} color={CW_ECC} />
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
