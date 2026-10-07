"use client";

import { useState } from "react";
import { CircleCheck, CircleX, FlaskConical } from "lucide-react";
import { BLOCK_COLORS } from "@/lib/qr/render";
import { ECC_INFO, ECC_LEVELS } from "@/lib/qr/tables";
import Reveal from "../ui/Reveal";
import { Callout, Section, SectionHeading, SubHeading } from "../ui/Section";
import DamageLab from "./DamageLab";

type Cell = { b: number; k: number };
const IL_BLOCKS = 3;
const IL_LEN = 8;
const IL_CAP = 2;

function InterleaveRow({ title, seq, pos, width }: { title: string; seq: Cell[]; pos: number; width: number }) {
  const hit = (i: number) => i >= pos && i < pos + width;
  const errors = [0, 0, 0];
  seq.forEach((x, i) => {
    if (hit(i)) errors[x.b]++;
  });
  const ok = errors.every((e) => e <= IL_CAP);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{title}</span>
        <span className={`inline-flex items-center gap-1.5 font-semibold ${ok ? "text-mint" : "text-red"}`}>
          {ok ? <CircleCheck size={16} aria-hidden /> : <CircleX size={16} aria-hidden />}
          {ok ? "Sửa được" : "Không sửa được"}
        </span>
      </div>
      <div className="relative flex gap-[2px] sm:gap-[3px]">
        {seq.map((x, i) => (
          <div
            key={i}
            className="mono relative flex h-10 min-w-0 flex-1 items-center justify-center overflow-hidden rounded text-[8px] font-bold text-bg sm:text-xs"
            style={{ background: BLOCK_COLORS[x.b] }}
          >
            {"ABC"[x.b]}
            {x.k + 1}
            {hit(i) && <span className="absolute inset-0 rounded bg-[#5b3a29]/85" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-xs">
        {errors.map((e, b) => (
          <span key={b} className={e > IL_CAP ? "text-red" : "text-muted"}>
            Khối {"ABC"[b]}: {e} lỗi
          </span>
        ))}
      </div>
    </div>
  );
}

const PLAIN: Cell[] = Array.from({ length: IL_BLOCKS * IL_LEN }, (_, i) => ({ b: Math.floor(i / IL_LEN), k: i % IL_LEN }));
const MIXED: Cell[] = Array.from({ length: IL_BLOCKS * IL_LEN }, (_, i) => ({ b: i % IL_BLOCKS, k: Math.floor(i / IL_BLOCKS) }));

function InterleaveDemo() {
  const [pos, setPos] = useState(5);
  const [width, setWidth] = useState(5);
  const maxPos = IL_BLOCKS * IL_LEN - width;
  const p = Math.min(pos, maxPos);
  return (
    <div className="card spot p-6 sm:p-8">
      <p className="mb-5 text-sm text-muted">
        3 khối A, B, C — mỗi khối sửa được tối đa <b className="text-ink">{IL_CAP}</b> codeword lỗi. Di chuyển vết bẩn để so
        sánh:
      </p>
      <div className="space-y-6">
        <InterleaveRow title="Không đan xen" seq={PLAIN} pos={p} width={width} />
        <InterleaveRow title="Có đan xen" seq={MIXED} pos={p} width={width} />
      </div>
      <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <label className="flex items-center gap-3">
          <span className="w-28 text-muted">Vị trí vết bẩn</span>
          <input type="range" min={0} max={maxPos} value={p} onChange={(e) => setPos(+e.target.value)} className="flex-1" />
        </label>
        <label className="flex items-center gap-3">
          <span className="w-28 text-muted">Độ rộng: {width}</span>
          <input type="range" min={1} max={9} value={width} onChange={(e) => setWidth(+e.target.value)} className="flex-1" />
        </label>
      </div>
    </div>
  );
}

function DivisionDiagram() {
  return (
    <div className="card spot p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
        <div>
          <div className="flex gap-1">
            {[32, 91, 11, 120, 209].map((v) => (
              <span key={v} className="mono flex h-10 w-11 items-center justify-center rounded-md bg-cyan/20 text-sm text-cyan">
                {v}
              </span>
            ))}
            <span className="self-center text-dim">…</span>
          </div>
          <div className="mt-1.5 text-xs text-dim">codeword dữ liệu = hệ số đa thức</div>
        </div>
        <span className="mono text-3xl text-dim">÷</span>
        <div>
          <div className="mono flex h-10 items-center rounded-md border border-violet/40 bg-violet/10 px-3 text-sm text-violet">
            g(x) = (x − α⁰)(x − α¹)…
          </div>
          <div className="mt-1.5 text-xs text-dim">đa thức sinh</div>
        </div>
        <span className="mono text-3xl text-dim">→</span>
        <div>
          <div className="flex gap-1">
            {[168, 72, 22, 82].map((v) => (
              <span key={v} className="mono flex h-10 w-11 items-center justify-center rounded-md bg-orange/20 text-sm text-orange">
                {v}
              </span>
            ))}
            <span className="self-center text-dim">…</span>
          </div>
          <div className="mt-1.5 text-xs text-dim">phần dư = codeword sửa lỗi</div>
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Muốn xem từng bước phép chia? Hãy tới{" "}
        <a href="#lab" className="text-mint underline-offset-4 hover:underline">
          Bước 4 của phòng thí nghiệm
        </a>
        .
      </p>
    </div>
  );
}

export default function ErrorCorrection() {
  return (
    <Section id="sua-loi">
      <SectionHeading
        n={5}
        kicker="Reed–Solomon"
        title="Cơ chế sửa lỗi Reed–Solomon"
        lead="Mã QR dùng thuật toán sửa lỗi Reed–Solomon trên trường hữu hạn GF(256). Người tạo mã chọn một trong bốn mức, đánh đổi giữa khả năng chịu hư hỏng và dung lượng."
      />
      <SubHeading n="5.1">Bốn mức sửa lỗi</SubHeading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ECC_LEVELS.map((e, i) => (
          <Reveal key={e} delay={i * 70}>
            <div className="card spot lift h-full p-5">
              <div className="flex items-baseline justify-between">
                <span className="mono text-4xl font-extrabold text-mint">{e}</span>
                <span className="text-sm text-dim">{ECC_INFO[e].name}</span>
              </div>
              <div className="mt-4 h-24 overflow-hidden rounded-xl bg-bg-soft p-2">
                <div className="grid h-full grid-cols-10 gap-[3px]">
                  {Array.from({ length: 30 }, (_, k) => (
                    <span
                      key={k}
                      className="rounded-[2px]"
                      style={{
                        background: k < Math.round((ECC_INFO[e].percent / 100) * 30) ? "#ff8a4c" : "#4cc9f0",
                        opacity: k < Math.round((ECC_INFO[e].percent / 100) * 30) ? 0.9 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 text-lg font-bold">
                ~{ECC_INFO[e].percent}% <span className="text-sm font-normal text-muted">codeword khôi phục được</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{ECC_INFO[e].use}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid gap-8 lg:grid-cols-2">
        <Reveal>
          <SubHeading n="5.2">Nguyên lý hoạt động</SubHeading>
          <p className="leading-relaxed text-muted">
            Dữ liệu được chia thành các codeword 8 bit. Với mỗi khối dữ liệu, thuật toán coi các codeword là{" "}
            <b className="text-ink">hệ số của một đa thức</b>, rồi chia đa thức đó cho một “đa thức sinh” có bậc bằng số
            codeword sửa lỗi cần tạo. <b className="text-ink">Phần dư</b> của phép chia chính là các codeword sửa lỗi, được
            nối thêm vào sau dữ liệu.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Khi đọc, máy quét tính lại “hội chứng” (syndrome) của khối nhận được. Nếu tất cả bằng 0 thì dữ liệu không lỗi;
            nếu không, thuật toán (thường là Berlekamp–Massey kết hợp tìm kiếm Chien và công thức Forney) xác định vị trí và
            giá trị lỗi rồi sửa lại. Với <b className="text-ink">n</b> codeword sửa lỗi, có thể sửa tối đa{" "}
            <b className="text-ink">n/2</b> codeword sai ở vị trí chưa biết, hoặc <b className="text-ink">n</b> codeword bị
            xóa ở vị trí đã biết.
          </p>
          <div className="mt-6">
            <DivisionDiagram />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <SubHeading n="5.3">Chia khối và đan xen (Interleaving)</SubHeading>
          <p className="mb-6 leading-relaxed text-muted">
            Với các phiên bản lớn, dữ liệu được chia thành nhiều khối, mỗi khối có mã sửa lỗi riêng. Sau đó các codeword
            của các khối được đan xen với nhau trước khi đặt lên mã. Nhờ vậy, một vết bẩn tập trung ở một chỗ sẽ phân tán
            lỗi sang nhiều khối, khối nào cũng chỉ hỏng một ít và vẫn sửa được.
          </p>
          <InterleaveDemo />
        </Reveal>
      </div>

      <Reveal className="mt-16">
        <SubHeading>
          <span className="inline-flex items-center gap-2">
            <FlaskConical size={22} aria-hidden />
            Thử phá hỏng mã QR
          </span>
        </SubHeading>
        <DamageLab />
      </Reveal>

      <Reveal className="mt-8">
        <Callout tone="warn" title="Hiểu lầm thường gặp">
          Mức H không có nghĩa là có thể che 30% diện tích mã ở bất kỳ đâu. Các mẫu định vị, thông tin định dạng và vùng
          trống không được bảo vệ bởi Reed–Solomon; che vào các vùng này có thể làm mã không đọc được dù mức sửa lỗi cao.
        </Callout>
      </Reveal>
    </Section>
  );
}
