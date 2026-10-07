"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Award, CircleCheck, CircleX, Lightbulb, Medal, RotateCw, Sprout, Trophy } from "lucide-react";
import { confetti } from "@/lib/confetti";
import { Section, SectionHeading } from "../ui/Section";

const QUESTIONS = [
  {
    q: "Mã QR được phát minh năm nào, bởi công ty nào?",
    options: ["1984 – Sony", "1994 – Denso Wave", "2000 – Toyota", "2006 – ISO"],
    answer: 1,
    why: "Kỹ sư Masahiro Hara và cộng sự tại Denso Wave phát minh mã QR năm 1994 để theo dõi linh kiện ô tô.",
  },
  {
    q: "Mẫu định vị có tỉ lệ đen-trắng-đen-trắng-đen là bao nhiêu?",
    options: ["1:2:1:2:1", "1:1:3:1:1", "3:1:1:1:3", "1:1:1:1:1"],
    answer: 1,
    why: "Tỉ lệ 1:1:3:1:1 rất hiếm gặp trong ấn phẩm in, nên máy quét không nhầm với hình khác.",
  },
  {
    q: "Mã QR phiên bản 10 có bao nhiêu module mỗi cạnh?",
    options: ["47", "57", "61", "41"],
    answer: 1,
    why: "4 × 10 + 17 = 57 module.",
  },
  {
    q: "Chuỗi “HELLO WORLD” nên được mã hóa ở chế độ nào?",
    options: ["Numeric", "Alphanumeric", "Byte", "Kanji"],
    answer: 1,
    why: "Chỉ gồm chữ in hoa và dấu cách — đều thuộc bảng 45 ký tự Alphanumeric (2 ký tự → 11 bit).",
  },
  {
    q: "Mức sửa lỗi nào nên dùng khi chèn logo vào giữa mã?",
    options: ["L (~7%)", "M (~15%)", "H (~30%)", "Không cần sửa lỗi"],
    answer: 2,
    why: "Logo che mất một phần dữ liệu; mức H khôi phục được khoảng 30% codeword.",
  },
  {
    q: "Với n codeword sửa lỗi, Reed–Solomon sửa được tối đa bao nhiêu codeword sai ở vị trí chưa biết?",
    options: ["n", "n/2", "2n", "n − 1"],
    answer: 1,
    why: "n/2 codeword sai ở vị trí chưa biết, hoặc n codeword bị xóa ở vị trí đã biết.",
  },
  {
    q: "Vì sao cần áp mặt nạ lên vùng dữ liệu?",
    options: [
      "Để mã hóa bí mật nội dung",
      "Để tránh mảng màu lớn và hình giống mẫu định vị",
      "Để tăng dung lượng",
      "Để đổi màu mã",
    ],
    answer: 1,
    why: "Mặt nạ phá vỡ các mẫu bất lợi; bộ tạo mã thử 8 mặt nạ và chọn mặt nạ có điểm phạt thấp nhất.",
  },
  {
    q: "Vùng trống (quiet zone) tối thiểu của mã QR thường là bao nhiêu?",
    options: ["1 module", "2 module", "4 module", "Không cần"],
    answer: 2,
    why: "Tối thiểu 4 module (Micro QR là 2 module). Thiếu vùng trống là lỗi phổ biến khiến mã không quét được.",
  },
  {
    q: "Một poster được đọc từ khoảng cách 2 m nên in mã cỡ khoảng bao nhiêu?",
    options: ["2 cm", "5 cm", "20 cm", "1 m"],
    answer: 2,
    why: "Quy tắc kinh nghiệm: cạnh mã ≈ khoảng cách quét ÷ 10 → 200 cm ÷ 10 = 20 cm.",
  },
  {
    q: "“Quishing” là gì?",
    options: [
      "Mã QR hình chữ nhật",
      "Lừa đảo trực tuyến sử dụng mã QR",
      "Kỹ thuật nén dữ liệu QR",
      "Chuẩn thanh toán QR",
    ],
    answer: 1,
    why: "QR + phishing: mã QR dẫn tới trang giả mạo để đánh cắp mật khẩu, OTP.",
  },
];

