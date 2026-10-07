"use client";

import { useState, type ReactNode } from "react";
import { Apple, Bot, Check, Copy, MessageSquare } from "lucide-react";
import Reveal from "../ui/Reveal";
import { Section, SectionHeading, SubHeading } from "../ui/Section";

const LIBS = [
  ["Python", "qrcode, segno", "pyzbar, OpenCV (QRCodeDetector)"],
  ["JavaScript", "qrcode (npm), qrcode.js, QRCode Styling", "jsQR, html5-qrcode, ZXing-js"],
  ["Java / Android", "ZXing", "ZXing, Google ML Kit Barcode Scanning"],
  ["iOS (Swift)", "Core Image (CIQRCodeGenerator)", "AVFoundation, Vision framework"],
  ["C / C++", "libqrencode, Nayuki QR Code generator", "ZBar, quirc, OpenCV"],
  ["PHP", "endroid/qr-code, chillerlan/php-qrcode", "khanamiryan/qrcode-detector-decoder"],
];

const SNIPPETS = [
  {
    n: "12.2",
    tab: "Python – tạo mã",
    lang: "python",
    code: `# pip install qrcode[pil]
import qrcode

qr = qrcode.QRCode(
    version=None,       # tự chọn phiên bản nhỏ nhất
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=10,        # số pixel mỗi module
    border=4,           # vùng trống 4 module
)
qr.add_data("https://www.vidu.vn")
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("ma_qr.png")`,
  },
  {
    n: "12.3",
    tab: "Python – đọc bằng OpenCV",
    lang: "python",
    code: `# pip install opencv-python
import cv2

img = cv2.imread("ma_qr.png")
detector = cv2.QRCodeDetector()
data, points, _ = detector.detectAndDecode(img)
print("Nội dung:", data if data else "Không tìm thấy mã QR")`,
  },
  {
    n: "12.4",
    tab: "JavaScript – tạo mã",
    lang: "js",
    code: `// npm install qrcode
const QRCode = require('qrcode');

QRCode.toFile('ma_qr.png', 'https://www.vidu.vn', {
  errorCorrectionLevel: 'H',
  margin: 4,
  color: { dark: '#000000', light: '#FFFFFF' }
});`,
  },
];

const KEYWORDS = /^(import|from|const|let|require|print|if|else|None|True|False|def|return|new)$/;

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#.*$|\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_]\w*)|(\d+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="text-dim italic">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="text-mint">{m[2]}</span>);
    else if (m[3]) out.push(KEYWORDS.test(m[3]) ? <span key={k++} className="text-violet">{m[3]}</span> : m[3]);
    else if (m[4]) out.push(<span key={k++} className="text-amber">{m[4]}</span>);
    last = re.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function CodeTabs() {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const s = SNIPPETS[i];
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-panel-2/40 p-2">
        {SNIPPETS.map((x, k) => (
          <button
            key={x.tab}
            onClick={() => {
              setI(k);
              setCopied(false);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${k === i ? "bg-panel font-semibold text-ink" : "text-muted hover:text-ink"}`}
          >
            <span className="mono mr-1.5 text-xs text-mint">{x.n}</span>
            {x.tab}
          </button>
        ))}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(s.code).then(() => setCopied(true));
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs hover:bg-panel-2"
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden />
              Đã chép
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden />
              Sao chép
            </>
          )}
        </button>
      </div>
      <pre key={i} className="pop mono thin-scroll overflow-x-auto p-5 text-sm leading-relaxed">
        {s.code.split("\n").map((line, k) => (
          <div key={k} className="flex">
            <span className="mr-5 w-5 shrink-0 text-right text-dim/60 select-none">{k + 1}</span>
            <span>{highlight(line)}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

const PHONES = [
  {
    icon: Apple,
    title: "iPhone (iOS 11 trở lên)",
    text: "Mở ứng dụng Camera, hướng vào mã, chạm vào thông báo hiện ra. Có thể thêm “Trình quét mã” vào Trung tâm điều khiển.",
  },
  { icon: Bot, title: "Android", text: "Dùng Camera (nhiều hãng tích hợp sẵn), Google Lens, hoặc nút quét QR trong bảng cài đặt nhanh." },
  {
    icon: MessageSquare,
    title: "Ứng dụng khác",
    text: "Zalo, ứng dụng ngân hàng, ví điện tử đều có tính năng quét QR, kể cả quét từ ảnh có sẵn trong thư viện.",
  },
];

export default function Programming() {
  return (
    <Section id="lap-trinh">
      <SectionHeading
        n={12}
        kicker="For Developers"
        title="Tạo và đọc mã QR bằng lập trình"
        lead="Bạn không cần tự viết mọi bước như phòng thí nghiệm ở chương 7 — hầu hết ngôn ngữ đều có thư viện làm sẵn."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <Reveal>
          <SubHeading n="12.1">Thư viện phổ biến</SubHeading>
          <div className="card overflow-hidden text-sm">
            <div className="grid grid-cols-[0.9fr_1.2fr_1.2fr] bg-panel-2/70 font-semibold">
              <div className="p-3">Nền tảng</div>
              <div className="p-3 text-mint">Tạo mã</div>
              <div className="p-3 text-cyan">Đọc mã</div>
            </div>
            {LIBS.map(([p, a, b]) => (
              <div key={p} className="grid grid-cols-[0.9fr_1.2fr_1.2fr] border-t border-line hover:bg-panel-2/40">
                <div className="p-3 font-medium">{p}</div>
                <div className="mono p-3 text-xs leading-relaxed text-muted">{a}</div>
                <div className="mono p-3 text-xs leading-relaxed text-muted">{b}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <SubHeading>Ví dụ mã nguồn</SubHeading>
          <CodeTabs />
          <p className="mt-3 text-xs text-dim">
            Trang web này tự cài đặt bộ mã hóa (TypeScript) để hiển thị từng bước, và dùng jsQR để giải mã trong các thí nghiệm.
          </p>
        </Reveal>
      </div>
      <div className="mt-14">
        <Reveal>
          <SubHeading n="12.5">Quét mã QR trên điện thoại</SubHeading>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {PHONES.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="card spot lift h-full p-5">
                <p.icon size={30} aria-hidden />
                <div className="mt-2 font-semibold">{p.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
