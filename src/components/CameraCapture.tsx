import { useEffect, useRef, useState } from "react";
import { downscaleToJpeg } from "../lib/image";
import { reportError } from "../lib/errorOverlay";
import ModalHeader from "./ModalHeader";

// In-app camera so we control the UI (banner, framing guide, shutter). Outputs
// an already-downscaled JPEG data URL. Falls back to the native file picker if
// getUserMedia is denied or unavailable.

const MAX_DIM = 1600;
const QUALITY = 0.8;

export default function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        reportError("camera", e);
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function captureFrame() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, MAX_DIM / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    stopStream();
    onCapture(canvas.toDataURL("image/jpeg", QUALITY));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      onCapture(await downscaleToJpeg(file));
    } catch (err) {
      reportError("image downscale", err);
    }
  }

  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-md flex-col bg-black">
      {/* banner above the feed — same ModalHeader as New receipt so the
          transition after capture doesn't shift */}
      <ModalHeader title="Take a picture of the receipt" onClose={onClose} />

      {/* live feed + overlay guide */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {!failed ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-on-surface-variant">
              Couldn't open the camera.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-primary px-6 py-2.5 font-medium text-on-primary"
            >
              Choose a photo instead
            </button>
          </div>
        )}
      </div>

      {/* shutter */}
      {!failed && (
        <div className="flex items-center justify-center bg-surface py-5">
          <button
            onClick={captureFrame}
            disabled={!ready}
            aria-label="Capture"
            className="h-16 w-16 rounded-full bg-primary ring-4 ring-primary/30 transition active:scale-95 disabled:opacity-50"
          />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
