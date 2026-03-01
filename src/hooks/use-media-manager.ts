import { useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";

interface CachedMedia {
  element: HTMLVideoElement | HTMLAudioElement | HTMLImageElement;
  clipId: string;
  type: "video" | "audio" | "image";
  src: string;
  ready: boolean;
  /** Web Audio nodes for this element (only for video/audio) */
  sourceNode?: MediaElementAudioSourceNode;
  gainNode?: GainNode;
}

/**
 * Manages HTMLMediaElement instances for timeline clips.
 *
 * - Creates/pools <video>, <audio>, and <img> elements for clips that have a
 *   real `src` (blob URL or file URL).
 * - Routes all audio through the Web Audio API (AudioContext → GainNode)
 *   so we get proper mixing with per-clip volume, per-track volume,
 *   track mute, track solo, and a master volume knob.
 * - Syncs play / pause / seek with the editor timeline.
 * - Exposes `getVideoElement` and `getImageElement` so the canvas renderer can
 *   call `ctx.drawImage(el, …)` to paint actual decoded frames.
 */
export function useMediaManager(masterVolume: number = 1) {
  const mediaCache = useRef<Map<string, CachedMedia>>(new Map());
  /** Tracks the last time we force-seeked each element (to avoid re-seeking every frame) */
  const lastSyncRef = useRef<Map<string, number>>(new Map());
  /** Shared AudioContext for the entire mixer */
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Subscribe to individual slices so we don't re-render on unrelated changes
  const tracks = useEditorStore((s) => s.tracks);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);

  /** Lazily create / resume the shared AudioContext */
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // ── helpers ───────────────────────────────────────────
  /** Flat list of every clip that carries a real source URL, annotated with
   *  the track-level mute / solo / volume / visibility flags it inherits. */
  const getClipsWithTrackInfo = useCallback(() => {
    const anySolo = tracks.some((t) => t.solo);
    return tracks.flatMap((track) =>
      track.clips
        .filter((clip) => clip.src && clip.src.length > 0)
        .map((clip) => ({
          ...clip,
          trackMuted: track.muted,
          trackSolo: track.solo,
          trackVolume: track.volume ?? 1,
          trackVisible: track.visible,
          /** When any track is soloed, non-soloed tracks are silenced */
          effectivelyMuted: track.muted || (anySolo && !track.solo),
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
        // Disconnect Web Audio nodes
        cached.gainNode?.disconnect();
        cached.sourceNode?.disconnect();
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
        existing.gainNode?.disconnect();
        existing.sourceNode?.disconnect();
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
        video.addEventListener("loadeddata", () => {
          entry.ready = true;
          // Connect to Web Audio graph once loaded
          connectToAudioGraph(entry);
        });
        entry.element = video;
      } else if (clip.type === "audio") {
        const audio = document.createElement("audio");
        audio.src = clip.src;
        audio.preload = "auto";
        audio.addEventListener("loadeddata", () => {
          entry.ready = true;
          connectToAudioGraph(entry);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getClipsWithTrackInfo]);

  /** Route an HTMLMediaElement through Web Audio: source → gain → destination */
  const connectToAudioGraph = useCallback((entry: CachedMedia) => {
    if (entry.type === "image") return;
    if (entry.sourceNode) return; // already connected

    try {
      const ctx = getAudioContext();
      const el = entry.element as HTMLMediaElement;
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      entry.sourceNode = source;
      entry.gainNode = gain;
    } catch {
      // Some browsers may reject duplicate createMediaElementSource calls.
      // Fall back to native volume control (handled in sync loop).
    }
  }, [getAudioContext]);

  // ── sync playback / seek / volume every frame ─────────
  useEffect(() => {
    const clips = getClipsWithTrackInfo();
    const now = performance.now();

    for (const clip of clips) {
      if (clip.type === "image") continue; // images don't "play"

      const cached = mediaCache.current.get(clip.id);
      if (!cached || !cached.ready) continue;

      const el = cached.element as HTMLMediaElement;
      const clipEnd = clip.startTime + clip.duration;
      const isActive = currentTime >= clip.startTime && currentTime < clipEnd;
      const mediaTime = currentTime - clip.startTime + clip.trimStart;

      if (isActive) {
        // ── Volume mixing ──
        // Final volume = clipVol × trackVol × masterVol
        // Silence when the track is muted or when solo logic silences it.
        const clipVol = clip.volume ?? 1;
        const finalVol = clip.effectivelyMuted
          ? 0
          : Math.min(1, Math.max(0, clipVol * clip.trackVolume * masterVolume));

        if (cached.gainNode) {
          // Use Web Audio gain for smooth, click-free volume changes
          cached.gainNode.gain.value = finalVol;
          // HTMLMediaElement volume must stay at 1 when routed through Web Audio
          el.volume = 1;
        } else {
          // Fallback: direct volume on the element
          el.volume = finalVol;
        }

        if (isPlaying) {
          // During playback: let the native element run freely.
          // Only force-seek when drift is large (> 300ms) AND we haven't
          // synced recently (debounce 500ms) to prevent the constant
          // seek→play→seek cycle that causes the "morse code" sound.
          const drift = Math.abs(el.currentTime - mediaTime);
          const lastSync = lastSyncRef.current.get(clip.id) ?? 0;
          const sinceLast = now - lastSync;

          if (drift > 0.3 && sinceLast > 500) {
            el.currentTime = mediaTime;
            lastSyncRef.current.set(clip.id, now);
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
          // Reset sync tracker so next play starts fresh
          lastSyncRef.current.delete(clip.id);
        }
      } else {
        // Clip not at playhead → silence it
        if (cached.gainNode) {
          cached.gainNode.gain.value = 0;
        }
        if (!el.paused) el.pause();
        lastSyncRef.current.delete(clip.id);
      }
    }
  }, [currentTime, isPlaying, getClipsWithTrackInfo, masterVolume]);

  // ── cleanup on unmount ────────────────────────────────
  useEffect(() => {
    const cache = mediaCache.current;
    const ctx = audioCtxRef.current;
    return () => {
      for (const cached of cache.values()) {
        if (cached.type !== "image") {
          const el = cached.element as HTMLMediaElement;
          el.pause();
          el.removeAttribute("src");
          el.load();
        }
        cached.gainNode?.disconnect();
        cached.sourceNode?.disconnect();
      }
      cache.clear();
      if (ctx) ctx.close().catch(() => {});
      audioCtxRef.current = null;
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
