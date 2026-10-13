# Compliance review prompt

Run this review before every release tag, before making the repository public or publishing on the Chrome Web Store, and whenever a change adds:

- network access, data handling or permissions;
- third-party code or assets;
- new interaction with Apple's player.

Give the prompt below to an AI coding agent working in this repository, such as Claude Code or Codex, for example: "Run the compliance review in docs/compliance-review-prompt.md." The owner reviews the result before anything is committed.

## Prompt

```text
You are doing a legal compliance review of this Chrome extension for the
tv.apple.com web player. The goal is to find anything that could infringe
someone's rights, break a policy or license, or mislead users, and to record
the good-faith work done to avoid that. You are not giving legal advice. Never
state that something is legal; state what the sources say, what the code does,
and how they compare.

Ground rules
- Work from primary sources fetched live during this review, not from memory.
  Quote the exact sentence you rely on, with its URL, the date you checked it,
  and the document's own "last updated" date when it has one.
- Work from the code, not from the docs. Cite evidence as file:line, or as the
  command you ran and its output.
- Separate facts, interpretation and recommendations. When in doubt, take the
  more conservative reading and flag the item for the owner or a lawyer.
- Do not change code, assets or wording on your own. Propose changes, explain
  them, and wait for the owner. Updating docs/compliance.md with the review is
  the only edit allowed without asking.
- Do not commit or push.

1. Context
   - Read AGENTS.md, docs/compliance.md (status, open items, last review),
     PRIVACY.md, THIRD_PARTY_NOTICES.md, LICENSE, icons/ORIGIN.md and the
     README disclaimer.
   - Run `python3 scripts/package.py` and list exactly which files ship.
   - Run `git --no-pager log --oneline` and `git --no-pager diff <last
     reviewed commit>..HEAD --stat` to see what changed since the last review.

2. Sources (fetch each one and note any change since the last review)
   - Apple trademark guidelines:
     https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html
   - Apple Media Services Terms, the US version and the versions for the
     main user markets:
     https://www.apple.com/legal/internet-services/itunes/us/terms.html
   - Chrome Web Store program policies, user data FAQ and Manifest V3 rules:
     https://developer.chrome.com/docs/webstore/program-policies/policies
     https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
   - The license of every third-party asset or dependency found in step 4.

3. Trademarks
   - Product name, manifest name and description, popup text, log prefix,
     release title, zip name and repository name:
     - Apple's marks appear only in a referential phrase ("for Apple TV"),
       never first and never as part of the product name.
     - The name has no "Plus" or "+" next to "TV".
   - Icons, screenshots and listing images show no apple, fruit, Apple logo,
     Apple TV logo, Apple TV app styling or SF Symbols.
   - The disclaimer is present and accurate in the README, the release notes
     and the store listing.
   - If a new name is proposed, search existing trademarks and store listings
     for it and report what you find.

4. Copyright and third-party material
   - Search the shipped files and the tracked repository for material copied
     from Apple or anyone else: large SVG paths, base64 or data: URIs, font
     files, minified blocks, copied CSS, markup or text.
   - List every third-party asset, check its license, and confirm its required
     notice is in THIRD_PARTY_NOTICES.md and in both zips.
   - Confirm that .dev/, the test mock and atv-player-*.txt dumps are not
     tracked: `git ls-files`, and `git log --all --name-only` for history.
   - Confirm docs/apple-player-internals.md describes Apple's player in its own
     words and pastes no Apple code.

5. Apple's terms, DRM and access controls
   - Confirm the extension does not tamper with or circumvent DRM, HDCP,
     region checks, logins, subscriptions or payments, and does not download,
     record or capture video.
   - Confirm quality selection only picks from hlsSession.levels and does not
     touch resolutionLimits or HDCP handling.
   - For each feature added since the last review, say how it relates to the
     terms' "may not modify or use modified versions of such software" clause,
     and whether the disclosure still covers it.

6. Privacy and store policies
   - Search the shipped code for network and storage APIs: fetch,
     XMLHttpRequest, sendBeacon, WebSocket, EventSource, import(, eval,
     new Function, chrome.storage, cookies, indexedDB and localStorage.
     Compare every hit with PRIVACY.md.
   - Check manifest permissions and host permissions. Each one must be needed
     and explained.
   - Confirm there is no remote code, that the single purpose still holds, and
     that the listing texts, privacy answers and test instructions in
     docs/store/README.md still match the code and PRIVACY.md.

7. Licenses and packaging
   - LICENSE and THIRD_PARTY_NOTICES.md exist and are inside both zips.
   - The packaging script still refuses to build without them.

8. Report
   - Update docs/compliance.md:
     - the status table and the affected sections;
     - the open items;
     - the sources table, with dates and versions;
     - a new dated entry at the top of the review log:
       - when nothing is found, one line with the date, the version, the
         commit or tag reviewed and the reviewers (the owner, plus the AI tool and
         model), saying the sources are unchanged;
       - otherwise, a full entry naming the reviewers, the commit reviewed,
         the scope, each finding with evidence and the action taken or
         proposed, and what was not checked.
   - Then summarize for the owner, most important first:
     - anything blocking a release or publication;
     - proposed changes, with the exact wording;
     - questions only the owner or a lawyer can answer.
```
