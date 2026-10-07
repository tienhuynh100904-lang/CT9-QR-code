import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import Reveal from "./Reveal";

export function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} data-chapter={id} className={`relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({ n, title, kicker, lead }: { n: number; title: string; kicker: string; lead?: ReactNode }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="mono flex h-10 min-w-10 items-center justify-center rounded-xl border border-line-strong bg-panel px-2 text-sm font-semibold text-mint">
          {String(n).padStart(2, "0")}
        </span>
        <span className="mono text-xs tracking-[0.2em] text-dim uppercase">{kicker}</span>
      </div>
      <h2 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl md:text-5xl">{title}</h2>
      {lead && <p className="mt-5 text-lg leading-relaxed text-muted">{lead}</p>}
    </Reveal>
  );
}

export function SubHeading({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <h3 className="mb-5 flex items-baseline gap-3 text-xl font-bold sm:text-2xl">
      {n && <span className="mono text-sm font-medium text-mint">{n}</span>}
      <span>{children}</span>
    </h3>
  );
}

export function Callout({ tone = "tip", title, children }: { tone?: "tip" | "warn" | "info"; title: string; children: ReactNode }) {
  const styles = {
    tip: { border: "border-mint/30", bg: "bg-mint/[0.06]", icon: Lightbulb, color: "text-mint" },
    warn: { border: "border-amber/30", bg: "bg-amber/[0.06]", icon: TriangleAlert, color: "text-amber" },
    info: { border: "border-cyan/30", bg: "bg-cyan/[0.06]", icon: Info, color: "text-cyan" },
  }[tone];
  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-5`}>
      <div className={`mb-1.5 flex items-center gap-2 font-semibold ${styles.color}`}>
        <styles.icon size={18} aria-hidden />
        {title}
      </div>
      <div className="leading-relaxed text-muted">{children}</div>
    </div>
  );
}
