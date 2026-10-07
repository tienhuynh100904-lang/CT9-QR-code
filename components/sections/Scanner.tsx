"use client";

import { useEffect, useRef, useState } from "react";
import jsQR, { type QRCode } from "jsqr";
import { Camera, CircleX, Dices, Folder, Ruler, Square, Type, Video } from "lucide-react";
import { encodeText } from "@/lib/qr/matrix";
import { useLab } from "../LabContext";

const CHUNK_NAME: Record<string, string> = {
  numeric: "Numeric",
  alphanumeric: "Alphanumeric",
  byte: "Byte",
  kanji: "Kanji",
  eci: "ECI",
  structuredAppend: "Structured Append",
};

function drawOverlay(ctx: CanvasRenderingContext2D, code: QRCode) {
  const l = code.location;
  ctx.lineWidth = Math.max(3, ctx.canvas.width / 160);
  ctx.strokeStyle = "#5ef2c2";
  ctx.beginPath();
  ctx.moveTo(l.topLeftCorner.x, l.topLeftCorner.y);
  ctx.lineTo(l.topRightCorner.x, l.topRightCorner.y);
  ctx.lineTo(l.bottomRightCorner.x, l.bottomRightCorner.y);
  ctx.lineTo(l.bottomLeftCorner.x, l.bottomLeftCorner.y);
  ctx.closePath();
  ctx.stroke();
  const dot = (p: { x: number; y: number }, color: string, r: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const r = Math.max(6, ctx.canvas.width / 70);
  dot(l.topLeftFinderPattern, "#e5484d", r);
  dot(l.topRightFinderPattern, "#e5484d", r);
  dot(l.bottomLeftFinderPattern, "#e5484d", r);
  if (l.bottomRightAlignmentPattern) dot(l.bottomRightAlignmentPattern, "#1fae63", r * 0.7);
}

export default function Scanner() {
  const { text } = useLab();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [result, setResult] = useState<QRCode | null | "none">(null);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodeCanvas = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(img.data, c.width, c.height);
    if (code) drawOverlay(ctx, code);
    return code;
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera(false);
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const useSample = () => {
    stopCamera();
    setError(null);
    const q = encodeText(text || "HELLO WORLD", "M");
    if (!q) return;
    const c = canvasRef.current!;
    const W = 520;
    c.width = c.height = W;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    // nền "giấy" lốm đốm + mã bị xoay nghiêng để thấy máy quét vẫn đọc được
    ctx.fillStyle = "#e9e4d8";
    ctx.fillRect(0, 0, W, W);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(120,100,80,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * W, Math.random() * W, 6, 6);
    }
    const angle = ((Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 25) * Math.PI) / 180;
    const cell = Math.floor((W * 0.55) / (q.size + 8));
    const full = cell * (q.size + 8);
    ctx.save();
    ctx.translate(W / 2, W / 2);
    ctx.rotate(angle);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-full / 2, -full / 2, full, full);
    ctx.fillStyle = "#111";
    for (let i = 0; i < q.size * q.size; i++) {
      if (!q.modules[i]) continue;
      ctx.fillRect(-full / 2 + ((i % q.size) + 4) * cell, -full / 2 + (Math.floor(i / q.size) + 4) * cell, cell, cell);
    }
    ctx.restore();
    setResult(decodeCanvas() ?? "none");
  };

  const onFile = (file: File) => {
    stopCamera();
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current!;
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d", { willReadFrequently: true })!.drawImage(img, 0, 0, c.width, c.height);
      setResult(decodeCanvas() ?? "none");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCamera(true);
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      const loop = () => {
        if (!streamRef.current) return;
        if (v.readyState >= 2) {
          const c = canvasRef.current!;
          const scale = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
          c.width = Math.round(v.videoWidth * scale);
          c.height = Math.round(v.videoHeight * scale);
          c.getContext("2d", { willReadFrequently: true })!.drawImage(v, 0, 0, c.width, c.height);
          const code = decodeCanvas();
          if (code) {
            setResult(code);
            stopCamera();
            return;
          }
        }
        setTimeout(() => requestAnimationFrame(loop), 120);
      };
      loop();
    } catch {
      setError("Không mở được camera (chưa cấp quyền hoặc thiết bị không có camera). Bạn vẫn có thể chọn ảnh.");
      stopCamera();
    }
  };

  return (
    <div className="card spot grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-bg-soft">
          <canvas ref={canvasRef} className={`max-h-full max-w-full ${result === null && !camera ? "hidden" : ""}`} />
          <video ref={videoRef} className="hidden" playsInline muted />
          {result === null && !camera && (
            <div className="p-6 text-center text-dim">
              <Camera size={48} className="mx-auto mb-2" aria-hidden />
              Chọn ảnh có mã QR, bật camera, hoặc dùng mã mẫu
            </div>
          )}
          {camera && <div className="scanline" aria-hidden />}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button
            onClick={useSample}
            className="inline-flex items-center gap-2 rounded-lg bg-mint px-3 py-2 font-semibold text-bg hover:brightness-110"
          >
            <Dices size={16} aria-hidden />
            Mã mẫu xoay nghiêng
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong px-3 py-2 hover:bg-panel-2">
            <Folder size={16} aria-hidden />
            Chọn ảnh
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          {camera ? (
            <button onClick={stopCamera} className="inline-flex items-center gap-2 rounded-lg border border-red/60 px-3 py-2 text-red">
              <Square size={16} aria-hidden />
              Tắt camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2 hover:bg-panel-2"
            >
              <Video size={16} aria-hidden />
              Quét bằng camera
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-amber">{error}</p>}
      </div>
      <div className="space-y-3">
        <h4 className="font-semibold">Máy quét thấy gì?</h4>
        {result === null ? (
          <p className="text-sm text-muted">
            Bộ giải mã (jsQR) chạy ngay trong trình duyệt của bạn — không gửi ảnh đi đâu cả. Kết quả sẽ hiện các mẫu định vị
            tìm được, phiên bản, chế độ mã hóa và nội dung.
          </p>
        ) : result === "none" ? (
          <p className="flex items-start gap-2 rounded-xl border border-red/40 bg-red/10 p-4 text-sm">
            <CircleX size={18} className="mt-0.5 shrink-0 text-red" aria-hidden />
            Không tìm thấy mã QR. Thử ảnh rõ hơn, đủ sáng, mã chiếm phần lớn khung hình.
          </p>
        ) : (
          <div className="pop space-y-3 text-sm">
            <div className="rounded-xl border border-mint/40 bg-mint/[0.07] p-4">
              <div className="text-xs text-muted">Nội dung giải mã</div>
              <div className="mono mt-1 break-all text-ink">{result.data || "(trống)"}</div>
            </div>
            <ul className="space-y-1.5 text-muted">
              <li>
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-[#e5484d]" />3 mẫu định vị → xác định vị trí, góc
                xoay
              </li>
              <li>
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-[#1fae63]" />
                Mẫu căn chỉnh → nắn phối cảnh
              </li>
              <li className="flex items-center gap-1.5">
                <Ruler size={16} className="shrink-0" aria-hidden />
                Phiên bản <b className="text-ink">{result.version}</b> ({result.version * 4 + 17}×{result.version * 4 + 17})
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <Type size={16} className="shrink-0" aria-hidden />
                Các đoạn dữ liệu:{" "}
                {result.chunks.map((c, i) => (
                  <span key={i} className="mono mr-1 rounded bg-panel-2 px-1.5 py-0.5 text-xs text-ink">
                    {CHUNK_NAME[c.type] ?? c.type}
                    {c.type === "eci" && "assignmentNumber" in c ? ` ${c.assignmentNumber}` : ""}
                  </span>
                ))}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
