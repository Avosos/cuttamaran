<h1 align="center">Cuttamaran</h1>

<p align="center">
  A premium desktop video editor built with modern web technologies.<br/>
  <strong>By Avosos</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-v35-47848f?style=flat-square&logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

---

## Overview

Cuttamaran is a sleek, dark-themed desktop video editor designed for creators who want a fast, modern editing experience. It combines the power of Electron with the flexibility of Next.js and React to deliver a polished, native-feeling application.

## Features

### Timeline & Editing
- **Multi-track timeline** — Video, audio, text, and image tracks with drag-and-drop clip editing
- **Clip splitting** — Split clips at the playhead with a single shortcut
- **Trim controls** — Drag clip edges to trim start/end points
- **Cross-track dragging** — Move clips between tracks freely
- **Clip & track colors** — Customize clip and track colors via right-click context menu
- **Track management** — Add, rename, reorder, remove, mute, lock, and hide tracks
- **Drag-to-timeline** — Drag media from the asset panel directly onto tracks
- **Undo / Redo** — Full history with deep-cloned state snapshots

### Preview & Playback
- **Live preview** — Real-time canvas preview with transport controls
- **Resolution switching** — Multiple canvas sizes (1080p, 720p, 4K, vertical, square, etc.)
- **Audio waveforms** — Visual waveform display on audio and video clips

### Media & Assets
- **Asset management** — Import and organize media, text, audio, effects, and stickers
- **User Libraries** — Create and manage custom asset libraries
- **Media persistence** — Media files stored alongside project files

### Effects & Text
- **Effects & transitions** — Apply visual effects and clip transitions
- **Rich text overlays** — Alignment, bold/italic/underline, letter/line spacing, stroke, and background color

### Properties & Controls
- **Properties panel** — Fine-grained control over clip properties, transforms, opacity, speed, and filters

### Export
- **Multi-format export** — MP4, WebM, MOV, GIF with configurable quality
- **Audio-only / Video-only** — Choose to export full video, audio only, or video only
- **FFmpeg-powered** — Hardware-accelerated rendering via bundled FFmpeg

### Project Management
- **Project launcher** — IntelliJ-style home screen with recent and on-disk project discovery
- **Custom file format** — `.cmp` project files and `.cma` archive format
- **Close confirmation** — Warns before closing unsaved projects

### Customization
- **Settings** — Configurable auto-save, preview quality, and storage paths
- **Themes** — Dark and light modes with accent color options (Purple, Orange, Green)
- **Dynamic app icon** — Icon adapts to the selected accent color
- **Customizable shortcuts** — Rebindable keyboard shortcuts with recording UI

### Interface
- **Frameless window** — Custom title bar with native window controls
- **Menu bar** — File, Edit, View, and Help menus with keyboard accelerators

## Tech Stack

| Layer        | Technology                             |
| ------------ | -------------------------------------- |
| Desktop      | Electron 35                            |
| Frontend     | Next.js 16 (App Router, static export) |
| UI           | React 19, pure inline styles           |
| State        | Zustand                                |
| Icons        | Lucide React                           |
| Export       | FFmpeg (fluent-ffmpeg)                 |
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

Build the Next.js frontend, then launch Electron:

```bash
npx next build
npx electron .
```

Or use the dev script:

```bash
npm run dev:electron
```

### Package for Distribution

```bash
npm run build
```

This uses `electron-builder` to produce platform-specific installers.

## Project Structure

```
cuttamaran/
├── electron/
│   ├── main.js            # Electron main process & IPC handlers
│   └── preload.js         # Preload bridge (IPC)
├── src/
│   ├── app/               # Next.js App Router pages & global styles
│   ├── components/
│   │   ├── editor/        # Editor UI (header, layout, panels)
│   │   │   └── panels/    # Timeline, preview, properties, assets
│   │   ├── project-launcher.tsx
│   │   └── splash-screen.tsx
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── stores/            # Zustand state management
│   └── types/             # TypeScript type definitions
├── assets/                # App icons (SVG, PNG, ICO)
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

## License

MIT © [Avosos](https://github.com/avosos)
