"use client";

import { useEffect, useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { CHAPTERS } from "@/lib/chapters";

function Logo() {
  // Biểu tượng nhỏ: 3 mẫu định vị
  return (
    <svg viewBox="0 0 10 10" className="h-7 w-7" aria-hidden>
      <rect width="10" height="10" rx="2" fill="#f7f8fc" />
      {[
        [1, 1],
        [6, 1],
        [1, 6],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <rect x={x} y={y} width="3" height="3" fill="#0e1430" />
          <rect x={x + 0.75} y={y + 0.75} width="1.5" height="1.5" fill="#f7f8fc" />
          <rect x={x + 1.1} y={y + 1.1} width="0.8" height="0.8" fill="#0e1430" />
        </g>
      ))}
      <rect x="6.5" y="6.5" width="1" height="1" fill="#5ef2c2" />
      <rect x="7.8" y="7.8" width="1" height="1" fill="#0e1430" />
      <rect x="6.5" y="7.8" width="1" height="1" fill="#0e1430" />
    </svg>
  );
}

export default function Nav() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight));
      setScrolled(h.scrollTop > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });

    // Đèn rọi theo chuột cho các thẻ .spot
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".spot") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = CHAPTERS.find((c) => c.id === active);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex shrink-0 items-center gap-2.5 font-bold">
            <Logo />
            <span className="hidden sm:inline">Giải mã QR</span>
          </a>
          <div className="min-w-0 flex-1">
            {current && scrolled && (
              <div key={current.id} className="pop truncate text-sm text-muted">
                <span className="mono mr-2 text-mint">{String(current.n).padStart(2, "0")}</span>
                {current.title}
              </div>
            )}
          </div>
          <a
            href="#lab"
            className="hidden items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110 sm:flex"
          >
            <FlaskConical size={16} aria-hidden />
            Tự tạo mã QR
          </a>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-medium transition hover:bg-panel-2"
            aria-haspopup="dialog"
          >
            <span aria-hidden className="grid grid-cols-2 gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-[2px] bg-current" />
              ))}
            </span>
            Mục lục
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
          <div
            className="h-full origin-left bg-gradient-to-r from-mint via-cyan to-violet"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mục lục"
          className="fixed inset-0 z-[60] overflow-y-auto bg-bg/95 backdrop-blur-xl"
          onClick={() => setOpen(false)}
        >
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Mục lục</h2>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm hover:bg-panel-2"
              >
                Đóng
                <X size={14} aria-hidden />
              </button>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CHAPTERS.map((c, i) => (
                <li key={c.id} className="pop" style={{ animationDelay: `${i * 30}ms` }}>
                  <a
                    href={`#${c.id}`}
                    onClick={() => setOpen(false)}
                    className={`card lift flex items-center gap-4 p-4 ${active === c.id ? "border-mint/60" : ""}`}
                  >
                    <c.icon size={24} aria-hidden />
                    <span>
                      <span className="mono block text-xs text-mint">Chương {c.n}</span>
                      <span className="font-semibold">{c.title}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
