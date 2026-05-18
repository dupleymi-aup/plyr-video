"use client";

import { useEffect, useRef, forwardRef } from "react";
import Plyr from "plyr";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function detectMimeType(url: string): string {
  if (url.includes(".m3u8")) return "application/x-mpegurl";
  if (url.includes(".mpd")) return "application/dash+xml";
  if (url.includes(".webm")) return "video/webm";
  if (url.includes(".ogg") || url.includes(".ogv")) return "video/ogg";
  return "video/mp4";
}

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  mimeType?: string;
  captions?: Array<{ src: string; label: string; srclang: string }>;
  onReady?: (player: Plyr) => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export const PlyrPlayer = forwardRef<Plyr | null, PlyrPlayerProps>(
  ({ source, poster, captions, mimeType, onReady, onEnded, onTimeUpdate, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Plyr | null>(null);
    // Keep refs for callbacks to avoid stale closures
    const onEndedRef = useRef(onEnded);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const type = mimeType || detectMimeType(source);

    // Keep callback refs in sync
    useEffect(() => {
      onEndedRef.current = onEnded;
    }, [onEnded]);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    // Expose player instance via ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(playerRef.current);
        } else {
          (ref as React.MutableRefObject<Plyr | null>).current = playerRef.current;
        }
      }
    }, [ref]);

    // Initialize player
    useEffect(() => {
      if (!containerRef.current) return;

      playerRef.current = new Plyr(containerRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "captions",
          "settings",
          "pip",
          "fullscreen",
        ],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        quality: { default: 720, options: [360, 480, 720, 1080] },
        tooltips: { controls: true, seek: true },
      });

      // Set source during init — avoids double-setup
      playerRef.current.source = {
        type: "video",
        sources: [{ src: source, type }],
        ...(poster && { poster }),
        ...(captions && {
          tracks: captions.map((cap) => ({
            kind: "captions",
            label: cap.label,
            srclang: cap.srclang,
            src: cap.src,
          })),
        }),
      };

      if (onReady && playerRef.current) {
        onReady(playerRef.current);
      }

      playerRef.current.on("ended", () => onEndedRef.current?.());
      playerRef.current.on("timeupdate", () => {
        if (playerRef.current) {
          onTimeUpdateRef.current?.(playerRef.current.currentTime);
        }
      });

      return () => {
        try {
          playerRef.current?.destroy();
        } catch {
          // Ignore destroy errors — player may already be in a bad state
        }
        playerRef.current = null;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update source when it changes after initial mount
    useEffect(() => {
      if (playerRef.current && source && playerRef.current.ready) {
        playerRef.current.source = {
          type: "video",
          sources: [{ src: source, type }],
          ...(poster && { poster }),
          ...(captions && {
            tracks: captions.map((cap) => ({
              kind: "captions",
              label: cap.label,
              srclang: cap.srclang,
              src: cap.src,
            })),
          }),
        };
      }
    }, [source, poster, captions]);

    return (
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center rounded-lg bg-black aspect-video text-white">
            <p className="text-sm">Video player failed to load.</p>
          </div>
        }
      >
        <div ref={containerRef} className={className}>
          <video
            controls
            crossOrigin="anonymous"
            playsInline
            preload="metadata"
            poster={poster}
          >
            <source src={source} type={type} />
            {captions?.map((cap) => (
              <track
                key={cap.srclang}
                kind="captions"
                label={cap.label}
                srcLang={cap.srclang}
                src={cap.src}
              />
            ))}
          </video>
        </div>
      </ErrorBoundary>
    );
  }
);

PlyrPlayer.displayName = "PlyrPlayer";
