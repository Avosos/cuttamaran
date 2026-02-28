<p align="center">
  <img src="assets/icon.svg" width="80" height="80" alt="Cuttamaran" />
</p>

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

### Features

- **Multi-track timeline** — Video, audio, text, and image tracks with drag-and-drop clip editing
- **Live preview** — Real-time canvas preview with transport controls and resolution switching
- **Asset management** — Import and organize media, text, audio, effects, and stickers
- **Properties panel** — Fine-grained control over clip properties, transforms, and filters
- **Keyboard shortcuts** — Comprehensive hotkeys for efficient editing
- **Export** — Multiple format (MP4, WebM, MOV, GIF) and quality options
- **Project launcher** — IntelliJ-style home screen with project management
- **Settings** — Configurable auto-save, preview quality, theme, and storage paths
- **Custom UI** — Frameless window with custom title bar and window controls

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Desktop      | Electron                          |
| Frontend     | Next.js 16 (App Router, static export) |
| UI           | React 19, pure inline styles      |
| State        | Zustand                           |
| Icons        | Lucide React                      |
| Build        | electron-builder                  |

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

### Package for Distribution

```bash
npm run build
```

This uses `electron-builder` to produce platform-specific installers.

## Project Structure

```
cuttamaran/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload bridge (IPC)
├── src/
│   ├── app/             # Next.js App Router pages & globals
│   ├── components/
│   │   ├── editor/      # Editor UI (header, layout, panels)
│   │   └── project-launcher.tsx
│   ├── stores/          # Zustand state management
│   └── types/           # TypeScript type definitions
├── assets/              # App icon (SVG, PNG, ICO)
└── package.json
```

## Keyboard Shortcuts

| Shortcut              | Action              |
| --------------------- | ------------------- |
| `Space`               | Play / Pause        |
| `←` / `→`            | Seek ±1 second      |
| `Shift + ←` / `→`   | Seek ±5 seconds     |
| `Home` / `End`        | Go to start / end   |
| `Ctrl + Z`            | Undo                |
| `Ctrl + Shift + Z`    | Redo                |
| `Ctrl + S`            | Save                |
| `Delete`              | Delete selected clip|
| `?`                   | Toggle shortcuts    |

## License

MIT © [Avosos](https://github.com/avosos)
