"use client";

import { useState } from "react";
import { ArrowDown, Info } from "lucide-react";
import type { Plan } from "@/lib/qr/encoder";
import { BLOCK_COLORS } from "@/lib/qr/render";
import { Panel } from "./shared";

type Key = { block: number; isEcc: boolean; index: number } | null;

export default function StepInterleave({ plan, onDemo }: { plan: Plan; onDemo: () => void }) {
  const [hover, setHover] = useState<Key>(null);
  const single = plan.blocks.length === 1;
  const same = (b: number, isEcc: boolean, i: number) =>
    hover !== null && hover.block === b && hover.isEcc === isEcc && hover.index === i;

  const chip = (value: number, block: number, isEcc: boolean, index: number, delay?: number, label?: string) => {
    const color = BLOCK_COLORS[block % BLOCK_COLORS.length];
    const hl = same(block, isEcc, index);
    return (
      <span
        key={`${block}-${isEcc}-${index}-${label ?? ""}`}
        onMouseEnter={() => setHover({ block, isEcc, index })}
        className={`mono inline-flex h-8 min-w-9 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-semibold transition ${
          delay !== undefined ? "pop" : ""
        } ${hl ? "scale-125 ring-2 ring-white" : ""}`}
        style={{
          background: isEcc ? "transparent" : `${color}30`,
          color,
          border: `1.5px ${isEcc ? "dashed" : "solid"} ${color}aa`,
          animationDelay: delay !== undefined ? `${delay}ms` : undefined,
        }}
        title={`Khối ${block + 1}, ${isEcc ? "sửa lỗi" : "dữ liệu"} #${index + 1}`}
      >
        {value}
      </span>
    );
  };

  return (
    <div className="space-y-5" onMouseLeave={() => setHover(null)}>
      {single && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan/40 bg-cyan/[0.07] p-4 text-sm">
          <span>
            <Info size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />
            Mã của bạn chỉ có <b>1 khối</b> nên thứ tự giữ nguyên: toàn bộ dữ liệu rồi đến toàn bộ mã sửa lỗi. Muốn thấy
            đan xen thật sự?
          </span>
          <button onClick={onDemo} className="rounded-lg bg-cyan px-3 py-1.5 font-semibold text-bg hover:brightness-110">
            Thử ví dụ nhiều khối
          </button>
        </div>
      )}

      <Panel title="Các khối (viền liền = dữ liệu, viền đứt = sửa lỗi)">
        <div className="thin-scroll max-h-64 space-y-2 overflow-auto pr-1">
          {plan.blocks.map((b) => (
            <div key={b.index} className="flex items-center gap-1">
              <span className="mono mr-1 w-14 shrink-0 text-xs" style={{ color: BLOCK_COLORS[b.index % BLOCK_COLORS.length] }}>
                Khối {b.index + 1}
              </span>
              {b.data.map((v, i) => chip(v, b.index, false, i))}
              <span className="mx-1 h-6 w-px shrink-0 bg-line-strong" />
              {b.ecc.map((v, i) => chip(v, b.index, true, i))}
            </div>
          ))}
        </div>
      </Panel>

      <div className="flex items-center justify-center gap-3 text-sm text-muted">
        <ArrowDown size={24} aria-hidden />
        Lấy lần lượt codeword thứ 1 của mọi khối, rồi thứ 2… (dữ liệu trước, sửa lỗi sau)
      </div>

      <Panel title={`Chuỗi cuối cùng: ${plan.interleaved.length} codeword = ${plan.interleaved.length * 8} bit${plan.remainderBits ? ` + ${plan.remainderBits} bit dư` : ""}`}>
        <div className="thin-scroll flex max-h-64 flex-wrap gap-1 overflow-y-auto pr-1">
          {plan.interleaved.map((c, i) => chip(c.value, c.block, c.isEcc, c.indexInBlock, Math.min(i, 120) * 12, `f${i}`))}
          {plan.remainderBits > 0 && (
            <span className="mono inline-flex h-8 items-center rounded-md border border-line-strong px-2 text-[11px] text-dim">
              +{"0".repeat(plan.remainderBits)}
            </span>
          )}
        </div>
      </Panel>
      {plan.remainderBits > 0 && (
        <p className="text-xs text-dim">
          Bit dư (remainder bits): phiên bản {plan.version} có số module dữ liệu không chia hết cho 8 nên thêm{" "}
          {plan.remainderBits} bit 0 cho kín lưới.
        </p>
      )}
    </div>
  );
}
