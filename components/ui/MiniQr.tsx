import { INK } from "@/lib/qr/render";

/** Vẽ nhanh một mã QR bằng SVG (kèm vùng trống 2 module) */
export default function MiniQr({
  modules,
  size,
  dark = INK,
  light = "#f7f8fc",
  quiet = 2,
  className = "w-full rounded-lg",
}: {
  modules: Uint8Array;
  size: number;
  dark?: string;
  light?: string;
  quiet?: number;
  className?: string;
}) {
  let d = "";
  for (let i = 0; i < size * size; i++) if (modules[i]) d += `M${i % size},${Math.floor(i / size)}h1v1h-1z`;
  return (
    <svg
      viewBox={`${-quiet} ${-quiet} ${size + quiet * 2} ${size + quiet * 2}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Mã QR"
    >
      <rect x={-quiet} y={-quiet} width={size + quiet * 2} height={size + quiet * 2} fill={light} />
      <path d={d} fill={dark} />
    </svg>
  );
}
