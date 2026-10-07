"use client";

import { useEffect, useMemo, useState } from "react";
import jsQR from "jsqr";
import { CircleCheck, CircleX, Megaphone, PersonStanding, Ruler, Scissors, SquareDashed, Smartphone, Sparkles, SunMoon, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const SIZE_TABLE = [
  { place: "Danh thiếp, nhãn sản phẩm", range: "10–20 cm", size: "2 – 2,5 cm", min: 10, max: 20 },
  { place: "Tờ rơi, thực đơn bàn", range: "20–40 cm", size: "3 – 4 cm", min: 20, max: 40 },
  { place: "Poster trong nhà", range: "1–2 m", size: "10 – 20 cm", min: 100, max: 200 },
  { place: "Biển quảng cáo, băng rôn", range: "5–10 m", size: "50 – 100 cm", min: 500, max: 1000 },
];

function fmtCm(cm: number) {
  return cm >= 100 ? `${(cm / 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} m` : `${Math.round(cm)} cm`;
}

function SizeCalculator() {
  const [t, setT] = useState(0.55); // vị trí thanh trượt (thang log)
  const dist = Math.round(10 * Math.pow(100, t)); // 10 cm → 10 m
  const size = Math.max(2, dist / 10);
  const row = SIZE_TABLE.findIndex((r) => dist >= r.min * 0.75 && dist <= r.max * 1.5);
  const px = 40 + 170 * t;
  const qr = useMemo(() => encodeText("https://www.vidu.vn", "M")!, []);
  return (
    <div className="card spot grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="mono rounded-2xl bg-bg-soft p-5 text-center">
          <div className="text-sm text-muted">Kích thước cạnh mã ≈ khoảng cách quét ÷ 10</div>
          <div className="mt-2 text-2xl sm:text-3xl">
            <span className="text-cyan">{fmtCm(dist)}</span> ÷ 10 ≈ <b className="text-mint">{fmtCm(size)}</b>
          </div>
          {dist / 10 < 2 && <div className="mt-1 text-xs text-amber">Tối thiểu nên khoảng 2×2 cm (chưa tính vùng trống)</div>}
        </div>
        <label className="mt-5 block text-sm">
          <span className="text-muted">Khoảng cách người quét đứng: {fmtCm(dist)}</span>
          <input type="range" min={0} max={1} step={0.005} value={t} onChange={(e) => setT(+e.target.value)} className="mt-2 w-full" />
        </label>
        <div className="mt-5 overflow-hidden rounded-xl border border-line text-sm">
          {SIZE_TABLE.map((r, i) => (
            <div
              key={r.place}
              className={`grid grid-cols-[1.4fr_1fr_1fr] border-t border-line transition first:border-0 ${
                i === row ? "bg-mint/10 text-ink" : "text-muted"
              }`}
            >
              <div className="p-2.5">{r.place}</div>
              <div className="mono p-2.5">{r.range}</div>
              <div className="mono p-2.5">{r.size}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-end">
        <div className="flex w-full items-end justify-between gap-4">
          <div className="flex justify-center" aria-hidden>
            <PersonStanding size={64 - 30 * t} />
          </div>
          <div className="mb-3 h-px flex-1 border-t-2 border-dashed border-line-strong" />
          <div className="shrink-0 overflow-hidden rounded-lg transition-all" style={{ width: px, height: px }}>
            <MiniQr modules={qr.modules} size={qr.size} quiet={1} className="h-full w-full" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-dim">
          Mã càng chứa nhiều dữ liệu (phiên bản càng lớn) thì module càng nhỏ, do đó cần in mã lớn hơn.
        </p>
      </div>
    </div>
  );
}

const PRESETS = [
  { name: "Đen / Trắng", dark: "#000000", light: "#ffffff" },
  { name: "Xanh đậm / Kem", dark: "#1e3a8a", light: "#fef3c7" },
  { name: "Vàng / Trắng", dark: "#facc15", light: "#ffffff" },
  { name: "Xám nhạt / Trắng", dark: "#cbd5e1", light: "#ffffff" },
  { name: "Đảo màu", dark: "#ffffff", light: "#0e1430" },
];

function lum(hex: string) {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ContrastTester() {
  const [dark, setDark] = useState("#1e3a8a");
  const [light, setLight] = useState("#fef3c7");
  const qr = useMemo(() => encodeText("https://vi.wikipedia.org/wiki/Mã_QR", "M")!, []);
  const [readable, setReadable] = useState<boolean | null>(null);
  const L1 = lum(dark);
  const L2 = lum(light);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  const inverted = L1 > L2;

  useEffect(() => {
    const id = setTimeout(() => {
      const scale = 5;
      const q = 4;
      const w = (qr.size + q * 2) * scale;
      const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      const D = rgb(dark);
      const Lc = rgb(light);
      const data = new Uint8ClampedArray(w * w * 4);
      for (let y = 0; y < w; y++) {
        for (let x = 0; x < w; x++) {
          const r = Math.floor(y / scale) - q;
          const c = Math.floor(x / scale) - q;
          const on = r >= 0 && c >= 0 && r < qr.size && c < qr.size && qr.modules[r * qr.size + c];
          const col = on ? D : Lc;
          const o = (y * w + x) * 4;
          data[o] = col[0];
          data[o + 1] = col[1];
          data[o + 2] = col[2];
          data[o + 3] = 255;
        }
      }
      setReadable(!!jsQR(data, w, w, { inversionAttempts: "dontInvert" }));
    }, 120);
    return () => clearTimeout(id);
  }, [dark, light, qr]);

  const verdict = inverted
    ? { text: "Mã đảo màu (sáng trên nền tối): nhiều ứng dụng đọc được nhưng không phải tất cả — nên hạn chế.", tone: "text-amber" }
    : ratio >= 4
      ? { text: "Độ tương phản cao — dễ quét.", tone: "text-mint" }
      : ratio >= 2.5
        ? { text: "Tương phản trung bình — có thể khó quét trong ánh sáng yếu.", tone: "text-amber" }
        : { text: "Hai màu quá gần nhau — rất khó quét.", tone: "text-red" };

  return (
    <div className="card spot grid gap-6 p-6 sm:p-8 md:grid-cols-[240px_1fr]">
      <div className="mx-auto w-full max-w-[240px]">
        <MiniQr modules={qr.modules} size={qr.size} dark={dark} light={light} quiet={4} className="w-full rounded-xl" />
      </div>
      <div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setDark(p.dark);
                setLight(p.light);
              }}
              className="flex items-center gap-2 rounded-lg border border-line-strong px-3 py-1.5 text-xs hover:bg-panel-2"
            >
              <span className="flex overflow-hidden rounded">
                <span className="h-4 w-4" style={{ background: p.dark }} />
                <span className="h-4 w-4" style={{ background: p.light }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-9 w-12 cursor-pointer rounded bg-transparent" />
            <span className="text-muted">Màu module “tối”</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-9 w-12 cursor-pointer rounded bg-transparent" />
            <span className="text-muted">Màu nền</span>
          </label>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-bg-soft p-3">
            <div className="text-xs text-dim">Tỉ lệ tương phản</div>
            <div className="mono text-2xl font-bold">{ratio.toFixed(2)} : 1</div>
          </div>
          <div className={`rounded-xl p-3 ${readable ? "bg-mint/10" : "bg-red/10"}`}>
            <div className="text-xs text-dim">Máy quét thử (jsQR, không thử đảo màu)</div>
            <div className={`text-lg font-bold ${readable ? "text-mint" : "text-red"}`}>
              {readable === null ? (
                "…"
              ) : readable ? (
                <span className="inline-flex items-center gap-1.5">
                  <CircleCheck size={18} aria-hidden />
                  Đọc được
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <CircleX size={18} aria-hidden />
                  Không đọc được
                </span>
              )}
            </div>
          </div>
        </div>
        <p className={`mt-3 text-sm ${verdict.tone}`}>{verdict.text}</p>
      </div>
    </div>
  );
}

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: SunMoon,
    title: "Độ tương phản cao",
    text: "Module tối trên nền sáng. Tránh các cặp màu gần nhau (vàng trên trắng, xám nhạt). Mã đảo màu (sáng trên nền tối) nhiều ứng dụng đọc được nhưng không phải tất cả, nên hạn chế.",
  },
  { icon: SquareDashed, title: "Giữ vùng trống", text: "Tối thiểu 4 module, không đặt chữ hoặc hình sát mã." },
  {
    icon: Tag,
    title: "Chèn logo",
    text: "Dùng mức sửa lỗi H (hoặc Q), logo đặt ở giữa, chiếm không quá khoảng 20–25% diện tích, không che mẫu định vị, thông tin định dạng và mẫu căn chỉnh.",
  },
  { icon: Scissors, title: "Giữ dữ liệu ngắn", text: "URL ngắn giúp mã thưa module hơn, dễ quét hơn khi in nhỏ." },
  { icon: Ruler, title: "Định dạng file", text: "In ấn nên dùng định dạng vector (SVG, EPS, PDF) để không bị vỡ hình khi phóng to." },
  {
    icon: Megaphone,
    title: "Lời kêu gọi hành động",
    text: "Ghi kèm “Quét để xem thực đơn”, “Quét để thanh toán”… giúp người dùng biết mã dẫn tới đâu và tăng độ tin cậy.",
  },
  { icon: Sparkles, title: "Bề mặt in", text: "Tránh bề mặt quá bóng gây lóa, bề mặt cong gắt hoặc vật liệu co giãn." },
  {
    icon: Smartphone,
    title: "Luôn kiểm tra",
    text: "Quét thử bằng nhiều điện thoại (iOS, Android, máy cũ) và ở nhiều điều kiện ánh sáng trước khi in số lượng lớn.",
  },
];

export default function Design() {
  return (
    <Section id="thiet-ke">
      <SectionHeading
        n={11}
        kicker="Design & Print"
        title="Thiết kế và in ấn mã QR"
        lead="Một mã QR đẹp mà không quét được thì vô dụng. Vài quy tắc đơn giản giúp mã vừa đẹp vừa “ăn” camera ngay lần đầu."
      />
      <Reveal>
        <SubHeading n="11.1">Kích thước và khoảng cách quét</SubHeading>
        <SizeCalculator />
      </Reveal>
      <Reveal className="mt-14">
        <SubHeading n="11.2">Nguyên tắc thiết kế</SubHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="card spot lift p-5">
              <p.icon size={24} aria-hidden />
              <div className="mt-2 font-semibold">{p.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal className="mt-10">
        <SubHeading>Thử nghiệm: chọn màu cho mã QR</SubHeading>
        <ContrastTester />
      </Reveal>
    </Section>
  );
}
