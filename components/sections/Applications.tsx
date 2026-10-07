"use client";

import { useMemo, useState } from "react";
import { Calendar, Download, Factory, GraduationCap, Hospital, IdCard, Link, Lock, Mail, MapPin, MessageSquare, Phone, ShoppingBag, Ticket, User, UtensilsCrossed, Wheat, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import { downloadPng } from "@/lib/qr/render";
import MiniQr from "../ui/MiniQr";
import Reveal from "../ui/Reveal";
import { Callout, Section, SectionHeading, SubHeading } from "../ui/Section";

/* ---------- 9.1 TLV kiểu EMVCo / VietQR ---------- */

function crc16(s: string) {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const tlv = (tag: string, value: string) => tag + String(value.length).padStart(2, "0") + value;

interface Field {
  tag: string;
  name: string;
  value: string;
  children?: { tag: string; name: string; value: string; children?: { tag: string; name: string; value: string }[] }[];
}

function buildPayment(amount: string, note: string) {
  const bank = [
    { tag: "00", name: "Mã BIN ngân hàng", value: "970436" },
    { tag: "01", name: "Số tài khoản (giả định)", value: "0011223344" },
  ];
  const merchant = [
    { tag: "00", name: "Định danh NAPAS (GUID)", value: "A000000727" },
    { tag: "01", name: "Người thụ hưởng", value: bank.map((b) => tlv(b.tag, b.value)).join(""), children: bank },
    { tag: "02", name: "Mã dịch vụ (chuyển tới tài khoản)", value: "QRIBFTTA" },
  ];
  const extra = [{ tag: "08", name: "Nội dung chuyển khoản", value: note }];
  const fields: Field[] = [
    { tag: "00", name: "Phiên bản dữ liệu", value: "01" },
    { tag: "01", name: "Phương thức (12 = QR động, dùng một lần)", value: "12" },
    { tag: "38", name: "Thông tin tài khoản thụ hưởng", value: merchant.map((m) => tlv(m.tag, m.value)).join(""), children: merchant },
    { tag: "53", name: "Mã tiền tệ (704 = VND)", value: "704" },
    ...(amount ? [{ tag: "54", name: "Số tiền", value: amount }] : []),
    { tag: "58", name: "Mã quốc gia", value: "VN" },
    ...(note ? [{ tag: "62", name: "Thông tin bổ sung", value: extra.map((e) => tlv(e.tag, e.value)).join(""), children: extra }] : []),
  ];
  const body = fields.map((f) => tlv(f.tag, f.value)).join("") + "6304";
  const crc = crc16(body);
  fields.push({ tag: "63", name: "Mã kiểm tra CRC-16", value: crc });
  return { fields, full: body + crc };
}

const TLV_COLORS = ["#5ef2c2", "#4cc9f0", "#8b7bff", "#ff6fae", "#ffc857", "#ff8a4c", "#a3e635", "#f472b6"];

function TlvDemo() {
  const [amount, setAmount] = useState("50000");
  const [note, setNote] = useState("Thanh toan don hang");
  const [hover, setHover] = useState<number | null>(null);
  const { fields } = useMemo(
    () => buildPayment(amount.replace(/\D/g, "").slice(0, 13), note.replace(/[^\x20-\x7e]/g, "").slice(0, 50)),
    [amount, note],
  );
  return (
    <div className="card spot p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-muted">Số tiền (VND)</span>
          <input
            value={amount}
            inputMode="numeric"
            onChange={(e) => setAmount(e.target.value)}
            className="mono mt-1 w-full rounded-xl border border-line-strong bg-bg-soft px-3 py-2 outline-none focus:border-mint/70"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted">Nội dung (không dấu)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line-strong bg-bg-soft px-3 py-2 outline-none focus:border-mint/70"
          />
        </label>
      </div>
      <div className="mono mt-5 rounded-xl bg-bg-soft p-4 text-sm leading-relaxed break-all" onMouseLeave={() => setHover(null)}>
        {fields.map((f, i) => {
          const color = TLV_COLORS[i % TLV_COLORS.length];
          const len = String(f.value.length).padStart(2, "0");
          return (
            <span
              key={i}
              onMouseEnter={() => setHover(i)}
              className={`cursor-default rounded px-0.5 transition ${hover === i ? "bg-white/15" : ""}`}
              style={{ color }}
            >
              <b>{f.tag}</b>
              <span className="opacity-60">{len}</span>
              {f.value}
            </span>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-dim">
        Mỗi trường = <b className="text-ink">Tag</b> (2 số) + <span className="text-ink/70">Length</span> (2 số) + Value. Rê chuột
        lên chuỗi để xem từng trường.
      </div>
      <div className="mt-5 space-y-1.5">
        {fields.map((f, i) => (
          <div
            key={i}
            onMouseEnter={() => setHover(i)}
            className={`rounded-lg border px-3 py-2 text-sm transition ${hover === i ? "border-white/30 bg-white/5" : "border-line"}`}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="mono font-bold" style={{ color: TLV_COLORS[i % TLV_COLORS.length] }}>
                {f.tag}
              </span>
              <span>{f.name}</span>
              {!f.children && <span className="mono ml-auto text-xs text-muted">{f.value}</span>}
            </div>
            {f.children && (
              <div className="mt-1.5 space-y-1 border-l border-line-strong pl-3">
                {f.children.map((c) => (
                  <div key={c.tag} className="text-xs">
                    <div className="flex flex-wrap gap-2">
                      <span className="mono font-bold text-ink/80">{c.tag}</span>
                      <span className="text-muted">{c.name}</span>
                      {!c.children && <span className="mono ml-auto">{c.value}</span>}
                    </div>
                    {c.children && (
                      <div className="mt-1 space-y-0.5 border-l border-line pl-3">
                        {c.children.map((g) => (
                          <div key={g.tag} className="flex gap-2">
                            <span className="mono font-bold text-ink/70">{g.tag}</span>
                            <span className="text-muted">{g.name}</span>
                            <span className="mono ml-auto">{g.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-dim">
        Ví dụ minh họa cấu trúc dữ liệu (số tài khoản giả định), không phải mã thanh toán thật — trang cố ý không vẽ mã QR
        cho chuỗi này.
      </p>
    </div>
  );
}

/* ---------- 9.2 Bộ tạo mã cho các định dạng nội dung ---------- */

type FormatKey = "url" | "wifi" | "vcard" | "mecard" | "email" | "tel" | "sms" | "geo" | "event";

const FORMATS: { key: FormatKey; label: string; icon: LucideIcon; example: string }[] = [
  { key: "url", label: "Website", icon: Link, example: "https://www.vidu.vn" },
  { key: "wifi", label: "Wi-Fi", icon: Wifi, example: "WIFI:T:WPA;S:TenWifi;P:MatKhau;;" },
  { key: "vcard", label: "vCard", icon: User, example: "BEGIN:VCARD … FN:Nguyen Van A … TEL:090… END:VCARD" },
  { key: "mecard", label: "MECARD", icon: IdCard, example: "MECARD:N:Nguyen,An;TEL:0901234567;EMAIL:an@vidu.vn;;" },
  { key: "email", label: "Email", icon: Mail, example: "mailto:ten@vidu.vn?subject=Tieu%20de&body=Noi%20dung" },
  { key: "tel", label: "Gọi điện", icon: Phone, example: "tel:+84901234567" },
  { key: "sms", label: "Tin nhắn SMS", icon: MessageSquare, example: "SMSTO:+84901234567:Noi dung tin nhan" },
  { key: "geo", label: "Bản đồ", icon: MapPin, example: "geo:21.0285,105.8542" },
  { key: "event", label: "Sự kiện lịch", icon: Calendar, example: "BEGIN:VEVENT … DTSTART:20261020T090000 … END:VEVENT" },
];

const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const icsDate = (v: string) => v.replace(/[-:]/g, "").replace(/T\d{4}$/, (m) => m + "00");

type Values = Record<string, string>;

const DEFAULTS: Record<FormatKey, Values> = {
  url: { url: "https://www.vidu.vn" },
  wifi: { ssid: "QuanCaPhe", pass: "12345678", type: "WPA" },
  vcard: { name: "Nguyen Van A", tel: "0901234567", email: "a@vidu.vn" },
  mecard: { last: "Nguyen", first: "An", tel: "0901234567", email: "an@vidu.vn" },
  email: { to: "ten@vidu.vn", subject: "Tieu de", body: "Noi dung" },
  tel: { tel: "+84901234567" },
  sms: { tel: "+84901234567", body: "Noi dung tin nhan" },
  geo: { lat: "21.0285", lng: "105.8542" },
  event: { title: "Hoi thao ma QR", start: "2026-10-20T09:00", end: "2026-10-20T11:00" },
};

const FIELDS: Record<FormatKey, { k: string; label: string; type?: string; options?: string[] }[]> = {
  url: [{ k: "url", label: "Đường dẫn" }],
  wifi: [
    { k: "ssid", label: "Tên mạng (SSID)" },
    { k: "pass", label: "Mật khẩu" },
    { k: "type", label: "Bảo mật", options: ["WPA", "WEP", "nopass"] },
  ],
  vcard: [
    { k: "name", label: "Họ tên" },
    { k: "tel", label: "Điện thoại" },
    { k: "email", label: "Email" },
  ],
  mecard: [
    { k: "last", label: "Họ" },
    { k: "first", label: "Tên" },
    { k: "tel", label: "Điện thoại" },
    { k: "email", label: "Email" },
  ],
  email: [
    { k: "to", label: "Người nhận" },
    { k: "subject", label: "Tiêu đề" },
    { k: "body", label: "Nội dung" },
  ],
  tel: [{ k: "tel", label: "Số điện thoại" }],
  sms: [
    { k: "tel", label: "Số điện thoại" },
    { k: "body", label: "Nội dung" },
  ],
  geo: [
    { k: "lat", label: "Vĩ độ" },
    { k: "lng", label: "Kinh độ" },
  ],
  event: [
    { k: "title", label: "Tên sự kiện" },
    { k: "start", label: "Bắt đầu", type: "datetime-local" },
    { k: "end", label: "Kết thúc", type: "datetime-local" },
  ],
};

function payload(key: FormatKey, v: Values): string {
  switch (key) {
    case "url":
      return v.url;
    case "wifi":
      return `WIFI:T:${v.type};S:${esc(v.ssid)};${v.type === "nopass" ? "" : `P:${esc(v.pass)};`};`;
    case "vcard":
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${v.name}\nTEL:${v.tel}\nEMAIL:${v.email}\nEND:VCARD`;
    case "mecard":
      return `MECARD:N:${v.last},${v.first};TEL:${v.tel};EMAIL:${v.email};;`;
    case "email":
      return `mailto:${v.to}?subject=${encodeURIComponent(v.subject)}&body=${encodeURIComponent(v.body)}`;
    case "tel":
      return `tel:${v.tel}`;
    case "sms":
      return `SMSTO:${v.tel}:${v.body}`;
    case "geo":
      return `geo:${v.lat},${v.lng}`;
    case "event":
      return `BEGIN:VEVENT\nSUMMARY:${v.title}\nDTSTART:${icsDate(v.start)}\nDTEND:${icsDate(v.end)}\nEND:VEVENT`;
  }
}

function ContentGenerator() {
  const [key, setKey] = useState<FormatKey>("wifi");
  const [values, setValues] = useState(DEFAULTS);
  const v = values[key];
  const data = payload(key, v);
  const qr = useMemo(() => (data ? encodeText(data, "M") : null), [data]);
  const fmt = FORMATS.find((f) => f.key === key)!;

  return (
    <div className="card overflow-hidden">
      <div className="thin-scroll flex gap-1 overflow-x-auto border-b border-line bg-panel-2/40 p-2">
        {FORMATS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKey(f.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition ${
              key === f.key ? "bg-mint font-semibold text-bg" : "text-muted hover:bg-panel-2"
            }`}
          >
            <f.icon size={16} aria-hidden />
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_260px]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS[key].map((fd) => (
              <label key={fd.k} className="text-sm">
                <span className="text-muted">{fd.label}</span>
                {fd.options ? (
                  <select
                    value={v[fd.k]}
                    onChange={(e) => setValues({ ...values, [key]: { ...v, [fd.k]: e.target.value } })}
                    className="mt-1 w-full rounded-xl border border-line-strong bg-bg-soft px-3 py-2"
                  >
                    {fd.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={fd.type ?? "text"}
                    value={v[fd.k]}
                    onChange={(e) => setValues({ ...values, [key]: { ...v, [fd.k]: e.target.value } })}
                    className="mt-1 w-full rounded-xl border border-line-strong bg-bg-soft px-3 py-2 outline-none focus:border-mint/70"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-5 text-xs text-dim">Chuỗi được mã hóa vào QR:</div>
          <pre className="mono mt-1 rounded-xl bg-bg-soft p-3 text-xs leading-relaxed break-all whitespace-pre-wrap text-mint">{data}</pre>
          <div className="mt-3 text-xs text-dim">
            Cú pháp mẫu trong tài liệu: <span className="mono text-muted">{fmt.example}</span>
          </div>
        </div>
        <div>
          {qr ? (
            <>
              <div key={data} className="pop rounded-2xl bg-paper p-2">
                <MiniQr modules={qr.modules} size={qr.size} />
              </div>
              <div className="mono mt-2 text-center text-xs text-dim">
                V{qr.plan.version} · {qr.size}×{qr.size}
              </div>
              <button
                onClick={() => downloadPng(qr.modules, qr.size, `qr-${key}.png`)}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line-strong px-3 py-2 text-sm hover:bg-panel-2"
              >
                <Download size={14} aria-hidden />
                Tải PNG
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-line p-6 text-center text-sm text-dim">Nội dung trống hoặc quá dài</div>
          )}
        </div>
      </div>
    </div>
  );
}

const FIELDS_OF_USE = [
  { icon: ShoppingBag, title: "Bán lẻ và marketing", text: "Dẫn tới trang sản phẩm, khuyến mãi, mạng xã hội, đánh giá; in trên bao bì, poster, danh thiếp." },
  { icon: UtensilsCrossed, title: "Nhà hàng, khách sạn", text: "Thực đơn điện tử, gọi món tại bàn, đánh giá dịch vụ." },
  { icon: Ticket, title: "Vé và kiểm soát ra vào", text: "Vé máy bay (boarding pass, thường dùng thêm PDF417/Aztec), vé tàu, vé xem phim, sự kiện, thẻ gửi xe." },
  {
    icon: IdCard,
    title: "Giấy tờ hành chính",
    text: "Thẻ Căn cước công dân gắn chip tại Việt Nam có mã QR chứa thông tin cơ bản; hóa đơn điện tử, giấy chứng nhận, văn bằng có mã QR để tra cứu xác thực.",
  },
  {
    icon: Wheat,
    title: "Truy xuất nguồn gốc",
    text: "Nông sản, thực phẩm, dược phẩm; chuẩn GS1 Digital Link cho phép một mã QR vừa làm mã sản phẩm, vừa dẫn tới thông tin cho người tiêu dùng.",
  },
  { icon: Factory, title: "Sản xuất và logistics", text: "Theo dõi linh kiện, kho hàng, kiện hàng (mục đích gốc của mã QR)." },
  { icon: Hospital, title: "Y tế", text: "Vòng tay bệnh nhân, quản lý thuốc, mẫu xét nghiệm; giấy chứng nhận tiêm chủng thời COVID-19." },
  { icon: GraduationCap, title: "Giáo dục", text: "Điểm danh, liên kết tài liệu, video bài giảng trong sách giáo khoa." },
  {
    icon: Lock,
    title: "Bảo mật và xác thực",
    text: "Đăng nhập bằng quét mã (Zalo Web, WhatsApp Web), thiết lập xác thực hai lớp (2FA) qua mã QR chứa khóa bí mật TOTP.",
  },
];

export default function Applications() {
  return (
    <Section id="ung-dung">
      <SectionHeading
        n={9}
        kicker="Applications"
        title="Ứng dụng của mã QR"
        lead="Từ chuyển khoản ngân hàng đến kết nối Wi-Fi, mã QR đã len lỏi vào hầu hết mọi hoạt động hằng ngày."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <Reveal>
          <SubHeading n="9.1">Thanh toán điện tử</SubHeading>
          <p className="leading-relaxed text-muted">
            Đây là ứng dụng phát triển mạnh nhất tại châu Á. Tại Việt Nam, chuẩn <b className="text-ink">VietQR</b> do NAPAS
            xây dựng (dựa trên chuẩn EMVCo QR) cho phép chuyển khoản liên ngân hàng bằng cách quét mã. Nội dung mã chứa mã
            ngân hàng (BIN), số tài khoản, số tiền, nội dung chuyển khoản… dưới dạng chuỗi{" "}
            <b className="text-ink">TLV (Tag – Length – Value)</b> có mã kiểm tra CRC.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Các ví điện tử như MoMo, ZaloPay, VNPay-QR cũng dùng QR rộng rãi. Trên thế giới có Alipay, WeChat Pay (Trung
            Quốc), PromptPay (Thái Lan), UPI (Ấn Độ), PIX (Brazil)…
          </p>
          <div className="mt-6">
            <Callout tone="info" title="Thử sửa số tiền">
              Mỗi khi đổi số tiền hoặc nội dung, trường Length và mã CRC ở cuối chuỗi tự cập nhật. Máy quét dùng CRC để phát hiện
              chuỗi bị sửa đổi hoặc đọc sai.
            </Callout>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <TlvDemo />
        </Reveal>
      </div>

      <div className="mt-16">
        <Reveal>
          <SubHeading n="9.2">Định dạng nội dung phổ biến</SubHeading>
          <p className="mb-6 max-w-3xl leading-relaxed text-muted">
            Ứng dụng quét trên điện thoại nhận diện một số định dạng chuẩn và tự động xử lý phù hợp. Chọn một loại, điền thông
            tin và quét thử mã vừa tạo:
          </p>
        </Reveal>
        <Reveal>
          <ContentGenerator />
        </Reveal>
      </div>

      <div className="mt-16">
        <Reveal>
          <SubHeading n="9.3">Các lĩnh vực ứng dụng khác</SubHeading>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS_OF_USE.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 60}>
              <div className="card spot lift flex h-full gap-4 p-5">
                <f.icon size={30} className="shrink-0" aria-hidden />
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
