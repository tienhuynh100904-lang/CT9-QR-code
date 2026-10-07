"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Ecc } from "@/lib/qr/tables";

interface LabState {
  text: string;
  setText: (t: string) => void;
  ecc: Ecc;
  setEcc: (e: Ecc) => void;
  /** Đưa một chuỗi vào phòng thí nghiệm và cuộn tới đó */
  openInLab: (t: string) => void;
}

const Ctx = createContext<LabState | null>(null);

export const LAB_MAX = 120;

export function LabProvider({ children }: { children: ReactNode }) {
  const [text, setTextRaw] = useState("HELLO WORLD");
  const [ecc, setEcc] = useState<Ecc>("Q");
  const setText = useCallback((t: string) => setTextRaw(Array.from(t).slice(0, LAB_MAX).join("")), []);
  const openInLab = useCallback(
    (t: string) => {
      setText(t);
      document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" });
    },
    [setText],
  );
  const value = useMemo(() => ({ text, setText, ecc, setEcc, openInLab }), [text, setText, ecc, openInLab]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLab() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLab must be used inside LabProvider");
  return v;
}
