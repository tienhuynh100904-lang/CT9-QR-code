import type { ReactNode } from "react";
import { FileText, Image as ImageIcon, Lock, Monitor, QrCode, Repeat, Smartphone, type LucideIcon } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function Finder({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  const u = s / 7;
  return (
    <g>
      <rect x={x} y={y} width={s} height={s} fill="#0e1430" />
      <rect x={x + u} y={y + u} width={s - 2 * u} height={s - 2 * u} fill="#f7f8fc" />
      <rect x={x + 2 * u} y={y + 2 * u} width={3 * u} height={3 * u} fill="#0e1430" />
    </g>
  );
}

function RmqrArt() {
  const W = 43;
  const H = 11;
  const rnd = seeded(11);
  let d = "";
  for (let r = 0; r < H; r++) for (let c = 9; c < W - 6; c++) if (rnd() < 0.48) d += `M${c},${r}h1v1h-1z`;
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="w-full rounded-lg" shapeRendering="crispEdges" aria-label="Minh họa rMQR">
      <rect x={-1} y={-1} width={W + 2} height={H + 2} fill="#f7f8fc" />
      <Finder x={0} y={2} />
      <path d={d} fill="#0e1430" />
      <rect x={W - 5} y={H - 5} width={5} height={5} fill="#0e1430" />
      <rect x={W - 4} y={H - 4} width={3} height={3} fill="#f7f8fc" />
      <rect x={W - 3} y={H - 3} width={1} height={1} fill="#0e1430" />
    </svg>
  );
}

function ArtQr() {
  // Mã QR "nghệ thuật": vẫn là QR chuẩn (mức H), chỉ đổi hình dạng & màu module
  const q = encodeText("https://vi.wikipedia.org/wiki/Mã_QR", "H")!;
  const n = q.size;
  const isFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  let dots = "";
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n);
    const c = i % n;
    // ô vuông bo góc: vẫn đủ "vuông" để mọi máy quét nhận ra
    if (q.modules[i] && !isFinder(r, c))
      dots += `M${c + 0.04},${r + 0.3}q0,-.26 .26,-.26h.4q.26,0 .26,.26v.4q0,.26 -.26,.26h-.4q-.26,0 -.26,-.26z`;
  }
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} className="w-full rounded-lg" aria-label="Mã QR nghệ thuật">
      <defs>
        <linearGradient id="art-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset="0.5" stopColor="#0e7490" />
          <stop offset="1" stopColor="#be185d" />
        </linearGradient>
      </defs>
      <rect x={-2} y={-2} width={n + 4} height={n + 4} rx={3} fill="#fdf8ff" />
      <path d={dots} fill="url(#art-g)" />
      {[
        [0, 0],
        [0, n - 7],
        [n - 7, 0],
      ].map(([r, c]) => (
        <g key={`${r}${c}`}>
          <rect x={c + 0.5} y={r + 0.5} width={6} height={6} rx={1.8} fill="none" stroke="url(#art-g)" strokeWidth={1} />
          <rect x={c + 2} y={r + 2} width={3} height={3} rx={0.9} fill="url(#art-g)" />
        </g>
      ))}
    </svg>
  );
}


const FlowNode = ({ icon: Icon, label, sub }: { icon: LucideIcon; label: string; sub?: string }) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-2xl">
      <Icon size={26} aria-hidden />
    </div>
    <div className="mt-1.5 text-xs font-semibold">{label}</div>
    {sub && <div className="mono text-[10px] text-dim">{sub}</div>}
  </div>
);
const FlowWire = ({ color = "#5ef2c2", delay = 0 }: { color?: string; delay?: number }) => (
  <div className="relative mt-[-18px] h-0.5 flex-1 bg-line-strong">
    <span
      className="absolute -top-[3px] h-2 w-2 rounded-full"
      style={{ background: color, boxShadow: `0 0 10px ${color}`, animation: `flow 2.4s linear ${delay}s infinite` }}
    />
  </div>
);

