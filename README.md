# Player Tweaks for Apple TV

<img src="icons/icon-128.png" alt="Extension icon: three sliders with a plus badge" width="96" height="96">

Chrome extension for the Apple TV web player (tv.apple.com): live sports, movies and series.

- Removes the dark gradient that covers the video when the mouse moves.
- **Quality:** starts at the highest quality and keeps it pinned, or choose Auto or a specific resolution.
- **Subtitles:** blocks the ones Apple turns on by itself and remembers whether you want them on or off. Apple turns them on when you mute, when you skip back 10 seconds, or when the audio language differs from the interface.
- **Playback info overlay:** quality, dropped frames, buffer, measured bandwidth, live delay, CDN and more.
- **Settings button:** inside Apple's control bar, with the same settings in the extension's toolbar popup.

Settings are stored in tv.apple.com's `localStorage` under `player-tweaks:settings`.

## Installation

From a release:

1. Download `player-tweaks-for-apple-tv-VERSION.zip` from the repository's **Releases** page.
2. Extract it.
3. Open `chrome://extensions` and turn on **Developer mode**.
4. Click **Load unpacked** and choose the extracted `player-tweaks-for-apple-tv` folder.
5. Reload the tv.apple.com tab.

To update, extract a newer zip over the same folder and click the extension's reload button.

From the source, follow the same steps but choose the repository folder in step 4.

## Packaging and releases

```sh
python3 scripts/package.py
```

This builds two zips in `dist/`: one for manual installation and one with `manifest.json` at the root for the Chrome Web Store. Pushing a `vVERSION` tag makes GitHub Actions publish a release with the installation zip. See [docs/publishing.md](docs/publishing.md).

## Files

| File | Purpose |
| --- | --- |
| `content.js`, `content.css` | Remove the player's dark gradient. |
| `player-tools.js` | Runs in the page: quality, subtitles, the button in Apple's control bar and the overlay. |
| `ui-controls.js` | Settings controls shared by the in-player menu and the popup. |
| `bridge.js` | Connects the popup to the page. |
| `popup.html`, `popup.js`, `popup.css` | Toolbar popup. |
| `icons/` | Extension icons and their SVG sources; see [icons/ORIGIN.md](icons/ORIGIN.md). |
| `tools/dump-player.js` | Console snippet that dumps the live player's HTML and CSS. |
| `scripts/package.py` | Builds the zips. |
| `.github/workflows/release.yml` | Publishes a GitHub release for each version tag. |
| `LICENSE`, `THIRD_PARTY_NOTICES.md`, `PRIVACY.md` | License, third-party credits and privacy policy. |

## Documentation

- [docs/troubleshooting.md](docs/troubleshooting.md): the highest quality Apple serves, and dropped frames caused by software video decoding.
- [docs/apple-player-internals.md](docs/apple-player-internals.md): what the extension relies on inside Apple's web player, when it was verified, and how to check it again.
- [docs/compliance.md](docs/compliance.md): trademarks, licenses, Apple's terms, privacy and store policies, with the review log. Reviews follow [docs/compliance-review-prompt.md](docs/compliance-review-prompt.md).
- [docs/publishing.md](docs/publishing.md): releases, making the repository public, and the Chrome Web Store.

## Disclaimer

Player Tweaks for Apple TV is an independent project. It is not affiliated with, authorized, sponsored or approved by Apple Inc. Apple and Apple TV are trademarks of Apple Inc. They are used here only to say which website the extension works with.

What the extension does and does not do:

- It changes how the tv.apple.com web player behaves in your own browser: the overlay, the quality choice, subtitles and a playback information overlay.
- It does not bypass DRM, HDCP, region checks, logins or subscriptions, and it does not download or record video. It only chooses among the stream qualities Apple's player already offers your account.
- It contains no code, icons or other artwork from Apple.
- It collects no data and sends nothing anywhere. See [PRIVACY.md](PRIVACY.md).

Apple's Media Services Terms say you may not "modify or use modified versions" of Apple's software. Using this extension may conflict with those terms, and Apple can change its player at any time, which can break the extension. Use it at your own risk.

The software is provided "as is", without warranty of any kind, as stated in the [license](LICENSE). The steps taken to respect Apple's rights, store policies and licenses are recorded in [docs/compliance.md](docs/compliance.md).

## License

[MIT](LICENSE). Third-party material and its licenses are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
