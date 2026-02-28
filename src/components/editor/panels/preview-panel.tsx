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
      } else if (clip.type === "image" && clip.thumbnail) {
        // Draw image placeholder
        const img = new window.Image();
        img.src = clip.thumbnail;
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch {
          // Image not loaded yet
        }
      } else if (clip.type === "video") {
        // Draw video frame placeholder with gradient
        const progress =
          (currentTime - clip.startTime) / clip.duration;
        const hue = 240 + progress * 60;
        const grad = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        grad.addColorStop(0, `hsl(${hue}, 50%, 15%)`);
        grad.addColorStop(1, `hsl(${hue + 30}, 40%, 10%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated bars
        ctx.fillStyle = `hsl(${hue}, 60%, 25%)`;
        const barW = canvas.width / 20;
        for (let i = 0; i < 20; i++) {
          const barH =
            canvas.height *
            (0.2 +
              0.3 * Math.sin((progress * Math.PI * 4 + i * 0.5) % Math.PI));
          ctx.fillRect(
            i * barW + 2,
            canvas.height - barH,
            barW - 4,
            barH
          );
        }

        // File name
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(clip.name, canvas.width / 2, 30);
      }
    }
  }, [getActiveClips, currentTime, canvasSize]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlayback();
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 5 : 1)));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime(
            Math.min(duration, currentTime + (e.shiftKey ? 5 : 1))
          );
          break;
        case "Home":
          e.preventDefault();
          setCurrentTime(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentTime(duration);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback, setCurrentTime, currentTime, duration]);

  // Calculate canvas display size
  const aspectRatio = canvasSize.width / canvasSize.height;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Preview area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 min-h-0"
      >
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{
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
            className="w-full h-full"
            style={{ background: "#000" }}
          />

          {/* Resolution badge */}
          <div
            className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-medium"
            style={{
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
        className="px-4 py-3"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Progress bar */}
        <div
          className="relative w-full h-1 rounded-full mb-3 cursor-pointer group"
          style={{ background: "var(--bg-surface)" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            setCurrentTime(ratio * duration);
          }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all"
            style={{
              width: `${(currentTime / duration) * 100}%`,
              background: "linear-gradient(90deg, var(--accent), #a78bfa)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              transform: "translate(-50%, -50%)",
              background: "white",
              boxShadow: "0 0 10px var(--accent-glow)",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          {/* Time display */}
          <div
            className="font-mono text-xs tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--text-primary)" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ color: "var(--text-muted)" }}> / </span>
            {formatTime(duration)}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentTime(0)}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              title="Go to start"
            >
              <SkipBack
                size={16}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>

            <button
              onClick={togglePlayback}
              className="p-2.5 rounded-xl transition-all"
              style={{
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
                <Pause size={18} className="text-white" />
              ) : (
                <Play
                  size={18}
                  className="text-white"
                  style={{ marginLeft: "2px" }}
                />
              )}
            </button>

            <button
              onClick={() => setCurrentTime(duration)}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              title="Go to end"
            >
              <SkipForward
                size={16}
                style={{ color: "var(--text-secondary)" }}
              />
            </button>
          </div>

          {/* Volume & Fullscreen */}
          <div className="flex items-center gap-2">
            <Volume2 size={14} style={{ color: "var(--text-muted)" }} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-16"
            />
            <button
              className="p-1.5 rounded-lg transition-all hover:bg-white/5 ml-1"
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
