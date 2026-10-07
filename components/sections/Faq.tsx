import Reveal from "../ui/Reveal";
import { Section, SectionHeading } from "../ui/Section";

const FAQ = [
  {
    q: "Mã QR có hết hạn không?",
    a: "Mã QR tĩnh không bao giờ hết hạn vì dữ liệu nằm sẵn trong mã. Tuy nhiên nếu mã chứa URL mà website ngừng hoạt động, hoặc mã QR động mà dịch vụ ngừng gia hạn, thì mã sẽ không dẫn tới đâu.",
  },
  {
    q: "Có bao nhiêu mã QR khác nhau có thể tạo ra?",
    a: "Số lượng là gần như vô hạn trong thực tế. Riêng phiên bản 40 có hàng nghìn byte dữ liệu, tức số tổ hợp lớn hơn rất nhiều lần số nguyên tử trong vũ trụ quan sát được; không có nguy cơ “hết mã”.",
  },
  {
    q: "Mã QR có thể chứa virus không?",
    a: "Bản thân mã QR chỉ là dữ liệu văn bản, không thể “chạy” virus. Nguy hiểm đến từ nội dung mà nó dẫn tới, như trang web lừa đảo hoặc tệp cài đặt độc hại.",
  },
  {
    q: "Tại sao mã QR của tôi không quét được?",
    a: "Nguyên nhân phổ biến: thiếu vùng trống, độ tương phản thấp, in quá nhỏ so với lượng dữ liệu, logo che vào vùng quan trọng, bề mặt in bị lóa hoặc cong, ảnh mờ, hoặc mã bị đảo màu.",
  },
  {
    q: "Mã QR có lưu được tiếng Việt có dấu không?",
    a: "Có. Dùng chế độ Byte với bảng mã UTF-8 (nên khai báo ECI 26 để tương thích tốt nhất). Hầu hết thư viện hiện đại đều tự xử lý việc này.",
  },
  {
    q: "Có thể đọc mã QR khi không có Internet không?",
    a: "Có. Việc giải mã diễn ra ngay trên thiết bị. Chỉ khi nội dung là đường dẫn web thì mới cần Internet để mở trang.",
  },
  {
    q: "Mã QR có thể in màu hoặc đổi hình dạng không?",
    a: "Có, miễn là đảm bảo độ tương phản giữa module tối và sáng, giữ nguyên cấu trúc các mẫu định vị và vùng trống, và dùng mức sửa lỗi đủ cao nếu thay đổi nhiều.",
  },
  {
    q: "Một mã QR có thể bị sao chép không?",
    a: "Rất dễ: chỉ cần chụp ảnh. Vì vậy không nên dùng mã QR tĩnh làm cơ chế bảo mật duy nhất (ví dụ vé, phiếu giảm giá); cần kết hợp kiểm tra trên máy chủ, mã dùng một lần hoặc chữ ký số.",
  },
];

export default function Faq() {
  return (
    <Section id="hoi-dap">
      <SectionHeading n={14} kicker="FAQ" title="Câu hỏi thường gặp" />
      <div className="grid gap-3 md:grid-cols-2">
        {FAQ.map((f, i) => (
          <Reveal key={f.q} delay={(i % 2) * 80}>
            <details className="card group open:border-mint/40">
              <summary className="flex cursor-pointer items-center gap-4 p-5 font-semibold">
                <span className="mono flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-sm text-mint">
                  ?
                </span>
                <span className="flex-1">{f.q}</span>
                <span className="text-xl text-dim transition group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 pl-[4.25rem] leading-relaxed text-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
