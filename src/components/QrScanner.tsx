import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

interface QrScannerProps {
  /** Called with the raw decoded string the first time a code is read. */
  onDecodedText: (text: string) => void;
  /** Called when the camera can't be started (permission denied, no device). */
  onError?: (message: string) => void;
}

/**
 * Live camera view that decodes a QR badge and reports its contents once.
 * Cleans up the media stream automatically on unmount.
 */
export function QrScannerView({ onDecodedText, onError }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannedRef = useRef(false);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        scanner.stop();
        onDecodedText(result.data);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      },
    );

    scanner
      .start()
      .then(() => setStarting(false))
      .catch((e) => {
        setStarting(false);
        onError?.(
          e instanceof Error
            ? e.message
            : "Unable to access the camera. Check permissions.",
        );
      });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [onDecodedText, onError]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video ref={videoRef} className="h-full w-full object-cover" />
      {starting && (
        <div className="absolute inset-0 grid place-items-center bg-night-900/80 text-sm text-white/60">
          Starting camera…
        </div>
      )}
    </div>
  );
}
