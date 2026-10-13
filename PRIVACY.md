# Privacy policy

Last updated: 2026-10-12.

## Purpose

The extension changes how the tv.apple.com web player behaves in your browser:

- it can hide the dark gradient over the video;
- it controls stream quality;
- it handles subtitles;
- it can show playback information.

## Data processed in your browser

To work, the extension reads the following from the tv.apple.com page while a video plays:

- **Streams:** the stream qualities the player offers and the one playing.
- **Tracks:** the available subtitle and audio tracks and the selected ones.
- **Playback statistics:** frame rate, dropped frames, buffered time, measured bandwidth, startup time, quality switches, stalls, errors, live delay, the CDN in use, and the IP address of the video server from the player's own log.
- **Subtitle language:** the last subtitle language you picked in Apple's player, and your browser's language, to choose a subtitle language.
- **Mouse and keyboard:** mouse movement, clicks and the Escape key on the page, only to show the extension's button, close its menu and look for the dark gradient again. None of it is recorded.

This information is used only on the spot, to apply your settings and to show it in the extension's menu, popup and on-screen overlay. It is not saved, except for the settings below.

The extension does not read your Apple Account, payment details, viewing history or what you watch.

## Data stored

The extension stores only its own settings, in tv.apple.com's `localStorage` under the key `player-tweaks:settings`:

- whether the dark gradient is hidden;
- the quality choice;
- the subtitle preferences;
- the overlay preferences;
- whether the button appears in the player.

These settings contain no personal information. They stay in that browser profile and are not synced to other devices.

## Transmission and sharing

The extension sends nothing to any server:

- it has no analytics;
- it loads no remote code;
- it calls no external service.

The developer receives no data. The toolbar popup talks to the tv.apple.com tab only through Chrome's local extension messaging.

The settings live in tv.apple.com's storage, so scripts run by that site can read them. Your use of tv.apple.com itself is governed by Apple's own policies.

## Limited use

The data is used only to provide the features described above, and never for advertising, profiling or any unrelated purpose. This follows the [Chrome Web Store user data policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including its limited use requirements.

## Permissions

The extension requests no Chrome permissions. Its scripts run only on `https://tv.apple.com/*`.

## Deleting your data

To remove the settings, clear tv.apple.com's site data in Chrome. Uninstalling the extension does not remove them by itself.

## Contact

Use the project's [GitHub repository](https://github.com/tomviglini/player-tweaks-for-apple-tv).
