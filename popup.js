// Toolbar popup: a remote control for the settings owned by the tv.apple.com tab.
const UI = window.PlayerTweaksUI;
const controlsRoot = document.getElementById("controls");
const missing = document.getElementById("missing");
const statsSection = document.getElementById("stats-section");
const stats = document.getElementById("stats");

document.adoptedStyleSheets = [UI.createStyleSheet()];
const controls = UI.createSettingsUI(controlsRoot, {
  context: "popup",
  onChange: (patch) => request({ type: "update-settings", patch })
});

async function request(message) {
  let state = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    state = await chrome.tabs.sendMessage(tab.id, message, { frameId: 0 });
  } catch {}
  render(state);
}

function render(state) {
  const connected = Boolean(state?.settings);
  missing.hidden = connected;
  controlsRoot.hidden = !connected;
  statsSection.hidden = !connected || !state.stats.length;
  if (connected) {
    controls.update(state);
    stats.textContent = state.stats.join("\n");
  }
}

request({ type: "get-state" });
setInterval(() => request({ type: "get-state" }), 1000);
