"use client";

import { useEffect, useRef } from "react";

const fmt = (n: number) => n.toLocaleString("vi-VN");

/** Số đếm tăng dần khi cuộn tới, định dạng kiểu Việt Nam (7.089) */
export default function Counter({ to, duration = 1400, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    el.textContent = fmt(0) + suffix;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - t, 3)))) + suffix;
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(to) + suffix;
    };
  }, [to, duration, suffix]);
  return (
    <span ref={ref} className="tabular-nums">
      {`${fmt(to)}${suffix}`}
    </span>
  );
}
