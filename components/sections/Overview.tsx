import { ArrowLeft, ArrowRight, Check, Circle, CreditCard, FileText, Hash, Link, User, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";
import Timeline from "./Timeline";

const DATA_TYPES: { icon: LucideIcon; label: string }[] = [
  { icon: FileText, label: "Văn bản" },
  { icon: Hash, label: "Số" },
  { icon: Link, label: "Website" },
  { icon: User, label: "Danh bạ" },
  { icon: Wifi, label: "Wi-Fi" },
  { icon: CreditCard, label: "Thanh toán" },
];

function Barcode() {
  const widths = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2];
  let x = 0;
  return (
    <svg viewBox="0 0 70 40" className="h-24 w-full" aria-label="Mã vạch một chiều">
      {widths.map((w, i) => {
        const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={34} fill="#0e1430" /> : null;
        x += w + (i % 3 === 0 ? 1 : 0.6);
        return el;
      })}
      <text x="35" y="39.5" textAnchor="middle" fontSize="4.5" fill="#0e1430" fontFamily="monospace">
        8 935049 500018
      </text>
    </svg>
  );
}

function QrSample() {
  // Mã QR thật (phiên bản 1) được tạo lúc build bằng bộ mã hóa của trang
  const qr = encodeText("QR CODE", "L")!;
  return <MiniQr modules={qr.modules} size={qr.size} quiet={1} className="h-24 w-24" />;
}

const COMPARE = [
  ["Hướng lưu dữ liệu", "Một chiều (ngang)", "Hai chiều (ngang và dọc)"],
  ["Dung lượng", "Khoảng 20–30 ký tự", "Tối đa 7.089 chữ số hoặc 2.953 byte"],
  ["Hướng quét", "Phải quét gần thẳng hàng với vạch", "Đọc được ở mọi góc xoay 360°"],
  ["Khả năng chịu hư hỏng", "Thấp, hỏng một phần thường không đọc được", "Khôi phục được 7–30% dữ liệu hư hỏng"],
  ["Diện tích", "Dài, tốn diện tích", "Nhỏ gọn, khoảng 1/10 diện tích cho cùng lượng dữ liệu"],
  ["Thiết bị đọc", "Máy quét laser hoặc camera", "Camera điện thoại, máy quét ảnh"],
];