function StaticDynamicFlow() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card spot p-6">
        <div className="mb-5 font-semibold">
          QR tĩnh <span className="text-sm font-normal text-dim">(Static)</span>
        </div>
        <div className="flex items-center gap-2">
          <FlowNode icon={Smartphone} label="Điện thoại" />
          <FlowWire />
          <FlowNode icon={QrCode} label="Mã QR" sub="chứa nội dung" />
          <FlowWire delay={1.2} />
          <FlowNode icon={FileText} label="Nội dung" sub="cố định" />
        </div>
      </div>
      <div className="card spot p-6">
        <div className="mb-5 font-semibold">
          QR động <span className="text-sm font-normal text-dim">(Dynamic)</span>
        </div>
        <div className="flex items-center gap-2">
          <FlowNode icon={Smartphone} label="Điện thoại" />
          <FlowWire color="#8b7bff" />
          <FlowNode icon={QrCode} label="Mã QR" sub="URL ngắn" />
          <FlowWire color="#8b7bff" delay={0.8} />
          <FlowNode icon={Monitor} label="Máy chủ" sub="chuyển hướng" />
          <FlowWire color="#8b7bff" delay={1.6} />
          <FlowNode icon={Repeat} label="Nội dung" sub="đổi được" />
        </div>
      </div>
      <style>{`@keyframes flow { from { left: 0 } to { left: calc(100% - 8px) } }`}</style>
    </div>
  );
}

const STATIC_DYNAMIC = [
  ["Nội dung", "Lưu trực tiếp trong mã", "Mã chứa một URL ngắn trỏ tới máy chủ, máy chủ chuyển hướng tới nội dung thật"],
  ["Chỉnh sửa sau khi in", "Không được", "Được, thay đích đến trên máy chủ"],
  ["Thống kê lượt quét", "Không", "Có (số lượt, thời gian, vị trí, thiết bị)"],
  ["Chi phí", "Miễn phí, vĩnh viễn", "Thường phải trả phí dịch vụ"],
  ["Rủi ro", "Ít phụ thuộc bên thứ ba", "Mã “chết” nếu dịch vụ ngừng hoạt động hoặc hết hạn thuê bao"],
];

