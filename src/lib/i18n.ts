/* ══════════════════════════════════════════════════════════════════════════════
 * Cuttamaran — Internationalization (i18n)
 * Supports: English (en), German (de)
 * ══════════════════════════════════════════════════════════════════════════════ */

export type Language = "en" | "de";

export interface Translations {
  // ─── Menu ───────────────────────────────────
  menu: {
    file: string;
    edit: string;
    playback: string;
    view: string;
    help: string;
    newProject: string;
    openFile: string;
    save: string;
    saveAs: string;
    export: string;
    saveAsTemplate: string;
    templateNamePrompt: string;
    templateNameDefault: string;
    templateDescPrompt: string;
    templateSaved: string;
    backToProjects: string;
    undo: string;
    redo: string;
    splitClip: string;
    deleteClip: string;
    selectAll: string;
    deselectAll: string;
    playPause: string;
    goToStart: string;
    goToEnd: string;
    back1s: string;
    forward1s: string;
    back5s: string;
    forward5s: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    toggleSnap: string;
    keyboardShortcuts: string;
    aboutCuttamaran: string;
  };
  // ─── Editor Header ──────────────────────────
  header: {
    appName: string;
    untitled: string;
    undo: string;
    redo: string;
    save: string;
    saved: string;
    export: string;
    landscape169: string;
    portrait916: string;
    square11: string;
    social45: string;
    landscape4k: string;
    custom: string;
    settings: string;
    editorSettings: string;
    keyboardShortcuts: string;
    backToProjects: string;
  };
  // ─── Settings Modal ─────────────────────────
  settings: {
    title: string;
    storage: string;
    general: string;
    performance: string;
    about: string;
    projectsFolder: string;
    chooseFolder: string;
    projectsFolderDesc: string;
    autoSave: string;
    autoSaveDesc: string;
    theme: string;
    dark: string;
    light: string;
    accentColor: string;
    purple: string;
    orange: string;
    green: string;
    previewQuality: string;
    previewQualityDesc: string;
    low: string;
    medium: string;
    high: string;
    aboutHeading: string;
    videoEditor: string;
    version: string;
    aboutDescription: string;
    language: string;
    languageDesc: string;
  };
  // ─── Export Modal ───────────────────────────
  exportModal: {
    title: string;
    mode: string;
    fullProject: string;
    videoAndAudio: string;
    noAudioTrack: string;
    videoOnlyMuted: string;
    soundOnly: string;
    audioOnly: string;
    format: string;
    mp4: string;
    mp4Desc: string;
    webm: string;
    webmDesc: string;
    mov: string;
    movDesc: string;
    gif: string;
    gifDesc: string;
    mp3: string;
    mp3Desc: string;
    wav: string;
    wavDesc: string;
    quality: string;
    quality720: string;
    quality720Desc: string;
    quality1080: string;
    quality1080Desc: string;
    qualityOriginal: string;
    qualityOriginalDesc: string;
    audioQuality: string;
    kbps128: string;
    kbps192: string;
    kbps320: string;
    standard: string;
    high: string;
    best: string;
    output: string;
    chooseFolder: string;
    cancel: string;
    export: string;
    exporting: string;
    renderingProgress: string;
    exportComplete: string;
    showInFolder: string;
    done: string;
    exportFailed: string;
    exportFailedDesc: string;
    tryAgain: string;
  };
  // ─── Project Launcher ──────────────────────
  launcher: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    projectsFolder: string;
    chooseFolder: string;
    getStarted: string;
    appName: string;
    newProject: string;
    openFile: string;
    recent: string;
    allProjects: string;
    settings: string;
    welcomeBack: string;
    welcomeBackSubtitle: string;
    recentProjects: string;
    noRecentProjects: string;
    noRecentProjectsDesc: string;
    noProjectsFound: string;
    noProjectsFoundDesc: string;
    open: string;
    delete: string;
    lastOpened: string;
    created: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    newProjectTitle: string;
    projectName: string;
    projectNamePlaceholder: string;
    resolution: string;
    template: string;
    createProject: string;
    cancel: string;
    unsavedChangesConfirm: string;
    fullHDLandscape: string;
    fullHDPortrait: string;
    square: string;
    uhd4k: string;
    social45: string;
  };
  // ─── Templates ─────────────────────────────
  templates: {
    blank: string;
    blankDesc: string;
    vlog: string;
    vlogDesc: string;
    musicVideo: string;
    musicVideoDesc: string;
    gaming: string;
    gamingDesc: string;
    tutorial: string;
    tutorialDesc: string;
    cinematic: string;
    cinematicDesc: string;
    socialShort: string;
    socialShortDesc: string;
    customTemplates: string;
    addTemplate: string;
    noCustomTemplates: string;
  };
  // ─── Timeline ──────────────────────────────
  timeline: {
    snap: string;
    deleteSelected: string;
    splitAtPlayhead: string;
    zoomIn: string;
    zoomOut: string;
    addVideo: string;
    addAudio: string;
    videoTrack: string;
    audioTrack: string;
    toggleVisibility: string;
    toggleMute: string;
    solo: string;
    lockTrack: string;
    deleteTrack: string;
    trackColor: string;
    custom: string;
    reset: string;
    deleteTrackConfirm: string;
    deleteTrackConfirmDesc: string;
    delete: string;
    cancel: string;
    splitAtPlayheadCtx: string;
    duplicate: string;
    muteClip: string;
    unmuteClip: string;
    speed: string;
    properties: string;
    clipColor: string;
    speed025: string;
    speed05: string;
    speed1: string;
    speed15: string;
    speed2: string;
    speed4: string;
    dropMediaHere: string;
  };
  // ─── Preview ───────────────────────────────
  preview: {
    dropMediaToStart: string;
    loading: string;
    goToStart: string;
    play: string;
    pause: string;
    goToEnd: string;
    fullscreen: string;
  };
  // ─── Properties Panel ──────────────────────
  properties: {
    videoClip: string;
    audioClip: string;
    textClip: string;
    imageClip: string;
    clipColor: string;
    timelineColor: string;
    reset: string;
    timing: string;
    start: string;
    duration: string;
    source: string;
    trim: string;
    trimStart: string;
    trimEnd: string;
    sourceRange: string;
    appearance: string;
    opacity: string;
    transform: string;
    positionX: string;
    positionY: string;
    scaleX: string;
    scaleY: string;
    rotation: string;
    resetTransform: string;
    audio: string;
    volume: string;
    text: string;
    content: string;
    fontSize: string;
    color: string;
    font: string;
    style: string;
    normal: string;
    bold: string;
    italic: string;
    boldItalic: string;
    align: string;
    spacing: string;
    lineHeight: string;
    bgColor: string;
    on: string;
    off: string;
    stroke: string;
    effects: string;
    intensity: string;
    removeEffect: string;
    fadeIn: string;
    fadeOut: string;
    crossDissolve: string;
    blur: string;
    brightness: string;
    contrast: string;
    saturation: string;
    vignette: string;
  };
  // ─── Assets Panel ──────────────────────────
  assets: {
    assets: string;
    text: string;
    audio: string;
    effects: string;
    stickers: string;
    library: string;
    searchAssets: string;
    dropMediaHere: string;
    orClickToBrowse: string;
    mediaCount: string;
    addToTimeline: string;
    remove: string;
    noMediaFiles: string;
    titlePreset: string;
    titleSample: string;
    subtitlePreset: string;
    subtitleSample: string;
    captionPreset: string;
    captionSample: string;
    lowerThirdPreset: string;
    lowerThirdSample: string;
    quotePreset: string;
    quoteSample: string;
    boldHeadingPreset: string;
    boldHeadingSample: string;
    addToTimelineAtPlayhead: string;
    importAudioHint: string;
    supportedFormats: string;
    effectsAndTransitions: string;
    selectClipForEffects: string;
    stickersComingSoon: string;
    saveClip: string;
    saveSegment: string;
    all: string;
    clips: string;
    segments: string;
    customCategory: string;
    loading: string;
    noLibraryItems: string;
    noLibraryItemsDesc: string;
    noItemsInCategory: string;
    saveToLibrary: string;
    name: string;
    savedClipPlaceholder: string;
    savedSegmentPlaceholder: string;
    category: string;
    save: string;
    cancel: string;
  };
  // ─── Keyboard Shortcuts ────────────────────
  shortcuts: {
    title: string;
    resetAll: string;
    hint: string;
    resetToDefault: string;
    pressKeyCombo: string;
    clickToReassign: string;
    categoryPlayback: string;
    categoryEditing: string;
    categoryFile: string;
    categoryNavigation: string;
    categoryView: string;
    categoryGeneral: string;
    playPause: string;
    back1s: string;
    forward1s: string;
    back5s: string;
    forward5s: string;
    goToStart: string;
    goToEnd: string;
    undo: string;
    redo: string;
    splitClip: string;
    deleteClip: string;
    duplicateClip: string;
    selectAll: string;
    deselect: string;
    newProject: string;
    openProject: string;
    save: string;
    saveAs: string;
    exportShortcut: string;
    nextClip: string;
    previousClip: string;
    nextClipEnd: string;
    zoomIn: string;
    zoomOut: string;
    resetZoom: string;
    toggleShortcuts: string;
  };
  // ─── Common ─────────────────────────────────
  common: {
    save: string;
    cancel: string;
    delete: string;
    undo: string;
    redo: string;
    loading: string;
    settings: string;
    export: string;
    custom: string;
    reset: string;
  };
}

