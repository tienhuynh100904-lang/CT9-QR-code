"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Drama,
  Flag,
  Hash,
  type LucideIcon,
  PencilLine,
  Puzzle,
  Route,
  RotateCw,
  Ruler,
  Search,
  Shield,
  Shuffle,
} from "lucide-react";
import { makePlan } from "@/lib/qr/encoder";
import { buildQr } from "@/lib/qr/matrix";
import { MODE_INFO, sizeOf } from "@/lib/qr/tables";
import { ECC_LEVELS } from "@/lib/qr/tables";
import { confetti } from "@/lib/confetti";
import { LAB_MAX, useLab } from "../LabContext";
import StepAnalyze from "./StepAnalyze";
import StepVersion from "./StepVersion";
import StepEncode from "./StepEncode";
import StepRS from "./StepRS";
import StepInterleave from "./StepInterleave";
import StepFunction from "./StepFunction";
import StepPlace from "./StepPlace";
import StepMask from "./StepMask";
import StepFinal from "./StepFinal";

const STEPS: { short: string; icon: LucideIcon; title: string; desc: string }[] = [
  { short: "Phân tích", icon: Search, title: "Phân tích dữ liệu", desc: "Xác định loại ký tự để chọn chế độ mã hóa tối ưu." },
  {
    short: "Phiên bản",
    icon: Ruler,
    title: "Chọn mức sửa lỗi và phiên bản",
    desc: "Chọn phiên bản nhỏ nhất đủ chứa dữ liệu ở mức sửa lỗi đã chọn.",
  },
  {
    short: "Mã hóa",
    icon: Hash,
    title: "Mã hóa dữ liệu",
    desc: "Ghép chỉ báo chế độ, trường đếm ký tự, dữ liệu, bit kết thúc và byte đệm thành chuỗi bit.",
  },
  { short: "Sửa lỗi", icon: Shield, title: "Tạo mã sửa lỗi", desc: "Chia thành khối, tính codeword Reed–Solomon cho từng khối." },
  {
    short: "Đan xen",
    icon: Shuffle,
    title: "Đan xen",
    desc: "Trộn codeword dữ liệu và sửa lỗi của các khối, thêm bit dư nếu cần.",
  },
  {
    short: "Mẫu chức năng",
    icon: Puzzle,
    title: "Đặt các mẫu chức năng",
    desc: "Mẫu định vị, phân tách, thời gian, căn chỉnh, module tối.",
  },
  {
    short: "Đặt dữ liệu",
    icon: Route,
    title: "Đặt dữ liệu",
    desc: "Điền bit theo đường zíc-zắc cột đôi từ góc dưới-phải, bỏ qua các vùng chức năng.",
  },
  { short: "Mặt nạ", icon: Drama, title: "Áp mặt nạ", desc: "Thử 8 mặt nạ, chọn mặt nạ có điểm phạt thấp nhất." },
  {
    short: "Hoàn thiện",
    icon: Flag,
    title: "Ghi thông tin định dạng và phiên bản",
    desc: "Hoàn thiện mã, thêm vùng trống 4 module.",
  },
];

const PRESETS: { label: string; text: string; ecc?: "L" | "M" | "Q" | "H" }[] = [
  { label: "HELLO WORLD", text: "HELLO WORLD", ecc: "Q" },
  { label: "Chỉ số", text: "0123456789012345" },
  { label: "Tiếng Việt", text: "Xin chào Việt Nam!" },
  { label: "Đường dẫn", text: "https://vi.wikipedia.org/wiki/Mã_QR" },
  { label: "Nhiều khối", text: "Mã QR được phát minh năm 1994 bởi Masahiro Hara tại Denso Wave.", ecc: "H" },
];

