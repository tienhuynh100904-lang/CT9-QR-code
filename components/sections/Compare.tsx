import { Bot, Check, Globe, PenLine, Sunrise, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const INK = "#0e1430";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function DataMatrix() {
  const n = 14;
  const r = rng(3);
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const on = x === 0 || y === n - 1 ? true : y === 0 ? x % 2 === 0 : x === n - 1 ? y % 2 === 1 : r() < 0.5;
      if (on) d += `M${x},${y}h1v1h-1z`;
    }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="w-full" shapeRendering="crispEdges" aria-label="Minh họa Data Matrix">
      <rect x={-2} y={-2} width={n + 4} height={n + 4} fill="#f7f8fc" />
      <path d={d} fill={INK} />
    </svg>
  );
}

function Pdf417() {
  const r = rng(7);
  let d = "";
  for (let y = 0; y < 8; y++) {
    let x = 0;
    let k = 0;
    while (x < 60) {
      const w = 0.6 + Math.floor(r() * 3) * 0.6;
      if (k % 2 === 0) d += `M${x.toFixed(1)},${y * 3}h${w.toFixed(1)}v3h-${w.toFixed(1)}z`;
      x += w;
      k++;
    }
  }
  return (
    <svg viewBox="-3 -3 66 30" className="w-full" aria-label="Minh họa PDF417">
      <rect x={-3} y={-3} width={66} height={30} fill="#f7f8fc" />
      <rect x={0} y={0} width={3} height={24} fill={INK} />
      <rect x={57} y={0} width={3} height={24} fill={INK} />
      <path d={d} fill={INK} />
    </svg>
  );
}

function Aztec() {
  const n = 19;
  const c = 9;
  const r = rng(5);
  let d = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const dist = Math.max(Math.abs(x - c), Math.abs(y - c));
      if (dist <= 5 ? dist % 2 === 0 : r() < 0.5) d += `M${x},${y}h1v1h-1z`;
    }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="w-full" shapeRendering="crispEdges" aria-label="Minh họa Aztec">
      <rect x={-1} y={-1} width={n + 2} height={n + 2} fill="#f7f8fc" />
      <path d={d} fill={INK} />
    </svg>
  );
}

function MaxiCode() {
  const r = rng(9);
  let d = "";
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const cx = x * 1.2 + (y % 2 ? 0.6 : 0) + 0.8;
      const cy = y * 1.05 + 0.8;
      if (Math.hypot(cx - 10, cy - 8.6) < 4.2) continue;
      if (r() < 0.45) d += `M${(cx - 0.5).toFixed(2)},${cy.toFixed(2)}a.5,.5 0 1,0 1,0a.5,.5 0 1,0 -1,0`;
    }
  return (
    <svg viewBox="-1 -1 22 19" className="w-full" aria-label="Minh họa MaxiCode">
      <rect x={-1} y={-1} width={22} height={19} fill="#f7f8fc" />
      <path d={d} fill={INK} />
      {[3.4, 2.2, 1].map((rad) => (
        <circle key={rad} cx={10} cy={8.6} r={rad} fill="none" stroke={INK} strokeWidth={0.6} />
      ))}
    </svg>
  );
}

function Nfc() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" aria-label="Minh họa NFC">
      <rect width={40} height={40} fill="#f7f8fc" />
      <rect x={8} y={10} width={12} height={20} rx={2} fill="none" stroke={INK} strokeWidth={1.6} />
      {[6, 10, 14].map((rad, i) => (
        <path
          key={rad}
          d={`M ${22 + i} ${20 - rad * 0.7} A ${rad} ${rad} 0 0 1 ${22 + i} ${20 + rad * 0.7}`}
          fill="none"
          stroke={INK}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={1 - i * 0.25}
        />
      ))}
    </svg>
  );
}

const TRENDS: { icon: LucideIcon; text: string }[] = [
  {
    icon: Globe,
    text: "Thanh toán QR xuyên biên giới: nhiều nước ASEAN đã kết nối hệ thống QR thanh toán, cho phép du khách quét mã bằng ứng dụng ngân hàng trong nước.",
  },
  {
    icon: Sunrise,
    text: "GS1 Digital Link: lộ trình “Sunrise 2027” hướng tới việc các điểm bán lẻ quét được mã 2D (như QR) thay cho mã vạch EAN/UPC truyền thống.",
  },
  { icon: PenLine, text: "Kết hợp với chữ ký số, mã hóa để chống giả mạo giấy tờ, hóa đơn, nhãn hàng." },
  { icon: Bot, text: "Mã QR nghệ thuật tạo bằng AI, vừa đẹp vừa quét được." },
];