const en: Translations = {
  menu: {
    file: "File",
    edit: "Edit",
    playback: "Playback",
    view: "View",
    help: "Help",
    newProject: "New Project",
    openFile: "Open File…",
    save: "Save",
    saveAs: "Save As…",
    export: "Export…",
    saveAsTemplate: "Save as Template…",
    templateNamePrompt: "Template name:",
    templateNameDefault: "My Template",
    templateDescPrompt: "Short description (optional):",
    templateSaved: "Template saved!",
    backToProjects: "Back to Projects",
    undo: "Undo",
    redo: "Redo",
    splitClip: "Split Clip",
    deleteClip: "Delete Clip",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    playPause: "Play / Pause",
    goToStart: "Go to Start",
    goToEnd: "Go to End",
    back1s: "Back 1s",
    forward1s: "Forward 1s",
    back5s: "Back 5s",
    forward5s: "Forward 5s",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset Zoom",
    toggleSnap: "Toggle Snap",
    keyboardShortcuts: "Keyboard Shortcuts…",
    aboutCuttamaran: "About Cuttamaran",
  },
  header: {
    appName: "Cuttamaran",
    untitled: "Untitled",
    undo: "Undo",
    redo: "Redo",
    save: "Save",
    saved: "Saved!",
    export: "Export",
    landscape169: "16:9 Landscape",
    portrait916: "9:16 Portrait",
    square11: "1:1 Square",
    social45: "4:5 Social",
    landscape4k: "4K Landscape",
    custom: "Custom",
    settings: "Settings",
    editorSettings: "Editor Settings",
    keyboardShortcuts: "Keyboard Shortcuts",
    backToProjects: "Back to Projects",
  },
  settings: {
    title: "Settings",
    storage: "Storage",
    general: "General",
    performance: "Performance",
    about: "About",
    projectsFolder: "Projects Folder",
    chooseFolder: "Choose Folder",
    projectsFolderDesc: "Where your .cut project files are saved",
    autoSave: "Auto-save",
    autoSaveDesc: "Automatically save every 30 seconds",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    accentColor: "Accent Color",
    purple: "Purple",
    orange: "Orange",
    green: "Green",
    previewQuality: "Preview Quality",
    previewQualityDesc: "Lower quality = smoother playback",
    low: "Low",
    medium: "Medium",
    high: "High",
    aboutHeading: "Cuttamaran",
    videoEditor: "Video Editor",
    version: "Version 1.0.0",
    aboutDescription: "A minimal, timeline-based video editor for desktop.",
    language: "Language",
    languageDesc: "Choose the interface language",
  },
  exportModal: {
    title: "Export Project",
    mode: "Mode",
    fullProject: "Full project",
    videoAndAudio: "Video + Audio",
    noAudioTrack: "No audio track",
    videoOnlyMuted: "Video only — muted",
    soundOnly: "Sound only — no video",
    audioOnly: "Audio only",
    format: "Format",
    mp4: "MP4",
    mp4Desc: "H.264 — best compatibility",
    webm: "WebM",
    webmDesc: "VP9 — smaller file size",
    mov: "MOV",
    movDesc: "ProRes — editing & Apple",
    gif: "GIF",
    gifDesc: "Animated — social media",
    mp3: "MP3",
    mp3Desc: "Compressed — small file",
    wav: "WAV",
    wavDesc: "Uncompressed — best quality",
    quality: "Quality",
    quality720: "720p",
    quality720Desc: "720p — fast render",
    quality1080: "1080p",
    quality1080Desc: "1080p — balanced",
    qualityOriginal: "Original",
    qualityOriginalDesc: "Original — best quality",
    audioQuality: "Audio Quality",
    kbps128: "128 kbps",
    kbps192: "192 kbps",
    kbps320: "320 kbps",
    standard: "Standard",
    high: "High",
    best: "Best",
    output: "Output",
    chooseFolder: "Choose…",
    cancel: "Cancel",
    export: "Export",
    exporting: "Exporting…",
    renderingProgress: "Rendering: {percent}%",
    exportComplete: "Export Complete!",
    showInFolder: "Show in Folder",
    done: "Done",
    exportFailed: "Export Failed",
    exportFailedDesc: "Something went wrong during export.",
    tryAgain: "Try Again",
  },
  launcher: {
    welcomeTitle: "Welcome to Cuttamaran",
    welcomeSubtitle: "Choose where to store your projects",
    projectsFolder: "Projects Folder",
    chooseFolder: "Choose Folder",
    getStarted: "Get Started",
    appName: "Cuttamaran",
    newProject: "New Project",
    openFile: "Open File",
    recent: "Recent",
    allProjects: "All Projects",
    settings: "Settings",
    welcomeBack: "Welcome back",
    welcomeBackSubtitle: "Create a new project or open a recent one",
    recentProjects: "Recent Projects",
    noRecentProjects: "No recent projects",
    noRecentProjectsDesc: "Create a new project to get started",
    noProjectsFound: "No projects found",
    noProjectsFoundDesc: "Projects you create will appear here",
    open: "Open",
    delete: "Delete",
    lastOpened: "Last opened",
    created: "Created",
    justNow: "just now",
    minutesAgo: "{n}m ago",
    hoursAgo: "{n}h ago",
    daysAgo: "{n}d ago",
    newProjectTitle: "New Project",
    projectName: "Project Name",
    projectNamePlaceholder: "My Awesome Video",
    resolution: "Resolution",
    template: "Template",
    createProject: "Create Project",
    cancel: "Cancel",
    unsavedChangesConfirm: "Create a new project? Unsaved changes will be lost.",
    fullHDLandscape: "Full HD Landscape",
    fullHDPortrait: "Full HD Portrait",
    square: "Square",
    uhd4k: "4K UHD",
    social45: "Social (4:5)",
  },
  templates: {
    blank: "Blank",
    blankDesc: "Start from scratch with a clean timeline",
    vlog: "Vlog",
    vlogDesc: "Single video with voice-over track",
    musicVideo: "Music Video",
    musicVideoDesc: "Multi-layer visuals with dedicated music track",
    gaming: "Gaming",
    gamingDesc: "Fast-paced gaming edits with overlay tracks",
    tutorial: "Tutorial",
    tutorialDesc: "Screen recording with narration",
    cinematic: "Cinematic",
    cinematicDesc: "Widescreen edit with SFX and color grade",
    socialShort: "Social Short",
    socialShortDesc: "Vertical 9:16 for Reels, TikTok, Shorts",
    customTemplates: "Custom Templates",
    addTemplate: "+ Add Template",
    noCustomTemplates: "No custom templates yet",
  },
  timeline: {
    snap: "Snap",
    deleteSelected: "Delete selected clip",
    splitAtPlayhead: "Split clip at playhead",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    addVideo: "+ Video",
    addAudio: "+ Audio",
    videoTrack: "Video {n}",
    audioTrack: "Audio {n}",
    toggleVisibility: "Toggle visibility",
    toggleMute: "Toggle mute",
    solo: "Solo",
    lockTrack: "Lock track",
    deleteTrack: "Delete track",
    trackColor: "Track Color",
    custom: "Custom",
    reset: "Reset",
    deleteTrackConfirm: "Delete track \"{name}\"?",
    deleteTrackConfirmDesc: "This will remove the track and all its clips.",
    delete: "Delete",
    cancel: "Cancel",
    splitAtPlayheadCtx: "Split at Playhead",
    duplicate: "Duplicate",
    muteClip: "Mute Clip",
    unmuteClip: "Unmute Clip",
    speed: "Speed",
    properties: "Properties",
    clipColor: "Clip Color",
    speed025: "0.25×",
    speed05: "0.5×",
    speed1: "1× (Normal)",
    speed15: "1.5×",
    speed2: "2×",
    speed4: "4×",
    dropMediaHere: "Drop media here to add to timeline",
  },
  preview: {
    dropMediaToStart: "Drop media to get started",
    loading: "Loading…",
    goToStart: "Go to start",
    play: "Play (Space)",
    pause: "Pause (Space)",
    goToEnd: "Go to end",
    fullscreen: "Fullscreen",
  },
  properties: {
    videoClip: "Video clip",
    audioClip: "Audio clip",
    textClip: "Text clip",
    imageClip: "Image clip",
    clipColor: "Clip Color",
    timelineColor: "Timeline Color",
    reset: "Reset",
    timing: "Timing",
    start: "Start",
    duration: "Duration",
    source: "Source",
    trim: "Trim",
    trimStart: "Trim Start",
    trimEnd: "Trim End",
    sourceRange: "Source range",
    appearance: "Appearance",
    opacity: "Opacity",
    transform: "Transform",
    positionX: "Position X",
    positionY: "Position Y",
    scaleX: "Scale X",
    scaleY: "Scale Y",
    rotation: "Rotation",
    resetTransform: "Reset Transform",
    audio: "Audio",
    volume: "Volume",
    text: "Text",
    content: "Content",
    fontSize: "Font Size",
    color: "Color",
    font: "Font",
    style: "Style",
    normal: "Normal",
    bold: "Bold",
    italic: "Italic",
    boldItalic: "Bold Italic",
    align: "Align",
    spacing: "Spacing",
    lineHeight: "Line H.",
    bgColor: "BG Color",
    on: "On",
    off: "Off",
    stroke: "Stroke",
    effects: "Effects",
    intensity: "Intensity",
    removeEffect: "Remove effect",
    fadeIn: "Fade In",
    fadeOut: "Fade Out",
    crossDissolve: "Cross Dissolve",
    blur: "Blur",
    brightness: "Brightness",
    contrast: "Contrast",
    saturation: "Saturation",
    vignette: "Vignette",
  },
  assets: {
    assets: "Assets",
    text: "Text",
    audio: "Audio",
    effects: "Effects",
    stickers: "Stickers",
    library: "Library",
    searchAssets: "Search assets…",
    dropMediaHere: "Drop media here",
    orClickToBrowse: "or click to browse",
    mediaCount: "Media ({n})",
    addToTimeline: "Add to timeline",
    remove: "Remove",
    noMediaFiles: "No media files yet",
    titlePreset: "Title",
    titleSample: "Your Title",
    subtitlePreset: "Subtitle",
    subtitleSample: "Your subtitle here",
    captionPreset: "Caption",
    captionSample: "Caption text",
    lowerThirdPreset: "Lower Third",
    lowerThirdSample: "Name or Title",
    quotePreset: "Quote",
    quoteSample: "\"Your quote here\"",
    boldHeadingPreset: "Bold Heading",
    boldHeadingSample: "BIG TEXT",
    addToTimelineAtPlayhead: "Add to timeline at playhead",
    importAudioHint: "Import audio files from Assets",
    supportedFormats: "Supports MP3, WAV, AAC, OGG",
    effectsAndTransitions: "Effects & Transitions",
    selectClipForEffects: "Select a clip on the timeline to apply effects",
    stickersComingSoon: "Stickers coming soon",
    saveClip: "Save Clip",
    saveSegment: "Save Segment",
    all: "All",
    clips: "Clips",
    segments: "Segments",
    customCategory: "Custom",
    loading: "Loading…",
    noLibraryItems: "No library items yet",
    noLibraryItemsDesc: "Save clips or segments to reuse them",
    noItemsInCategory: "No items in this category",
    saveToLibrary: "Save to Library",
    name: "Name",
    savedClipPlaceholder: "My saved clip",
    savedSegmentPlaceholder: "My intro sequence",
    category: "Category",
    save: "Save",
    cancel: "Cancel",
  },
  shortcuts: {
    title: "Keyboard Shortcuts",
    resetAll: "Reset All",
    hint: "Click any shortcut to reassign it. Press Esc to cancel.",
    resetToDefault: "Reset to default",
    pressKeyCombo: "Press a key combo…",
    clickToReassign: "Click to reassign",
    categoryPlayback: "Playback",
    categoryEditing: "Editing",
    categoryFile: "File",
    categoryNavigation: "Navigation",
    categoryView: "View",
    categoryGeneral: "General",
    playPause: "Play / Pause",
    back1s: "Back 1 second",
    forward1s: "Forward 1 second",
    back5s: "Back 5 seconds",
    forward5s: "Forward 5 seconds",
    goToStart: "Go to start",
    goToEnd: "Go to end",
    undo: "Undo",
    redo: "Redo",
    splitClip: "Split clip at playhead",
    deleteClip: "Delete selected clip",
    duplicateClip: "Duplicate clip",
    selectAll: "Select all",
    deselect: "Deselect",
    newProject: "New project",
    openProject: "Open project",
    save: "Save",
    saveAs: "Save As…",
    exportShortcut: "Export…",
    nextClip: "Next clip",
    previousClip: "Previous clip",
    nextClipEnd: "Next clip end",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Reset zoom",
    toggleShortcuts: "Toggle shortcuts panel",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    undo: "Undo",
    redo: "Redo",
    loading: "Loading…",
    settings: "Settings",
    export: "Export",
    custom: "Custom",
    reset: "Reset",
  },
};

