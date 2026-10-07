"use client";

import { useMemo, useState } from "react";
import { makePlan } from "@/lib/qr/encoder";
import { encodeText } from "@/lib/qr/matrix";
import { ALNUM_CHARS, MODE_INFO } from "@/lib/qr/tables";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Callout, Section, SectionHeading, SubHeading } from "../ui/Section";

const MODES = [
  { name: "Numeric", bits: "0001", chars: "0–9", pack: "3 chữ số → 10 bit", color: "#5ef2c2" },
  { name: "Alphanumeric", bits: "0010", chars: "45 ký tự: 0–9, A–Z (in hoa), dấu cách, $ % * + - . / :", pack: "2 ký tự → 11 bit", color: "#4cc9f0" },
  { name: "Byte", bits: "0100", chars: "Bất kỳ byte nào (mặc định ISO-8859-1, thực tế phổ biến UTF-8)", pack: "1 ký tự → 8 bit", color: "#ff8a4c" },
  { name: "Kanji", bits: "1000", chars: "Ký tự Shift JIS (tiếng Nhật)", pack: "1 ký tự → 13 bit", color: "#ff6fae" },
  { name: "ECI", bits: "0111", chars: "Khai báo bảng mã (ví dụ UTF-8 = ECI 26)", pack: "Chỉ dẫn, không chứa dữ liệu", color: "#8b7bff" },
  { name: "Structured Append", bits: "0011", chars: "Chia dữ liệu thành tối đa 16 mã QR liên kết", pack: "—", color: "#ffc857" },
  { name: "FNC1", bits: "0101 / 1001", chars: "Dữ liệu theo chuẩn GS1 / ứng dụng riêng", pack: "—", color: "#a3e635" },
  { name: "Kết thúc", bits: "0000", chars: "Đánh dấu hết dữ liệu", pack: "—", color: "#6b76a8" },
];

function Bits({ bits, color }: { bits: string; color: string }) {
  return (
    <span className="mono inline-flex gap-0.5">
      {Array.from(bits).map((b, i) =>
        b === " " || b === "/" ? (
          <span key={i} className="px-0.5 text-dim">
            {b}
          </span>
        ) : (
          <span
            key={i}
            className="flex h-6 w-5 items-center justify-center rounded text-xs font-bold"
            style={{ background: b === "1" ? color : "transparent", color: b === "1" ? "#070b1a" : color, border: `1px solid ${color}` }}
          >
            {b}
          </span>
        ),
      )}
    </span>
  );
}

