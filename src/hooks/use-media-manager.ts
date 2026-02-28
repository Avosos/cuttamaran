import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";

interface CachedMedia {
  element: HTMLVideoElement | HTMLAudioElement | HTMLImageElement;
  clipId: string;
  type: "video" | "audio" | "image";
  src: string;
  ready: boolean;
}

/**
 * Manages HTMLMediaElement instances for timeline clips.
 *
 * - Creates/pools <video>, <audio>, and <img> elements for clips that have a
 *   real `src` (blob URL or file URL).
 * - Syncs play / pause / seek / volume with the editor timeline.
 * - Exposes `getVideoElement` and `getImageElement` so the canvas renderer can
 *   call `ctx.drawImage(el, …)` to paint actual decoded frames.
 */
export function useMediaManager(masterVolume: number = 1) {
  const mediaCache = useRef<Map<string, CachedMedia>>(new Map());

  // Subscribe to individual slices so we don't re-render on unrelated changes
  const tracks = useEditorStore((s) => s.tracks);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  // ── helpers ───────────────────────────────────────────
  /** Flat list of every clip that carries a real source URL, annotated with
   *  the track-level mute / visibility flags it inherits. */
  const getClipsWithTrackInfo = useCallback(() => {
    return tracks.flatMap((track) =>
      track.clips
        .filter((clip) => clip.src && clip.src.length > 0)
        .map((clip) => ({
          ...clip,
          trackMuted: track.muted,
          trackVisible: track.visible,
        }))
    );
  }, [tracks]);

  // ── create / destroy elements ─────────────────────────
  useEffect(() => {
    const clips = getClipsWithTrackInfo();
    const activeIds = new Set(clips.map((c) => c.id));

    // Tear down elements whose clips were removed
    for (const [id, cached] of mediaCache.current) {
      if (!activeIds.has(id)) {
        if (cached.type !== "image") {
          const el = cached.element as HTMLMediaElement;
          el.pause();
          el.removeAttribute("src");
          el.load(); // release network resources
        }
        mediaCache.current.delete(id);
      }
    }

    // Spin up elements for new clips
    for (const clip of clips) {
      const existing = mediaCache.current.get(clip.id);
      if (existing && existing.src === clip.src) continue; // already tracked

      // Source changed → drop old entry
      if (existing) {
        if (existing.type !== "image") {
          (existing.element as HTMLMediaElement).pause();
        }
        mediaCache.current.delete(clip.id);
      }

      const entry: CachedMedia = {
        element: null!,
        clipId: clip.id,
        type: clip.type as "video" | "audio" | "image",
        src: clip.src,
        ready: false,
      };

      if (clip.type === "video") {
        const video = document.createElement("video");
        video.src = clip.src;
        video.preload = "auto";
        video.playsInline = true;
        // Keep audio on — volume is controlled per-element below
        video.addEventListener("loadeddata", () => {
          entry.ready = true;
        });
        entry.element = video;
      } else if (clip.type === "audio") {
        const audio = document.createElement("audio");
        audio.src = clip.src;
        audio.preload = "auto";
        audio.addEventListener("loadeddata", () => {
          entry.ready = true;
        });
        entry.element = audio;
      } else if (clip.type === "image") {
        const img = new Image();
        img.src = clip.thumbnail || clip.src;
        img.addEventListener("load", () => {
          entry.ready = true;
        });
        entry.element = img;
      }

      if (entry.element) {
        mediaCache.current.set(clip.id, entry);
      }
    }
  }, [getClipsWithTrackInfo]);

  // ── sync playback / seek / volume every frame ─────────
  useEffect(() => {
    const clips = getClipsWithTrackInfo();

    for (const clip of clips) {
      if (clip.type === "image") continue; // images don't "play"

      const cached = mediaCache.current.get(clip.id);
      if (!cached || !cached.ready) continue;

      const el = cached.element as HTMLMediaElement;
      const clipEnd = clip.startTime + clip.duration;
      const isActive = currentTime >= clip.startTime && currentTime < clipEnd;
      const mediaTime = currentTime - clip.startTime + clip.trimStart;

      if (isActive) {
        // Volume ─ clip vol × master vol, respecting track mute
        const clipVol = clip.volume ?? 1;
        el.volume = clip.trackMuted
          ? 0
          : Math.min(1, Math.max(0, clipVol * masterVolume));

        if (isPlaying) {
          // During playback let the element run; only re-seek if drift
          // exceeds 150 ms so we don't stutter.
          if (Math.abs(el.currentTime - mediaTime) > 0.15) {
            el.currentTime = mediaTime;
          }
          if (el.paused) {
            el.play().catch(() => {});
          }
        } else {
          // Paused / scrubbing – seek directly
          el.pause();
          if (Math.abs(el.currentTime - mediaTime) > 0.01) {
            el.currentTime = mediaTime;
          }
        }
      } else {
        // Clip not at playhead → silence it
        if (!el.paused) el.pause();
      }
    }
  }, [currentTime, isPlaying, getClipsWithTrackInfo, masterVolume]);

  // ── cleanup on unmount ────────────────────────────────
  useEffect(() => {
    const cache = mediaCache.current;
    return () => {
      for (const cached of cache.values()) {
        if (cached.type !== "image") {
          const el = cached.element as HTMLMediaElement;
          el.pause();
          el.removeAttribute("src");
          el.load();
        }
      }
      cache.clear();
    };
  }, []);

  // ── public accessors ─────────────────────────────────
  const getVideoElement = useCallback(
    (clipId: string): HTMLVideoElement | null => {
      const cached = mediaCache.current.get(clipId);
      if (cached?.type === "video" && cached.ready) {
        return cached.element as HTMLVideoElement;
      }
      return null;
    },
    []
  );

  const getImageElement = useCallback(
    (clipId: string): HTMLImageElement | null => {
      const cached = mediaCache.current.get(clipId);
      if (cached?.type === "image" && cached.ready) {
        return cached.element as HTMLImageElement;
      }
      return null;
    },
    []
  );

  return { getVideoElement, getImageElement };
}
