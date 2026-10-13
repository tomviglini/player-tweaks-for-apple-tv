// Runs in the page's MAIN world at document_start. Apple's player reads its hls.js
// config overrides and auto-subtitle preferences from localStorage and exposes the
// hls.js instance as window.hlsSession; this script hooks all three, pins quality,
// and adds the in-player settings panel and the debug HUD.
(() => {
  const UI = window.PlayerTweaksUI;
  const LOG_PREFIX = "[Player Tweaks]";
  const CONFIG_OVERRIDES_KEY = "mk-hlsjs-config-overrides";
  // Apple's auto-subtitle triggers: on mute, on 10 s skip back, on audio/UI language mismatch.
  const AUTO_SUBTITLE_PREF = /^tv\+pref:(som|sosb|solm)-/;
  // content.css and content.js hide the dark gradient only while <html> has this attribute.
  const HIDE_GRADIENT_ATTRIBUTE = "data-player-tweaks-hide-gradient";
  // How long after a stream starts the saved subtitle preference overrides the page's own pick.
  const SUBTITLE_GUARD_MS = 15000;
  const CONFIG_OVERRIDES = {
    // Lets hlsSession.variantId pin a variant; production builds ignore it otherwise.
    allowManualLevelSelectInProd: true,
    // Default startup prefers variants under 5 Mbps and 1200p; start at the best instead.
    enableAdaptiveStartup: false,
    startupRestrictions: {
      minValidBitrate: 0,
      maxValidBitrate: 1e12,
      maxPreferredBitrate: 1e12,
      minValidHeight: 0,
      maxValidHeight: 1e6
    },
    // Defaults are 0.95 / 0.9 / 0.7, which hold back switching up.
    abrBandWidthFactor: 1,
    abrBandWidthUpFactor: 1,
    abrLowSampleBandwidthFactor: 1
  };
  // Auto keeps Apple's own settings. The pinning flag only unlocks the variantId setter,
  // so switching from Auto to a locked quality mid-video still works.
  const AUTO_CONFIG_OVERRIDES = { allowManualLevelSelectInProd: true };
  // Events from our UI that must not reach the player's click and keyboard shortcuts.
  const ISOLATED_EVENTS = [
    "click", "dblclick", "pointerdown", "pointerup", "mousedown", "mouseup",
    "keydown", "keyup", "keypress", "wheel", "contextmenu"
  ];
  // Lucide "settings" (ISC license): a thin outline gear like Apple's control icons.
  const GEAR_PATH =
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z";
  const PAGE_CSS = `
    .stage { position: fixed; pointer-events: none; }
    .gear { position: absolute; top: 60px; right: 30px; display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px 0 9px; border: 0; border-radius: 16px; background: rgba(40,40,40,.7); backdrop-filter: blur(60px) saturate(220%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); color: rgba(255,255,255,.9); font: 600 12px/1 ${UI.APPLE_FONT}; cursor: pointer; pointer-events: auto; opacity: 0; visibility: hidden; transition: opacity .2s, visibility .2s; }
    .gear.visible { opacity: 1; visibility: visible; }
    .gear[hidden] { display: none; }
    .gear svg { width: 18px; height: 18px; }
    .panel { position: absolute; width: 240px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; padding-bottom: 6px; border-radius: 6px; background: rgba(40,40,40,.7); backdrop-filter: blur(60px) saturate(220%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2), 0 8px 40px rgba(0,0,0,.55); pointer-events: auto; }
    .hud { position: absolute; max-width: calc(100% - 16px); white-space: pre; line-height: 1.35; font-variant-numeric: tabular-nums; pointer-events: none; }
    .panel[hidden], .hud[hidden] { display: none; }
  `;
  // Same sizing and colors as Apple's controls next to it: 18px icons, the bar's
  // --player-controls-color-alt (90% white) and plain white on hover.
  const CONTROL_CSS = `
    button { display: flex; align-items: center; gap: 4px; height: 24px; padding: 0 2px; border: 0; background: transparent; color: var(--player-controls-color-alt, rgba(255,255,255,.8)); font: 600 11px/1 ${UI.APPLE_FONT}; font-variant-numeric: tabular-nums; cursor: pointer; transition: opacity .1s ease-in; }
    button:hover, button[aria-expanded="true"] { color: #fff; }
    button:focus-visible { outline: 4px solid var(--keyColor-focus-color, #0071e3); outline-offset: 2px; border-radius: 4px; }
    svg { width: 18px; height: 18px; flex: none; }
  `;

  const originalGetItem = Storage.prototype.getItem;
  let settings = loadSettings();

  function loadSettings() {
    try {
      return UI.mergeSettings(UI.DEFAULT_SETTINGS, JSON.parse(originalGetItem.call(localStorage, UI.STORAGE_KEY)));
    } catch {
      return UI.mergeSettings(UI.DEFAULT_SETTINGS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(UI.STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  function applyGradientSetting() {
    document.documentElement?.toggleAttribute(HIDE_GRADIENT_ATTRIBUTE, settings.hideGradient);
  }

  applyGradientSetting();

  // Patch reads instead of writing Apple's keys, so nothing sticks once the extension is off.
  Storage.prototype.getItem = function (key) {
    const value = originalGetItem.call(this, key);
    if (key === CONFIG_OVERRIDES_KEY) {
      let stored = {};
      try {
        stored = JSON.parse(value) || {};
      } catch {}
      const overrides = settings.quality.mode === "auto" ? AUTO_CONFIG_OVERRIDES : CONFIG_OVERRIDES;
      return JSON.stringify({ ...stored, ...overrides });
    }
    if (settings.blockAutoSubtitles && typeof key === "string" && AUTO_SUBTITLE_PREF.test(key)) {
      return "false";
    }
    return value;
  };

  function safe(read, fallback) {
    try {
      return read() ?? fallback;
    } catch {
      return fallback;
    }
  }

  // ---- Playback state ----------------------------------------------------------

  let session;
  let playingLevel;
  let playback = newPlayback();
  let lastPinnedId;
  const attachedSessions = new WeakSet();
  const pinnedSessions = new WeakSet();
  const watchedVideos = new WeakSet();

  function newPlayback() {
    return { switches: 0, lastSwitchAt: 0, stalls: 0, applyPending: false, subtitleGuardUntil: 0, frames: null, fps: null };
  }

  function levelKey(level) {
    return `${level.height}/${Math.round(level.frameRate || 0)}/${level.bitrate}`;
  }

  function compareLevels(a, b) {
    return (
      (b.height || 0) - (a.height || 0) ||
      (b.frameRate || 0) - (a.frameRate || 0) ||
      (b.bitrate || 0) - (a.bitrate || 0)
    );
  }

  // Playable video variants on the current CDN pathway, best first, one per quality.
  function videoLevels() {
    const all = safe(() => session.levels, []).filter((level) => !level.iframes);
    const samePathway = all.filter((level) => level.pathwayID === playingLevel?.pathwayID);
    const unique = new Map();
    for (const level of (samePathway.length ? samePathway : all).sort(compareLevels)) {
      if (!unique.has(levelKey(level))) {
        unique.set(levelKey(level), level);
      }
    }
    return [...unique.values()];
  }

  function describe(level) {
    return `${UI.qualityLabel(level)} @ ${UI.formatMbps(level.bitrate)}`;
  }

  function resolveQualityTarget() {
    const levels = videoLevels();
    const quality = settings.quality;
    if (quality.mode === "auto" || !levels.length) {
      return null;
    }
    if (quality.mode !== "fixed") {
      return levels[0];
    }
    const distance = (level) => [
      Math.abs((level.height || 0) - (quality.height || 0)),
      Math.round(level.frameRate || 0) === Math.round(quality.frameRate || 0) ? 0 : 1,
      Math.abs((level.bitrate || 0) - (quality.bitrate || 0))
    ];
    return [...levels].sort((a, b) => {
      const [da, db] = [distance(a), distance(b)];
      return da[0] - db[0] || da[1] - db[1] || da[2] - db[2];
    })[0];
  }

  function applyQuality() {
    if (!session) {
      return;
    }
    const target = resolveQualityTarget();
    // Auto leaves alone a session the extension never pinned, so it stays Apple's own.
    if (target || pinnedSessions.has(session)) {
      try {
        // An empty id hands control back to Apple's adaptive bitrate logic.
        session.variantId = target ? target.mediaOptionId : "";
      } catch (error) {
        console.warn(`${LOG_PREFIX} could not set quality`, error);
        return;
      }
      if (target) {
        pinnedSessions.add(session);
      } else {
        pinnedSessions.delete(session);
      }
    }
    const pinnedId = target?.mediaOptionId ?? "auto";
    if (pinnedId !== lastPinnedId) {
      lastPinnedId = pinnedId;
      console.info(`${LOG_PREFIX} quality: ${target ? `pinned ${describe(target)}` : "auto"}`);
    }
  }

  function subtitleOptions() {
    return safe(() => session.subtitleMediaOptions, []);
  }

  function currentSubtitle() {
    const id = safe(() => session.subtitleSelectedPersistentID);
    if (id == null || id < 0) {
      return null;
    }
    return subtitleOptions().find((option) => option.MediaSelectionOptionsPersistentID === id) || { MediaSelectionOptionsName: `#${id}` };
  }

  function subtitleName(option) {
    return option.MediaSelectionOptionsName || option.MediaSelectionOptionsExtendedLanguageTag || "?";
  }

  function preferredSubtitle() {
    const options = subtitleOptions();
    const tag = (option) => (option.MediaSelectionOptionsExtendedLanguageTag || option.MediaSelectionOptionsLanguageCode || "").toLowerCase();
    // Same order Apple uses: the last language picked in its menu, then the browser's.
    const lastPicked = safe(() => JSON.parse(originalGetItem.call(localStorage, "mk-last-selected-lang")).language);
    const languages = [lastPicked, navigator.language, "en"].filter(Boolean).map((l) => l.split("-")[0].toLowerCase());
    for (const language of languages) {
      const match = options.find((o) => tag(o).startsWith(language));
      if (match) {
        return match;
      }
    }
    return options[0];
  }

  function setSubtitles(on) {
    if (!session) {
      return;
    }
    if (!on) {
      if (currentSubtitle()) {
        session.subtitleSelectedPersistentID = -1;
      }
      return;
    }
    if (currentSubtitle()) {
      return;
    }
    const option = preferredSubtitle();
    if (option) {
      session.subtitleSelectedPersistentID = option.MediaSelectionOptionsPersistentID;
    }
  }

  function attach(hls) {
    const events = window.Hls?.Events;
    if (!events || attachedSessions.has(hls)) {
      return;
    }
    attachedSessions.add(hls);

    hls.on(events.MANIFEST_PARSED, () => {
      if (hls !== session) {
        return;
      }
      playingLevel = undefined;
      playback = newPlayback();
      playback.applyPending = true;
      playback.subtitleGuardUntil = Date.now() + SUBTITLE_GUARD_MS;
      applyQuality();
      refreshUI();
    });

    hls.on(events.LEVEL_SWITCHED, (_, level) => {
      if (hls !== session) {
        return;
      }
      if (level?.mediaOptionId !== playingLevel?.mediaOptionId) {
        playingLevel = safe(() => hls.levels, []).find((l) => l.mediaOptionId === level?.mediaOptionId) || level;
        playback.switches++;
        playback.lastSwitchAt = Date.now();
        console.info(`${LOG_PREFIX} now playing ${describe(playingLevel)}`);
      }
      // The variant and subtitle setters need an active playlist, which exists by now.
      if (playback.applyPending) {
        playback.applyPending = false;
        applyQuality();
        setSubtitles(settings.subtitles);
      }
      refreshUI();
    });

    hls.on(events.SUBTITLE_TRACK_SWITCH, () => {
      setTimeout(() => {
        if (hls !== session) {
          return;
        }
        // Undo subtitles the page turns on by itself right after the stream starts.
        if (!settings.subtitles && Date.now() < playback.subtitleGuardUntil && currentSubtitle()) {
          setSubtitles(false);
        }
        refreshUI();
      }, 0);
    });
  }

  Object.defineProperty(window, "hlsSession", {
    configurable: true,
    get() {
      return session;
    },
    set(value) {
      session = value;
      playingLevel = undefined;
      playback = newPlayback();
      if (value) {
        attach(value);
      }
      syncUI();
    }
  });

  // ---- Debug stats ------------------------------------------------------------

  function findVideo() {
    let best = null;
    let bestArea = 0;
    for (const video of document.querySelectorAll("video")) {
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (video.readyState > 0 && area > bestArea) {
        best = video;
        bestArea = area;
      }
    }
    // Skip small inline previews; the main player fills most of the window.
    return bestArea >= window.innerWidth * window.innerHeight * 0.25 ? best : null;
  }

  function watchVideo(video) {
    if (watchedVideos.has(video)) {
      return;
    }
    watchedVideos.add(video);
    video.addEventListener("waiting", () => {
      if (!video.seeking && video.currentTime > 0) {
        playback.stalls++;
      }
    });
  }

  function sampleFrames(video) {
    const quality = video?.getVideoPlaybackQuality?.();
    if (!quality) {
      return;
    }
    const sample = { total: quality.totalVideoFrames, time: performance.now() };
    const previous = playback.frames;
    if (previous && sample.total >= previous.total && sample.time > previous.time) {
      playback.fps = ((sample.total - previous.total) * 1000) / (sample.time - previous.time);
    }
    playback.frames = sample;
  }

  function formatAgo(timestamp) {
    const seconds = Math.round((Date.now() - timestamp) / 1000);
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function formatSeconds(value) {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return `${(value > 60 ? value / 1000 : value).toFixed(1)} s`;
  }

  function modeLabel() {
    return { auto: "Auto", fixed: "Fixed" }[settings.quality.mode] || "Highest";
  }

  function currentLabel() {
    const level = playingLevel || safe(() => session.activeRootPlaylistQuery.enabledVariantMediaOption);
    return level ? `${UI.qualityLabel(level)} · ${UI.formatMbps(level.bitrate)}` : null;
  }

  function statsLines(compact) {
    const headline = currentLabel() || "—";
    if (compact) {
      return [headline];
    }

    const level = playingLevel;
    const video = findVideo();
    const quality = video?.getVideoPlaybackQuality?.();
    const log = safe(() => session.accessLog, []);
    const entry = log[log.length - 1] || {};
    const lines = [`${headline} · ${modeLabel()}`];

    if (level) {
      const pathway = level.pathwayID && level.pathwayID !== "." ? `CDN ${level.pathwayID}` : null;
      const codec = (level.videoCodec || level.levelCodec || "").split(",")[0];
      lines.push([codec, level.videoRange, pathway].filter(Boolean).join(" · "));
    }
    if (video) {
      const dropped = quality
        ? `dropped ${quality.droppedVideoFrames} (${((100 * quality.droppedVideoFrames) / Math.max(1, quality.totalVideoFrames)).toFixed(2)}%)`
        : null;
      const fps = playback.fps ? `${playback.fps.toFixed(1)} fps` : null;
      lines.push([`Video ${video.videoWidth}×${video.videoHeight}`, fps, dropped].filter(Boolean).join(" · "));
    }

    const observed = entry["c-observed-bitrate"];
    const buffer = safe(() => session.bufferedDuration);
    lines.push(
      [observed ? `Network ${UI.formatMbps(observed)}` : null, Number.isFinite(buffer) ? `buffer ${buffer.toFixed(1)} s` : null]
        .filter(Boolean)
        .join(" · ")
    );

    if (safe(() => session.isLive)) {
      const playingDate = safe(() => new Date(session.playingDate).getTime());
      const latency = (Date.now() - playingDate) / 1000;
      if (Number.isFinite(latency) && latency >= 0 && latency < 7200) {
        lines.push(`Live · ${latency.toFixed(1)} s behind${safe(() => session.isPlayingAtLive) ? " (at live edge)" : ""}`);
      }
    }

    const stalls = Number.isFinite(entry["c-stalls"]) ? entry["c-stalls"] : playback.stalls;
    const switches = Math.max(0, playback.switches - 1);
    lines.push(
      `Quality switches ${switches}${switches && playback.lastSwitchAt ? ` (${formatAgo(playback.lastSwitchAt)} ago)` : ""} · stalls ${stalls}`
    );

    const audioId = safe(() => session.audioSelectedPersistentID);
    const audio = safe(() => session.audioMediaOptions, []).find((o) => o.MediaSelectionOptionsPersistentID === audioId);
    const subtitle = currentSubtitle();
    lines.push(
      [
        audio ? `Audio ${subtitleName(audio)}` : null,
        `Subs ${subtitle ? subtitleName(subtitle) : "off"}`,
        settings.blockAutoSubtitles ? "auto blocked" : null
      ]
        .filter(Boolean)
        .join(" · ")
    );

    const errors = safe(() => session.errorLog.length, 0);
    lines.push(
      [
        formatSeconds(entry["c-startup-time"]) ? `Startup ${formatSeconds(entry["c-startup-time"])}` : null,
        entry["s-ip"] ? `Server ${entry["s-ip"]}` : null,
        errors ? `Errors ${errors}` : null
      ]
        .filter(Boolean)
        .join(" · ")
    );

    return lines.filter(Boolean);
  }

  function getState(includeStats) {
    const levels = session ? videoLevels() : [];
    const target = resolveQualityTarget();
    const playingKey = playingLevel ? levelKey(playingLevel) : null;
    const mode = settings.quality.mode;
    const options = [
      { key: "auto", label: "Auto (Apple default)", hint: "Apple picks it for your connection. Starts lower and climbs.", value: { mode: "auto" }, selected: mode === "auto" },
      {
        key: "max",
        label: "Highest available",
        hint: `Locks ${levels[0] ? `${UI.qualityLabel(levels[0])} · ${UI.formatMbps(levels[0].bitrate)}` : "the best stream"}. Never drops; may buffer.`,
        value: { mode: "max" },
        selected: mode !== "auto" && mode !== "fixed"
      },
      ...levels.map((level) => ({
        key: levelKey(level),
        label: `${UI.qualityLabel(level)} · ${UI.formatMbps(level.bitrate)}`,
        value: { mode: "fixed", height: level.height, frameRate: level.frameRate, bitrate: level.bitrate },
        selected: mode === "fixed" && Boolean(target) && levelKey(target) === levelKey(level),
        playing: levelKey(level) === playingKey
      }))
    ];
    if (mode === "fixed" && !levels.length) {
      options.push({
        key: "saved",
        label: `${UI.qualityLabel(settings.quality)} · ${UI.formatMbps(settings.quality.bitrate)}`,
        hint: "Saved",
        value: settings.quality,
        selected: true
      });
    }

    const subtitle = currentSubtitle();
    return {
      hasPlayer: Boolean(session && findVideo()),
      settings,
      current: currentLabel(),
      qualityOptions: options,
      subtitlesAvailable: subtitleOptions().length > 0,
      subtitlesLabel: subtitle ? subtitleName(subtitle) : null,
      stats: includeStats && session ? statsLines(false) : []
    };
  }

  function updateSettings(patch) {
    settings = UI.mergeSettings(settings, patch);
    saveSettings();
    if (patch.quality) {
      applyQuality();
    }
    if ("subtitles" in patch) {
      setSubtitles(settings.subtitles);
    }
    if ("hideGradient" in patch) {
      applyGradientSetting();
    }
    if ("injectUI" in patch) {
      if (!settings.injectUI) {
        togglePanel(false);
      }
      syncUI();
    }
    refreshUI();
  }

  // ---- In-player UI -----------------------------------------------------------

  // The button sits in Apple's control bar so it fades with Apple's controls; the menu
  // and the HUD live in a top-layer popover above the player and its fullscreen element.
  let host, stage, floatingGear, floatingGearLabel, panel, hud, controls, gearTimer;
  let control, controlButton, controlLabel;
  let layerKey = "";

  function gearIcon() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    const attributes = {
      viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.8",
      "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true"
    };
    for (const [name, value] of Object.entries(attributes)) {
      svg.setAttribute(name, value);
    }
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", GEAR_PATH);
    const hub = document.createElementNS(ns, "circle");
    hub.setAttribute("cx", "12");
    hub.setAttribute("cy", "12");
    hub.setAttribute("r", "3");
    svg.append(path, hub);
    return svg;
  }

  function isolate(element) {
    for (const type of ISOLATED_EVENTS) {
      element.addEventListener(type, (event) => event.stopPropagation());
    }
    element.addEventListener("keydown", (event) => event.key === "Escape" && togglePanel(false));
  }

  function buildUI() {
    host = document.createElement("div");
    host.id = "player-tweaks-ui";
    host.setAttribute("popover", "manual");
    const hostStyle = {
      inset: "0", width: "100vw", height: "100vh", "max-width": "none", "max-height": "none",
      margin: "0", padding: "0", border: "0", background: "transparent", overflow: "visible",
      "pointer-events": "none"
    };
    for (const [property, value] of Object.entries(hostStyle)) {
      host.style.setProperty(property, value, "important");
    }
    isolate(host);

    const root = host.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [UI.createStyleSheet(PAGE_CSS)];

    // Fallback for when Apple's control bar cannot be found.
    floatingGearLabel = document.createElement("span");
    floatingGear = document.createElement("button");
    floatingGear.type = "button";
    floatingGear.className = "gear";
    floatingGear.title = "Quality and settings";
    floatingGear.append(gearIcon(), floatingGearLabel);
    floatingGear.addEventListener("click", () => togglePanel());

    panel = document.createElement("div");
    panel.className = "panel";
    panel.hidden = true;
    controls = UI.createSettingsUI(panel, { context: "panel", onChange: updateSettings });

    hud = document.createElement("div");
    hud.className = "hud";
    hud.hidden = true;

    stage = document.createElement("div");
    stage.className = "stage";
    stage.append(hud, floatingGear, panel);
    root.append(stage);
  }

  function buildControl() {
    control = document.createElement("div");
    control.id = "player-tweaks-control";
    control.style.cssText = "display: flex; align-items: center; height: 24px;";
    isolate(control);
    const root = control.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CONTROL_CSS);
    root.adoptedStyleSheets = [sheet];

    controlLabel = document.createElement("span");
    controlButton = document.createElement("button");
    controlButton.type = "button";
    controlButton.title = "Quality and settings";
    controlButton.setAttribute("aria-label", "Quality and settings");
    controlButton.setAttribute("aria-haspopup", "true");
    controlButton.setAttribute("aria-expanded", "false");
    controlButton.append(gearIcon(), controlLabel);
    controlButton.addEventListener("click", () => togglePanel());
    root.append(controlButton);
  }

  // Puts our button just before Apple's subtitles button; returns whether it is there.
  function ensureControl(video) {
    const scope = video.closest(".video-player") || document;
    const bar = settings.injectUI ? scope.querySelector(".video-player__controls") : null;
    if (!bar) {
      control?.remove();
      return false;
    }
    if (!control) {
      buildControl();
    }
    if (control.parentNode !== bar) {
      const captions = bar.querySelector(":scope > .video-player__control--captions");
      bar.insertBefore(control, captions || bar.firstChild);
    }
    return true;
  }

  function panelAnchor() {
    return control?.isConnected ? control : floatingGear;
  }

  // Opens upward from the button in Apple's bar, or downward from the floating gear.
  function positionPanel() {
    if (!panel || panel.hidden) {
      return;
    }
    const anchor = panelAnchor().getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    panel.style.right = `${Math.max(12, box.right - anchor.right)}px`;
    if (control?.isConnected) {
      panel.style.top = "auto";
      panel.style.bottom = `${Math.max(12, box.bottom - anchor.top + 8)}px`;
      panel.style.maxHeight = `${Math.max(160, anchor.top - box.top - 24)}px`;
    } else {
      panel.style.bottom = "auto";
      panel.style.top = `${anchor.bottom - box.top + 10}px`;
      panel.style.maxHeight = `${Math.max(160, box.bottom - anchor.bottom - 24)}px`;
    }
  }

  // Apple hides its controls after a few idle seconds; nudge it while our menu is open.
  function keepPlayerControlsVisible() {
    const target = control?.isConnected && control.closest(".video-player")?.querySelector(".scrim__clickable");
    if (!target) {
      return;
    }
    const rect = control.getBoundingClientRect();
    const init = { bubbles: true, composed: true, clientX: rect.left, clientY: rect.top };
    target.dispatchEvent(new PointerEvent("pointermove", init));
    target.dispatchEvent(new MouseEvent("mousemove", init));
  }

  function togglePanel(open = panel?.hidden) {
    if (!panel) {
      return;
    }
    panel.hidden = !open;
    controlButton?.setAttribute("aria-expanded", String(Boolean(open)));
    if (open) {
      controls.update(getState(false));
      positionPanel();
      keepPlayerControlsVisible();
    }
    revealGear();
  }

  function revealGear() {
    if (!floatingGear || floatingGear.hidden) {
      return;
    }
    floatingGear.classList.add("visible");
    clearTimeout(gearTimer);
    gearTimer = setTimeout(() => {
      if (panel.hidden && !floatingGear.matches(":hover")) {
        floatingGear.classList.remove("visible");
      }
    }, 3000);
  }

  function hideUI() {
    if (host?.matches(":popover-open")) {
      host.hidePopover();
    }
    if (panel) {
      panel.hidden = true;
    }
  }

  function renderHud() {
    const hudSettings = settings.hud;
    hud.hidden = !hudSettings.enabled;
    if (hud.hidden) {
      return;
    }
    UI.applyHudLook(hud, hudSettings);
    const [vertical, horizontal] = hudSettings.corner.split("-");
    hud.style[vertical] = `${hudSettings.margin}px`;
    hud.style[horizontal] = `${hudSettings.margin}px`;
    hud.style.textAlign = horizontal;
    hud.textContent = statsLines(hudSettings.compact).join("\n");
  }

  function refreshUI() {
    if (!host) {
      return;
    }
    const label = playingLevel ? UI.qualityLabel(playingLevel) : "Quality";
    floatingGearLabel.textContent = label;
    if (controlLabel) {
      controlLabel.textContent = label;
    }
    renderHud();
    if (!panel.hidden) {
      controls.update(getState(false));
      positionPanel();
    }
  }

  function syncUI() {
    const video = session ? findVideo() : null;
    if (!video) {
      hideUI();
      return;
    }
    watchVideo(video);
    sampleFrames(video);
    if (!host) {
      buildUI();
    }

    // Inside the player's <dialog> so a modal dialog does not make the UI inert.
    const container = video.closest("dialog") || document.body;
    if (host.parentNode !== container) {
      container.append(host);
    }
    // Re-show whenever something may have entered the top layer above us.
    const key = `${container.open}|${Boolean(document.fullscreenElement)}`;
    if (!host.matches(":popover-open") || key !== layerKey) {
      layerKey = key;
      try {
        if (host.matches(":popover-open")) {
          host.hidePopover();
        }
        host.showPopover();
      } catch (error) {
        console.warn(`${LOG_PREFIX} could not show UI`, error);
      }
    }

    const injected = ensureControl(video);
    floatingGear.hidden = injected || !settings.injectUI;
    if (!panelAnchor().isConnected || (floatingGear.hidden && !injected)) {
      panel.hidden = true;
    }

    const rect = video.getBoundingClientRect();
    Object.assign(stage.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
    if (!panel.hidden) {
      keepPlayerControlsVisible();
    }
    refreshUI();
  }

  setInterval(syncUI, 1000);
  window.addEventListener("resize", syncUI);
  document.addEventListener("fullscreenchange", () => {
    layerKey = "";
    syncUI();
  });
  window.addEventListener("pointermove", () => host?.matches(":popover-open") && revealGear(), { passive: true, capture: true });
  window.addEventListener(
    "pointerdown",
    (event) => {
      const path = event.composedPath();
      if (panel && !panel.hidden && !path.includes(host) && !path.includes(control)) {
        togglePanel(false);
      }
    },
    true
  );
  // Svelte may re-render Apple's control bar; put the button back right away.
  let resyncQueued = false;
  new MutationObserver(() => {
    if (control && !control.isConnected && settings.injectUI && session && !resyncQueued) {
      resyncQueued = true;
      requestAnimationFrame(() => {
        resyncQueued = false;
        syncUI();
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ---- Toolbar popup bridge ---------------------------------------------------

  document.addEventListener("player-tweaks:request", (event) => {
    let request;
    try {
      request = JSON.parse(event.detail);
    } catch {
      return;
    }
    if (request.message?.type === "update-settings") {
      updateSettings(request.message.patch || {});
    }
    const detail = JSON.stringify({ id: request.id, payload: getState(true) });
    document.dispatchEvent(new CustomEvent("player-tweaks:response", { detail }));
  });
})();
