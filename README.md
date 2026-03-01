<h1 align="center">Cuttamaran</h1>

<p align="center">
  A premium, open-source desktop video editor built with modern web technologies.<br/>
  <strong>By Avosos</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-v35-47848f?style=flat-square&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FFmpeg-powered-007808?style=flat-square&logo=ffmpeg" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

---

## Overview

Cuttamaran is a sleek, dark-themed desktop video editor designed for creators who want a fast, modern editing experience. It combines the power of Electron with the flexibility of Next.js and React to deliver a polished, native-feeling application.

The full editing loop — import media, arrange on a multi-track timeline, preview in real time, and export via FFmpeg — works end-to-end today (~11 000 lines of production code).

## Features

### Timeline & Editing
- **Multi-track timeline** — Video, audio, text, and image tracks with drag-and-drop clip editing
- **Clip splitting** — Split clips at the playhead with a single shortcut
- **Trim controls** — Drag clip edges to trim start/end points with source-aware constraints
- **Cross-track dragging** — Move clips between tracks freely
- **Snapping** — Clips snap to the playhead and other clip edges (toggleable)
- **Clip & track colors** — Customize clip and track colors via right-click context menu
- **Track management** — Add, rename, reorder (drag), remove, mute, solo, lock, and hide tracks with per-track volume
- **Speed adjustment** — Change clip speed from 0.25× to 4× via context menu
- **Drag-to-timeline** — Drag media from the asset panel directly onto tracks
- **Undo / Redo** — 50-level history with deep-cloned state snapshots and 500 ms merge window

### Preview & Playback
- **Live preview** — Real-time Canvas 2D compositing with RAF playback loop
- **Transport controls** — Play/pause, frame step (±1 frame), scrub bar, volume slider with mute toggle
- **Resolution switching** — 5 canvas presets (1080p, 720p, 4K, vertical, square) plus custom dimensions up to 8K
- **Effects in preview** — Blur, brightness, contrast, saturation, vignette, and fade rendered live
- **Clip transforms** — Position, scale, and rotation rendered in preview
- **Audio waveforms** — Decoded and cached RMS waveform overlay on audio and video clips

### Media & Assets
- **Asset panel** — Import video, audio, and image files via dialog or drag-and-drop; files are copied into the project `media/` folder
- **Metadata probing** — Duration, resolution, and file size extracted via FFmpeg on import
- **Search & filter** — Quick filter across imported assets
- **Text presets** — 6 styled text presets (Title, Subtitle, Caption, Lower Third, Quote, Callout) with one-click add
- **Effects grid** — 8 effects (fade in/out, cross dissolve, blur, brightness, contrast, saturation, vignette) with drag-onto-clip support
- **User library** — Save clips or multi-track segments to a persistent library with categories; insert from library onto timeline

### Text & Typography
- **Rich text clips** — Editable text content with font family (10 Google fonts), size, color, bold/italic/underline, alignment
- **Advanced styling** — Letter spacing, line height, background color, stroke color and width

### Properties Panel
- **Clip inspector** — Timing (start, duration), trim range with visual bar, opacity, transform (position, scale, rotation with reset), per-clip volume (0–200 %)
- **Text properties** — Full typography controls when a text clip is selected
- **Effects list** — Adjust intensity and duration per effect, remove individual effects

### Export
- **Multi-format export** — MP4 (H.264), WebM (VP9), MOV (ProRes), GIF
- **Audio-only export** — MP3, WAV, AAC
- **Export modes** — Video + Audio, Video Only, Audio Only
- **Quality presets** — Draft (720p), Standard (1080p), High (native resolution)
- **Frame-by-frame rendering** — Canvas frames are encoded to PNG and piped to FFmpeg with audio mixing via `filter_complex`
- **Progress reporting** — Real-time frame counter and progress bar with cancel support

### Project Management
- **Project launcher** — Home screen with recent projects (relative timestamps), on-disk project scanner, first-time setup wizard
- **7 built-in presets** — Blank, Valorant Montage, Music Video, YouTube, TikTok/Reels, Cinematic, Podcast
- **Custom templates** — Create, edit, and delete reusable project templates with track configuration
- **Custom file format** — `.cmp` project files (JSON) and `.cma` archive format (project + media bundle)
- **Auto-save** — Configurable interval (default 30 s) when enabled
- **Close confirmation** — Save / Don't Save / Cancel dialog on unsaved changes

### Customization
- **Settings** — Projects folder, default resolution, auto-save toggle, preview quality (low/medium/high)
- **Themes** — Dark and light modes
- **Accent colors** — Purple, Orange, Green — applied across the UI and dynamically generated window icon
- **Customizable shortcuts** — 27 actions across 6 categories, click-to-record rebinding, per-shortcut and global reset

### Interface
- **Frameless window** — Custom title bar with platform-native min/max/close controls
- **Menu bar** — File, Edit, Playback, View, and Help menus with keyboard accelerator labels
- **Resizable panels** — Drag-to-resize assets (200–500 px), properties (toggle), and timeline (150–500 px) panels
- **Status bar** — Track count, clip count, project duration, and zoom level
- **Animated splash screen** — Branded loading sequence on launch

## Tech Stack

| Layer        | Technology                             |
| ------------ | -------------------------------------- |
| Desktop      | Electron 35                            |
| Frontend     | Next.js 16 (App Router, static export) |
| UI           | React 19, pure inline styles           |
| State        | Zustand                                |
| Drag & Drop  | dnd-kit                                |
| Icons        | Lucide React                           |
| Audio        | Web Audio API (GainNode mixing)        |
| Export       | FFmpeg (fluent-ffmpeg + ffmpeg-static)  |
| Build        | electron-builder                       |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+

