"use client";

import { useState } from "react";
import { Section, SectionHeading } from "../ui/Section";

const TERMS = [
  ["Module", "Ô vuông đơn vị nhỏ nhất của mã QR (đen hoặc trắng), tương ứng 1 bit."],
  ["Codeword", "Nhóm 8 bit (1 byte), đơn vị xử lý của thuật toán Reed–Solomon."],
  ["Version (Phiên bản)", "Kích thước mã, từ 1 (21×21) đến 40 (177×177)."],
  ["ECC Level", "Mức sửa lỗi L, M, Q, H."],
  ["Finder Pattern", "Ba hình vuông định vị lớn ở các góc."],
  ["Alignment Pattern", "Các hình vuông nhỏ giúp hiệu chỉnh biến dạng."],
  ["Timing Pattern", "Đường kẻ đen-trắng xen kẽ xác định tọa độ module."],
  ["Quiet Zone", "Vùng trống bao quanh mã, tối thiểu 4 module."],
  ["Mask (Mặt nạ)", "Mẫu XOR áp lên vùng dữ liệu để tránh các mảng màu bất lợi."],
  ["Reed–Solomon", "Thuật toán mã sửa lỗi dựa trên đa thức trên trường hữu hạn."],
  ["ECI", "Extended Channel Interpretation – khai báo bảng mã ký tự."],
  ["Structured Append", "Chia dữ liệu thành tối đa 16 mã QR liên kết với nhau."],
  ["Quishing", "Lừa đảo trực tuyến sử dụng mã QR."],
  ["VietQR", "Chuẩn mã QR chuyển khoản liên ngân hàng tại Việt Nam do NAPAS phát triển."],
  ["EMVCo QR", "Chuẩn quốc tế cho mã QR thanh toán, nền tảng của nhiều chuẩn quốc gia."],
];

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

export default function Glossary() {
  const [q, setQ] = useState("");
  const list = TERMS.filter(([t, d]) => fold(t + " " + d).includes(fold(q)));
  return (
    <Section id="thuat-ngu">
      <SectionHeading n={15} kicker="Glossary" title="Bảng thuật ngữ" />
      <div className="mb-6 max-w-md">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm thuật ngữ… (gõ không dấu cũng được)"
          className="w-full rounded-xl border border-line-strong bg-bg-soft px-4 py-3 outline-none focus:border-mint/70"
          aria-label="Tìm thuật ngữ"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(([t, d]) => (
          <div key={t} className="card spot lift pop p-5">
            <div className="mono font-bold text-mint">{t}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-dim">Không tìm thấy thuật ngữ phù hợp.</p>}
      </div>
    </Section>
  );
}