export default function Compare() {
  const qr = encodeText("QR", "L")!;
  const codes = [
    {
      name: "QR Code",
      art: <MiniQr modules={qr.modules} size={qr.size} />,
      trait: "Dung lượng lớn, đọc nhanh, phổ biến nhất với người dùng phổ thông",
      use: "Thanh toán, marketing, URL",
    },
    {
      name: "Data Matrix",
      art: <DataMatrix />,
      trait: "Rất nhỏ gọn, mẫu định vị hình chữ L, phù hợp khắc laser",
      use: "Linh kiện điện tử, dược phẩm, y tế (GS1 DataMatrix)",
    },
    {
      name: "PDF417",
      art: <Pdf417 />,
      trait: "Mã xếp chồng nhiều hàng, dung lượng khá lớn",
      use: "Thẻ lên máy bay, giấy phép lái xe (Mỹ), giấy tờ tùy thân",
    },
    {
      name: "Aztec Code",
      art: <Aztec />,
      trait: "Mẫu định vị ở tâm (hình “mắt bò”), không cần vùng trống",
      use: "Vé tàu, vé máy bay trên điện thoại",
    },
    { name: "MaxiCode", art: <MaxiCode />, trait: "Kích thước cố định, mẫu tròn đồng tâm", use: "Phân loại bưu kiện UPS" },
    {
      name: "NFC",
      art: <Nfc />,
      trait: "Không phải mã in mà là chip vô tuyến tầm rất gần, cần thiết bị hỗ trợ",
      use: "Thanh toán chạm, thẻ từ, tem thông minh",
    },
  ];
  return (
    <Section id="so-sanh">
      <SectionHeading
        n={13}
        kicker="Comparison"
        title="So sánh với các mã 2D khác và công nghệ thay thế"
        lead="Mã QR không đơn độc — mỗi loại mã có điểm mạnh riêng cho từng bối cảnh."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {codes.map((c, i) => (
          <Reveal key={c.name} delay={(i % 3) * 70}>
            <div className="card spot lift group flex h-full gap-4 p-5">
              <div className="w-24 shrink-0 self-start overflow-hidden rounded-lg transition duration-500 group-hover:scale-110">
                {c.art}
              </div>
              <div>
                <div className="font-bold">{c.name}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.trait}</p>
                <p className="mt-2 text-xs text-dim">
                  <span className="text-mint">Ứng dụng:</span> {c.use}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-dim">Hình Data Matrix, PDF417, Aztec, MaxiCode là minh họa phong cách, không phải mã thật.</p>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <SubHeading n="13.1">Ưu điểm và hạn chế của mã QR</SubHeading>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-mint/30 bg-mint/[0.05] p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-mint">
                <ThumbsUp size={18} aria-hidden />
                Ưu điểm
              </div>
              <ul className="space-y-1.5 text-sm text-muted">
                {[
                  "Miễn phí, dễ tạo",
                  "In được trên mọi chất liệu",
                  "Đọc bằng điện thoại phổ thông",
                  "Dung lượng lớn",
                  "Chịu hư hỏng tốt",
                  "Đọc được ở mọi góc độ",
                  "Hỗ trợ đa ngôn ngữ",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <Check size={14} className="mt-1 shrink-0" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-red/30 bg-red/[0.05] p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-red">
                <ThumbsDown size={18} aria-hidden />
                Hạn chế
              </div>
              <ul className="space-y-1.5 text-sm text-muted">
                {[
                  "Con người không đọc được bằng mắt nên dễ bị lợi dụng để lừa đảo",
                  "Cần camera và ánh sáng đủ",
                  "QR tĩnh không sửa được sau khi in",
                  "Phụ thuộc Internet nếu nội dung là URL",
                  "Dung lượng vẫn giới hạn (không chứa trực tiếp ảnh, video)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <X size={14} className="mt-1 shrink-0" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <SubHeading n="13.2">Xu hướng tương lai</SubHeading>
          <div className="space-y-3">
            {TRENDS.map((t) => (
              <div key={t.text} className="card spot flex gap-4 p-4">
                <t.icon size={24} className="shrink-0" aria-hidden />
                <p className="text-sm leading-relaxed text-muted">{t.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
