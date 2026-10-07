"use client";

import { useState } from "react";
import { Ban, Bandage, Bug, CircleCheck, CircleParking, Coffee, Fish, Frown, Gift, Hotel, Landmark, Mail, Mailbox, PartyPopper, ScanSearch, Send, Zap, ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { confetti } from "@/lib/confetti";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const ATTACKS = [
  {
    icon: Fish,
    title: "Quishing (QR phishing)",
    text: "Mã QR trong email, tin nhắn, thư giả mạo dẫn tới trang web giả ngân hàng, cơ quan nhà nước để đánh cắp mật khẩu, OTP.",
  },
  {
    icon: Bandage,
    title: "Dán đè mã thanh toán",
    text: "Kẻ gian dán mã QR của chúng lên mã QR thanh toán thật tại cửa hàng, bãi gửi xe, trạm sạc… khiến tiền chuyển vào tài khoản lạ.",
  },
  { icon: Bug, title: "Phát tán mã độc", text: "Mã dẫn tới tệp cài đặt ứng dụng (APK) giả mạo, chiếm quyền điều khiển điện thoại." },
  {
    icon: Landmark,
    title: "Giả cơ quan chức năng",
    text: "Giả danh điện lực, thuế, công an yêu cầu quét mã để “cập nhật thông tin”.",
  },
  {
    icon: Send,
    title: "Lạm dụng định dạng đặc biệt",
    text: "Mã tự động soạn tin nhắn tới đầu số thu phí, thêm danh bạ, kết nối Wi-Fi giả mạo.",
  },
];

const SCENARIOS: { where: string; icon: LucideIcon; context: string; shown: React.ReactNode; safe: boolean; why: string }[] = [
  {
    where: "Email lạ",
    icon: Mail,
    context: "“Tài khoản ngân hàng của bạn bị tạm khóa. Quét mã để xác minh ngay trong 24 giờ.”",
    shown: (
      <>
        https://<b className="text-red">vietcornbank</b>-xacminh.com/login
      </>
    ),
    safe: false,
    why: "Tên miền “vietcornbank” (r + n giả chữ m) nhái vietcombank, lại đến từ email lạ và hối thúc — đúng kịch bản quishing.",
  },
  {
    where: "Quán cà phê",
    icon: Coffee,
    context: "Mã in trên bảng gỗ ở bàn, kèm dòng chữ “Quét để xem thực đơn” và logo quán.",
    shown: <>https://menu.quancaphe.vn/ban-12</>,
    safe: true,
    why: "Nguồn rõ ràng, có lời kêu gọi hành động, đường dẫn khớp tên quán và không đòi thông tin nhạy cảm. Vẫn nên liếc qua tên miền trước khi mở.",
  },
  {
    where: "Bãi gửi xe",
    icon: CircleParking,
    context: "Mã thanh toán dán trên cột, mép giấy hơi bong, màu khác hẳn tấm biển xung quanh.",
    shown: (
      <>
        Người nhận: <b className="text-red">TRAN VAN B</b> (không phải tên bãi xe)
      </>
    ),
    safe: false,
    why: "Dấu hiệu dán đè: mép bong, khác màu, và tên người nhận hiển thị trong ứng dụng ngân hàng không khớp đơn vị thu tiền.",
  },
  {
    where: "Tin nhắn SMS",
    icon: Zap,
    context: "“ĐIỆN LỰC: Quét mã cập nhật thông tin khách hàng và nhập OTP để tránh bị cắt điện.”",
    shown: <>https://evn-capnhat-thongtin.online</>,
    safe: false,
    why: "Cơ quan nhà nước và ngân hàng không yêu cầu quét mã để nhập mật khẩu, OTP. Tên miền lạ giả danh điện lực.",
  },
  {
    where: "Tờ rơi phát ngoài đường",
    icon: Gift,
    context: "“Tải ứng dụng ngân hàng phiên bản mới để nhận quà 500.000đ!”",
    shown: (
      <>
        https://qua-tang-vip.top/<b className="text-red">app-ngan-hang.apk</b>
      </>
    ),
    safe: false,
    why: "Tệp .apk cài ngoài kho ứng dụng chính thức có thể chiếm quyền điều khiển điện thoại. Chỉ cài ứng dụng từ kho chính thức.",
  },
  {
    where: "Quầy lễ tân khách sạn",
    icon: Hotel,
    context: "Nhân viên lễ tân đưa thẻ có mã Wi-Fi khi bạn nhận phòng.",
    shown: <>Kết nối Wi-Fi “KhachSan_Guest” (WPA)</>,
    safe: true,
    why: "Nguồn đáng tin (nhân viên trực tiếp đưa), nội dung đúng như mô tả. Dù vậy, tránh đăng nhập tài khoản nhạy cảm trên Wi-Fi công cộng.",
  },
  {
    where: "Poster “bốc thăm trúng thưởng”",
    icon: Mailbox,
    context: "“Quét để đăng ký tham gia, cơ hội trúng iPhone!”",
    shown: (
      <>
        Soạn tin: <b className="text-red">DK VIP</b> gửi <b className="text-red">8x77</b>
      </>
    ),
    safe: false,
    why: "Mã tự động soạn tin nhắn tới đầu số thu phí — lạm dụng định dạng SMSTO. Luôn đọc kỹ trước khi bấm gửi.",
  },
];

const HABITS = [
  "Luôn xem trước đường dẫn hiển thị sau khi quét; kiểm tra kỹ tên miền (chú ý các tên gần giống như vietcornbank thay vì vietcombank).",
  "Khi thanh toán, kiểm tra tên người nhận hiển thị trên ứng dụng ngân hàng trước khi xác nhận.",
  "Quan sát xem mã có dấu hiệu bị dán đè, bong mép, in khác màu so với xung quanh hay không.",
  "Không quét mã từ nguồn lạ, email/tin nhắn không rõ người gửi; cơ quan nhà nước và ngân hàng không yêu cầu quét mã để nhập mật khẩu, OTP.",
  "Không cài ứng dụng từ đường dẫn trong mã QR; chỉ cài từ kho ứng dụng chính thức.",
  "Dùng ứng dụng quét có tính năng kiểm tra độ an toàn của URL; cập nhật hệ điều hành thường xuyên.",
  "Với doanh nghiệp: dùng QR động có tên miền riêng, in mã trên vật liệu khó bóc dán, kiểm tra định kỳ các điểm đặt mã.",
];

function Challenge() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => SCENARIOS.map(() => null));
  const sc = SCENARIOS[i];
  const answered = answers[i];
  const correct = answers.filter((a, k) => a !== null && a === SCENARIOS[k].safe).length;
  const doneCount = answers.filter((a) => a !== null).length;
  const finished = doneCount === SCENARIOS.length;

  const answer = (safe: boolean) => {
    if (answered !== null) return;
    const next = [...answers];
    next[i] = safe;
    setAnswers(next);
    const total = next.filter((a, k) => a !== null && a === SCENARIOS[k].safe).length;
    if (next.every((a) => a !== null) && total >= SCENARIOS.length - 1) setTimeout(() => confetti(), 300);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel-2/40 px-6 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <ScanSearch size={20} aria-hidden />
          Thử thách: Bạn có bị lừa không?
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex gap-1">
            {SCENARIOS.map((s, k) => (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-label={`Tình huống ${k + 1}`}
                className={`h-2.5 w-6 rounded-full transition ${
                  answers[k] === null
                    ? k === i
                      ? "bg-ink"
                      : "bg-line-strong"
                    : answers[k] === s.safe
                      ? "bg-mint"
                      : "bg-red"
                }`}
              />
            ))}
          </div>
          <span className="mono text-muted">
            Đúng {correct}/{SCENARIOS.length}
          </span>
        </div>
      </div>
      <div key={i} className="pop grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
        <div>
          <div className="mono text-xs tracking-widest text-mint uppercase">
            Tình huống {i + 1} · {sc.where}
          </div>
          <p className="mt-3 text-lg leading-relaxed">{sc.context}</p>
          {answered === null ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => answer(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-mint/60 bg-mint/10 px-5 py-3 font-semibold text-mint transition hover:bg-mint/20"
              >
                <CircleCheck size={18} aria-hidden />
                An toàn, mở luôn
              </button>
              <button
                onClick={() => answer(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-red/60 bg-red/10 px-5 py-3 font-semibold text-red transition hover:bg-red/20"
              >
                <Ban size={18} aria-hidden />
                Nguy hiểm, bỏ qua
              </button>
            </div>
          ) : (
            <div
              className={`pop mt-6 rounded-2xl border p-4 ${
                answered === sc.safe ? "border-mint/50 bg-mint/[0.07]" : "shake border-red/50 bg-red/[0.07]"
              }`}
            >
              <div className={`flex items-start gap-2 font-bold ${answered === sc.safe ? "text-mint" : "text-red"}`}>
                {answered === sc.safe ? (
                  <PartyPopper size={20} className="mt-0.5 shrink-0" aria-hidden />
                ) : (
                  <Frown size={20} className="mt-0.5 shrink-0" aria-hidden />
                )}
                <span>
                  {answered === sc.safe ? "Chính xác!" : "Chưa đúng!"} Đây là mã {sc.safe ? "tương đối an toàn" : "nguy hiểm"}.
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{sc.why}</p>
            </div>
          )}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setI((x) => Math.max(0, x - 1))}
              disabled={i === 0}
              aria-label="Tình huống trước"
              className="inline-flex items-center rounded-lg border border-line-strong px-3 py-1.5 text-sm disabled:opacity-30"
            >
              <ArrowLeft size={16} aria-hidden />
            </button>
            <button
              onClick={() => setI((x) => Math.min(SCENARIOS.length - 1, x + 1))}
              disabled={i === SCENARIOS.length - 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-sm disabled:opacity-30"
            >
              Tình huống tiếp
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
          {finished && (
            <p className="mt-4 text-sm text-muted">
              Kết quả: <b className="text-ink">{correct}/{SCENARIOS.length}</b>{" "}
              {correct === SCENARIOS.length ? "— bạn là “thám tử QR” thực thụ!" : "— xem lại các thói quen an toàn bên dưới nhé."}
            </p>
          )}
        </div>
        {/* Mô phỏng màn hình điện thoại sau khi quét */}
        <div className="mx-auto w-full max-w-[280px] rounded-[32px] border-[6px] border-panel-2 bg-bg-soft p-4 shadow-2xl">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-panel-2" />
          <sc.icon size={40} className="mx-auto" aria-hidden />
          <div className="mt-3 rounded-xl bg-panel p-3">
            <div className="text-[11px] text-dim">Mã QR chứa:</div>
            <div className="mono mt-1 text-xs leading-relaxed break-all text-ink">{sc.shown}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <span className="rounded-lg bg-panel-2 py-2 text-muted">Hủy</span>
            <span className="rounded-lg bg-cyan/30 py-2 text-cyan">Mở</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Habits() {
  const [done, setDone] = useState<boolean[]>(() => HABITS.map(() => false));
  const n = done.filter(Boolean).length;
  return (
    <div className="card p-6 sm:p-8">
      <div className="mb-5 flex items-center gap-4">
        <div
          className="relative h-14 w-14 shrink-0 rounded-full"
          style={{ background: `conic-gradient(var(--mint) ${(n / HABITS.length) * 360}deg, var(--panel-2) 0)` }}
        >
          <div className="mono absolute inset-1.5 flex items-center justify-center rounded-full bg-panel text-sm font-bold">
            {n}/{HABITS.length}
          </div>
        </div>
        <p className="text-sm text-muted">Đánh dấu những thói quen bạn đã có. Mục tiêu: đủ {HABITS.length}/{HABITS.length}!</p>
      </div>
      <ol className="space-y-2">
        {HABITS.map((h, k) => (
          <li key={k}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                done[k] ? "border-mint/40 bg-mint/[0.06]" : "border-line hover:bg-white/[0.03]"
              }`}
            >
              <input
                type="checkbox"
                checked={done[k]}
                onChange={() => setDone(done.map((d, j) => (j === k ? !d : d)))}
                className="mt-0.5 h-4 w-4 accent-[var(--mint)]"
              />
              <span className={done[k] ? "text-ink" : "text-muted"}>
                <span className="mono mr-2 text-mint">{k + 1}.</span>
                {h}
              </span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Security() {
  return (
    <Section id="bao-mat">
      <SectionHeading
        n={10}
        kicker="Security"
        title="Bảo mật và lừa đảo qua mã QR"
        lead="Mã QR chỉ là một cách lưu dữ liệu; bản thân nó không an toàn hay nguy hiểm. Rủi ro nằm ở chỗ con người không thể “đọc” mã bằng mắt, nên rất dễ bị dẫn tới nội dung độc hại mà không biết."
      />
      <SubHeading n="10.1">Các hình thức tấn công phổ biến</SubHeading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ATTACKS.map((a, i) => (
          <Reveal key={a.title} delay={i * 60}>
            <div className="card spot lift h-full p-5">
              <div className="text-3xl" style={{ animation: `float 4s ease-in-out ${i * 0.4}s infinite` }}>
                <a.icon size={30} aria-hidden />
              </div>
              <div className="mt-3 font-semibold">{a.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{a.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12">
        <Challenge />
      </Reveal>

      <Reveal className="mt-16">
        <SubHeading n="10.2">Biện pháp phòng tránh</SubHeading>
        <Habits />
      </Reveal>
    </Section>
  );
}