function HelloWorld() {
  const plan = useMemo(() => makePlan("HELLO WORLD", "Q")!, []);
  const pairs = plan.segments.filter((s) => s.kind === "data");
  const [sel, setSel] = useState(0);
  const p = pairs[sel];
  const chars = p.label.split("");
  return (
    <div className="card spot p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Mã hóa</span>
        <span className="mono rounded-lg bg-paper px-3 py-1 font-bold text-paper-ink">HELLO WORLD</span>
        <span className="text-sm text-muted">(11 ký tự) ở phiên bản 1</span>
      </div>
      <ol className="mt-6 space-y-4">
        <li className="flex flex-wrap items-center gap-3">
          <span className="mono w-6 text-mint">1.</span>
          <span className="text-muted">Chỉ báo chế độ:</span>
          <Bits bits="0010" color="#ff8a4c" />
        </li>
        <li className="flex flex-wrap items-center gap-3">
          <span className="mono w-6 text-mint">2.</span>
          <span className="text-muted">Số ký tự 11 trên 9 bit:</span>
          <Bits bits="000001011" color="#ffc857" />
        </li>
        <li className="flex flex-wrap items-start gap-3">
          <span className="mono w-6 text-mint">3.</span>
          <div className="flex-1">
            <span className="text-muted">Chia thành từng cặp — bấm vào một cặp:</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {pairs.map((x, i) => (
                <button
                  key={i}
                  onClick={() => setSel(i)}
                  className={`mono rounded-lg border px-3 py-2 text-lg font-bold transition ${
                    i === sel ? "scale-110 border-cyan bg-cyan text-bg" : "border-line-strong hover:border-cyan/60"
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
        </li>
        <li className="flex flex-wrap items-start gap-3">
          <span className="mono w-6 text-mint">4.</span>
          <div key={sel} className="pop flex-1 rounded-xl bg-bg-soft p-4">
            {chars.length === 2 ? (
              <>
                <div className="mono text-lg">
                  45 × <span className="text-cyan">{ALNUM_CHARS.indexOf(chars[0] === "␣" ? " " : chars[0])}</span> +{" "}
                  <span className="text-pink">{ALNUM_CHARS.indexOf(chars[1] === "␣" ? " " : chars[1])}</span> ={" "}
                  <b>{parseInt(p.bits, 2)}</b>
                </div>
                <div className="mt-1 text-sm text-dim">
                  “{chars[0]}” = {ALNUM_CHARS.indexOf(chars[0] === "␣" ? " " : chars[0])}, “{chars[1]}” ={" "}
                  {ALNUM_CHARS.indexOf(chars[1] === "␣" ? " " : chars[1])} trong bảng 45 ký tự
                </div>
              </>
            ) : (
              <div className="mono text-lg">
                Ký tự lẻ cuối cùng “{chars[0]}” = <b>{parseInt(p.bits, 2)}</b> → mã hóa bằng 6 bit
              </div>
            )}
            <div className="mt-3">
              <Bits bits={p.bits} color="#4cc9f0" />
            </div>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="mono w-6 text-mint">5.</span>
          <span className="min-w-0 flex-1 text-muted">
            Thêm bit kết thúc, đệm cho đủ bội số 8, rồi điền các byte đệm xen kẽ{" "}
            <span className="mono text-ink">11101100</span> và <span className="mono text-ink">00010001</span> cho đến khi
            đủ dung lượng.
          </span>
        </li>
      </ol>
      <div className="mt-6">
        <div className="mb-2 text-xs text-dim">Bảng 45 ký tự Alphanumeric (giá trị dưới mỗi ký tự):</div>
        <div className="grid grid-cols-9 gap-1 sm:grid-cols-15">
          {Array.from(ALNUM_CHARS).map((ch, i) => {
            const used = chars.includes(ch === " " ? "␣" : ch);
            return (
              <div
                key={i}
                className={`mono rounded-md border py-1 text-center transition ${
                  used ? "border-cyan bg-cyan/20" : "border-line"
                }`}
              >
                <div className="text-sm font-bold">{ch === " " ? "␣" : ch}</div>
                <div className="text-[10px] text-dim">{i}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UppercaseTip() {
  const [url, setUrl] = useState("https://vidu.vn/abc");
  const upper = url.toUpperCase();
  const a = useMemo(() => encodeText(url || " ", "M"), [url]);
  const b = useMemo(() => encodeText(upper || " ", "M"), [upper]);
  return (
    <div className="card spot p-6 sm:p-8">
      <label className="text-sm text-muted" htmlFor="url-tip">
        Nhập một URL:
      </label>
      <input
        id="url-tip"
        value={url}
        maxLength={120}
        onChange={(e) => setUrl(e.target.value)}
        className="mono mt-2 w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-3 outline-none focus:border-mint/70"
      />
      <div className="mt-6 grid grid-cols-2 gap-5">
        {[
          { label: "Viết thường", s: url, q: a },
          { label: "Viết HOA", s: upper, q: b },
        ].map(({ label, s, q }) => (
          <div key={label}>
            <div className="mb-2 font-semibold">{label}</div>
            <div className="mx-auto max-w-[170px]">{q && <MiniQr modules={q.modules} size={q.size} />}</div>
            {q && (
              <div className="mono mt-2 space-y-0.5 text-center text-xs">
                <div className={q.plan.analysis.mode === "alphanumeric" ? "text-cyan" : "text-orange"}>
                  {MODE_INFO[q.plan.analysis.mode].name}
                </div>
                <div className="text-muted">
                  V{q.plan.version} · {q.size}×{q.size} · {q.plan.usedBits} bit
                </div>
              </div>
            )}
            <div className="mono mt-1 truncate text-center text-xs text-dim">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Modes() {
  return (
    <Section id="che-do">
      <SectionHeading
        n={4}
        kicker="Encoding Modes"
        title="Các chế độ mã hóa dữ liệu"
        lead="Mã QR hỗ trợ nhiều chế độ mã hóa để tối ưu số bit cần dùng cho từng loại dữ liệu. Một mã QR có thể kết hợp nhiều chế độ khác nhau trong cùng một chuỗi (mã hóa hỗn hợp) để tiết kiệm dung lượng."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m, i) => (
          <Reveal key={m.name} delay={i * 50}>
            <div className="card spot lift h-full p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-bold" style={{ color: m.color }}>
                  {m.name}
                </span>
              </div>
              <Bits bits={m.bits} color={m.color} />
              <p className="mt-3 text-sm leading-relaxed text-muted">{m.chars}</p>
              <p className="mono mt-3 text-xs text-ink/80">{m.pack}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <SubHeading n="4.1">Độ dài trường đếm ký tự</SubHeading>
          <p className="mb-5 leading-relaxed text-muted">
            Ngay sau chỉ báo chế độ là trường đếm số ký tự, có độ dài (số bit) thay đổi theo phiên bản:
          </p>
          <div className="card overflow-hidden text-sm">
            <div className="grid grid-cols-5 bg-panel-2/70 font-semibold">
              {["Phiên bản", "Numeric", "Alnum", "Byte", "Kanji"].map((h) => (
                <div key={h} className="p-3">
                  {h}
                </div>
              ))}
            </div>
            {[
              ["1 – 9", 10, 9, 8, 8],
              ["10 – 26", 12, 11, 16, 10],
              ["27 – 40", 14, 13, 16, 12],
            ].map((row) => (
              <div key={row[0]} className="grid grid-cols-5 border-t border-line hover:bg-panel-2/40">
                {row.map((c, i) => (
                  <div key={i} className={`mono p-3 ${i === 0 ? "text-muted" : ""}`}>
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Callout tone="tip" title="Mẹo tối ưu">
              Nếu nội dung là URL, viết toàn bộ bằng chữ in hoa (ví dụ <span className="mono">HTTPS://VIDU.VN/ABC</span>) có
              thể cho phép dùng chế độ Alphanumeric, giúp mã nhỏ hơn. Tên miền không phân biệt hoa thường, nhưng phần đường
              dẫn trên một số máy chủ thì có, nên cần kiểm tra trước.
            </Callout>
          </div>
          <div className="mt-6">
            <UppercaseTip />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <SubHeading n="4.2">Ví dụ mã hóa chế độ Alphanumeric</SubHeading>
          <HelloWorld />
        </Reveal>
      </div>
    </Section>
  );
}
