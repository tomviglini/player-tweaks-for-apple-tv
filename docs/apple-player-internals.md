# Apple TV web player internals

This file covers what the extension relies on inside the tv.apple.com web player. It was read from Apple's shipped bundles and from dumps of the live player on 2026-10-10 and 2026-10-11, and the `allowManualLevelSelectInProd` details from hls.js 3.4.16 on 2026-10-12.

None of it is a public API, and Apple can change any of it without notice:

- Before relying on something, re-verify it (see [Re-verifying](#re-verifying)).
- After re-verifying, update this file with the date.
- Everything here is described in our own words. Do not paste Apple's code into this file.

## Where the code lives

| Bundle | Contents |
| --- | --- |
| `tv.apple.com/assets/main~*.js` | The Svelte app: player UI and auto-subtitles. |
| `tv.apple.com/assets/mediakit~*.js` | MusicKit, which creates the hls.js player. |
| `tv.apple.com/assets/CommerceModalContainer~*.js` | The `localStorage` helpers. |
| `https://js-cdn.music.apple.com/hls.js/current/hls.js/hls.js` | Apple's fork of hls.js. Version 3.4.16 was live. |
| `/includes/js-cdn/musickit/v3/components/musickit-components/` | Stencil web components. The contextual menu was in `p-b3823096.entry.js`; the hash changes between builds. |

Two page settings make the extension's styling possible:

- the page's CSP allows `'unsafe-inline'` in `style-src`;
- Trusted Types is not enforced.

## Player creation

MusicKit's `createHlsPlayer`:

1. builds an hls.js config;
2. reads `localStorage["mk-hlsjs-config-overrides"]` as JSON and merges it on top with `Object.assign`;
3. creates `new window.Hls(config)` and assigns the instance to `window.hlsSession`;
4. sets `window.hlsSession` back to `undefined` when the player is destroyed.

The merge is shallow, so a nested setting such as `startupRestrictions` is replaced as a whole. The overrides key is a developer flag. The other flags, which the extension does not use, are `mk-hlsjs-log-level`, `mk-hlsjs-version` and `mk-hlsjs-item-preloading`.

**Extension use:** `player-tools.js` runs at `document_start` in the page's MAIN world.

- It patches `Storage.prototype.getItem` so that reading the overrides key returns whatever is stored there, merged with the extension's overrides. Nothing is written, so turning the extension off leaves Apple's storage untouched.
- It defines a `window.hlsSession` accessor, so it sees every new session as Apple assigns it.

## hls.js settings that hold quality back

| Setting | Apple's default | Extension (Highest and Fixed) |
| --- | --- | --- |
| `enableAdaptiveStartup` | `true` | `false` |
| `startupRestrictions` | `minValidBitrate: 8e5`, `maxValidBitrate: 8e6`, `maxPreferredBitrate: 5e6`, `minValidHeight: 300`, `maxValidHeight: 1200` | All five limits wide open |
| `targetStartupMs` | `4000` | Unchanged |
| `abrBandWidthFactor` | `0.95` | `1` |
| `abrBandWidthUpFactor` | `0.9` | `1` |
| `abrLowSampleBandwidthFactor` | `0.7` | `1` |
| `allowManualLevelSelectInProd` | `false` | `true` |

In Auto, the extension adds only `allowManualLevelSelectInProd`, so Apple's startup and bandwidth settings stay as they are.

The startup restrictions make the player prefer variants under 5 Mbps. Together with the conservative bandwidth factors, playback starts low and takes a while to reach the top variant, which was the problem that started this extension.

Related settings the extension leaves alone:

- `resolutionLimits` caps resolution by HDCP class: 858×576 for SD and 3440×1440 for HD.
- The bandwidth history is stored in `localStorage["AppleHLS-bandwidth-estimation"]`.
- `useViewportSizeForLevelCap` is `false`, so the window size does not cap quality.

### Why the extension does not edit the playlist

An earlier version removed lower variants from the HLS master playlist by wrapping `fetch` and XHR. That was dropped: Apple's hls.js filters variants by `HDCP-LEVEL` and `PATHWAY-ID`, so stripping them blindly could leave only variants the player then rejects. Pinning through `hlsSession.variantId` only chooses among the variants the player already accepts.

## `hlsSession`

Members the extension reads or sets:

- **`levels`:** the variant list after the player's own filtering. Each level has:
  - `mediaOptionId`, `width`, `height`, `frameRate` and `bitrate`;
  - `levelCodec` or `videoCodec`, and `videoRange`;
  - `pathwayID`, `hdcpLevel` and `iframes`.
- **`variantId`:** setting a `mediaOptionId` pins that variant, and `""` hands control back to adaptive bitrate. Production builds ignore it unless `allowManualLevelSelectInProd` is on.
  - Checked in hls.js 3.4.16 on 2026-10-12: the setter is the only code that reads `allowManualLevelSelectInProd`, whose default is `false`. With the flag on, `""` or `"Nah"` turns manual mode off for the playing item, and any other id turns it on and switches. With the flag on and no `variantId` write, the player behaves as it does without the extension.
- **Subtitles:**
  - `subtitleMediaOptions` lists the tracks, with `MediaSelectionOptionsPersistentID`, `MediaSelectionOptionsName` and `MediaSelectionOptionsExtendedLanguageTag`;
  - `subtitleSelectedPersistentID` reads the current track, and setting it to `-1` turns subtitles off.
- **Audio:** `audioMediaOptions` and `audioSelectedPersistentID`, with the same fields as subtitles.
- **`accessLog`:** each entry carries `c-observed-bitrate`, `c-stalls`, `c-frames-dropped`, `c-startup-time`, `s-ip`, `sc-indicated-bitrate` and `c-overdue`. There is also an `errorLog`.
- **Playback state:** `bufferedDuration`, `isLive`, `isPlayingAtLive`, `playingDate` and `config`.
- **`activeRootPlaylistQuery`:**
  - `.mediaOptionListQueries[0].mediaOptionList` is the unfiltered variant list, and `.filteredMediaOptionList` the playable one;
  - `.maxHdcpLevel`;
  - `.enabledVariantMediaOption` is the variant playing now.
- **Events:** `window.Hls.Events` has `MANIFEST_PARSED`, `LEVEL_SWITCHED` and `SUBTITLE_TRACK_SWITCH`. The variant and subtitle setters do nothing until the first `LEVEL_SWITCHED`, because they need an active playlist.

**Extension use:**

- **Quality options:** the extension takes `levels` without I-frame variants, keeps the CDN pathway that is playing, and lists one option per height, frame rate and bitrate, best first.
  - "Highest available" pins the first option.
  - "Fixed resolution" pins the closest match, by height, then frame rate, then bitrate.
  - Auto writes nothing to a session the extension never pinned. It sets `variantId` to `""` only to undo an earlier pin in the same session. Apple reads the overrides when it creates the player, so switching to Auto mid-video unpins at once, but the extension's startup and bandwidth settings stay until Apple creates a new player, for example after a page reload. Whether autoplay of the next episode creates a new player was not checked.
    - Checked in hls.js 3.4.16 on 2026-10-12: the adaptive bitrate code reads `abrBandWidthFactor`, `abrBandWidthUpFactor` and `abrLowSampleBandwidthFactor` from its config object at every decision, so changing them in a running player might take effect. It was not checked whether that object is `hlsSession.config`. The extension does not write into a running player's config, so it does not depend on that internal code, and it never imposes values that might no longer be Apple's.
- **When it applies:** quality is applied on `MANIFEST_PARSED` and again on the first `LEVEL_SWITCHED`. The subtitle setting is applied on that same `LEVEL_SWITCHED`.
- **HUD:** it reads the video element, the playing level, `bufferedDuration`, the live fields and the last `accessLog` entry.

## Auto-subtitles

`main.js` runs an xstate machine named `auto-subs`. It turns subtitles on by itself on three triggers, each gated by a preference key that includes a content id:

| Trigger | Key |
| --- | --- |
| Muting | `tv+pref:som-<id>` |
| Skipping back 10 s | `tv+pref:sosb-<id>` |
| Audio language different from the interface language | `tv+pref:solm-<id>` |

The machine reads the key as JSON on every event, and any value other than `false` counts as enabled. Returning `"false"` from a read therefore turns a trigger off immediately.

Related keys:

- `mk-text-track` holds the saved subtitle track;
- `mk-last-selected-lang` holds the last language picked in Apple's menu, as a JSON object with a `language` field;
- the track that means no subtitles is labeled `"Off"`.

**Extension use:**

- **Block automatic subtitles:** while the setting is on, the `getItem` patch returns `"false"` for keys matching the three prefixes.
- **Guard:** for 15 s after `MANIFEST_PARSED`, subtitles the page turns on by itself are switched back off if "Start with subtitles" is off.
- **Start with subtitles:** picks a track in this order:
  1. `mk-last-selected-lang`;
  2. the browser language;
  3. English;
  4. the first track.

## Controls visibility

The scrim component listens on `.video-player-scrim` for:

- `mousemove`;
- `focusin`;
- `touchstart`, `touchmove` and `touchend`.

After 4000 ms without any of them, it adds `.video-player-scrim--hidden`. It also has a `lock` prop with the values Unlocked, Hidden and Visible.

**Extension use:**

- The settings button lives inside Apple's control bar, so it fades out with Apple's controls.
- While the menu is open, `player-tools.js` dispatches `pointermove` and `mousemove` on `.scrim__clickable` about once a second. The events bubble up to the scrim and keep the controls visible.

## Player DOM

Structure of the full-viewport player during playback, as seen in the live dump:

```text
dialog.playback-view.is-full-viewport.is-playback-active
  .video-player > .video-player__content
    #main-video-container > video#apple-music-video-player
    .video-player-scrim[--hidden]
      .scrim__gradient                 (hidden by content.css)
      .scrim__header  > close button, volume
      .scrim__body    > skip back / play-pause / skip forward
      .scrim__footer  > .video-player__footer (grid: "info controls" / scrub / "tabs auto-subs")
        .video-player__controls        (flex, gap 14px)
          amp-jump-to-live-control.video-player__control      (only away from the live edge)
          [the extension's #player-tweaks-control goes here]
          amp-captions-control.video-player__control--captions
          amp-audio-tracks-control.video-player__control
          amp-contextual-menu-button.share-control
          amp-playback-controls-full-screen.video-player__control
      .scrim__clickable
```

The controls are 24×24 boxes with 18px icons. They use `var(--player-controls-color-alt)` (`#ffffffe6`) and turn white on hover. The close and volume buttons sit in the top 46px of the player.

**Extension use:**

- **Button:**
  - `#player-tweaks-control` is inserted before `.video-player__control--captions`, or first if the captions control is missing.
  - A `MutationObserver` puts it back when Svelte re-renders the bar.
  - A floating gear is the fallback when the bar cannot be found.
- **Menu and HUD:** both live in a manual popover, `#player-tweaks-ui`, appended inside the player's `<dialog>` so the modal dialog does not make them inert. The popover is shown again whenever the dialog or fullscreen state changes, so it stays on top.
- **Overlay:** `content.css` and `content.js` hide `.scrim__gradient` and similar dark full-width gradients inside the player.
  - They act only while `<html>` has `data-player-tweaks-hide-gradient`, which `player-tools.js` sets from the gradient setting.
  - `content.js` only marks the gradients it finds, with `data-player-tweaks-gradient`, and `content.css` hides them. Turning the setting off therefore brings Apple's gradient back at once, with nothing to undo.

## Contextual menu (desktop, min-width 484px)

Apple's menu metrics, as seen in the live dump:

- **Rows:** 32px tall with `0 10px` padding. Text is 13px with a line height of 1.23, in `rgba(255,255,255,.85)`.
- **Group titles:** 11px, weight 600, in `rgba(255,255,255,.25)`, with `6px 10px 2px` padding.
- **Subtext:** 10px in `rgba(255,255,255,.55)`.
- **Dividers:** `.5px` between items and `2px` between groups, both `rgba(255,255,255,.1)`.
- **Box:** minimum width 185px and 6px radius.
- **Material:**
  - background `rgba(40,40,40,.7)` with `blur(60px) saturate(220%)`;
  - an inset ring of `rgba(255,255,255,.2)`;
  - shadow `0 8px 40px rgba(0,0,0,.55)`;
  - hover `rgba(170,170,170,.2)`.
- **Font:** `-apple-system, BlinkMacSystemFont, "SF Pro", …, sans-serif`.

**Extension use:** `ui-controls.js` follows these values a notch smaller: 28px rows, 12px text, and 9.5px descriptions.

## Observed stream

MLS live match in Chrome on Windows, 2026-10-10:

| Quality | Bitrates |
| --- | --- |
| 1080p60 | 8.1 and 6.3 Mbps |
| 1080p30 | 5.1 Mbps |
| 720p30 | 4.2 and 3.3 Mbps |
| 576p | 2.6 Mbps |
| 480p | 2.2 Mbps |
| 432p | 1.7 Mbps |
| 360p | 1.0 Mbps |

All variants were H.264 (`avc1.640032` or `avc1.640029`), SDR and `HDCP-LEVEL=NONE`. Each quality was repeated on three CDN pathways: `ap-p`, `ap-b` and `ak-p`. See [troubleshooting.md](troubleshooting.md) for what this means for quality.

## Re-verifying

- **Player DOM and CSS:** paste [`tools/dump-player.js`](../tools/dump-player.js) into the DevTools console during playback. It opens and closes the subtitles menu, then saves the player's DOM, shadow roots, component styles and the relevant page CSS:
  - it copies them to the clipboard;
  - it downloads them as `atv-player-full-dump.txt`.

  Dumps contain Apple's markup and icons. Keep them out of the repository; `.gitignore` excludes `atv-player-*.txt`.
- **Bundle code:** in DevTools → Sources, search all files for strings such as:
  - `mk-hlsjs-config-overrides` and `allowManualLevelSelectInProd`;
  - `startupRestrictions`;
  - `tv+pref:som-` and `auto-subs`.
- **Quality ladder:** paste this during playback. It copies a JSON report to the clipboard with:
  - the hls.js version, whether a session exists and the stored overrides;
  - the playing variant and the decoded size;
  - dropped frames;
  - the playable and full variant lists.

```js
(() => {
  const s = window.hlsSession, q = s?.activeRootPlaylistQuery, v = q?.mediaOptionListQueries?.[0];
  const fmt = (l) => l && `${l.width}x${l.height} ${Math.round(l.frameRate || 0)}fps ${((l.bitrate || 0) / 1e6).toFixed(1)}Mbps ${l.videoCodec || l.levelCodec || ""} ${l.videoRange || ""}${l.hdcpLevel ? " hdcp=" + l.hdcpLevel : ""}${l.pathwayID && l.pathwayID !== "." ? " path=" + l.pathwayID : ""}`;
  const list = (ls) => (ls || []).filter((l) => !l.iframes).sort((a, b) => b.bitrate - a.bitrate).map(fmt);
  const video = document.querySelector("video");
  const report = {
    hls: window.Hls?.version, session: !!s, overrides: localStorage.getItem("mk-hlsjs-config-overrides"),
    maxHdcpLevel: q?.maxHdcpLevel, current: fmt(q?.enabledVariantMediaOption),
    decoded: video ? `${video.videoWidth}x${video.videoHeight}` : null,
    dropped: video?.getVideoPlaybackQuality?.().droppedVideoFrames,
    playable: list(v?.filteredMediaOptionList), all: list(v?.mediaOptionList),
  };
  copy(JSON.stringify(report, null, 2));
  return report;
})();
```

With the extension active, `overrides` shows the merged overrides, because the snippet reads through the patched `getItem`.