export default function Quiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const score = picked.filter((p, k) => p === QUESTIONS[k].answer).length;
  const done = picked.every((p) => p !== null);
  const q = QUESTIONS[i];
  const p = picked[i];

  const pick = (o: number) => {
    if (p !== null) return;
    const next = [...picked];
    next[i] = o;
    setPicked(next);
    if (next.every((x) => x !== null)) {
      const s = next.filter((x, k) => x === QUESTIONS[k].answer).length;
      if (s >= 7) setTimeout(() => confetti(), 400);
    }
  };

  const badge =
    score === 10
      ? { icon: Trophy, title: "Bậc thầy QR", text: "Hoàn hảo! Bạn có thể tự tay vẽ một mã QR rồi đấy." }
      : score >= 7
        ? { icon: Medal, title: "Chuyên gia QR", text: "Rất giỏi! Chỉ còn vài chi tiết nhỏ nữa thôi." }
        : score >= 4
          ? { icon: Award, title: "Người khám phá", text: "Khá lắm! Lướt lại vài chương để lên hạng nhé." }
          : { icon: Sprout, title: "Tân binh", text: "Khởi đầu tốt! Hãy thử phòng thí nghiệm ở chương 7 rồi quay lại." };

  return (
    <Section id="thu-thach">
      <SectionHeading
        n={16}
        kicker="Final Challenge"
        title="Thử thách cuối: bạn hiểu mã QR đến đâu?"
        lead="10 câu hỏi nhanh tổng hợp từ toàn bộ tài liệu. Trả lời hết để nhận huy hiệu!"
      />
      <div className="card mx-auto max-w-3xl overflow-hidden">
        <div className="h-1.5 bg-panel-2">
          <div
            className="h-full bg-gradient-to-r from-mint to-cyan transition-all duration-500"
            style={{ width: `${(picked.filter((x) => x !== null).length / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <div key={i} className="pop p-6 sm:p-8">
          <div className="flex items-center justify-between text-sm">
            <span className="mono text-mint">
              Câu {i + 1}/{QUESTIONS.length}
            </span>
            <span className="mono text-muted">Điểm: {score}</span>
          </div>
          <h3 className="mt-3 text-xl font-bold sm:text-2xl">{q.q}</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((o, k) => {
              const isAns = k === q.answer;
              const chosen = p === k;
              return (
                <button
                  key={o}
                  onClick={() => pick(k)}
                  disabled={p !== null}
                  className={`rounded-xl border p-4 text-left transition ${
                    p === null
                      ? "border-line-strong hover:-translate-y-0.5 hover:border-mint/60 hover:bg-panel-2"
                      : isAns
                        ? "border-mint bg-mint/10"
                        : chosen
                          ? "shake border-red bg-red/10"
                          : "border-line opacity-50"
                  }`}
                >
                  <span className="mono mr-2 text-dim">{"ABCD"[k]}.</span>
                  {o}
                  {p !== null && isAns && <CircleCheck size={20} className="float-right text-mint" aria-hidden />}
                  {chosen && !isAns && <CircleX size={20} className="float-right text-red" aria-hidden />}
                </button>
              );
            })}
          </div>
          {p !== null && <p className="pop mt-5 rounded-xl bg-bg-soft p-4 text-sm leading-relaxed text-muted">
              <Lightbulb size={16} className="mr-1.5 inline -translate-y-0.5 text-amber" aria-hidden />
              {q.why}
            </p>}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setI((x) => Math.max(0, x - 1))}
              disabled={i === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-4 py-2 text-sm disabled:opacity-30"
            >
              <ArrowLeft size={16} aria-hidden />
              Câu trước
            </button>
            {i < QUESTIONS.length - 1 ? (
              <button
                onClick={() => setI((x) => x + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
                disabled={p === null}
              >
                Câu tiếp
                <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <button
                onClick={() => {
                  setPicked(QUESTIONS.map(() => null));
                  setI(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-4 py-2 text-sm"
              >
                <RotateCw size={16} aria-hidden />
                Làm lại
              </button>
            )}
          </div>
        </div>
        {done && (
          <div className="pop border-t border-line bg-gradient-to-br from-mint/10 to-violet/10 p-6 text-center sm:p-8">
            <div className="text-6xl" style={{ animation: "wiggle 1.2s ease-in-out infinite" }}>
              <badge.icon size={64} className="mx-auto" aria-hidden />
            </div>
            <div className="mt-3 text-2xl font-extrabold">{badge.title}</div>
            <div className="mono mt-1 text-lg text-mint">
              {score}/{QUESTIONS.length} câu đúng
            </div>
            <p className="mt-2 text-muted">{badge.text}</p>
          </div>
        )}
      </div>
    </Section>
  );
}