export default function Overview() {
  return (
    <Section id="tong-quan">
      <SectionHeading
        n={1}
        kicker="Overview"
        title="Tổng quan về mã QR"
        lead={
          <>
            <strong className="text-ink">Mã QR</strong> (Quick Response Code – “mã phản hồi nhanh”) là một loại mã vạch
            hai chiều dạng ma trận, gồm các ô vuông nhỏ màu đen (module tối) và trắng (module sáng) sắp xếp trên một lưới
            vuông.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal className="card spot p-6 sm:p-8">
          <SubHeading n="1.1">Mã QR là gì?</SubHeading>
          <p className="leading-relaxed text-muted">
            Thông tin được lưu theo <em className="text-ink not-italic">cả chiều ngang lẫn chiều dọc</em>, nhờ vậy mã QR
            chứa được nhiều dữ liệu hơn hẳn mã vạch một chiều truyền thống và có thể được đọc rất nhanh từ mọi hướng.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Một mã QR có thể chứa văn bản, số, đường dẫn website, thông tin liên hệ, cấu hình Wi-Fi, dữ liệu thanh toán…
            Ngày nay hầu hết điện thoại thông minh đều quét được mã QR trực tiếp bằng camera mà không cần cài thêm phần
            mềm.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {DATA_TYPES.map((t) => (
              <span key={t.label} className="inline-flex items-center gap-1.5 rounded-lg bg-panel-2 px-3 py-1.5 text-sm">
                <t.icon size={16} aria-hidden />
                {t.label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120} className="card spot flex flex-col justify-center gap-6 p-6 sm:p-8">
          <div className="grid grid-cols-2 items-end gap-6">
            <div className="group">
              <div className="rounded-xl bg-paper p-3 transition group-hover:scale-105">
                <Barcode />
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold">Mã vạch 1D</div>
                <div className="flex items-center justify-center gap-1.5 text-sm text-dim">
                  <ArrowLeft size={14} aria-hidden />
                  chỉ đọc theo chiều ngang
                  <ArrowRight size={14} aria-hidden />
                </div>
              </div>
            </div>
            <div className="group flex flex-col items-center">
              <div className="rounded-xl bg-paper p-3 transition group-hover:scale-105">
                <QrSample />
              </div>
              <div className="mt-3 text-center">
                <div className="font-semibold">Mã QR 2D</div>
                <div className="text-sm text-dim">↔ ngang &amp; ↕ dọc</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-16">
        <SubHeading n="1.2">Lịch sử hình thành</SubHeading>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          <Reveal>
            <p className="leading-relaxed text-muted">
              Mã QR được phát minh năm <strong className="text-ink">1994</strong> bởi kỹ sư{" "}
              <strong className="text-ink">Masahiro Hara</strong> và nhóm cộng sự tại công ty{" "}
              <strong className="text-ink">Denso Wave</strong> (Nhật Bản), một công ty con của tập đoàn Denso thuộc hệ sinh
              thái Toyota. Mục đích ban đầu là theo dõi linh kiện ô tô trong dây chuyền sản xuất, nơi mã vạch 1D không còn
              đáp ứng được nhu cầu về dung lượng và tốc độ quét.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-2xl border border-line bg-panel/60 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex items-center" aria-hidden>
                  <Circle size={22} fill="currentColor" />
                  <Circle size={22} />
                </span>
                <span className="font-semibold">Cảm hứng từ bàn cờ vây</span>
              </div>
              <p className="leading-relaxed text-muted">
                Nhóm nghiên cứu khảo sát rất nhiều ấn phẩm in để tìm ra tỉ lệ hình học ít xuất hiện nhất trong thực tế, và
                chọn tỉ lệ <span className="mono font-semibold text-mint">1:1:3:1:1</span> cho “hình vuông định vị” ở ba
                góc để máy quét không nhầm lẫn với các hình in khác.
              </p>
            </div>
          </Reveal>
        </div>
        <div className="mt-12">
          <Timeline />
        </div>
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.6fr]">
        <Reveal>
          <SubHeading n="1.3">Bằng sáng chế và thương hiệu</SubHeading>
          <p className="leading-relaxed text-muted">
            Denso Wave sở hữu bằng sáng chế cho công nghệ mã QR nhưng tuyên bố{" "}
            <strong className="text-ink">không thực thi quyền này</strong> đối với mã QR theo tiêu chuẩn, nhằm khuyến
            khích sử dụng rộng rãi. Nhờ vậy bất kỳ ai cũng có thể tạo và sử dụng mã QR miễn phí.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <SubHeading n="1.4">So sánh mã QR với mã vạch 1D</SubHeading>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[1fr_1.2fr_1.4fr] border-b border-line bg-panel-2/60 text-sm font-semibold">
              <div className="p-3 sm:p-4">Tiêu chí</div>
              <div className="p-3 text-muted sm:p-4">Mã vạch 1D</div>
              <div className="p-3 text-mint sm:p-4">Mã QR (2D)</div>
            </div>
            {COMPARE.map(([k, a, b]) => (
              <div
                key={k}
                className="grid grid-cols-[1fr_1.2fr_1.4fr] border-b border-line text-sm transition last:border-0 hover:bg-panel-2/50"
              >
                <div className="p-3 font-medium sm:p-4">{k}</div>
                <div className="p-3 text-dim sm:p-4">{a}</div>
                <div className="p-3 sm:p-4">
                  <Check size={14} className="mr-1 inline-block align-text-bottom text-mint" aria-hidden />
                  {b}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
