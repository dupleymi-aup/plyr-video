"use client";

import { useEffect, useRef, useCallback, forwardRef } from "react";
import Plyr from "plyr";

interface PlyrPlayerProps {
  source: string;
  poster?: string;
  captions?: Array<{ src: string; label: string; srclang: string }>;
  onReady?: (player: Plyr) => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export const PlyrPlayer = forwardRef<Plyr | null, PlyrPlayerProps>(
  ({ source, poster, captions, onReady, onEnded, onTimeUpdate, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Plyr | null>(null);

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

      if (onReady && playerRef.current) {
        onReady(playerRef.current);
      }

      playerRef.current.on("ended", () => onEnded?.());
      playerRef.current.on("timeupdate", () => {
        if (playerRef.current) {
          onTimeUpdate?.(playerRef.current.currentTime);
        }
      });

      return () => {
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, []);

    // Update source when it changes
    useEffect(() => {
      if (playerRef.current && source) {
        playerRef.current.source = {
          type: "video",
          sources: [{ src: source, type: "video/mp4" }],
          poster,
          tracks: captions?.map((cap) => ({
            kind: "captions",
            label: cap.label,
            srclang: cap.srclang,
            src: cap.src,
          })),
        };
      }
    }, [source, poster, captions]);

    return (
      <div ref={containerRef} className={className}>
        <video
          controls
          crossOrigin="anonymous"
          playsInline
          preload="metadata"
          poster={poster}
        >
          <source src={source} type="video/mp4" />
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
    );
  }
);

PlyrPlayer.displayName = "PlyrPlayer";

export function usePlyrPlayer() {
  const playerRef = useRef<Plyr | null>(null);
  const setPlayer = useCallback((player: Plyr) => {
    playerRef.current = player;
  }, []);
  return { playerRef, setPlayer };
}