### Install

```bash
git clone https://github.com/avosos/cuttamaran.git
cd cuttamaran
npm install
```

### Development

Run the Next.js dev server and Electron together:

```bash
npm run dev:electron
```

Or build and launch manually:

```bash
npx next build
npx electron .
```

### Package for Distribution

```bash
npm run build:electron
```

This uses `electron-builder` to produce platform-specific installers (NSIS + portable on Windows, DMG on macOS, AppImage on Linux).

## Project Structure

```
cuttamaran/
├── electron/
│   ├── main.js            # Electron main process, IPC handlers, FFmpeg export, custom protocol
│   └── preload.js         # Preload bridge (contextBridge / IPC)
├── src/
│   ├── app/               # Next.js App Router entry, global styles
│   ├── components/
│   │   ├── editor/        # Editor shell (header, layout, menu bar, window controls)
│   │   │   └── panels/    # Timeline, preview, properties, assets panels
│   │   ├── project-launcher.tsx   # Home screen & project management
│   │   └── splash-screen.tsx      # Startup splash
│   ├── hooks/             # useMediaManager, useWaveform, useSettings, useGlobalShortcuts
│   ├── lib/               # Utility functions
│   ├── stores/            # Zustand stores (editor-store, shortcut-store)
│   └── types/             # TypeScript type definitions
├── public/                # Static assets & app icons
└── package.json
```

## File Formats

| Extension | Description                                           |
| --------- | ----------------------------------------------------- |
| `.cmp`    | **Cuttamaran Project** — JSON project file            |
| `.cma`    | **Cuttamaran Archive** — Bundled project + media      |

## Keyboard Shortcuts

All shortcuts are customizable via the shortcuts panel (`?`).

### Playback

| Shortcut              | Action              |
| --------------------- | ------------------- |
| `Space`               | Play / Pause        |
| `←` / `→`            | Seek ±1 second      |
| `Shift + ←` / `→`   | Seek ±5 seconds     |
| `Home` / `End`        | Go to start / end   |

### Editing

| Shortcut              | Action                  |
| --------------------- | ----------------------- |
| `Ctrl + Z`            | Undo                    |
| `Ctrl + Shift + Z`    | Redo                    |
| `S`                   | Split clip at playhead  |
| `Delete`              | Delete selected clip    |
| `Ctrl + D`            | Duplicate clip          |
| `Ctrl + A`            | Select all              |
| `Escape`              | Deselect                |

### File

| Shortcut              | Action              |
| --------------------- | ------------------- |
| `Ctrl + N`            | New project          |
| `Ctrl + O`            | Open project         |
| `Ctrl + S`            | Save                 |
| `Ctrl + Shift + S`    | Save As…             |
| `Ctrl + E`            | Export…              |

### Navigation

| Shortcut              | Action              |
| --------------------- | ------------------- |
| `Tab`                 | Next clip            |
| `Shift + Tab`         | Previous clip        |

### View

| Shortcut              | Action              |
| --------------------- | ------------------- |
| `Ctrl + =`            | Zoom in              |
| `Ctrl + -`            | Zoom out             |
| `Ctrl + 0`            | Reset zoom           |
| `?`                   | Toggle shortcuts     |

## Roadmap

Features planned or under consideration for future releases:

### High Priority
- [ ] **Export effects fidelity** — Apply blur, brightness, vignette, fade, and transform effects during export (currently preview-only)
- [ ] **Export text transforms** — Full text positioning, rotation, and scale in exported output
- [ ] **Multi-clip selection** — Shift+click range select, Ctrl+click toggle, bulk move/delete
- [ ] **Real transitions engine** — True crossfade, wipe, slide, and dissolve transitions between adjacent clips
- [ ] **Fullscreen preview** — Complete the fullscreen toggle (button exists, not yet wired)
- [ ] **Copy / paste clips** — Clipboard operations for clips on the timeline

### Medium Priority
- [ ] **Keyframe animation** — Animate any clip property over time with easing curves and motion paths
- [ ] **On-canvas transform handles** — Drag to move, resize, and rotate clips directly in the preview
- [ ] **Ripple & insert editing** — Automatic gap closing and content shifting modes
- [ ] **Razor / blade tool** — Click anywhere on the timeline to split
- [ ] **Markers & labels** — Place named markers on the timeline ruler
- [ ] **Subtitle / caption support** — SRT import/export, auto-captions
- [ ] **Dedicated Audio tab** — Browse and preview audio assets separately
- [ ] **Audio effects** — EQ, compressor, reverb, audio ducking
- [ ] **Audio metering** — Visual level meters during playback

### Future
- [ ] **Color grading** — Color wheels, curves, LUT support
- [ ] **Proxy workflow** — Generate optimized proxies for heavy media
- [ ] **Media relinking** — Reconnect missing media files when paths change
- [ ] **Speed ramping** — Keyframeable playback speed (time remapping)
- [ ] **Video stabilization** — Post-capture stabilization via FFmpeg
- [ ] **Crop tool** — Dedicated crop rectangle editor (not just scale)
- [ ] **Render queue** — Batch export with multiple output configurations
- [ ] **Sticker / overlay library** — Browseable sticker packs
- [ ] **Auto-update** — Electron auto-updater integration
- [ ] **File association** — Double-click `.cmp` files to open in Cuttamaran
- [ ] **Single-instance lock** — Prevent multiple app windows
- [ ] **Clip grouping & linking** — Group clips, link audio-video pairs
- [ ] **Detachable panels** — Pop panels out to separate windows
- [ ] **Accessibility** — Screen reader support, high-contrast mode

## License

MIT © [Avosos](https://github.com/avosos)
