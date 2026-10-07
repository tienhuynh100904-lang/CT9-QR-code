import { Check, Globe, Lightbulb, X } from "lucide-react";
import type { Plan } from "@/lib/qr/encoder";
import { ALNUM_CHARS, dataBitLength, MODE_INFO, type Mode } from "@/lib/qr/tables";
import { Panel } from "./shared";

const CLASS_STYLE = {
  numeric: { color: "#5ef2c2", tag: "số" },
  alnum: { color: "#4cc9f0", tag: "A–Z" },
  byte: { color: "#ff8a4c", tag: "byte" },
};

export default function StepAnalyze({ plan, setText }: { plan: Plan; setText: (t: string) => void }) {
  const a = plan.analysis;
  const upper = a.text.toUpperCase();
  const upperIsAlnum = a.mode === "byte" && Array.from(upper).every((ch) => ALNUM_CHARS.includes(ch));

  const modes: { mode: Mode; desc: string; bad?: string }[] = [
    { mode: "numeric", desc: "chỉ 0–9", bad: a.chars.find((c) => !c.numeric)?.ch },
    { mode: "alphanumeric", desc: "45 ký tự: 0–9, A–Z, dấu cách $%*+-./:", bad: a.chars.find((c) => !c.alnum)?.ch },
    { mode: "byte", desc: "mọi byte (UTF-8)" },
  ];

  return (
    <div className="space-y-5">
      <Panel title={`Từng ký tự của bạn (${a.chars.length} ký tự, ${a.bytes.length} byte UTF-8)`}>
        <div className="thin-scroll flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
          {a.chars.map((c, i) => {
            const cls = c.numeric ? "numeric" : c.alnum ? "alnum" : "byte";
            const st = CLASS_STYLE[cls];
            return (
              <div
                key={i}
                className="pop flex min-w-11 flex-col items-center rounded-lg border px-1.5 py-1"
                style={{ borderColor: `${st.color}66`, background: `${st.color}14`, animationDelay: `${Math.min(i, 60) * 18}ms` }}
              >
                <span className="text-lg leading-tight font-bold">{c.ch === " " ? "␣" : c.ch}</span>
                <span className="mono text-[10px]" style={{ color: st.color }}>
                  {st.tag}
                </span>
                {c.bytes.length > 1 && (
                  <span className="mono text-[9px] text-dim">
                    {c.bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-dim">
          {Object.values(CLASS_STYLE).map((s) => (
            <span key={s.tag} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.tag === "số" ? "Chữ số" : s.tag === "A–Z" ? "Thuộc bảng Alphanumeric" : "Chỉ mã hóa được bằng Byte"}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        {modes.map(({ mode, desc, bad }) => {
          const fits = bad === undefined;
          const chosen = plan.analysis.mode === mode;
          const count = mode === "byte" ? a.bytes.length : a.chars.length;
          return (
            <div
              key={mode}
              className={`relative rounded-2xl border p-4 transition ${
                chosen
                  ? "border-mint bg-mint/[0.08] shadow-[0_0_30px_-10px_var(--mint)]"
                  : fits
                    ? "border-line-strong"
                    : "border-line opacity-60"
              }`}
            >
              {chosen && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-bg">
                  ĐƯỢC CHỌN
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="font-bold">{MODE_INFO[mode].name}</span>
                <span className="mono text-xs text-dim">{MODE_INFO[mode].indicator}</span>
              </div>
              <div className="mt-1 text-xs text-dim">{desc}</div>
              <div className="mt-3 text-sm">
                {fits ? (
                  <span className={`inline-flex items-center gap-1.5 ${chosen ? "text-mint" : "text-muted"}`}>
                    <Check size={14} className="shrink-0" aria-hidden />
                    {count} {mode === "byte" ? "byte" : "ký tự"} → <b className="mono">{dataBitLength(mode, count)}</b> bit dữ liệu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red">
                    <X size={14} className="shrink-0" aria-hidden />
                    không chứa được “{bad === " " ? "␣" : bad}”
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Bộ tạo mã chọn chế độ <b className="text-ink">gọn nhất</b> chứa được mọi ký tự. Chế độ càng hẹp thì mỗi ký tự càng
        tốn ít bit: Numeric nén 3 chữ số vào 10 bit, Alphanumeric nén 2 ký tự vào 11 bit, còn Byte dùng 8 bit cho mỗi byte.
        (Bộ tạo mã chuyên nghiệp còn có thể <i>trộn</i> nhiều chế độ trong một mã.)
      </p>

      {upperIsAlnum && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan/40 bg-cyan/[0.07] p-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <Lightbulb size={16} className="shrink-0" aria-hidden />
            Chữ thường không có trong bảng Alphanumeric. Viết HOA toàn bộ sẽ dùng được chế độ gọn hơn!
          </span>
          <button
            onClick={() => setText(upper)}
            className="rounded-lg bg-cyan px-3 py-1.5 font-semibold text-bg transition hover:brightness-110"
          >
            Thử viết HOA
          </button>
        </div>
      )}
      {a.nonAscii && (
        <div className="rounded-2xl border border-pink/40 bg-pink/[0.07] p-4 text-sm text-muted">
          <Globe size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />
          Có ký tự ngoài ASCII (chữ có dấu, emoji…): mỗi ký tự chiếm 2–4 byte UTF-8. Trang này sẽ thêm khai báo{" "}
          <b className="text-ink">ECI 26</b> (= UTF-8) để máy quét hiểu đúng bảng mã.
        </div>
      )}
    </div>
  );
}
