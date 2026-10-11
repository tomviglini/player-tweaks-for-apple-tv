// Settings controls shared by the in-player panel (page world) and the toolbar popup.
// Styled after Apple TV's own dark contextual menus (amp-contextual-menu).
(() => {
  const STORAGE_KEY = "player-tweaks:settings";

  const DEFAULT_SETTINGS = {
    injectUI: true,
    quality: { mode: "max" },
    subtitles: false,
    blockAutoSubtitles: true,
    hud: {
      enabled: true,
      compact: true,
      corner: "top-left",
      fontSize: 11,
      margin: 6,
      font: "system",
      style: "box"
    }
  };

  const APPLE_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Icons", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif';

  const CORNERS = [
    { id: "top-left", label: "↖ Top left" },
    { id: "top-right", label: "↗ Top right" },
    { id: "bottom-left", label: "↙ Bottom left" },
    { id: "bottom-right", label: "↘ Bottom right" }
  ];

  const FONTS = [
    { id: "system", label: "Apple (SF Pro)", family: APPLE_FONT },
    { id: "helvetica", label: "Helvetica / Arial", family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
    { id: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif" },
    { id: "trebuchet", label: "Trebuchet", family: '"Trebuchet MS", "Segoe UI", sans-serif' },
    { id: "arial-black", label: "Arial Black", family: '"Arial Black", "Arial Bold", sans-serif' },
    { id: "impact", label: "Impact", family: 'Impact, "Arial Narrow Bold", sans-serif' },
    { id: "georgia", label: "Georgia", family: "Georgia, serif" },
    { id: "mono", label: "Monospace", family: 'Consolas, "Cascadia Mono", "Courier New", monospace' }
  ];

  function outline(color, width = "0.07em") {
    const negative = `-${width}`;
    return [
      [negative, negative], ["0", negative], [width, negative], [width, "0"],
      [width, width], ["0", width], [negative, width], [negative, "0"]
    ]
      .map(([x, y]) => `${x} ${y} 0 ${color}`)
      .join(", ");
  }

  const BOX = { padding: "0.4em 0.65em", borderRadius: "0.45em" };

  const STYLES = [
    {
      id: "subtitle",
      label: "Subtitle (white, black outline)",
      css: { color: "#fff", textShadow: `${outline("#000")}, 0 0 0.3em rgba(0,0,0,.6)` }
    },
    { id: "subtitle-yellow", label: "Subtitle yellow", css: { color: "#ffe14d", textShadow: outline("#000") } },
    { id: "outline-blue", label: "White, blue outline", css: { color: "#fff", textShadow: outline("#1f6bff") } },
    { id: "outline-orange", label: "White, orange outline", css: { color: "#fff", textShadow: outline("#ff6a00") } },
    { id: "outline-white", label: "Black, white outline", css: { color: "#111", textShadow: outline("#fff") } },
    {
      id: "neon",
      label: "Cyan neon",
      css: { color: "#e0fcff", textShadow: `${outline("#003a44", "0.05em")}, 0 0 0.25em #00e5ff, 0 0 0.6em #00e5ff` }
    },
    { id: "box", label: "Dark box", css: { color: "#fff", background: "rgba(0,0,0,.62)", ...BOX } },
    {
      id: "glass",
      label: "Glass (like Apple's menus)",
      css: {
        color: "rgba(255,255,255,.85)",
        background: "rgba(40,40,40,.7)",
        backdropFilter: "blur(60px) saturate(220%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.2)",
        ...BOX
      }
    },
    {
      id: "terminal",
      label: "Green terminal",
      css: { color: "#3dff7a", background: "rgba(0,0,0,.78)", textShadow: "0 0 0.3em rgba(61,255,122,.45)", ...BOX }
    }
  ];

  // Metrics and colors from Apple's desktop contextual menu (amp-contextual-menu), a notch
  // smaller: 28px rows instead of 32px, 12px text instead of 13px.
  const CONTROLS_CSS = `
    .tweaks { color-scheme: dark; color: rgba(255,255,255,.85); font: 12px/1.25 ${APPLE_FONT}; }
    .tweaks * { box-sizing: border-box; }
    .tweaks small { color: rgba(255,255,255,.55); font-size: 9.5px; line-height: 1.3; }
    .tweaks .now { padding: 8px 10px 6px; font-weight: 600; }
    .tweaks .status { color: rgba(255,255,255,.85); font-size: 9.5px; }
    .tweaks .status:empty { display: none; }
    .tweaks .section { border-top: 2px solid rgba(255,255,255,.1); }
    .tweaks .section-title { padding: 6px 10px 2px; color: rgba(255,255,255,.25); font-size: 11px; line-height: 1.27; font-weight: 600; }
    .tweaks .option, .tweaks summary { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 28px; padding: 3px 10px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; list-style: none; }
    .tweaks summary::-webkit-details-marker { display: none; }
    .tweaks .option + .option, .tweaks .row + .row, .tweaks details > div > .option + .option { border-top: .5px solid rgba(255,255,255,.1); }
    .tweaks .option:hover, .tweaks summary:hover, .tweaks .row:hover { background: rgba(170,170,170,.2); }
    .tweaks .check { width: 12px; flex: none; font-weight: 600; }
    .tweaks .label { flex: 1; display: grid; gap: 2px; }
    .tweaks .tag { flex: none; color: #32d74b; font-size: 10px; }
    .tweaks .chevron { flex: none; color: rgba(255,255,255,.55); transition: transform .15s; }
    .tweaks details[open] > summary .chevron { transform: rotate(90deg); }
    .tweaks details .option { padding-left: 28px; }
    .tweaks .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 28px; padding: 4px 10px; cursor: pointer; }
    .tweaks .row .text { display: grid; gap: 2px; }
    .tweaks input.switch { appearance: none; position: relative; flex: none; width: 26px; height: 16px; margin: 0; border-radius: 8px; background: rgba(255,255,255,.25); cursor: pointer; transition: background .15s; }
    .tweaks input.switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.35); transition: transform .15s; }
    .tweaks input.switch:checked { background: #32d74b; }
    .tweaks input.switch:checked::after { transform: translateX(10px); }
    .tweaks .group-body { display: grid; gap: 8px; padding: 4px 10px 8px; font-size: 11px; }
    .tweaks .field { display: grid; gap: 4px; }
    .tweaks .field-head { display: flex; justify-content: space-between; }
    .tweaks output { color: rgba(255,255,255,.55); font-variant-numeric: tabular-nums; }
    .tweaks input[type=range] { width: 100%; height: 14px; margin: 0; accent-color: #0a84ff; }
    .tweaks select { width: 100%; padding: 3px 6px; border: .5px solid rgba(255,255,255,.18); border-radius: 5px; background: rgba(255,255,255,.08); color: inherit; font: inherit; }
    .tweaks select option { background: #282828; }
    .tweaks .corners { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .tweaks .corner { padding: 4px; border: .5px solid rgba(255,255,255,.18); border-radius: 5px; background: rgba(255,255,255,.04); color: inherit; font: inherit; cursor: pointer; }
    .tweaks .corner:hover { background: rgba(170,170,170,.2); }
    .tweaks .corner.selected { border-color: rgba(255,255,255,.7); background: rgba(255,255,255,.14); }
  `;

  function mergeSettings(base, patch) {
    const source = patch && typeof patch === "object" ? patch : {};
    return {
      ...base,
      ...source,
      quality: source.quality && typeof source.quality === "object" ? { ...source.quality } : { ...base.quality },
      hud: { ...base.hud, ...(source.hud && typeof source.hud === "object" ? source.hud : {}) }
    };
  }

  function qualityLabel(level) {
    if (!level || !level.height) {
      return "—";
    }
    return `${level.height}p${level.frameRate ? Math.round(level.frameRate) : ""}`;
  }

  function formatMbps(bitsPerSecond) {
    return Number.isFinite(bitsPerSecond) ? `${(bitsPerSecond / 1e6).toFixed(1)} Mbps` : "—";
  }

  // Font, size and colors only; callers position the element themselves.
  function applyHudLook(element, hud) {
    const font = FONTS.find((item) => item.id === hud.font) || FONTS[0];
    const style = STYLES.find((item) => item.id === hud.style) || STYLES[0];
    element.removeAttribute("style");
    Object.assign(
      element.style,
      { fontFamily: font.family, fontSize: `${hud.fontSize}px`, fontWeight: "600" },
      style.css
    );
  }

  function createStyleSheet(extraCss = "") {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CONTROLS_CSS + extraCss);
    return sheet;
  }

  function h(tag, props, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (key === "class") {
        element.className = value;
      } else if (key.startsWith("on")) {
        element.addEventListener(key.slice(2), value);
      } else {
        element[key] = value;
      }
    }
    element.append(...children.filter((child) => child != null));
    return element;
  }

  function section(title, ...children) {
    return h("div", { class: "section" }, title ? h("div", { class: "section-title" }, title) : null, ...children);
  }

  function switchRow(label, hint, onToggle) {
    const input = h("input", { type: "checkbox", class: "switch", onchange: () => onToggle(input.checked) });
    const status = h("small", { class: "status" });
    const row = h(
      "label",
      { class: "row" },
      h("span", { class: "text" }, h("span", {}, label), h("small", {}, hint), status),
      input
    );
    return { row, input, status };
  }

  function rangeRow(label, min, max, step, onInput) {
    let dragging = false;
    const output = h("output", {});
    const input = h("input", {
      type: "range",
      min,
      max,
      step,
      oninput: () => {
        output.textContent = `${input.value}px`;
        onInput(Number(input.value));
      },
      onpointerdown: () => (dragging = true),
      onpointerup: () => (dragging = false),
      onchange: () => (dragging = false)
    });
    const row = h("div", { class: "field" }, h("div", { class: "field-head" }, h("span", {}, label), output), input);
    return {
      row,
      set(value) {
        if (!dragging) {
          input.value = value;
          output.textContent = `${value}px`;
        }
      }
    };
  }

  function selectRow(label, items, onSelect) {
    const select = h(
      "select",
      { onchange: () => onSelect(select.value) },
      ...items.map((item) => h("option", { value: item.id }, item.label))
    );
    return { row: h("label", { class: "field" }, h("span", {}, label), select), set: (value) => (select.value = value) };
  }

  // context "panel": the menu behind the gear in Apple's control bar.
  // context "popup": the toolbar popup; adds the switch for the gear itself.
  function createSettingsUI(root, { context, onChange }) {
    const now = h("div", { class: "now" });

    const baseOptions = h("div", {});
    const fixedOptions = h("div", {});
    const fixedSummaryValue = h("small", {});
    const fixedCheck = h("span", { class: "check" });
    const fixedGroup = h(
      "details",
      {},
      h(
        "summary",
        {},
        fixedCheck,
        h("span", { class: "label" }, h("span", {}, "Fixed resolution"), h("small", {}, "Locks the quality you pick.")),
        fixedSummaryValue,
        h("span", { class: "chevron" }, "›")
      ),
      fixedOptions
    );
    let qualitySignature = "";
    let selectedKey = null;

    const injectUI = switchRow(
      "Gear in the player",
      "Settings button in Apple's control bar. Off: only in this popup.",
      (on) => onChange({ injectUI: on })
    );
    const subtitles = switchRow(
      "Start with subtitles",
      "On: in your language. Off: none. Apple's subtitles button still works.",
      (on) => onChange({ subtitles: on })
    );
    const blockAuto = switchRow(
      "Block automatic subtitles",
      "Stops Apple from turning them on when you mute, skip back 10 s, or the audio isn't in your language.",
      (on) => onChange({ blockAutoSubtitles: on })
    );
    const hudEnabled = switchRow(
      "Show playback info",
      "Overlay with quality, frames, buffer, bandwidth and more.",
      (on) => onChange({ hud: { enabled: on } })
    );
    const hudCompact = switchRow("Quality only", "Overlay shows just resolution and bitrate.", (on) =>
      onChange({ hud: { compact: on } })
    );
    const corners = CORNERS.map((corner) => ({
      id: corner.id,
      button: h("button", { type: "button", class: "corner", onclick: () => onChange({ hud: { corner: corner.id } }) }, corner.label)
    }));
    const fontSize = rangeRow("Font size", 10, 40, 1, (value) => onChange({ hud: { fontSize: value } }));
    const margin = rangeRow("Margin", 0, 120, 2, (value) => onChange({ hud: { margin: value } }));
    const font = selectRow("Font", FONTS, (value) => onChange({ hud: { font: value } }));
    const style = selectRow("Style", STYLES, (value) => onChange({ hud: { style: value } }));

    const styleGroup = h(
      "details",
      {},
      h("summary", {}, h("span", { class: "label" }, "HUD style"), h("span", { class: "chevron" }, "›")),
      h(
        "div",
        { class: "group-body" },
        h("div", { class: "field" }, h("span", {}, "Corner"), h("div", { class: "corners" }, ...corners.map((c) => c.button))),
        fontSize.row,
        margin.row,
        font.row,
        style.row
      )
    );

    const sections = [
      now,
      context === "popup" ? section("Interface", injectUI.row) : null,
      section("Quality", baseOptions, fixedGroup),
      section("Subtitles", subtitles.row, blockAuto.row),
      section("Debug", hudEnabled.row, hudCompact.row),
      section(null, styleGroup)
    ];
    root.classList.add("tweaks");
    root.append(...sections.filter(Boolean));

    function optionButton(option) {
      return h(
        "button",
        { type: "button", class: "option", onclick: () => onChange({ quality: option.value }) },
        h("span", { class: "check" }, option.selected ? "✓" : ""),
        h("span", { class: "label" }, h("span", {}, option.label), option.hint ? h("small", {}, option.hint) : null),
        option.playing ? h("span", { class: "tag" }, "● now") : null
      );
    }

    function renderQuality(options) {
      const signature = JSON.stringify(options.map((o) => [o.key, o.label, o.hint, o.selected, o.playing]));
      if (signature === qualitySignature) {
        return;
      }
      qualitySignature = signature;
      const fixed = options.filter((option) => option.value.mode === "fixed");
      baseOptions.replaceChildren(...options.filter((option) => option.value.mode !== "fixed").map(optionButton));
      fixedOptions.replaceChildren(...fixed.map(optionButton));

      const selectedFixed = fixed.find((option) => option.selected);
      fixedSummaryValue.textContent = selectedFixed ? selectedFixed.label : "";
      fixedCheck.textContent = selectedFixed ? "✓" : "";
      // Only open or close the submenu when the choice changes, not on every refresh.
      const key = options.find((option) => option.selected)?.key ?? null;
      if (key !== selectedKey) {
        selectedKey = key;
        fixedGroup.open = Boolean(selectedFixed);
      }
    }

    return {
      update(state) {
        const { settings } = state;
        now.textContent = state.hasPlayer ? `Now: ${state.current || "—"}` : "No active playback";
        renderQuality(state.qualityOptions || []);

        injectUI.input.checked = settings.injectUI;
        subtitles.input.checked = settings.subtitles;
        subtitles.status.textContent = !state.hasPlayer
          ? ""
          : state.subtitlesAvailable
            ? `Now: ${state.subtitlesLabel || "off"}`
            : "This stream has no subtitles";
        blockAuto.input.checked = settings.blockAutoSubtitles;

        hudEnabled.input.checked = settings.hud.enabled;
        hudCompact.input.checked = settings.hud.compact;
        for (const corner of corners) {
          corner.button.classList.toggle("selected", corner.id === settings.hud.corner);
        }
        fontSize.set(settings.hud.fontSize);
        margin.set(settings.hud.margin);
        font.set(settings.hud.font);
        style.set(settings.hud.style);
      }
    };
  }

  globalThis.PlayerTweaksUI = Object.freeze({
    APPLE_FONT,
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    mergeSettings,
    qualityLabel,
    formatMbps,
    applyHudLook,
    createStyleSheet,
    createSettingsUI
  });
})();
