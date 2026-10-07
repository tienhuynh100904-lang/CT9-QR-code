"use client";

import { useEffect, useRef, useState } from "react";

export interface GridInfo {
  /** Kích thước một module (px CSS) */
  cell: number;
  size: number;
  quiet: number;
  width: number;
}

export type GridDraw = (ctx: CanvasRenderingContext2D, g: GridInfo) => void;

/** Tọa độ pixel nguyên của một module để các ô khít nhau, không hở viền */
export function cellBox(g: GridInfo, r: number, c: number): [number, number, number, number] {
  const x = Math.round((c + g.quiet) * g.cell);
  const y = Math.round((r + g.quiet) * g.cell);
  return [x, y, Math.round((c + g.quiet + 1) * g.cell) - x, Math.round((r + g.quiet + 1) * g.cell) - y];
}

export function fillCell(ctx: CanvasRenderingContext2D, g: GridInfo, i: number, color: string, inset = 0) {
  const [x, y, w, h] = cellBox(g, Math.floor(i / g.size), i % g.size);
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
}

interface Props {
  size: number;
  quiet?: number;
  draw: GridDraw;
  label: string;
  background?: string;
  className?: string;
  onHover?: (index: number | null) => void;
  onPaint?: (index: number) => void;
  onPaintEnd?: () => void;
}

export default function GridCanvas({
  size,
  quiet = 0,
  draw,
  label,
  background = "#f7f8fc",
  className = "",
  onHover,
  onPaint,
  onPaintEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const painting = useRef(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(width * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, width);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, width);
    draw(ctx, { cell: width / (size + quiet * 2), size, quiet, width });
  }, [draw, width, size, quiet, background]);

  const indexAt = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cell = rect.width / (size + quiet * 2);
    const c = Math.floor((e.clientX - rect.left) / cell) - quiet;
    const r = Math.floor((e.clientY - rect.top) / cell) - quiet;
    return r >= 0 && c >= 0 && r < size && c < size ? r * size + c : null;
  };

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`block aspect-square w-full touch-none select-none ${className}`}
      onPointerMove={(e) => {
        const i = indexAt(e);
        onHover?.(i);
        if (painting.current && i !== null) onPaint?.(i);
      }}
      onPointerLeave={() => onHover?.(null)}
      onPointerDown={(e) => {
        if (!onPaint) return;
        painting.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        const i = indexAt(e);
        if (i !== null) onPaint(i);
      }}
      onPointerUp={() => {
        if (painting.current) {
          painting.current = false;
          onPaintEnd?.();
        }
      }}
      onPointerCancel={() => {
        painting.current = false;
      }}
    />
  );
}
