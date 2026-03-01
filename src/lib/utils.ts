export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getClipColor(type: string): string {
  switch (type) {
    case "video":
      return "var(--clip-video)";
    case "audio":
      return "var(--clip-audio)";
    case "image":
      return "var(--clip-image)";
    case "text":
      return "var(--clip-text)";
    default:
      return "var(--accent)";
  }
}

export function getClipGradient(type: string): string {
  switch (type) {
    case "video":
      return "var(--accent-gradient)";
    case "audio":
      return "linear-gradient(135deg, #06b6d4, #0891b2)";
    case "image":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "text":
      return "linear-gradient(135deg, #ec4899, #db2777)";
    default:
      return "var(--accent-gradient)";
  }
}

export function getClipPrimaryColor(type: string): string | null {
  switch (type) {
    case "audio":
      return "#06b6d4";
    case "image":
      return "#f59e0b";
    case "text":
      return "#ec4899";
    default:
      return null;
  }
}

export function generateWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    waveform.push(0.2 + Math.random() * 0.6);
  }
  return waveform;
}
