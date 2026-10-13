# Legal compliance

This project tries in good faith to respect:

- Apple's rights and terms;
- the Chrome Web Store policies;
- the licenses of everything it uses.

This file records the rules that apply, what the project does about each one, what is still open, and every review. Reviews follow [compliance-review-prompt.md](compliance-review-prompt.md) and are logged at the end of this file.

Reviews are done by the owner with the help of an AI assistant. They are a careful, good-faith check against the official sources quoted here, not a legal opinion. If the extension is monetized or Apple objects to it, get a lawyer's advice.

## Status

As of 2026-10-12:

| Area | Status | Summary |
| --- | --- | --- |
| [Trademarks](#trademarks) | Done | The product is "Player Tweaks for Apple TV", and the repository is `player-tweaks-for-apple-tv`. The icon and disclaimer are done. |
| [Copyright and third-party material](#copyright-and-third-party-material) | Done | No Apple code, icons, fonts or images ship. The Lucide gear is credited. |
| [Apple's terms](#apples-terms) | Risk disclosed | Changing Apple's web player likely counts as using a modified version of Apple's software. Users are warned. |
| [DRM and access controls](#drm-and-access-controls) | Done | Nothing is bypassed, downloaded or recorded. |
| [Privacy](#privacy) | Done | Nothing is sent anywhere. [PRIVACY.md](../PRIVACY.md) matches the code. |
| [Chrome Web Store policies](#chrome-web-store-policies) | Done | No permissions, no remote code, single purpose. |
| [Licenses](#licenses) | Done | MIT [LICENSE](../LICENSE) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) ship in both zips. |

## Trademarks

Apple's [trademark guidelines](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html) say:

- a third party may not use an Apple trademark "as or as part of a company name, trade name, product name, or service name";
- "You may not use an image of a real apple or other variation of the Apple logo for any purpose";
- third parties cannot use "a variation, phonetic equivalent, foreign language equivalent, takeoff, or abbreviation" of Apple's trademarks.

A compatible product may mention the Apple product only under three conditions:

- the Apple word mark is not part of the product name;
- it appears in a referential phrase such as "for" or "compatible with";
- it is less prominent than the product name.

What the project does:

- **Icon:** original sliders with a plus badge, drawn from scratch. An earlier apple icon was replaced on 2026-10-11 because of the apple rule; see [icons/ORIGIN.md](../icons/ORIGIN.md).
- **Disclaimer:** the README and the release notes state that the project is not affiliated with, authorized, sponsored or approved by Apple Inc., and that Apple and Apple TV are Apple's trademarks. The wording follows the guidelines.
- **Mentions:** Apple's names appear only to say which website the extension works with.

**Product name:** "Player Tweaks for Apple TV", chosen on 2026-10-11 to replace "Apple TV Overlay Cleaner", which put the mark first and inside the name.

- The name is our own, "Player Tweaks", and Apple TV appears only in the referential phrase "for Apple TV". Where the text can be styled, such as store images or a logo, keep "for Apple TV" smaller or plainer than "Player Tweaks".
- It has no "Plus" or "+" next to "TV". The service was called Apple TV+ until October 2025, so that would read as a takeoff.
- It is used in `manifest.json`, the popup, the console log prefix, the README, the release notes and title, and the zip names.
- Internal identifiers use the new name too: the settings key, the page global, element ids and events. Settings saved under the old `atv-cleaner:settings` key were not migrated.

- The GitHub repository was renamed from `apple-tv-chrome-extension`, which started with the mark, to `player-tweaks-for-apple-tv`.

**Open:** search the new name for existing trademarks and store listings before publishing.

## Copyright and third-party material

- **Apple material:** the shipped files contain no code, markup, icons, fonts or images from Apple.
  - The UI names Apple's system font (`SF Pro`) in a CSS font stack but does not bundle it.
  - To blend in, the menu reuses a handful of numeric style values read from Apple's menu: sizes, spacing, colors and blur. Apple's stylesheets are not copied.
- **Gear icon:** Lucide's `settings` icon, under the ISC License. The license requires the notice in every copy, so it is in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). `scripts/package.py` refuses to build without that file.
- **Extension icons:** original; see [icons/ORIGIN.md](../icons/ORIGIN.md).
- **Player notes:** [apple-player-internals.md](apple-player-internals.md) describes Apple's player in our own words, for interoperability, without copying Apple's code.
- **Local-only material:** the end-to-end test mock (`.dev/mock.html`) and player dumps (`atv-player-*.txt`) contain Apple's markup, CSS and icons, so they stay out of git through `.gitignore`. On 2026-10-11 the history was squashed into one commit, and it contains neither.
- **Screenshots:** release and store screenshots must not show frames of Apple's movies, series or matches.

## Apple's terms

The [Apple Media Services Terms](https://www.apple.com/legal/internet-services/itunes/us/terms.html) contain two relevant rules under "Services and Content Usage Rules". They were checked in the US version and the [Argentine version](https://www.apple.com/legal/internet-services/itunes/ar/terms.html), both updated 2026-09-14, which say the same:

> You may not tamper with or circumvent any security technology included with the Services or Content.

> You may access our Services only using Apple's software, and may not modify or use modified versions of such software.

The first rule is respected; see [DRM and access controls](#drm-and-access-controls).

The second rule is a real, accepted risk. The extension changes how Apple's web player behaves in the user's browser:

- it sets hls.js config overrides; in Auto, only the flag that lets the user lock a quality;
- it patches storage reads;
- it adds a button to Apple's control bar;
- it hides the player's dark gradient, unless the user turns that off.

A reasonable reading is that this counts as using a modified version of Apple's software. No change short of dropping those features removes that risk.

The terms bind users, and on a violation Apple "may, without notice to you: (i) terminate this Agreement and/or your Apple Account". Possible outcomes, from most to least likely:

1. **Apple changes its player and the extension breaks.** It could also stop honoring `mk-hlsjs-config-overrides` in production builds.
2. **Apple asks Google to remove the listing.** Fixing the name removes the easy trademark case.
3. **Apple sends a cease-and-desist letter.** This is more likely if the extension is popular, paid, or uses Apple's branding.
4. **Apple acts on user accounts.** The terms allow it, though it is unlikely for interface and quality tweaks.

Measures:

- **Disclosure:** the README and the release notes state the terms conflict and ask users to use the extension at their own risk.
- **Price:** the extension is free, with no ads.
- **Scope:** it changes only what the user sees and chooses in their own browser.

## DRM and access controls

The extension does not:

- tamper with or circumvent DRM, HDCP, region checks, logins, subscriptions or payments;
- download, record or capture video;
- unlock content the user's account does not include.

The quality feature only chooses among the variants Apple's player already accepts (`hlsSession.levels`). It does not touch `resolutionLimits`, which caps resolution by HDCP class.

These limits are a rule in [AGENTS.md](../AGENTS.md). They also keep the project inside the store's ban on facilitating "unauthorized access, download, or streaming of copyrighted content or media". Any feature that crosses them would need a new review, and should not be built.

## Privacy

- **What it does with data:** the extension reads player state and playback statistics on tv.apple.com and uses them locally. It stores only its own settings, under `player-tweaks:settings` in tv.apple.com's `localStorage`.
- **Network:** the shipped code makes no network requests. There is no `fetch`, XHR, `sendBeacon`, WebSocket or remote script.
- **Permissions and analytics:** it requests no Chrome permissions and has no analytics.
- **Policy:** [PRIVACY.md](../PRIVACY.md) describes exactly this. Update it whenever the code starts reading, storing or sending anything new.

## Chrome Web Store policies

From the [program policies](https://developer.chrome.com/docs/webstore/program-policies/policies):

| Policy | Quote | How the project complies |
| --- | --- | --- |
| Impersonation and intellectual property | "Don't pretend to be someone else" and "Don't infringe on the intellectual property rights of others" | Disclaimer, original icon, and a product name of our own. |
| Malicious and prohibited products | "Do not facilitate unauthorized access to content on websites, such as circumventing paywalls or login restrictions" | See [DRM and access controls](#drm-and-access-controls). |
| Privacy | "If your Product handles any user data, then you must post an accurate and up to date privacy policy" | [PRIVACY.md](../PRIVACY.md). |
| Quality | "An extension must have a single purpose that is narrow and easy to understand" | The listing describes one purpose, improving the tv.apple.com web player, with the features as parts of it. |
| Manifest V3 | "Execution of logic from a remote source is permissible only when accomplished through a documented API" | No remote code. All logic ships in the package. |

The scripts that run in the page's MAIN world are unusual, so they are explained in the store's review notes; see [publishing.md](publishing.md).

## Licenses

- **Own code:** MIT, in [LICENSE](../LICENSE).
- **Third-party material:** listed with full license texts in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
- **Packages:** both zips include both files, and the packaging script checks that.

## Disclaimer

The disclaimer is in the [README](../README.md#disclaimer) and the release notes. It states facts that can be checked against the code:

- no affiliation with Apple, plus the trademark attribution;
- what the extension does and does not do;
- no data collection;
- the conflict with Apple's terms;
- no warranty.

It deliberately avoids:

- **Broad legal claims** such as "this extension infringes nothing". A self-declaration has no legal effect, and an absolute claim that later proves wrong costs credibility.
- **Saying an AI confirmed it is legal.** That would overstate what an AI-assisted review is. This file records the review work instead.

## Open items

- [ ] Search "Player Tweaks for Apple TV" for existing trademarks and store listings before publishing.
- [ ] If tests are published, rebuild the mock without Apple's markup, CSS or icons.
- [ ] Get a lawyer's opinion if the extension is monetized or Apple objects.

## Sources

| Source | Checked | Version |
| --- | --- | --- |
| [Apple: Guidelines for Using Apple Trademarks and Copyrights](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html) | 2026-10-12 | no date shown; © 2026 |
| [Apple Media Services Terms (US)](https://www.apple.com/legal/internet-services/itunes/us/terms.html) | 2026-10-12 | updated 2026-09-14 |
| [Apple Media Services Terms (Argentina)](https://www.apple.com/legal/internet-services/itunes/ar/terms.html) | 2026-10-12 | updated 2026-09-14 |
| [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/policies) | 2026-10-12 | page updated 2025-05-22 |
| [Chrome Web Store user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) | 2026-10-12 | page footer 2016-04-23 |
| [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | 2026-10-12 | ISC, © 2026 Lucide Icons and Contributors |
| Coverage of the Apple TV+ to Apple TV rename, for example [Advanced Television](https://www.advanced-television.com/2025/10/14/apple-tv-drops-the/) | 2026-10-11 | October 2025 |

## Review log

- **2026-10-12, 0.2.0 (tag `v0.2.0`):** no findings; sources unchanged. Added the gradient switch and Auto to the list under [Apple's terms](#apples-terms). Reviewed by the owner with Claude (Opus 5.5) in Claude Code.

### 2026-10-11: initial review

- **Reviewers:** the owner, with Claude, Anthropic's AI assistant in Claude Code.
- **Scope:**
  - the shipped files (the zip contents) and the repository documents;
  - the icons, the release notes and the git history;
  - Apple's trademark guidelines and media services terms (US and Argentina);
  - the Chrome Web Store policies and the Lucide license.
- **Findings and actions:**
  - The apple icon broke Apple's apple-image rule. It was replaced with original sliders.
  - The repository had no license. MIT was added and is included in the zips.
  - The Lucide gear lacked its ISC notice. [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) was added and is included in the zips.
  - There was no privacy policy. [PRIVACY.md](../PRIVACY.md) was added, written from the code.
  - There was no disclaimer. It was added to the README and the release notes.
  - A store zip with `manifest.json` at the root was added.
  - Git history: checked; no Apple material.
  - Apple's terms: the modification clause is an accepted, disclosed risk.
  - The product name put the mark first. It was renamed to "Player Tweaks for Apple TV".
  - The repository name started with the mark. It was renamed to `player-tweaks-for-apple-tv`.
- **Not done:** a trademark search for the new name, and a lawyer's opinion.
