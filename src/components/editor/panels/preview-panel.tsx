"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Monitor,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useMediaManager } from "@/hooks/use-media-manager";
import { useSettings } from "@/hooks/use-settings";
import { getTranslations } from "@/lib/i18n";

export default function PreviewPanel() {
  const {
    isPlaying,
    currentTime,
    duration,
    togglePlayback,
    setCurrentTime,
    setIsPlaying,
    canvasSize,
    tracks,
  } = useEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const [volume, setVolume] = useState(80);
  const { getVideoElement, getImageElement } = useMediaManager(volume / 100);
  const [settings] = useSettings();
  const t = getTranslations(settings.language);

  // Scale the internal canvas resolution based on preview quality setting.
  // Lower quality = smaller canvas = faster rendering (CSS auto-scales it up).
  const qualityScale = settings.previewQuality === "low" ? 0.25
    : settings.previewQuality === "medium" ? 0.5
    : 1;
  const renderWidth = Math.round(canvasSize.width * qualityScale);
  const renderHeight = Math.round(canvasSize.height * qualityScale);

  // Keep refs in sync with store values
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // Get active clips at current time, z-ordered for compositing.
  // tracks[0] = top of timeline = foreground, so iterate in reverse:
  // bottom tracks paint first (background), top tracks paint last (foreground).
  const getActiveClips = useCallback(() => {
    const ordered: typeof tracks[number]["clips"] = [];
    for (let i = tracks.length - 1; i >= 0; i--) {
      const track = tracks[i];
      if (!track.visible || track.type === "audio") continue;
      for (const clip of track.clips) {
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          ordered.push(clip);
        }
      }
    }
    return ordered;
  }, [tracks, currentTime]);

  // Render the preview canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read theme-aware colors from CSS variables
    const cs = getComputedStyle(document.documentElement);
    const canvasBg = cs.getPropertyValue("--canvas-bg").trim() || "#0f0f1a";
    const accentColor = cs.getPropertyValue("--accent").trim() || "#7c5cfc";

    // Clear
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const activeClips = getActiveClips();

    if (activeClips.length === 0) {
      // Draw empty state
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern
      ctx.strokeStyle = cs.getPropertyValue("--hover-subtle").trim();
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center crosshair
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.strokeStyle = accentColor + "4d";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center text
      ctx.fillStyle = cs.getPropertyValue("--text-muted").trim();
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t.preview.dropMediaToStart, cx, cy + 50);
      return;
    }

    // Render active clips
    for (const clip of activeClips) {
      // ── Build CSS filter string from clip effects ──
      const effects = clip.effects || [];
      const clipTime = currentTime - clip.startTime; // time within this clip
      const filterParts: string[] = [];
      let fadeAlpha = 1;

      for (const fx of effects) {
        switch (fx.type) {
          case "blur":
            // value 0→1 maps to 0→20px
            filterParts.push(`blur(${(fx.value * 20).toFixed(1)}px)`);
            break;
          case "brightness":
            // value 0→1 maps to 0.2→2.0
            filterParts.push(`brightness(${(0.2 + fx.value * 1.8).toFixed(2)})`);
            break;
          case "contrast":
            // value 0→1 maps to 0.2→2.0
            filterParts.push(`contrast(${(0.2 + fx.value * 1.8).toFixed(2)})`);
            break;
          case "saturation":
            // value 0→1 maps to 0→2
            filterParts.push(`saturate(${(fx.value * 2).toFixed(2)})`);
            break;
          case "fade_in": {
            const dur = fx.duration ?? 1;
            if (clipTime < dur) {
              fadeAlpha *= clipTime / dur;
            }
            break;
          }
          case "fade_out": {
            const dur = fx.duration ?? 1;
            const timeFromEnd = clip.duration - clipTime;
            if (timeFromEnd < dur) {
              fadeAlpha *= timeFromEnd / dur;
            }
            break;
          }
          case "cross_dissolve": {
            const dur = fx.duration ?? 1;
            if (clipTime < dur) {
              fadeAlpha *= clipTime / dur;
            }
            const timeFromEnd = clip.duration - clipTime;
            if (timeFromEnd < dur) {
              fadeAlpha *= timeFromEnd / dur;
            }
            break;
          }
        }
      }

      // Clamp
      fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));
      const hasVignette = effects.find((e) => e.type === "vignette");

      // ── Per-clip compositing: save state, apply opacity + transform ──
      ctx.save();
      ctx.globalAlpha = (clip.opacity ?? 1) * fadeAlpha;

      // Transform (position, rotation, scale) around canvas center
      const px = (clip.positionX ?? 0) * (canvas.width / canvasSize.width);
      const py = (clip.positionY ?? 0) * (canvas.height / canvasSize.height);
      const rot = (clip.rotation ?? 0) * Math.PI / 180;
      const sx = clip.scaleX ?? 1;
      const sy = clip.scaleY ?? 1;
      if (px !== 0 || py !== 0 || rot !== 0 || sx !== 1 || sy !== 1) {
        const anchorX = canvas.width / 2;
        const anchorY = canvas.height / 2;
        ctx.translate(anchorX + px, anchorY + py);
        ctx.rotate(rot);
        ctx.scale(sx, sy);
        ctx.translate(-anchorX, -anchorY);
      }

      // Apply CSS filters
      if (filterParts.length > 0) {
        ctx.filter = filterParts.join(" ");
      }

      if (clip.type === "text") {
        // Render text clips
        const fontSize = clip.fontSize || 48;
        const weight = clip.fontWeight || "bold";
        const style = clip.fontStyle === "italic" ? "italic " : "";
        const family = clip.fontFamily || "Inter";
        ctx.font = `${style}${weight} ${fontSize}px ${family}, sans-serif`;
        const align = clip.textAlign || "center";
        ctx.textAlign = align;
        ctx.textBaseline = "middle";

        // Compute anchor x
        const anchorX = align === "left" ? fontSize : align === "right" ? canvas.width - fontSize : canvas.width / 2;

        // Letter spacing (apply via letterSpacing property on canvas — 2D spec)
        if (clip.letterSpacing && "letterSpacing" in ctx) {
          (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${clip.letterSpacing}px`;
        }

        // Multi-line support via lineHeight
        const lh = (clip.lineHeight ?? 1.2) * fontSize;
        const lines = (clip.text || "").split("\\n");
        const totalTextHeight = lines.length * lh;
        const startY = canvas.height / 2 - totalTextHeight / 2 + lh / 2;

        if (clip.backgroundColor) {
          // Measure widest line
          let maxW = 0;
          for (const line of lines) {
            const m = ctx.measureText(line);
            if (m.width > maxW) maxW = m.width;
          }
          const padding = 16;
          const bgX = align === "left" ? anchorX - padding : align === "right" ? anchorX - maxW - padding : anchorX - maxW / 2 - padding;
          ctx.fillStyle = clip.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(
            bgX,
            startY - lh / 2 - padding / 2,
            maxW + padding * 2,
            totalTextHeight + padding,
            8
          );
          ctx.fill();
        }

        // Text shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        for (let i = 0; i < lines.length; i++) {
          const ly = startY + i * lh;
          // Stroke
          if (clip.strokeWidth && clip.strokeWidth > 0) {
            ctx.strokeStyle = clip.strokeColor || "#000000";
            ctx.lineWidth = clip.strokeWidth;
            ctx.lineJoin = "round";
            ctx.strokeText(lines[i], anchorX, ly);
          }
          // Fill
          ctx.fillStyle = clip.color || "#ffffff";
          ctx.fillText(lines[i], anchorX, ly);
          // Underline
          if (clip.textDecoration === "underline") {
            const m = ctx.measureText(lines[i]);
            const ux = align === "left" ? anchorX : align === "right" ? anchorX - m.width : anchorX - m.width / 2;
            ctx.fillRect(ux, ly + fontSize * 0.35, m.width, Math.max(2, fontSize / 20));
          }
        }

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      } else if (clip.type === "image") {
        // Draw decoded image (cached by media manager)
        const imgEl = getImageElement(clip.id);
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
          const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
          const cAspect = canvas.width / canvas.height;
          let dw: number, dh: number, dx: number, dy: number;
          if (imgAspect > cAspect) {
            dw = canvas.width;
            dh = canvas.width / imgAspect;
            dx = 0;
            dy = (canvas.height - dh) / 2;
          } else {
            dh = canvas.height;
            dw = canvas.height * imgAspect;
            dx = (canvas.width - dw) / 2;
            dy = 0;
          }
          ctx.drawImage(imgEl, dx, dy, dw, dh);
        } else if (clip.thumbnail) {
          // Fallback while image loads
          const img = new window.Image();
          img.src = clip.thumbnail;
          try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          } catch {
            /* not loaded yet */
          }
        }
      } else if (clip.type === "video") {
        const videoEl = getVideoElement(clip.id);
        if (videoEl && videoEl.readyState >= 2) {
          // ── draw the actual decoded video frame ──
          const vAspect = videoEl.videoWidth / videoEl.videoHeight;
          const cAspect = canvas.width / canvas.height;
          let dw: number, dh: number, dx: number, dy: number;
          if (vAspect > cAspect) {
            dw = canvas.width;
            dh = canvas.width / vAspect;
            dx = 0;
            dy = (canvas.height - dh) / 2;
          } else {
            dh = canvas.height;
            dw = canvas.height * vAspect;
            dx = (canvas.width - dw) / 2;
            dy = 0;
          }
          ctx.drawImage(videoEl, dx, dy, dw, dh);
        } else {
          // Placeholder – no source or still loading
          ctx.fillStyle = canvasBg;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Film-frame icon
          ctx.strokeStyle = accentColor + "4d";
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 32, cy - 24, 64, 48);
          ctx.fillStyle = accentColor + "40";
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy - 14);
          ctx.lineTo(cx - 10, cy + 14);
          ctx.lineTo(cx + 14, cy);
          ctx.closePath();
          ctx.fill();

          // Clip name
          ctx.fillStyle = cs.getPropertyValue("--text-muted").trim();
          ctx.font = "13px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(clip.name, cx, cy + 50);

          if (clip.src) {
            ctx.fillStyle = cs.getPropertyValue("--text-muted").trim();
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("Loading\u2026", cx, cy + 68);
          }
        }
      }

      // ── Vignette: radial gradient overlay (draw in clip's transform space) ──
      if (hasVignette) {
        // Reset filter so vignette isn't double-processed
        ctx.filter = "none";
        const strength = hasVignette.value;
        const vcx = canvas.width / 2;
        const vcy = canvas.height / 2;
        const radius = Math.max(vcx, vcy);
        const grad = ctx.createRadialGradient(vcx, vcy, radius * (1 - strength * 0.6), vcx, vcy, radius);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${(strength * 0.85).toFixed(2)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Restore state (resets globalAlpha, transform, filter, shadows, etc.)
      ctx.restore();
    }
  }, [getActiveClips, currentTime, canvasSize, getVideoElement, getImageElement]);

  // Playback animation loop
  // Only re-run when isPlaying toggles — reads currentTime from ref to avoid
  // a dependency cycle that would tear down/recreate the RAF every frame.
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const animate = (time: number) => {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const newTime = currentTimeRef.current + delta;
        if (newTime >= durationRef.current) {
          // Update ref immediately so next RAF (if any) reads correct value
          currentTimeRef.current = 0;
          setCurrentTime(0);
          setIsPlaying(false);
          return; // stop the loop – the isPlaying=false will prevent restart
        }

        // Keep ref in lockstep with store to avoid stale reads
        currentTimeRef.current = newTime;
        setCurrentTime(newTime);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, setCurrentTime, setIsPlaying]);

  // Render on state changes
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);



  // Calculate canvas display size
  const aspectRatio = canvasSize.width / canvasSize.height;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary)" }}
    >
      {/* Preview area */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 0 }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 12,
            overflow: "hidden",
            aspectRatio: `${aspectRatio}`,
            maxWidth: "100%",
            maxHeight: "100%",
            width: aspectRatio > 1 ? "100%" : "auto",
            height: aspectRatio <= 1 ? "100%" : "auto",
            boxShadow:
              "var(--shadow-heavy)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={renderWidth}
            height={renderHeight}
            style={{ width: "100%", height: "100%", background: "#000" }}
          />

          {/* Resolution badge */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 500,
              background: "var(--overlay-bg)",
              backdropFilter: "blur(8px)",
              color: "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {canvasSize.width}×{canvasSize.height}{qualityScale < 1 ? ` (${settings.previewQuality})` : ""}
          </div>
        </div>
      </div>

      {/* Transport controls */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Progress bar */}
        <div
          style={{ position: "relative", width: "100%", height: 4, borderRadius: 9999, marginBottom: 12, cursor: "pointer", background: "var(--bg-surface)" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setCurrentTime(ratio * duration);
          }}
          onMouseEnter={(e) => {
            const thumb = e.currentTarget.querySelector("[data-thumb]") as HTMLElement;
            if (thumb) thumb.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            const thumb = e.currentTarget.querySelector("[data-thumb]") as HTMLElement;
            if (thumb) thumb.style.opacity = "0";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              borderRadius: 9999,
              transition: "width 0.05s",
              width: `${(currentTime / duration) * 100}%`,
              background: "linear-gradient(90deg, var(--accent), #a78bfa)",
            }}
          />
          <div
            data-thumb=""
            style={{
              position: "absolute",
              top: "50%",
              width: 12,
              height: 12,
              borderRadius: "50%",
              opacity: 0,
              transition: "opacity 0.15s",
              left: `${(currentTime / duration) * 100}%`,
              transform: "translate(-50%, -50%)",
              background: "white",
              boxShadow: "0 0 10px var(--accent-glow)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Time display */}
          <div
            style={{ fontFamily: "monospace", fontSize: 12, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ color: "var(--text-muted)" }}> / </span>
            {formatTime(duration)}
          </div>

          {/* Playback controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setCurrentTime(0)}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title={t.preview.goToStart}
            >
              <SkipBack
                size={16}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>

            <button
              onClick={togglePlayback}
              style={{
                padding: 10,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: isPlaying
                  ? "var(--bg-hover)"
                  : "var(--accent-gradient)",
                boxShadow: isPlaying
                  ? "none"
                  : "0 4px 16px var(--accent-glow)",
              }}
              title={isPlaying ? t.preview.pause : t.preview.play}
            >
              {isPlaying ? (
                <Pause size={18} style={{ color: "#ffffff" }} />
              ) : (
                <Play
                  size={18}
                  style={{ color: "#ffffff", marginLeft: 2 }}
                />
              )}
            </button>

            <button
              onClick={() => setCurrentTime(duration)}
              style={{
                padding: 8,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title={t.preview.goToEnd}
            >
              <SkipForward
                size={16}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>
          </div>

          {/* Volume & Fullscreen */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Volume2 size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ width: 64 }}
            />
            <button
              style={{
                padding: 6,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                marginLeft: 4,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-overlay)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title={t.preview.fullscreen}
            >
              <Maximize
                size={14}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
