"use client";

import React, { useEffect, useState } from "react";
import { Scissors } from "lucide-react";

interface SplashScreenProps {
  onFinished: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      { at: 15, text: "Loading core modules..." },
      { at: 35, text: "Preparing workspace..." },
      { at: 55, text: "Loading plugins..." },
      { at: 75, text: "Setting up timeline engine..." },
      { at: 90, text: "Almost ready..." },
      { at: 100, text: "Welcome to Cuttamaran" },
    ];

    let frame: number;
    const start = Date.now();
    const duration = 2200; // 2.2s total

    const animate = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);

      const currentStep = [...steps].reverse().find((s) => p >= s.at);
      if (currentStep) setStatusText(currentStep.text);

      if (p < 100) {
        frame = requestAnimationFrame(animate);
      } else {
        setTimeout(onFinished, 400);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        className="relative flex items-center justify-center mb-6"
        style={{
          animation: "splashLogoIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--accent-gradient-vibrant)",
            boxShadow: "0 0 60px var(--accent-glow), 0 0 120px var(--accent-muted)",
          }}
        >
          <Scissors size={36} className="text-white" />
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-3xl font-bold tracking-tight mb-1"
        style={{
          background: "linear-gradient(135deg, #f0f0f5, #a0a0b5)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "splashFadeUp 0.6s 0.2s ease-out both",
        }}
      >
        Cuttamaran
      </h1>
      <p
        className="text-sm mb-10"
        style={{
          color: "var(--text-muted)",
          animation: "splashFadeUp 0.6s 0.35s ease-out both",
        }}
      >
        Video Editor
      </p>

      {/* Progress bar */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: 260,
          height: 3,
          background: "var(--hover-overlay)",
          animation: "splashFadeUp 0.6s 0.5s ease-out both",
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: "var(--accent-gradient-bar)",
            boxShadow: "0 0 12px var(--accent-glow)",
            transition: "width 0.15s ease-out",
          }}
        />
      </div>

      {/* Status text */}
      <p
        className="mt-4 text-xs tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {statusText}
      </p>

      {/* Version */}
      <p
        className="absolute bottom-6 text-[10px]"
        style={{ color: "var(--text-muted)", opacity: 0.5 }}
      >
        v0.1.0
      </p>
    </div>
  );
}