export default function Variants() {
  const v2 = encodeText("QR MODEL 2", "M", { minVersion: 2 })!;
  const sqrc = encodeText("SQRC", "M")!;
  const frame = encodeText("FRAME QR", "H", { minVersion: 3 })!;

  const cards: { title: string; text: string; art: ReactNode; tag?: string }[] = [
    {
      title: "QR Model 1",
      tag: "1994",
      text: "Phiên bản gốc 1994, tối đa 14 phiên bản (73×73), không có mẫu căn chỉnh hiện đại. Hiện gần như không còn dùng.",
      art: (
        <div className="flex aspect-square items-center justify-center rounded-lg bg-paper text-5xl text-paper-ink/80">
          <span className="mono text-3xl font-black tracking-tighter">M1</span>
        </div>
      ),
    },
    {
      title: "QR Model 2",
      tag: "Phổ biến nhất",
      text: "Loại phổ biến nhất hiện nay, 40 phiên bản, có mẫu căn chỉnh giúp đọc tốt khi bị méo.",
      art: <MiniQr modules={v2.modules} size={v2.size} />,
    },
    {
      title: "Micro QR",
      text: "Chỉ có 1 mẫu định vị, vùng trống 2 module, kích thước từ 11×11 (M1) đến 17×17 (M4), tối đa 35 chữ số. Dùng cho linh kiện, bảng mạch nhỏ.",
      art: (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/micro-qr.png"
          alt="Mã Micro QR (M2) chứa chuỗi 12345"
          className="aspect-square w-full rounded-lg bg-white p-[12%]"
          style={{ imageRendering: "pixelated" }}
        />
      ),
    },
    {
      title: "rMQR",
      tag: "ISO/IEC 23941:2022",
      text: "Rectangular Micro QR: mã hình chữ nhật, cao 7–17 module, dài 27–139 module, phù hợp vị trí hẹp và dài (ống nghiệm, cạnh hộp).",
      art: (
        <div className="flex aspect-square items-center rounded-lg bg-paper px-2">
          <RmqrArt />
        </div>
      ),
    },
    {
      title: "iQR Code",
      text: "Có thể hình vuông hoặc chữ nhật, dung lượng lớn hơn QR thường, mã hóa được trên bề mặt cong. Phát triển bởi Denso Wave.",
      art: (
        <div className="flex aspect-square items-center justify-center gap-2 rounded-lg bg-paper p-4">
          <div className="h-16 w-16 rounded-sm border-[6px] border-paper-ink" />
          <div className="h-10 w-20 rounded-sm border-[6px] border-paper-ink" />
        </div>
      ),
    },
    {
      title: "SQRC",
      text: "Có vùng dữ liệu được mã hóa (bí mật), chỉ máy đọc có khóa mới xem được; vùng công khai vẫn đọc bằng thiết bị thường.",
      art: (
        <div className="relative">
          <MiniQr modules={sqrc.modules} size={sqrc.size} />
          <span className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-lg">
            <Lock size={48} aria-hidden />
          </span>
        </div>
      ),
    },
    {
      title: "Frame QR",
      text: "Có vùng “khung” tự do ở giữa để chèn hình ảnh, chữ.",
      art: (
        <div className="relative">
          <MiniQr modules={frame.modules} size={frame.size} />
          <span className="absolute inset-[30%] flex items-center justify-center rounded-md bg-gradient-to-br from-amber to-pink text-3xl">
            <ImageIcon size={32} aria-hidden />
          </span>
        </div>
      ),
    },
    {
      title: "Mã QR màu / nghệ thuật",
      text: "Không phải chuẩn riêng, mà là mã QR thông thường được thiết kế lại màu, bo góc, chèn logo, tận dụng mức sửa lỗi cao.",
      art: <ArtQr />,
    },
  ];

  return (
    <Section id="bien-the">
      <SectionHeading
        n={8}
        kicker="Variants"
        title="Các biến thể của mã QR"
        lead="Ngoài mã QR quen thuộc, Denso Wave và các tổ chức tiêu chuẩn còn phát triển nhiều biến thể cho những nhu cầu đặc biệt."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={(i % 4) * 60}>
            <div className="card spot lift group h-full p-4">
              <div className="mx-auto w-full max-w-[200px] transition duration-500 group-hover:scale-105">{c.art}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-bold">{c.title}</span>
                {c.tag && <span className="mono rounded bg-panel-2 px-1.5 py-0.5 text-[10px] text-mint">{c.tag}</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-dim">
        Ảnh Micro QR (M2, chứa “12345”) lấy từ tài liệu gốc; hình rMQR, iQR là minh họa. Mã “nghệ thuật” ở trên vẫn quét được!
      </p>

      <div className="mt-16">
        <Reveal>
          <SubHeading n="8.1">Mã QR tĩnh và mã QR động</SubHeading>
        </Reveal>
        <Reveal>
          <StaticDynamicFlow />
        </Reveal>
        <Reveal className="card mt-6 overflow-hidden">
          <div className="grid grid-cols-[1fr_1.2fr_1.6fr] bg-panel-2/70 text-sm font-semibold">
            <div className="p-3">Tiêu chí</div>
            <div className="p-3 text-mint">QR tĩnh</div>
            <div className="p-3 text-violet">QR động</div>
          </div>
          {STATIC_DYNAMIC.map(([k, a, b]) => (
            <div key={k} className="grid grid-cols-[1fr_1.2fr_1.6fr] border-t border-line text-sm hover:bg-panel-2/40">
              <div className="p-3 font-medium">{k}</div>
              <div className="p-3 text-muted">{a}</div>
              <div className="p-3 text-muted">{b}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
