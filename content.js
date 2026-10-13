// player-tools.js sets ENABLED on <html> while the gradient setting is on. This script
// only marks gradients; content.css hides them while ENABLED is there, so turning the
// setting off brings Apple's gradient back without undoing anything.
const ENABLED = "data-player-tweaks-hide-gradient";
const MARKER = "data-player-tweaks-gradient";

function isLikelyOverlayGradient(node) {
  if (!(node instanceof Element)) {
    return false;
  }

  const style = getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  const className = typeof node.className === "string" ? node.className : "";
  const backgroundImage = style.backgroundImage || "";
  const areaLooksLikeOverlay =
    rect.width >= window.innerWidth * 0.7 &&
    rect.height >= Math.max(120, window.innerHeight * 0.18);
  const isNearViewportEdge = rect.top <= 8 || rect.bottom >= window.innerHeight - 8;
  const hasDarkGradient =
    backgroundImage.includes("linear-gradient") &&
    /rgba?\(\s*0,\s*0,\s*0/i.test(backgroundImage);
  const hasScrimHint =
    className.includes("scrim") ||
    node.closest('[class*="video-player"]') ||
    node.closest("dialog");

  return areaLooksLikeOverlay && isNearViewportEdge && hasDarkGradient && hasScrimHint;
}

function mark(node) {
  if (!node.hasAttribute(MARKER)) {
    node.setAttribute(MARKER, "");
  }
}

function scanNode(root) {
  if (!document.documentElement.hasAttribute(ENABLED) || !(root instanceof Element || root instanceof Document)) {
    return;
  }

  if (root instanceof Element && isLikelyOverlayGradient(root)) {
    mark(root);
  }

  const nodes = root.querySelectorAll ? root.querySelectorAll("*") : [];
  for (const node of nodes) {
    if (isLikelyOverlayGradient(node)) {
      mark(node);
    }
  }
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.target instanceof Element) {
      scanNode(mutation.target);
    }

    for (const node of mutation.addedNodes) {
      scanNode(node);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["class", "style", ENABLED]
});

scanNode(document);
window.addEventListener("mousemove", () => scanNode(document), { passive: true });
window.addEventListener("resize", () => scanNode(document), { passive: true });
