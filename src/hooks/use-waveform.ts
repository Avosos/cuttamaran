"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Decoded waveform peaks for a single audio source.
 * `peaks` is a Float32Array of normalised amplitudes (0‑1), one entry per
 * "column" at the resolution the caller requested.
 */
export interface WaveformData {
  peaks: Float32Array;
  duration: number;
}

// ── Module-level cache so we decode each src only once ──
const waveformCache = new Map<string, WaveformData>();
const inflight = new Map<string, Promise<WaveformData | null>>();

/**
 * Decode the audio from `src` (blob URL, local-media://, etc.) and return
 * a fixed set of peak amplitudes that can be drawn as a waveform.
 *
 * @param src        URL of the media file
 * @param numPeaks   Number of peaks to return (should roughly equal pixel width / bar-spacing)
 */
async function decodePeaks(
  src: string,
  numPeaks: number
): Promise<WaveformData | null> {
  if (!src) return null;

  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();

    // Decode with an OfflineAudioContext (doesn't need user gesture)
    const audioCtx = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0); // mono / left channel
    const duration = audioBuffer.duration;
    const samplesPerPeak = Math.floor(rawData.length / numPeaks);

    const peaks = new Float32Array(numPeaks);

    // Compute RMS per bucket for a smoother look
    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, rawData.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += rawData[j] * rawData[j];
      }
      peaks[i] = Math.sqrt(sum / (end - start));
    }

    // Normalise so the tallest peak = 1
    let max = 0;
    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i] > max) max = peaks[i];
    }
    if (max > 0) {
      for (let i = 0; i < peaks.length; i++) {
        peaks[i] /= max;
      }
    }

    return { peaks, duration };
  } catch {
    // Not decodable (e.g. no audio track, CORS, codec issue)
    return null;
  }
}

/**
 * React hook – returns waveform peak data for a given source URL.
 *
 * The decode only happens once per unique `src`; results are cached
 * module-wide so switching between clips is instant.
 */
export function useWaveform(
  src: string | undefined,
  numPeaks: number
): WaveformData | null {
  const [data, setData] = useState<WaveformData | null>(() => {
    if (!src) return null;
    return waveformCache.get(cacheKey(src, numPeaks)) ?? null;
  });

  const srcRef = useRef(src);
  const peaksRef = useRef(numPeaks);

  useEffect(() => {
    srcRef.current = src;
    peaksRef.current = numPeaks;

    if (!src) {
      setData(null);
      return;
    }

    const key = cacheKey(src, numPeaks);

    // Already cached
    const cached = waveformCache.get(key);
    if (cached) {
      setData(cached);
      return;
    }

    // Already decoding
    let promise = inflight.get(key);
    if (!promise) {
      promise = decodePeaks(src, numPeaks);
      inflight.set(key, promise);
    }

    promise.then((result) => {
      inflight.delete(key);
      if (result) {
        waveformCache.set(key, result);
      }
      // Only update state if the component still wants this src+peaks
      if (srcRef.current === src && peaksRef.current === numPeaks) {
        setData(result);
      }
    });
  }, [src, numPeaks]);

  return data;
}

function cacheKey(src: string, numPeaks: number): string {
  return `${src}::${numPeaks}`;
}
