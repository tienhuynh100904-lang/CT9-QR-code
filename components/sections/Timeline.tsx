import type { CSSProperties } from "react";
import { Book, Camera, Car, Flag, Globe, Microscope, RefreshCw, Smartphone, Sparkles, Syringe, Tag } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const EVENTS = [
  { year: "1994", icon: Car, text: "Denso Wave công bố mã QR (Model 1) để theo dõi linh kiện ô tô." },
  { year: "1997", icon: Tag, text: "Được công nhận là tiêu chuẩn AIM (Automatic Identification Manufacturers)." },
  { year: "1999", icon: Flag, text: "Trở thành tiêu chuẩn công nghiệp Nhật Bản JIS X 0510." },
  { year: "2000", icon: Globe, text: "Trở thành tiêu chuẩn quốc tế ISO/IEC 18004." },
  { year: "2002", icon: Smartphone, text: "Điện thoại di động có tính năng đọc mã QR ra đời tại Nhật Bản." },
  { year: "2004", icon: Microscope, text: "Công bố Micro QR Code." },
  { year: "2006", icon: Book, text: "ISO/IEC 18004:2006 – chính thức hóa Model 2 và Micro QR." },
  { year: "2015", icon: RefreshCw, text: "Phiên bản cập nhật ISO/IEC 18004:2015." },
  { year: "2017–18", icon: Camera, text: "iOS 11 và nhiều dòng Android hỗ trợ quét QR trực tiếp bằng camera." },
  {
    year: "2020–22",
    icon: Syringe,
    text: "Đại dịch COVID-19 khiến mã QR bùng nổ: khai báo y tế, thực đơn không chạm, thanh toán. rMQR được chuẩn hóa (ISO/IEC 23941:2022).",
  },
  { year: "2024", icon: Sparkles, text: "Phiên bản cập nhật ISO/IEC 18004:2024." },
];

const ROW = 176; // chiều cao mỗi mốc (px)
const H = EVENTS.length * ROW;
const MOBILE_W = 64; // bề rộng dải đường cong trên mobile (px)
// Vị trí ngang từng mốc, lệch không đều để đường cong trông tự nhiên
const MOBILE_X = [14, 44, 26, 50, 16, 40, 22, 48, 30, 44, 18]; // px
const DESKTOP_X = [28, 60, 42, 72, 34, 56, 24, 66, 46, 74, 38]; // % bề rộng
// Độ dài "tay cầm" của đường cong (tỉ lệ khoảng cách dọc) cho từng đoạn
const HANDLE = [
  [0.45, 0.6],
  [0.65, 0.4],
  [0.5, 0.55],
  [0.4, 0.65],
  [0.6, 0.45],
  [0.55, 0.5],
  [0.7, 0.4],
  [0.4, 0.6],
  [0.6, 0.5],
  [0.5, 0.65],
];

/** Đường cong uốn lượn đi qua tâm các mốc, tiếp tuyến thẳng đứng tại mỗi mốc */
function wavePath(xs: number[]) {
  const pts = EVENTS.map((_, i) => [xs[i], i * ROW + ROW / 2] as const);
  let d = `M ${pts[0][0]} 0 L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const dy = y1 - y0;
    const [a, b] = HANDLE[i - 1];
    d += ` C ${x0} ${y0 + dy * a} ${x1} ${y1 - dy * b} ${x1} ${y1}`;
  }
  return d + ` L ${pts[pts.length - 1][0]} ${H}`;
}

function Wave({ w, xs, className, stretch }: { w: number; xs: number[]; className: string; stretch?: boolean }) {
  const id = `wave-${w}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${H}`}
      preserveAspectRatio={stretch ? "none" : "xMinYMin meet"}
      className={`pointer-events-none absolute top-0 left-0 ${className}`}
      style={{ height: H }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset="0" stopColor="var(--mint)" />
          <stop offset="0.6" stopColor="var(--cyan)" />
          <stop offset="1" stopColor="var(--line-strong)" />
        </linearGradient>
      </defs>
      <path
        d={wavePath(xs)}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Timeline() {
  return (
    <ol className="relative" style={{ height: H }}>
      <Wave w={MOBILE_W} xs={MOBILE_X} className="md:hidden" />
      <Wave w={100} xs={DESKTOP_X} className="hidden w-full md:block" stretch />
      {EVENTS.map((e, i) => {
        const left = DESKTOP_X[i] < 50; // mốc lệch trái -> chữ nằm bên phải
        const style = {
          top: i * ROW,
          height: ROW,
          "--xm": `${MOBILE_X[i]}px`,
          "--xd": `${DESKTOP_X[i]}%`,
        } as CSSProperties;
        return (
          <li key={e.year} className="absolute inset-x-0" style={style}>
            <span
              className="absolute top-1/2 left-[var(--xm)] z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-mint/40 bg-bg text-mint shadow-[0_0_24px_-6px_var(--mint)] md:left-[var(--xd)] md:h-14 md:w-14"
              aria-hidden
            >
              <e.icon size={22} />
            </span>
            <Reveal
              delay={60}
              className={`absolute top-1/2 -translate-y-1/2 pl-20 md:pl-0 ${
                left
                  ? "right-0 md:left-[calc(var(--xd)+4.5rem)]"
                  : "right-0 md:right-[calc(100%-var(--xd)+4.5rem)] md:left-0 md:text-right"
              }`}
            >
              <div className="mono text-3xl font-bold tracking-tight text-mint sm:text-4xl">{e.year}</div>
              <p className={`mt-1 max-w-md text-sm leading-relaxed text-muted sm:text-base ${left ? "" : "md:ml-auto"}`}>
                {e.text}
              </p>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
