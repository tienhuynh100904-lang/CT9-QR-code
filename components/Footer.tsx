import { ArrowUp, BookMarked, Coffee, Info, Mail, QrCode, ShieldCheck } from "lucide-react";

const REFS = [
  "ISO/IEC 18004 – Information technology – Automatic identification and data capture techniques – QR Code bar code symbology specification.",
  "ISO/IEC 23941:2022 – Rectangular Micro QR Code (rMQR) bar code symbology specification.",
  "Website chính thức của Denso Wave về mã QR: www.qrcode.com",
  "Tài liệu chuẩn VietQR của NAPAS: vietqr.net",
  "EMVCo – EMV QR Code Specification for Payment Systems.",
];

function ColTitle({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-ink uppercase">
      <Icon size={16} className="text-mint" aria-hidden />
      {children}
    </h2>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1.3fr_1fr]">
        {/* Giới thiệu */}
        <section>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/15 text-mint">
              <QrCode size={20} aria-hidden />
            </span>
            <span className="text-lg font-bold">
              Sản phẩm của <span className="text-mint">CT9</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Một sản phẩm vibe code của <b className="text-ink">CT9</b> – dự án phi lợi nhuận nhằm phổ biến chuẩn QR Code
            Việt Nam.
          </p>
          <p className="mt-3 flex gap-2 text-sm leading-relaxed text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-mint" aria-hidden />
            Mọi mã QR trên trang được tạo trực tiếp trong trình duyệt bằng bộ mã hóa viết riêng; không có dữ liệu nào được
            gửi đi.
          </p>
        </section>

        {/* Tài liệu tham khảo */}
        <section>
          <ColTitle icon={BookMarked}>Tài liệu tham khảo gợi ý</ColTitle>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            {REFS.map((r, i) => (
              <li key={r} className="flex gap-3">
                <span className="mono mt-0.5 text-xs text-mint">{String(i + 1).padStart(2, "0")}</span>
                {r}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-l-2 border-line-strong pl-3 text-xs leading-relaxed text-dim">
            Danh mục được tổng hợp từ kiến thức chung, không tra cứu trực tiếp khi soạn tài liệu; bạn nên kiểm tra lại phiên
            bản mới nhất của các tiêu chuẩn và trang web trên.
          </p>
        </section>

        {/* Liên hệ & ủng hộ */}
        <section className="space-y-6 md:col-span-2 lg:col-span-1">
          <div>
            <ColTitle icon={Mail}>Góp ý &amp; chỉnh sửa</ColTitle>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Thông tin chỉ mang tính tham khảo, chúng tôi không chịu trách nhiệm về tính chính xác và đầy đủ của dữ liệu. Nếu
              có sai sót, vui lòng liên hệ:
            </p>
            <a
              href="mailto:tienhuynh10904@gmail.com"
              className="mt-2 inline-block text-sm font-semibold break-all text-mint hover:underline"
            >
              tienhuynh10904@gmail.com
            </a>
          </div>
          <div className="rounded-2xl border border-line bg-panel/60 p-4">
            <ColTitle icon={Coffee}>Ủng hộ một cốc cà phê</ColTitle>
            <p className="mt-3 text-sm text-muted">
              Ngân hàng <b className="text-ink">MB</b>
            </p>
            <p className="mono mt-1 text-lg font-bold tracking-wider text-ink">0966016561</p>
          </div>
        </section>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <p className="text-xs text-dim">QR Code là nhãn hiệu đã đăng ký của DENSO WAVE INCORPORATED.</p>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-1.5 text-sm text-ink transition hover:bg-panel-2"
          >
            <ArrowUp size={16} aria-hidden />
            Về đầu trang
          </a>
        </div>
      </div>
    </footer>
  );
}
