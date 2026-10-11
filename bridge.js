// Relays toolbar popup requests to player-tools.js in the page world, which owns the
// settings (in the page's localStorage) and the player state.
const pending = new Map();
let nextId = 0;

document.addEventListener("player-tweaks:response", (event) => {
  let response;
  try {
    response = JSON.parse(event.detail);
  } catch {
    return;
  }
  pending.get(response.id)?.(response.payload);
  pending.delete(response.id);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const id = ++nextId;
  const timer = setTimeout(() => {
    pending.delete(id);
    sendResponse({ error: "timeout" });
  }, 1500);
  pending.set(id, (payload) => {
    clearTimeout(timer);
    sendResponse(payload);
  });
  document.dispatchEvent(new CustomEvent("player-tweaks:request", { detail: JSON.stringify({ id, message }) }));
  return true;
});
