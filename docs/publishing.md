# Publishing

How releases are made, and what to do before making the repository public or publishing on the Chrome Web Store.

As of 2026-10-11:

- the repository is private;
- releases are built by GitHub Actions;
- the extension is not in the Chrome Web Store.

The legal requirements and their status live in [compliance.md](compliance.md). Run the [compliance review](compliance-review-prompt.md) before each step below.

## GitHub releases

`python3 scripts/package.py` builds two zips in `dist/` from the files the extension needs, plus `LICENSE` and `THIRD_PARTY_NOTICES.md`:

| Zip | Contents | Use |
| --- | --- | --- |
| `player-tweaks-for-apple-tv-VERSION.zip` | An `player-tweaks-for-apple-tv/` folder | Manual installation. |
| `player-tweaks-for-apple-tv-VERSION-chrome-web-store.zip` | `manifest.json` at the root | Uploading to the store. |

The entries use maximum compression and fixed metadata, so the same sources always produce identical zips.

### Publish a release

1. Bump `version` in `manifest.json`, commit and push.
2. Tag the commit with the same version and push the tag:

   ```sh
   git tag -a v0.1.0 -m "Player Tweaks for Apple TV 0.1.0"
   git push origin v0.1.0
   ```

   [`.github/workflows/release.yml`](../.github/workflows/release.yml) then:

   1. checks out the tag and refuses to continue if the tag does not match the manifest version;
   2. builds the zips;
   3. creates the release, or updates it if it already exists, with the manual-installation zip and [`.github/RELEASE_NOTES.md`](../.github/RELEASE_NOTES.md) as its notes;
   4. downloads the zip again to check that it matches;
   5. records the outcome in a Git note under `refs/notes/releases`, without touching any branch.
3. Check the outcome over SSH, without `gh`:

   ```sh
   git fetch origin refs/notes/releases:refs/notes/releases
   git --no-pager notes --ref=releases show 'v0.1.0^{commit}'
   ```

To publish or refresh the release of an existing tag by hand:

1. Open **Actions → Publish release**.
2. Click **Run workflow** and enter the tag.

GitHub Actions must be enabled on the repository. While the repository is private, private repositories use the account's Actions minutes, and only people with access can download the release.

## Making the repository public

- **Compliance:** close the open items in [compliance.md](compliance.md), above all the product name.
- **Tests:** the end-to-end harness in `.dev/` stays local. Its mock contains Apple's markup, CSS and icons. Publishing tests needs a mock with placeholder icons and our own CSS, and a portable setup instead of the cached Chromium path.
- **Personal details:** keep the owner's name, email, machine and other projects out of tracked files. The GitHub handle stays, because it is part of every repository URL, and commits keep the owner's own Git identity.
- **Links:** the links in the release notes and in [PRIVACY.md](../PRIVACY.md) only open for everyone once the repository is public.

## Chrome Web Store

1. **Account:** register in the [developer dashboard](https://chrome.google.com/webstore/devconsole). Registration has a one-time fee.
2. **Package:** upload `dist/player-tweaks-for-apple-tv-VERSION-chrome-web-store.zip`.
3. **Listing:**
   - **Name:** the new product name (see [compliance.md](compliance.md#trademarks)).
   - **Description:** one purpose, improving the tv.apple.com web player, with the features as parts of it. End it with the disclaimer from the [README](../README.md#disclaimer).
   - **Icon:** `icons/icon-128.png`.
   - **Screenshots:** no frames of Apple's movies, series or matches; use a neutral or blurred video area.
   - **Homepage, support and privacy policy URLs:** the repository, its issues, and `PRIVACY.md`. They need the repository to be public.
4. **Privacy form:** declare what [PRIVACY.md](../PRIVACY.md) says. Local processing of website content still has to be declared, even though nothing is sent.
5. **Review notes:** explain the scripts that run in the page's MAIN world:
   - they patch `Storage.prototype.getItem`, so reads of Apple's hls.js config key and of its three auto-subtitle preferences return the extension's values;
   - they add an accessor for the page's `window.hlsSession` to pin quality and manage subtitles;
   - they send nothing anywhere and load no remote code.
6. **Distribution:** choose public or unlisted. Both are reviewed.
7. **Updates:** bump the version, build, and upload the new store zip as an update of the same item.
