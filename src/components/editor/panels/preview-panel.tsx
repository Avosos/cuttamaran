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
  const [volume, setVolume] = useState(80);
  const { getVideoElement, getImageElement } = useMediaManager(volume / 100);

  // Get active clips at current time
  const getActiveClips = useCallback(() => {
    return tracks.flatMap((track) =>
      track.clips.filter(
        (clip) =>
          currentTime >= clip.startTime &&
          currentTime < clip.startTime + clip.duration
      )
    );
  }, [tracks, currentTime]);

  // Render the preview canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const activeClips = getActiveClips();

    if (activeClips.length === 0) {
      // Draw empty state
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
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
      ctx.strokeStyle = "rgba(124, 92, 252, 0.3)";
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
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Drop media to get started", cx, cy + 50);
      return;
    }

    // Render active clips
    for (const clip of activeClips) {
      if (clip.type === "text") {
        // Render text clips
        const fontSize = clip.fontSize || 48;
        ctx.font = `bold ${fontSize}px ${clip.fontFamily || "Inter"}, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (clip.backgroundColor) {
          const textMetrics = ctx.measureText(clip.text || "");
          const padding = 16;
          ctx.fillStyle = clip.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(
            canvas.width / 2 - textMetrics.width / 2 - padding,
            canvas.height / 2 - fontSize / 2 - padding / 2,
            textMetrics.width + padding * 2,
            fontSize + padding,
            8
          );
          ctx.fill();
        }

        // Text shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = clip.color || "#ffffff";
        ctx.fillText(
          clip.text || "",
          canvas.width / 2,
          canvas.height / 2
        );

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
          ctx.globalAlpha = clip.opacity ?? 1;
          ctx.drawImage(imgEl, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
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
          ctx.globalAlpha = clip.opacity ?? 1;
          ctx.drawImage(videoEl, dx, dy, dw, dh);
          ctx.globalAlpha = 1;
        } else {
          // Placeholder – no source or still loading
          ctx.fillStyle = "#0f0f1a";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;

          // Film-frame icon
          ctx.strokeStyle = "rgba(124, 92, 252, 0.3)";
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 32, cy - 24, 64, 48);
          ctx.fillStyle = "rgba(124, 92, 252, 0.25)";
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy - 14);
          ctx.lineTo(cx - 10, cy + 14);
          ctx.lineTo(cx + 14, cy);
          ctx.closePath();
          ctx.fill();

          // Clip name
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.font = "13px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(clip.name, cx, cy + 50);

          if (clip.src) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.font = "11px Inter, sans-serif";
            ctx.fillText("Loading\u2026", cx, cy + 68);
          }
        }
      }
    }
  }, [getActiveClips, currentTime, canvasSize, getVideoElement, getImageElement]);

  // Playback animation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const animate = (time: number) => {
        const delta = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const newTime = currentTime + delta;
        if (newTime >= duration) {
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(newTime);
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, currentTime, duration, setCurrentTime, setIsPlaying]);

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
              "0 0 0 1px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
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
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(8px)",
              color: "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {canvasSize.width}×{canvasSize.height}
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title="Go to start"
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
                  : "linear-gradient(135deg, #7c5cfc, #6344e0)",
                boxShadow: isPlaying
                  ? "none"
                  : "0 4px 16px rgba(124, 92, 252, 0.4)",
              }}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title="Go to end"
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              title="Fullscreen"
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
