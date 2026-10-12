"use client";

import { useEffect, useRef, useState } from "react";

// Table QR codes printed from BizPos encode <BIZWALLET_URL>/order/t/<token>.
export function tableTokenFrom(text: string): string | null {
  const m = text.match(/\/order\/t\/([^/?#\s]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

// Camera QR scanner. Uses the browser's BarcodeDetector where it exists
// (Android Chrome) and jsQR elsewhere (iPhone Safari has no detector).
export default function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [wrongCode, setWrongCode] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch (e) {
        const name = (e as Error)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera access is off. Allow it in your browser settings, or scan the table QR with your phone's camera app."
            : "Couldn't open the camera. Scan the table QR with your phone's camera app instead."
        );
        return;
      }
      const video = videoRef.current;
      if (!video || stopped) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const Detector = (window as unknown as { BarcodeDetector?: new (o: object) => BarcodeDetectorLike })
        .BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;

      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2 && video.videoWidth) {
          let text: string | null = null;
          if (detector) {
            text = (await detector.detect(video).catch(() => []))[0]?.rawValue ?? null;
          } else if (jsQR && ctx) {
            // Downscale: plenty for a table QR and keeps each frame cheap.
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            text = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
          }
          if (text) {
            const token = tableTokenFrom(text);
            if (token) {
              navigator.vibrate?.(20);
              stopped = true;
              onToken(token);
              return;
            }
            setWrongCode(true);
          }
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onToken]);

  if (error) {
    return (
      <p role="alert" className="rounded-3xl bg-white p-6 text-center text-sm text-slate-700 shadow-sm">
        {error}
      </p>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      {/* Viewfinder */}
      <div className="pointer-events-none absolute inset-[18%] rounded-3xl border-[3px] border-white/90 shadow-[0_0_0_100vmax_rgb(21_16_12/0.45)]">
        <div className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse rounded-full bg-brand-300" />
      </div>
      {wrongCode && (
        <p className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 px-4 py-2.5 text-center text-sm font-medium text-slate-800">
          That isn&apos;t a table QR. Point at the code on your table.
        </p>
      )}
    </div>
  );
}
