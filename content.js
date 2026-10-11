const MARKER = "data-player-tweaks";

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

function neutralize(node) {
  if (node.hasAttribute(MARKER)) {
    return;
  }

  node.setAttribute(MARKER, "true");
  node.style.setProperty("opacity", "0", "important");
  node.style.setProperty("background", "transparent", "important");
  node.style.setProperty("background-image", "none", "important");
  node.style.setProperty("pointer-events", "none", "important");
}

function scanNode(root) {
  if (!(root instanceof Element || root instanceof Document)) {
    return;
  }

  if (root instanceof Element && isLikelyOverlayGradient(root)) {
    neutralize(root);
  }

  const nodes = root.querySelectorAll ? root.querySelectorAll("*") : [];
  for (const node of nodes) {
    if (isLikelyOverlayGradient(node)) {
      neutralize(node);
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
  attributeFilter: ["class", "style"]
});

scanNode(document);
window.addEventListener("mousemove", () => scanNode(document), { passive: true });
window.addEventListener("resize", () => scanNode(document), { passive: true });