export default function QrLab() {
  const { text, setText, ecc, setEcc } = useLab();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [maskSel, setMaskSel] = useState<{ key: string; mask: number } | null>(null);
  const [celebrated, setCelebrated] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const plan = useMemo(() => (text ? makePlan(text, ecc) : null), [text, ecc]);
  const build = useMemo(() => (plan ? buildQr(plan) : null), [plan]);
  const key = `${text}|${ecc}`;
  const mask = build ? (maskSel?.key === key ? maskSel.mask : build.best) : 0;

  const go = (i: number, scroll = false) => {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    setStep(next);
    setVisited((v) => new Set(v).add(next));
    if (next === STEPS.length - 1 && celebrated !== key) {
      setCelebrated(key);
      setTimeout(() => confetti({ y: window.innerHeight * 0.35 }), 250);
    }
    if (scroll && topRef.current && topRef.current.getBoundingClientRect().top < 0) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const loadDemo = () => {
    setText(PRESETS[4].text);
    setEcc("H");
  };

  const s = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div id="lab" className="card scroll-mt-20">
      {/* Đầu vào */}
      <div className="rounded-t-[20px] border-b border-line bg-panel-2/40 p-5 sm:p-7">
        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-[240px] flex-[3]">
            <span className="flex justify-between text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <PencilLine size={16} aria-hidden />
                Nhập nội dung muốn mã hóa
              </span>
              <span className="mono text-xs text-dim">
                {Array.from(text).length}/{LAB_MAX}
              </span>
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-3 text-lg outline-none transition focus:border-mint/70 focus:ring-4 focus:ring-mint/10"
              placeholder="Gõ chữ, số, đường dẫn…"
              aria-label="Nội dung mã hóa"
            />
          </label>
          <div>
            <span className="text-sm text-muted">Mức sửa lỗi</span>
            <div className="mt-1.5 flex gap-1">
              {ECC_LEVELS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEcc(e)}
                  className={`mono h-12 w-12 rounded-xl border text-lg font-bold transition ${
                    ecc === e ? "border-mint bg-mint text-bg" : "border-line-strong hover:bg-panel-2"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-dim">Thử nhanh:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setText(p.text);
                if (p.ecc) setEcc(p.ecc);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-mint/50 hover:text-mint"
            >
              {p.label}
            </button>
          ))}
        </div>
        {plan && build && (
          <div className="mono mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-bg-soft px-2.5 py-1">
              Chế độ <b className="text-mint">{MODE_INFO[plan.analysis.mode].name}</b>
            </span>
            <span className="rounded-md bg-bg-soft px-2.5 py-1">
              Phiên bản <b className="text-mint">{plan.version}</b> ({sizeOf(plan.version)}×{sizeOf(plan.version)})
            </span>
            <span className="rounded-md bg-bg-soft px-2.5 py-1">
              <b className="text-cyan">{plan.dataCodewords.length}</b> codeword dữ liệu +{" "}
              <b className="text-orange">{plan.blocks.length * plan.eccPerBlock}</b> sửa lỗi
            </span>
            <span className="rounded-md bg-bg-soft px-2.5 py-1">
              Mặt nạ <b className="text-pink">{mask}</b>
            </span>
          </div>
        )}
      </div>

      {/* Thanh bước */}
      <div ref={topRef} className="scroll-mt-20 border-b border-line px-3 py-4 sm:px-6">
        <div className="thin-scroll -mx-3 -my-5 overflow-x-auto px-3 py-5">
          <ol className="relative flex min-w-max gap-1 sm:min-w-0 sm:justify-between">
            <div className="absolute top-[18px] right-6 left-6 h-0.5 bg-line-strong" aria-hidden />
            <div
              className="absolute top-[18px] left-6 h-0.5 bg-gradient-to-r from-mint to-cyan transition-all duration-500"
              style={{ width: `calc((100% - 3rem) * ${progress / 100})` }}
              aria-hidden
            />
            {STEPS.map((st, i) => (
              <li key={st.short} className="relative z-10">
                <button
                  onClick={() => go(i)}
                  className="group flex w-[76px] flex-col items-center gap-1.5 sm:w-auto"
                  aria-current={i === step ? "step" : undefined}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                      i === step
                        ? "scale-110 border-mint bg-mint text-bg shadow-[0_0_20px_-2px_var(--mint)]"
                        : visited.has(i)
                          ? "border-mint/60 bg-panel-2 text-mint"
                          : "border-line-strong bg-panel text-dim group-hover:text-ink"
                    }`}
                  >
                    {visited.has(i) && i !== step ? <Check size={16} aria-hidden /> : i + 1}
                  </span>
                  <span className={`text-center text-[11px] leading-tight ${i === step ? "font-semibold text-ink" : "text-dim"}`}>
                    {st.short}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Nội dung bước */}
      <div className="p-5 sm:p-7">
        {!plan || !build ? (
          <div className="flex items-center justify-center gap-2 py-16 text-center text-muted">
            <PencilLine size={18} aria-hidden />
            Hãy nhập nội dung ở trên để bắt đầu.
          </div>
        ) : (
          <>
            <div key={`h${step}`} className="pop mb-6 flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-panel-2 text-2xl">
                <s.icon size={24} aria-hidden />
              </span>
              <div>
                <div className="mono text-xs tracking-widest text-mint uppercase">
                  Bước {step + 1} / {STEPS.length}
                </div>
                <h4 className="text-xl font-bold sm:text-2xl">{s.title}</h4>
                <p className="mt-1 text-muted">{s.desc}</p>
              </div>
            </div>
            <div key={`${key}#${step}`}>
              {step === 0 && <StepAnalyze plan={plan} setText={setText} />}
              {step === 1 && <StepVersion plan={plan} setEcc={setEcc} />}
              {step === 2 && <StepEncode plan={plan} />}
              {step === 3 && <StepRS plan={plan} />}
              {step === 4 && <StepInterleave plan={plan} onDemo={loadDemo} />}
              {step === 5 && <StepFunction build={build} />}
              {step === 6 && <StepPlace build={build} />}
              {step === 7 && <StepMask build={build} mask={mask} setMask={(m) => setMaskSel({ key, mask: m })} />}
              {step === 8 && <StepFinal build={build} mask={mask} />}
            </div>
          </>
        )}
      </div>

      {/* Điều hướng */}
      <div className="flex items-center justify-between gap-3 rounded-b-[20px] border-t border-line bg-panel-2/30 px-5 py-4 sm:px-7">
        <button
          onClick={() => go(step - 1, true)}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-panel-2 disabled:opacity-30"
        >
          <ArrowLeft size={16} aria-hidden />
          Bước trước
        </button>
        <span className="mono hidden text-xs text-dim sm:inline">
          {step + 1} / {STEPS.length}
        </span>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => go(step + 1, true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
          >
            Bước tiếp: {STEPS[step + 1].short}
            <ArrowRight size={16} aria-hidden />
          </button>
        ) : (
          <button
            onClick={() => go(0, true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-mint to-cyan px-5 py-2.5 text-sm font-semibold text-bg"
          >
            <RotateCw size={16} aria-hidden />
            Làm lại với nội dung khác
          </button>
        )}
      </div>
    </div>
  );
}