const de: Translations = {
  menu: {
    file: "Datei",
    edit: "Bearbeiten",
    playback: "Wiedergabe",
    view: "Ansicht",
    help: "Hilfe",
    newProject: "Neues Projekt",
    openFile: "Datei öffnen…",
    save: "Speichern",
    saveAs: "Speichern unter…",
    export: "Exportieren…",
    saveAsTemplate: "Als Vorlage speichern…",
    templateNamePrompt: "Vorlagenname:",
    templateNameDefault: "Meine Vorlage",
    templateDescPrompt: "Kurzbeschreibung (optional):",
    templateSaved: "Vorlage gespeichert!",
    backToProjects: "Zurück zu Projekten",
    undo: "Rückgängig",
    redo: "Wiederherstellen",
    splitClip: "Clip teilen",
    deleteClip: "Clip löschen",
    selectAll: "Alles auswählen",
    deselectAll: "Auswahl aufheben",
    playPause: "Abspielen / Pause",
    goToStart: "Zum Anfang",
    goToEnd: "Zum Ende",
    back1s: "1s zurück",
    forward1s: "1s vor",
    back5s: "5s zurück",
    forward5s: "5s vor",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    resetZoom: "Zoom zurücksetzen",
    toggleSnap: "Einrasten umschalten",
    keyboardShortcuts: "Tastenkürzel…",
    aboutCuttamaran: "Über Cuttamaran",
  },
  header: {
    appName: "Cuttamaran",
    untitled: "Unbenannt",
    undo: "Rückgängig",
    redo: "Wiederherstellen",
    save: "Speichern",
    saved: "Gespeichert!",
    export: "Exportieren",
    landscape169: "16:9 Querformat",
    portrait916: "9:16 Hochformat",
    square11: "1:1 Quadrat",
    social45: "4:5 Social",
    landscape4k: "4K Querformat",
    custom: "Benutzerdefiniert",
    settings: "Einstellungen",
    editorSettings: "Editor-Einstellungen",
    keyboardShortcuts: "Tastenkürzel",
    backToProjects: "Zurück zu Projekten",
  },
  settings: {
    title: "Einstellungen",
    storage: "Speicher",
    general: "Allgemein",
    performance: "Leistung",
    about: "Über",
    projectsFolder: "Projektordner",
    chooseFolder: "Ordner wählen",
    projectsFolderDesc: "Wo deine .cut-Projektdateien gespeichert werden",
    autoSave: "Automatisches Speichern",
    autoSaveDesc: "Alle 30 Sekunden automatisch speichern",
    theme: "Farbschema",
    dark: "Dunkel",
    light: "Hell",
    accentColor: "Akzentfarbe",
    purple: "Lila",
    orange: "Orange",
    green: "Grün",
    previewQuality: "Vorschauqualität",
    previewQualityDesc: "Niedrigere Qualität = flüssigere Wiedergabe",
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    aboutHeading: "Cuttamaran",
    videoEditor: "Video-Editor",
    version: "Version 1.0.0",
    aboutDescription: "Ein minimaler, zeitleistenbasierter Video-Editor für Desktop.",
    language: "Sprache",
    languageDesc: "Wähle die Sprache der Benutzeroberfläche",
  },
  exportModal: {
    title: "Projekt exportieren",
    mode: "Modus",
    fullProject: "Gesamtes Projekt",
    videoAndAudio: "Video + Audio",
    noAudioTrack: "Keine Audiospur",
    videoOnlyMuted: "Nur Video — stumm",
    soundOnly: "Nur Ton — kein Video",
    audioOnly: "Nur Audio",
    format: "Format",
    mp4: "MP4",
    mp4Desc: "H.264 — beste Kompatibilität",
    webm: "WebM",
    webmDesc: "VP9 — kleinere Datei",
    mov: "MOV",
    movDesc: "ProRes — Schnitt & Apple",
    gif: "GIF",
    gifDesc: "Animiert — Social Media",
    mp3: "MP3",
    mp3Desc: "Komprimiert — kleine Datei",
    wav: "WAV",
    wavDesc: "Unkomprimiert — beste Qualität",
    quality: "Qualität",
    quality720: "720p",
    quality720Desc: "720p — schnelles Rendern",
    quality1080: "1080p",
    quality1080Desc: "1080p — ausgewogen",
    qualityOriginal: "Original",
    qualityOriginalDesc: "Original — beste Qualität",
    audioQuality: "Audioqualität",
    kbps128: "128 kbps",
    kbps192: "192 kbps",
    kbps320: "320 kbps",
    standard: "Standard",
    high: "Hoch",
    best: "Beste",
    output: "Ausgabe",
    chooseFolder: "Wählen…",
    cancel: "Abbrechen",
    export: "Exportieren",
    exporting: "Exportiere…",
    renderingProgress: "Rendern: {percent}%",
    exportComplete: "Export abgeschlossen!",
    showInFolder: "Im Ordner anzeigen",
    done: "Fertig",
    exportFailed: "Export fehlgeschlagen",
    exportFailedDesc: "Beim Export ist ein Fehler aufgetreten.",
    tryAgain: "Erneut versuchen",
  },
  launcher: {
    welcomeTitle: "Willkommen bei Cuttamaran",
    welcomeSubtitle: "Wähle den Speicherort für deine Projekte",
    projectsFolder: "Projektordner",
    chooseFolder: "Ordner wählen",
    getStarted: "Loslegen",
    appName: "Cuttamaran",
    newProject: "Neues Projekt",
    openFile: "Datei öffnen",
    recent: "Zuletzt",
    allProjects: "Alle Projekte",
    settings: "Einstellungen",
    welcomeBack: "Willkommen zurück",
    welcomeBackSubtitle: "Erstelle ein neues Projekt oder öffne ein kürzliches",
    recentProjects: "Letzte Projekte",
    noRecentProjects: "Keine aktuellen Projekte",
    noRecentProjectsDesc: "Erstelle ein neues Projekt, um loszulegen",
    noProjectsFound: "Keine Projekte gefunden",
    noProjectsFoundDesc: "Erstellte Projekte erscheinen hier",
    open: "Öffnen",
    delete: "Löschen",
    lastOpened: "Zuletzt geöffnet",
    created: "Erstellt",
    justNow: "gerade eben",
    minutesAgo: "vor {n} Min.",
    hoursAgo: "vor {n} Std.",
    daysAgo: "vor {n} T.",
    newProjectTitle: "Neues Projekt",
    projectName: "Projektname",
    projectNamePlaceholder: "Mein tolles Video",
    resolution: "Auflösung",
    template: "Vorlage",
    createProject: "Projekt erstellen",
    cancel: "Abbrechen",
    unsavedChangesConfirm: "Neues Projekt erstellen? Ungespeicherte Änderungen gehen verloren.",
    fullHDLandscape: "Full HD Querformat",
    fullHDPortrait: "Full HD Hochformat",
    square: "Quadrat",
    uhd4k: "4K UHD",
    social45: "Social (4:5)",
  },
  templates: {
    blank: "Leer",
    blankDesc: "Von Grund auf mit einer leeren Zeitleiste starten",
    vlog: "Vlog",
    vlogDesc: "Einzelvideo mit Sprachspur",
    musicVideo: "Musikvideo",
    musicVideoDesc: "Mehrschichtige Visuals mit eigener Musikspur",
    gaming: "Gaming",
    gamingDesc: "Schnelle Gaming-Schnitte mit Overlay-Spuren",
    tutorial: "Tutorial",
    tutorialDesc: "Bildschirmaufnahme mit Erzählung",
    cinematic: "Cinematic",
    cinematicDesc: "Breitbild-Schnitt mit SFX und Farbkorrektur",
    socialShort: "Social Short",
    socialShortDesc: "Vertikal 9:16 für Reels, TikTok, Shorts",
    customTemplates: "Eigene Vorlagen",
    addTemplate: "+ Vorlage hinzufügen",
    noCustomTemplates: "Noch keine eigenen Vorlagen",
  },
  timeline: {
    snap: "Einrasten",
    deleteSelected: "Ausgewählten Clip löschen",
    splitAtPlayhead: "Clip an Abspielposition teilen",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    addVideo: "+ Video",
    addAudio: "+ Audio",
    videoTrack: "Video {n}",
    audioTrack: "Audio {n}",
    toggleVisibility: "Sichtbarkeit umschalten",
    toggleMute: "Stumm umschalten",
    solo: "Solo",
    lockTrack: "Spur sperren",
    deleteTrack: "Spur löschen",
    trackColor: "Spurfarbe",
    custom: "Benutzerdefiniert",
    reset: "Zurücksetzen",
    deleteTrackConfirm: "Spur \"{name}\" löschen?",
    deleteTrackConfirmDesc: "Dies entfernt die Spur und alle ihre Clips.",
    delete: "Löschen",
    cancel: "Abbrechen",
    splitAtPlayheadCtx: "An Abspielposition teilen",
    duplicate: "Duplizieren",
    muteClip: "Clip stummschalten",
    unmuteClip: "Clip laut schalten",
    speed: "Geschwindigkeit",
    properties: "Eigenschaften",
    clipColor: "Clipfarbe",
    speed025: "0,25×",
    speed05: "0,5×",
    speed1: "1× (Normal)",
    speed15: "1,5×",
    speed2: "2×",
    speed4: "4×",
    dropMediaHere: "Medien hierher ziehen, um zur Zeitleiste hinzuzufügen",
  },
  preview: {
    dropMediaToStart: "Medien ablegen, um zu starten",
    loading: "Laden…",
    goToStart: "Zum Anfang",
    play: "Abspielen (Leertaste)",
    pause: "Pause (Leertaste)",
    goToEnd: "Zum Ende",
    fullscreen: "Vollbild",
  },
  properties: {
    videoClip: "Videoclip",
    audioClip: "Audioclip",
    textClip: "Textclip",
    imageClip: "Bildclip",
    clipColor: "Clipfarbe",
    timelineColor: "Zeitleistenfarbe",
    reset: "Zurücksetzen",
    timing: "Timing",
    start: "Start",
    duration: "Dauer",
    source: "Quelle",
    trim: "Trimmen",
    trimStart: "Trimm-Anfang",
    trimEnd: "Trimm-Ende",
    sourceRange: "Quellbereich",
    appearance: "Darstellung",
    opacity: "Deckkraft",
    transform: "Transformation",
    positionX: "Position X",
    positionY: "Position Y",
    scaleX: "Skalierung X",
    scaleY: "Skalierung Y",
    rotation: "Drehung",
    resetTransform: "Transformation zurücksetzen",
    audio: "Audio",
    volume: "Lautstärke",
    text: "Text",
    content: "Inhalt",
    fontSize: "Schriftgröße",
    color: "Farbe",
    font: "Schriftart",
    style: "Stil",
    normal: "Normal",
    bold: "Fett",
    italic: "Kursiv",
    boldItalic: "Fett Kursiv",
    align: "Ausrichtung",
    spacing: "Abstand",
    lineHeight: "Zeilenh.",
    bgColor: "Hintergrund",
    on: "An",
    off: "Aus",
    stroke: "Kontur",
    effects: "Effekte",
    intensity: "Intensität",
    removeEffect: "Effekt entfernen",
    fadeIn: "Einblenden",
    fadeOut: "Ausblenden",
    crossDissolve: "Überblendung",
    blur: "Unschärfe",
    brightness: "Helligkeit",
    contrast: "Kontrast",
    saturation: "Sättigung",
    vignette: "Vignette",
  },
  assets: {
    assets: "Medien",
    text: "Text",
    audio: "Audio",
    effects: "Effekte",
    stickers: "Sticker",
    library: "Bibliothek",
    searchAssets: "Medien suchen…",
    dropMediaHere: "Medien hierher ziehen",
    orClickToBrowse: "oder klicken zum Durchsuchen",
    mediaCount: "Medien ({n})",
    addToTimeline: "Zur Zeitleiste hinzufügen",
    remove: "Entfernen",
    noMediaFiles: "Noch keine Mediendateien",
    titlePreset: "Titel",
    titleSample: "Dein Titel",
    subtitlePreset: "Untertitel",
    subtitleSample: "Dein Untertitel hier",
    captionPreset: "Beschriftung",
    captionSample: "Beschriftungstext",
    lowerThirdPreset: "Bauchbinde",
    lowerThirdSample: "Name oder Titel",
    quotePreset: "Zitat",
    quoteSample: "\"Dein Zitat hier\"",
    boldHeadingPreset: "Fette Überschrift",
    boldHeadingSample: "GROSSER TEXT",
    addToTimelineAtPlayhead: "An Abspielposition zur Zeitleiste hinzufügen",
    importAudioHint: "Audiodateien aus Medien importieren",
    supportedFormats: "Unterstützt MP3, WAV, AAC, OGG",
    effectsAndTransitions: "Effekte & Übergänge",
    selectClipForEffects: "Wähle einen Clip in der Zeitleiste, um Effekte anzuwenden",
    stickersComingSoon: "Sticker demnächst verfügbar",
    saveClip: "Clip speichern",
    saveSegment: "Segment speichern",
    all: "Alle",
    clips: "Clips",
    segments: "Segmente",
    customCategory: "Benutzerdefiniert",
    loading: "Laden…",
    noLibraryItems: "Noch keine Bibliothekselemente",
    noLibraryItemsDesc: "Speichere Clips oder Segmente zur Wiederverwendung",
    noItemsInCategory: "Keine Elemente in dieser Kategorie",
    saveToLibrary: "In Bibliothek speichern",
    name: "Name",
    savedClipPlaceholder: "Mein gespeicherter Clip",
    savedSegmentPlaceholder: "Meine Introszene",
    category: "Kategorie",
    save: "Speichern",
    cancel: "Abbrechen",
  },
  shortcuts: {
    title: "Tastenkürzel",
    resetAll: "Alle zurücksetzen",
    hint: "Klicke auf ein Tastenkürzel, um es neu zuzuweisen. Esc zum Abbrechen.",
    resetToDefault: "Auf Standard zurücksetzen",
    pressKeyCombo: "Tastenkombination drücken…",
    clickToReassign: "Klicken zum Zuweisen",
    categoryPlayback: "Wiedergabe",
    categoryEditing: "Bearbeitung",
    categoryFile: "Datei",
    categoryNavigation: "Navigation",
    categoryView: "Ansicht",
    categoryGeneral: "Allgemein",
    playPause: "Abspielen / Pause",
    back1s: "1 Sekunde zurück",
    forward1s: "1 Sekunde vor",
    back5s: "5 Sekunden zurück",
    forward5s: "5 Sekunden vor",
    goToStart: "Zum Anfang",
    goToEnd: "Zum Ende",
    undo: "Rückgängig",
    redo: "Wiederherstellen",
    splitClip: "Clip an Abspielposition teilen",
    deleteClip: "Ausgewählten Clip löschen",
    duplicateClip: "Clip duplizieren",
    selectAll: "Alles auswählen",
    deselect: "Auswahl aufheben",
    newProject: "Neues Projekt",
    openProject: "Projekt öffnen",
    save: "Speichern",
    saveAs: "Speichern unter…",
    exportShortcut: "Exportieren…",
    nextClip: "Nächster Clip",
    previousClip: "Vorheriger Clip",
    nextClipEnd: "Nächstes Clip-Ende",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    resetZoom: "Zoom zurücksetzen",
    toggleShortcuts: "Tastenkürzel-Panel umschalten",
  },
  common: {
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    undo: "Rückgängig",
    redo: "Wiederherstellen",
    loading: "Laden…",
    settings: "Einstellungen",
    export: "Exportieren",
    custom: "Benutzerdefiniert",
    reset: "Zurücksetzen",
  },
};

const translations: Record<Language, Translations> = { en, de };

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en;
}

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];
