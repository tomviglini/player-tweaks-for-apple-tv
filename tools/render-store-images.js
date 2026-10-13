// Renders the Chrome Web Store images into docs/store/; see docs/store/README.md.
// - screenshot-1280x800.png: the extension's real settings menu (ui-controls.js) on a neutral
//   background, with sample stream values from docs/apple-player-internals.md;
// - promo-small-440x280.png: the icon and the name;
// - store-icon-128.png: icons/icon.svg with the padding the store recommends.
// Nothing from Apple is drawn.
//
// Usage, from the repository root:
//   npm install --no-save playwright && npx playwright install chromium
//   node tools/render-store-images.js
// With playwright-core and an existing Chromium instead, set CHROME_PATH to its executable.
const fs = require("fs");
const path = require("path");

function loadChromium() {
  for (const name of ["playwright", "playwright-core"]) {
    try {
      return require(name).chromium;
    } catch {}
  }
  throw new Error("Install Playwright first: npm install --no-save playwright");
}

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs/store");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const iconSvg = read("icons/icon.svg");
const FONT = '"Liberation Sans", Arial, sans-serif';

// Variants from the observed MLS stream: height, frame rate, bitrate.
const LEVELS = [[1080, 60, 8.1e6], [1080, 60, 6.3e6], [1080, 30, 5.1e6], [720, 30, 4.2e6], [720, 30, 3.3e6], [576, 30, 2.6e6], [480, 30, 2.2e6]]
  .map(([height, frameRate, bitrate]) => ({ height, frameRate, bitrate }));

const screenshotHtml = `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1280px; height: 800px; overflow: hidden; }
  body { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; padding: 0 110px 0 96px;
    background: radial-gradient(900px 700px at 78% 50%, #14463f 0%, #0f2a27 45%, #111416 100%); font-family: ${FONT}; color: #fff; }
  .intro { width: 640px; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand svg { width: 96px; height: 96px; flex: none; }
  h1 { margin: 0; font-size: 54px; line-height: 1.05; font-weight: 700; letter-spacing: -0.5px; }
  .for { margin-top: 6px; font-size: 24px; color: rgba(255,255,255,.62); }
  ul { margin: 48px 0 0; padding: 0; list-style: none; display: grid; gap: 20px; font-size: 27px; line-height: 1.25; color: rgba(255,255,255,.9); }
  li { display: flex; gap: 14px; }
  li::before { content: ""; flex: none; width: 10px; height: 10px; margin-top: 12px; border-radius: 50%; background: #2fd3bb; }
  .menu { zoom: 1.32; width: 240px; padding-bottom: 6px; border-radius: 8px; background: rgba(40,40,40,.94);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.16), 0 18px 60px rgba(0,0,0,.55); }
</style>
<div class="intro">
  <div class="brand">${iconSvg}<div><h1>Player Tweaks</h1><div class="for">for Apple TV</div></div></div>
  <ul>
    <li>Starts at the highest quality and keeps it</li>
    <li>Stops subtitles from turning on by themselves</li>
    <li>Hides the dark gradient over the video</li>
    <li>Shows live playback info</li>
  </ul>
</div>
<div class="menu" id="menu"></div>`;

const promoHtml = `<!doctype html><meta charset="utf-8">
<style>
  html, body { margin: 0; width: 440px; height: 280px; overflow: hidden; }
  body { display: flex; align-items: center; gap: 22px; box-sizing: border-box; padding: 0 30px;
    background: linear-gradient(135deg, #0b6f62 0%, #0f9d8a 55%, #22b7a1 100%); font-family: ${FONT}; color: #fff; }
  svg { width: 132px; height: 132px; flex: none; filter: drop-shadow(0 6px 14px rgba(0,0,0,.28)); }
  h1 { margin: 0; font-size: 44px; line-height: 1.02; font-weight: 700; letter-spacing: -0.5px; }
  .for { margin-top: 8px; font-size: 19px; color: rgba(255,255,255,.78); }
</style>
${iconSvg}<div><h1>Player<br>Tweaks</h1><div class="for">for Apple TV</div></div>`;

// The menu as it looks during playback with the default settings. The quality option texts
// are built in player-tools.js (getState), so keep these in sync with it.
function renderMenu(levels) {
  const UI = window.PlayerTweaksUI;
  document.adoptedStyleSheets = [UI.createStyleSheet()];
  const top = levels[0];
  const state = {
    hasPlayer: true,
    current: `${UI.qualityLabel(top)} · ${UI.formatMbps(top.bitrate)}`,
    subtitlesAvailable: true,
    subtitlesLabel: null,
    settings: UI.mergeSettings(UI.DEFAULT_SETTINGS),
    qualityOptions: [
      { key: "auto", label: "Auto (Apple default)", hint: "Apple picks it for your connection. Starts lower and climbs.", value: { mode: "auto" }, selected: false },
      {
        key: "max",
        label: "Highest available",
        hint: `Locks ${UI.qualityLabel(top)} · ${UI.formatMbps(top.bitrate)}. Never drops; may buffer.`,
        value: { mode: "max" },
        selected: true
      },
      ...levels.map((level, index) => ({
        key: `level-${index}`,
        label: `${UI.qualityLabel(level)} · ${UI.formatMbps(level.bitrate)}`,
        value: { mode: "fixed", ...level },
        selected: false,
        playing: index === 0
      }))
    ]
  };
  UI.createSettingsUI(document.getElementById("menu"), { context: "panel", onChange() {} }).update(state);
}

(async () => {
  const browser = await loadChromium().launch({ executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(screenshotHtml);
  await page.addScriptTag({ content: read("ui-controls.js") });
  await page.evaluate(renderMenu, LEVELS);
  await page.screenshot({ path: path.join(OUT, "screenshot-1280x800.png") });

  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(promoHtml);
  await page.screenshot({ path: path.join(OUT, "promo-small-440x280.png") });

  // The store recommends 96x96 artwork with 16px of transparent padding. The badge makes the
  // artwork irregular, so it gets 100px with 14px of padding.
  await page.setViewportSize({ width: 128, height: 128 });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{position:absolute;left:14px;top:14px;width:100px;height:100px}</style>` +
      iconSvg.replace('viewBox="0 0 128 128"', 'viewBox="6 6 119 119"')
  );
  await page.screenshot({ path: path.join(OUT, "store-icon-128.png"), omitBackground: true });

  await browser.close();
  console.log(`Rendered the store images into ${path.relative(ROOT, OUT)}/.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
