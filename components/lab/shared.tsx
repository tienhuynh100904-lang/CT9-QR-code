import type { ReactNode } from "react";
import type { SegmentKind } from "@/lib/qr/encoder";

export const SEG_STYLE: Record<SegmentKind, { color: string; name: string }> = {
  eci: { color: "#ff6fae", name: "ECI" },
  mode: { color: "#ff8a4c", name: "Chỉ báo chế độ" },
  count: { color: "#ffc857", name: "Đếm ký tự" },
  data: { color: "#5ef2c2", name: "Dữ liệu" },
  terminator: { color: "#8b7bff", name: "Bit kết thúc" },
  bitpad: { color: "#a3acd6", name: "Bit đệm" },
  padbyte: { color: "#6b76a8", name: "Byte đệm" },
};

export const DATA_ALT = "#4cc9f0";

export function segColor(kind: SegmentKind, index: number) {
  return kind === "data" && index % 2 === 1 ? DATA_ALT : SEG_STYLE[kind].color;
}

export const CW_DATA = "#4cc9f0";
export const CW_ECC = "#ff8a4c";

export function Panel({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-bg-soft/70 p-4 sm:p-5 ${className}`}>
      {title && <div className="mb-3 text-sm font-semibold text-muted">{title}</div>}
      {children}
    </div>
  );
}

export function Byte({ value, color, dim = false, title }: { value: number; color: string; dim?: boolean; title?: string }) {
  return (
    <span
      title={title}
      className="mono inline-flex h-8 min-w-9 items-center justify-center rounded-md px-1 text-xs font-semibold transition"
      style={{
        background: dim ? "transparent" : `${color}26`,
        color: dim ? "#6b76a8" : color,
        border: `1px solid ${dim ? "#6b76a855" : `${color}66`}`,
      }}
    >
      {value}
    </span>
  );
}

/** Ký hiệu α mũ, ví dụ α⁷⁴ */
export function Alpha({ exp }: { exp: number | null }) {
  if (exp === null) return <span>0</span>;
  return (
    <span>
      α<sup className="text-[0.7em]">{exp}</sup>
    </span>
  );
}
