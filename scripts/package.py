"""Builds the extension zips in dist/.

- player-tweaks-for-apple-tv-VERSION.zip keeps the files in an unversioned
  player-tweaks-for-apple-tv/ folder for manual installation. Extracting a newer zip
  over the same location updates the loaded extension in place.
- player-tweaks-for-apple-tv-VERSION-chrome-web-store.zip has manifest.json at the
  root, as the Chrome Web Store requires.

Only what the extension needs goes in: the files that manifest.json and popup.html
reference, plus the license and third-party notices. Entries use maximum deflate
compression and fixed metadata, so the same sources always give the same bytes.
"""

import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
name = "player-tweaks-for-apple-tv"
version = manifest["version"]
legal = ["LICENSE", "THIRD_PARTY_NOTICES.md"]


def icon_paths(icons):
    if isinstance(icons, str):
        return [icons]
    return list((icons or {}).values())


files = {"manifest.json", *legal}
for script in manifest.get("content_scripts", []):
    files.update(script.get("js", []), script.get("css", []))
files.update(icon_paths(manifest.get("icons")))
action = manifest.get("action", {})
files.update(icon_paths(action.get("default_icon")))
if "service_worker" in manifest.get("background", {}):
    files.add(manifest["background"]["service_worker"])

for page in [action.get("default_popup")] + [file for file in files if file.endswith(".html")]:
    if not page:
        continue
    files.add(page)
    html = (root / page).read_text(encoding="utf-8")
    for ref in re.findall(r'(?:src|href)="([^"#?:]+)"', html):
        files.add((Path(page).parent / ref).as_posix())

missing = sorted(file for file in files if not (root / file).is_file())
assert not missing, f"Referenced files are missing: {', '.join(missing)}"


def build(target, folder):
    with ZipFile(target, "w") as package:
        for file in sorted(files):
            entry = ZipInfo(f"{folder}{file}", date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o644 << 16
            package.writestr(entry, (root / file).read_bytes(), ZIP_DEFLATED, 9)

    with ZipFile(target) as package:
        assert package.testzip() is None, f"{target.name} failed its integrity check."
        assert package.namelist() == [f"{folder}{file}" for file in sorted(files)], f"{target.name} has unexpected entries."
        for file in legal:
            assert package.read(f"{folder}{file}") == (root / file).read_bytes(), f"{target.name} is missing {file}."


dist = root / "dist"
dist.mkdir(exist_ok=True)
for target, folder in (
    (dist / f"{name}-{version}.zip", f"{name}/"),
    (dist / f"{name}-{version}-chrome-web-store.zip", ""),
):
    build(target, folder)
    print(f"Built {target.relative_to(root)} ({target.stat().st_size:,} bytes)")

print(f"{len(files)} files:")
for file in sorted(files):
    print(f"  {file}")
