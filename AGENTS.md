# Repository Instructions

## Git

- Do not commit unless the user explicitly asks for a commit in the current request.
- Do not push unless the user explicitly asks for a push in the current request. Authorization to commit does not authorize a push, and a request from an earlier task does not carry over to later changes.
- Never force-push or rewrite pushed history unless the user asks for that exact operation.
- Review the diff before writing a commit message. Use a concise English subject that starts with a lowercase imperative verb, stays within 72 characters, has no trailing period and no Conventional Commits prefix.
- Use `git --no-pager` for Git commands that print output.

## Language

- Write everything in English: code, identifiers, comments, documentation, UI copy and commit messages.
- Match the user's language in conversation.

## Extension

- Keep it a plain Manifest V3 extension with no build step, loadable with "Load unpacked" from the repository root.
- `ui-controls.js` and `player-tools.js` run in the page's MAIN world: keep each file in an IIFE and expose nothing beyond `window.PlayerTweaksUI`.
- Never write Apple's own `localStorage` keys; patch reads instead, so disabling the extension leaves nothing behind. Store our settings only under `player-tweaks:settings`.
- Apple's player is not a public API. Before relying on a class name, event, config key or `hlsSession` property, confirm it in the live player (`tools/dump-player.js`) or Apple's current bundles, and fail safe when it is missing. Record what you verify, with the date, in `docs/apple-player-internals.md`.
- Do not present invented markup, icons or behavior as Apple's. Say which parts of a mock or screenshot are not taken from the live player.
- Do not circumvent DRM or output protection such as HDCP, and do not download, record or capture video.
- Bump `version` in `manifest.json` whenever a change is handed over to load.

## Compliance

- Never copy Apple's code, markup, icons, fonts or images into tracked files. Keep player dumps and the test mock in `.dev/` or ignored files.
- Credit every third-party asset or dependency in `THIRD_PARTY_NOTICES.md` with its license text before it ships.
- Keep `PRIVACY.md` and the README disclaimer true to what the code does. Update them in the same change that starts reading, storing or sending anything new, or that adds permissions.
- Run the review in `docs/compliance-review-prompt.md` before tagging a release, and whenever a change adds network access, data handling, permissions, third-party material or new interaction with Apple's player. Record it in `docs/compliance.md`.
