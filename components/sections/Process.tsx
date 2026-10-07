"use client";

import { useEffect, useState } from "react";
import { BookOpen, Camera, Drama, Grid3x3, Ruler, Shield, Tag, Target } from "lucide-react";
import QrLab from "../lab/QrLab";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";
import Scanner from "./Scanner";

const READ_STEPS = [
  { icon: Camera, title: "Thu ảnh và tiền xử lý", text: "Chuyển ảnh xám, nhị phân hóa (ngưỡng thích nghi) để tách đen-trắng." },
  { icon: Target, title: "Tìm mẫu định vị", text: "Quét tìm tỉ lệ 1:1:3:1:1 theo hàng và cột, xác định 3 góc." },
  { icon: Ruler, title: "Hiệu chỉnh hình học", text: "Dùng mẫu định vị và mẫu căn chỉnh để tính phép biến đổi phối cảnh, “nắn thẳng” mã." },
  { icon: Grid3x3, title: "Lấy mẫu lưới", text: "Xác định kích thước module nhờ mẫu thời gian, đọc giá trị từng module." },
  { icon: Tag, title: "Đọc định dạng và phiên bản", text: "Biết mức sửa lỗi, mặt nạ và kích thước." },
  { icon: Drama, title: "Gỡ mặt nạ, trích codeword", text: "Đọc theo thứ tự zíc-zắc, tách đan xen." },
  { icon: Shield, title: "Sửa lỗi", text: "Áp dụng giải mã Reed–Solomon cho từng khối." },
  { icon: BookOpen, title: "Giải mã dữ liệu", text: "Đọc chế độ, số ký tự và chuyển chuỗi bit về văn bản; ứng dụng xử lý tiếp (mở URL, kết nối Wi-Fi…)." },
];

function ReadPipeline() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % READ_STEPS.length), 1800);
    return () => clearInterval(id);
  }, [paused]);
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {READ_STEPS.map((s, i) => (
        <div
          key={s.title}
          onMouseEnter={() => setActive(i)}
          className={`card relative p-5 transition duration-500 ${
            i === active ? "-translate-y-1 border-mint/60 shadow-[0_12px_40px_-16px_var(--mint)]" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                i === active ? "scale-110 bg-mint/20" : "bg-panel-2"
              }`}
            >
              <s.icon size={22} aria-hidden />
            </span>
            <span className="mono text-sm text-mint">0{i + 1}</span>
          </div>
          <div className="mt-3 font-semibold">{s.title}</div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
          {i === active && (
            <div className="absolute inset-x-5 bottom-0 h-0.5 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-mint" style={{ animation: paused ? "none" : "grow 1.8s linear" }} />
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes grow { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  );
}

export default function Process() {
  return (
    <Section id="quy-trinh">
      <SectionHeading
        n={7}
        kicker="Hands-on Lab"
        title="Quy trình tạo và đọc mã QR"
        lead="Đây là phần thú vị nhất: hãy nhập bất kỳ nội dung nào và đi qua đúng 9 bước mà một bộ tạo mã thực hiện — từ phân tích ký tự, tính bit, chia đa thức Reed–Solomon, đến xếp bit theo đường zíc-zắc và chọn mặt nạ. Mọi con số bạn thấy đều được tính thật ngay trong trình duyệt."
      />
      <Reveal>
        <SubHeading n="7.1">Các bước tạo mã QR — phòng thí nghiệm</SubHeading>
        <QrLab />
      </Reveal>

      <div className="mt-20">
        <Reveal>
          <SubHeading n="7.2">Các bước đọc (giải mã) mã QR</SubHeading>
          <p className="mb-6 max-w-3xl leading-relaxed text-muted">
            Máy quét làm ngược lại quá trình trên. Tám bước dưới đây diễn ra chỉ trong tích tắc mỗi khi bạn đưa camera vào
            một mã QR.
          </p>
        </Reveal>
        <ReadPipeline />
        <Reveal className="mt-10">
          <SubHeading>Tự tay quét thử</SubHeading>
          <Scanner />
        </Reveal>
      </div>
    </Section>
  );
}
