(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const video = [...document.querySelectorAll("video")].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
  if (!video) return console.warn("No <video> found: start playback and try again.");
  const root = video.closest("dialog") || video.closest(".video-player") || document.body;
  const scrim = root.querySelector(".video-player-scrim");
  const poke = () => scrim?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
  const skip = (el) => el.id === "player-tweaks-ui" || el.id === "player-tweaks-control";
  const sheets = new Map();
  const sheetId = (css) => { if (!sheets.has(css)) sheets.set(css, `css${sheets.size + 1}`); return sheets.get(css); };
  const rulesText = (sheet) => { try { return [...sheet.cssRules].map((r) => r.cssText).join("\n"); } catch { return `/* not accessible: ${sheet.href} */`; } };

  function serialize(node, depth = 0) {
    const pad = "  ".repeat(depth);
    if (node.nodeType === 3) { const t = node.textContent.trim(); return t ? `${pad}${t.slice(0, 200)}\n` : ""; }
    if (node.nodeType !== 1 || skip(node)) return "";
    const tag = node.tagName.toLowerCase();
    if (tag === "script") return "";
    if (tag === "svg") return `${pad}${node.outerHTML.replace(/\s+/g, " ")}\n`;
    if (tag === "style") return `${pad}<style> → ${sheetId(node.textContent)}\n`;
    const attrs = [...node.attributes].map((a) => ` ${a.name}="${a.value.slice(0, 300)}"`).join("");
    let out = `${pad}<${tag}${attrs}>\n`;
    if (node.shadowRoot) {
      const adopted = [...(node.shadowRoot.adoptedStyleSheets || [])].map((s) => sheetId(rulesText(s)));
      out += `${pad}  #shadow-root${adopted.length ? ` (styles: ${adopted.join(", ")})` : ""}\n`;
      for (const child of node.shadowRoot.childNodes) out += serialize(child, depth + 2);
    }
    for (const child of node.childNodes) out += serialize(child, depth + 1);
    return out;
  }
  function deepQueryAll(selector, scope = document, found = []) {
    for (const el of scope.querySelectorAll("*")) {
      if (el.matches(selector)) found.push(el);
      if (el.shadowRoot) deepQueryAll(selector, el.shadowRoot, found);
    }
    return found;
  }

  console.log("%c[dump] Capturing… don't touch anything for a few seconds.", "font-weight:bold");
  poke(); await sleep(900); poke();
  const playerHtml = serialize(root);

  // Opens the subtitles menu to capture its structure and styles, then closes it again.
  let menuHtml = "(could not open the subtitles menu)";
  const trigger = deepQueryAll('button.contextual-menu__trigger[aria-label]').find((b) => /subt|caption/i.test(b.getAttribute("aria-label")));
  if (trigger) {
    trigger.click(); await sleep(700); poke();
    const menus = deepQueryAll(".contextual-menu, [role=menu]").filter((m) => m.getBoundingClientRect().height > 0);
    menuHtml = menus.length ? menus.map((m) => {
      const r = m.getBoundingClientRect();
      const cs = getComputedStyle(m);
      return `-- menu at x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)} · font ${cs.fontSize} ${cs.fontFamily}\n` + serialize(m);
    }).join("\n") : "(the menu did not appear)";
    trigger.click(); await sleep(300);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  }

  const pageRules = [];
  for (const sheet of document.styleSheets) {
    for (const line of rulesText(sheet).split("\n")) {
      if (/video-player|scrim|playback-view|player-tab|live-badge|video-metadata|unified-controls|volume-unified/.test(line)) pageRules.push(line);
    }
  }

  const text = [
    `== ${location.href}`,
    `== viewport ${innerWidth}x${innerHeight} · dpr ${devicePixelRatio} · ${navigator.userAgent}`,
    "\n== PLAYER HTML (controls visible)\n" + playerHtml,
    "\n== SUBTITLES MENU OPEN\n" + menuHtml,
    "\n== PAGE CSS RULES FOR THE PLAYER\n" + pageRules.join("\n"),
    "\n== COMPONENT STYLESHEETS (shadow DOM)\n" + [...sheets].map(([css, id]) => `---- ${id}\n${css}`).join("\n\n"),
  ].join("\n");

  window.__atvFullDump = text;
  try { copy(text); } catch {}
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.download = "atv-player-full-dump.txt";
  link.click();
  console.log(`%c[dump] Done: copied to the clipboard and downloaded as atv-player-full-dump.txt (${Math.round(text.length / 1024)} KB).`, "font-weight:bold;color:#30d158");
})();
