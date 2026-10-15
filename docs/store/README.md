# Chrome Web Store listing

Texts and images for the Chrome Web Store listing, ready to paste into the developer dashboard. They describe version 0.2.1. Review them whenever the extension's behavior changes. The publishing steps are in [publishing.md](../publishing.md#chrome-web-store).

## Package

Upload `dist/player-tweaks-for-apple-tv-VERSION-chrome-web-store.zip`, built by `python3 scripts/package.py`.

## Store listing

### Name and summary

Both come from `manifest.json` and cannot be edited in the dashboard:

- **Name:** Player Tweaks for Apple TV
- **Summary:** Cleans the Apple TV Web player overlay, controls stream quality and auto subtitles, and shows playback debug info.

### Description

```text
Player Tweaks improves the Apple TV web player at tv.apple.com, for live sports, movies and series.

• Quality: starts at the highest quality and keeps it, or locks a resolution you pick. Auto leaves the choice to Apple's player.
• Subtitles: blocks the subtitles Apple turns on by itself when you mute, skip back 10 seconds, or the audio language differs from the interface, and remembers whether you want subtitles on or off.
• Cleaner picture: hides the dark gradient that covers the video when the controls show. You can turn this off.
• Playback info: an optional overlay with quality, dropped frames, buffer, measured bandwidth, live delay, CDN and more.
• Settings: a button in Apple's control bar, with the same settings in the toolbar popup.

Privacy: the extension reads the player's state only in your browser and sends nothing anywhere. It stores only its own settings, and it runs only on tv.apple.com.

It does not bypass DRM, HDCP, region checks, logins or subscriptions, and it does not download or record video. It only chooses among the stream qualities Apple's player already offers your account.

Player Tweaks for Apple TV is an independent project. It is not affiliated with, authorized, sponsored or approved by Apple Inc. Apple and Apple TV are trademarks of Apple Inc. Apple's Media Services Terms say you may not modify or use modified versions of Apple's software, so using this extension may conflict with those terms. Apple can change its player at any time, which can break the extension. Use it at your own risk.

The extension is open source under the MIT License.
Source code and issues: https://github.com/tomviglini/player-tweaks-for-apple-tv
```

### Category and language

- **Category:** Entertainment
- **Language:** English

### Graphic assets

| Field | File |
| --- | --- |
| Store icon | [`store-icon-128.png`](store-icon-128.png) |
| Screenshots | [`screenshot-1280x800.png`](screenshot-1280x800.png) |
| Small promo tile | [`promo-small-440x280.png`](promo-small-440x280.png) |

See [Images](#images) for what they show and how to render them again.

### Links

- **Homepage URL:** https://github.com/tomviglini/player-tweaks-for-apple-tv
- **Support URL:** https://github.com/tomviglini/player-tweaks-for-apple-tv/issues

Before submitting, check that the repository is public and that these links open without signing in.

### Mature content

Off.

## Privacy practices

### Single purpose description

```text
Improves the Apple TV web player at tv.apple.com: it controls stream quality and subtitles, can hide the dark gradient over the video, and can show playback information.
```

### Host permission justification

```text
The extension only changes the Apple TV web player, so its content scripts run only on https://tv.apple.com/*. They read the player's state to lock the chosen quality, manage subtitles, hide the dark gradient and show playback information. The extension requests no other permissions, and nothing it processes is sent anywhere.
```

### Remote code

Select **No, I am not using Remote code**. If the justification field stays enabled, use:

```text
All the JavaScript and CSS the extension runs ship in its package. It downloads and runs no external JavaScript or WebAssembly, imports no remote modules and uses no eval().
```

### Data usage

Google requires declaring how user data is handled even when it never leaves the device; see the [user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq). The table maps the code to the form's categories. Checking a category does not mean the developer receives that data.

| Category | Check | What the extension does |
| --- | --- | --- |
| Website content | Yes | Reads the player's state in the browser: the available qualities, the subtitle and audio tracks, playback statistics, and the last subtitle language picked in Apple's menu. |
| User activity | Yes | Listens for mouse movement, clicks and the Escape key only to show its button, close its menu and look for the gradient again. It records none of it. |
| Personally identifiable information | No | Reads no identity data. |
| Health information | No | Reads no health data. |
| Financial and payment information | No | Reads no payment data. |
| Authentication information | No | Reads no credentials or cookies. |
| Personal communications | No | Reads no messages. |
| Location | No | Reads no location. |
| Web history | No | Collects no list of visited pages. |

Check the three certifications: the extension does not sell or transfer user data to third parties, does not use it for purposes unrelated to its single purpose, and does not use it to determine creditworthiness or for lending.

### Privacy policy URL

https://github.com/tomviglini/player-tweaks-for-apple-tv/blob/main/PRIVACY.md

[PRIVACY.md](../../PRIVACY.md) must match these answers. Push any change to it before submitting the form.

## Test instructions

Leave the username and password empty. "Additional instructions" takes at most 500 characters; this text has 487:

```text
No test account: playback on tv.apple.com needs the reviewer's own Apple Account, and the extension only acts while a video plays. Its button shows the current quality in Apple's control bar; the toolbar popup has the same settings. The MAIN-world scripts patch Storage.prototype.getItem so reads of Apple's hls.js config key and auto-subtitle keys return the extension's values (nothing is written), and add a window.hlsSession accessor to lock quality. Nothing is sent; no remote code.
```

## Distribution

- **Payments:** free.
- **Visibility:** public or unlisted. Both are reviewed.
- **Regions:** all.

## Images

[`tools/render-store-images.js`](../../tools/render-store-images.js) renders all three images into this folder.

### What they show

- **Screenshot:**
  - the extension's own settings menu, rendered by `ui-controls.js` with the default settings;
  - sample stream values from the MLS stream in [apple-player-internals.md](../apple-player-internals.md#observed-stream);
  - a neutral background, the icon, the name and four feature lines.

  It does not show Apple's player.
- **Small promo tile:** the icon and the name.
- **Store icon:** `icons/icon.svg` with the 16px of transparent padding the store recommends. The icon inside the package has almost none.

### Rules

- **Apple material:** no frames of Apple's movies, series or matches, and no Apple logos, Apple TV app styling or Apple fonts.
- **Name:** "for Apple TV" stays smaller and plainer than "Player Tweaks"; see [compliance.md](../compliance.md#trademarks).
- **Text:** in English. The store shows screenshots at 640×400, so keep the text large and short.
- **Fonts:** the name and the feature lines use Liberation Sans, or Arial where it is missing. The menu uses the extension's own font stack. The result depends on the fonts installed on the machine that renders it.

### Regenerate

Run this from the repository root. It needs Node.js:

```sh
npm install --no-save playwright
npx playwright install chromium
node tools/render-store-images.js
```

To use an existing Chromium, install `playwright-core` instead and set `CHROME_PATH` to the browser's executable.

Regenerate after changing the menu's text or layout. The quality option texts are built in `player-tools.js` (`getState`), and the script keeps its own copy, so update it as well. Check the images before uploading them.
