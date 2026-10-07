"use client";

import { useCallback, useState } from "react";
import { Download, FileText, Hash, type LucideIcon, Puzzle, Search, Shield, Smartphone, Sparkles } from "lucide-react";
import { formatInfo, K, versionInfo, type QrBuild } from "@/lib/qr/matrix";
import { downloadPng, downloadSvg, INK, PAPER } from "@/lib/qr/render";
import { ECC_INFO } from "@/lib/qr/tables";
import GridCanvas, { cellBox, type GridDraw } from "../ui/GridCanvas";
import { Panel } from "./shared";

function ListIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />;
}

function BitRow({ label, bits, color }: { label: string; bits: string; color: (i: number) => string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-xs text-dim">{label}</span>
      <div className="mono flex gap-0.5">
        {Array.from(bits).map((b, i) => (
          <span
            key={i}
            className="pop flex h-7 w-5 items-center justify-center rounded text-xs font-semibold sm:w-6"
            style={{ background: color(i), animationDelay: `${i * 25}ms` }}
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function StepFinal({ build, mask }: { build: QrBuild; mask: number }) {
  const { layout, plan } = build;
  const { size, kind, formatBit, versionBit } = layout;
  const modules = build.masks[mask].modules;
  const [clean, setClean] = useState(false);
  const f = formatInfo(plan.ecc, mask);
  const b = (v: number, n: number) => v.toString(2).padStart(n, "0");

  const draw = useCallback<GridDraw>(
    (ctx, g) => {
      for (let i = 0; i < size * size; i++) {
        const r = Math.floor(i / size);
        const c = i % size;
        const [x, y, w, h] = cellBox(g, r, c);
        const k = kind[i];
        if (!clean && k === K.format) {
          ctx.fillStyle = modules[i] ? "#8e4ec6" : "#ead9fb";
        } else if (!clean && k === K.version) {
          ctx.fillStyle = modules[i] ? "#f76b15" : "#ffdcc4";
        } else ctx.fillStyle = modules[i] ? INK : PAPER;
        ctx.fillRect(x, y, w, h);
        if (!clean && (k === K.format || k === K.version) && g.cell >= 11) {
          ctx.fillStyle = modules[i] ? "#fff" : "#5b2a86";
          ctx.font = `600 ${Math.floor(g.cell * 0.5)}px ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(k === K.format ? 14 - formatBit[i] : versionBit[i]), x + w / 2, y + h / 2 + 0.5);
        }
      }
    },
    [size, kind, modules, clean, formatBit, versionBit],
  );

  const fmtColors = (i: number) => (i < 2 ? "#8b7bff55" : i < 5 ? "#ff6fae55" : "#ffffff14");
  const name = plan.analysis.text.slice(0, 24).replace(/[^\p{L}\p{N}]+/gu, "-") || "ma-qr";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-paper">
            <GridCanvas size={size} quiet={clean ? 4 : 1} draw={draw} label="Mã QR hoàn chỉnh" />
            {clean && <div className="scanline" aria-hidden />}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => setClean((c) => !c)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-3 py-1.5 font-semibold text-bg hover:brightness-110"
            >
              {clean ? (
                <>
                  <Search size={16} aria-hidden />
                  Hiện thông tin định dạng
                </>
              ) : (
                <>
                  <Sparkles size={16} aria-hidden />
                  Xem bản hoàn chỉnh
                </>
              )}
            </button>
            <button
              onClick={() => downloadPng(modules, size, `${name}.png`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 hover:bg-panel-2"
            >
              <Download size={14} aria-hidden />
              PNG
            </button>
            <button
              onClick={() => downloadSvg(modules, size, `${name}.svg`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 hover:bg-panel-2"
            >
              <Download size={14} aria-hidden />
              SVG
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="15 bit thông tin định dạng">
            <div className="thin-scroll space-y-1.5 overflow-x-auto pb-1">
              <BitRow
                label={`Mức ${plan.ecc} + mặt nạ ${mask}`}
                bits={ECC_INFO[plan.ecc].bits + b(mask, 3)}
                color={(i) => (i < 2 ? "#8b7bff55" : "#ff6fae55")}
              />
              <BitRow label="+ 10 bit BCH" bits={b(f.beforeMask, 15)} color={fmtColors} />
              <BitRow label="XOR" bits="101010000010010" color={() => "transparent"} />
              <BitRow label="= ghi lên mã" bits={b(f.bits, 15)} color={() => "#8e4ec6"} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Số trên ô tím = thứ tự bit (0 = bit trái nhất). Chuỗi được ghi <b className="text-muted">hai lần</b>: quanh mẫu
              định vị trên-trái, và chia đôi ở cạnh hai mẫu còn lại.
            </p>
          </Panel>
          {layout.version >= 7 && (
            <Panel title="18 bit thông tin phiên bản">
              <div className="thin-scroll overflow-x-auto pb-1">
                <BitRow
                  label={`V${layout.version} + Golay`}
                  bits={b(versionInfo(layout.version), 18)}
                  color={(i) => (i < 6 ? "#f76b1566" : "#ffffff14")}
                />
              </div>
            </Panel>
          )}
          <Panel title="Hành trình của bạn">
            <ul className="space-y-1.5 text-sm text-muted">
              <li>
                <ListIcon icon={FileText} />“<span className="text-ink">{plan.analysis.text.length > 30 ? plan.analysis.text.slice(0, 30) + "…" : plan.analysis.text}</span>”
                → {plan.analysis.chars.length} ký tự
              </li>
              <li>
                <ListIcon icon={Hash} />→ {plan.usedBits} bit nội dung → {plan.dataCodewords.length} codeword dữ liệu
              </li>
              <li>
                <ListIcon icon={Shield} />→ +{plan.blocks.length * plan.eccPerBlock} codeword sửa lỗi ({plan.blocks.length} khối)
              </li>
              <li>
                <ListIcon icon={Puzzle} />→ lưới {size}×{size} = {(size * size).toLocaleString("vi-VN")} module, mặt nạ {mask}
              </li>
            </ul>
          </Panel>
          <div className="rounded-2xl border border-mint/40 bg-mint/[0.07] p-4 text-sm">
            <Smartphone size={16} className="mr-1.5 inline-block align-text-bottom" aria-hidden />
            <b>Quét thử bằng điện thoại!</b> Nhớ rằng bản hoàn chỉnh cần một vùng trống trắng rộng ít nhất 4 module bao
            quanh.
          </div>
        </div>
      </div>
    </div>
  );
}
