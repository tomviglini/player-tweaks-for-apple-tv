# Troubleshooting

## Highest available quality

Observed on 2026-10-10 in Chrome on Windows, MLS live match:

- Apple serves at most **1080p60 at 8.1 Mbps, H.264 (`avc1.640032`), SDR** to the web player. There is no 4K, HDR or HEVC variant.
- The master playlist lists 9 qualities, each repeated on 3 CDN pathways (`ap-p`, `ap-b`, `ak-p`); the player uses one pathway.
- Every variant is `HDCP-LEVEL=NONE`, so HDCP does not cap the quality.

If playback already shows 1080p60 at 8.1 Mbps, there is nothing higher to force. Low quality at startup or after a network dip is what the extension's startup overrides and quality pinning address.

On-demand video is usually capped lower by Apple's DRM; see [the next section](#apples-drm-caps-on-demand-video-at-480p).

## Apple's DRM caps on-demand video at 480p

Apple protects its video with DRM. In Chrome, Apple's player uses Widevine at the software security level, and drops every variant Apple does not allow at that level before the extension sees the list. See [DRM and security level](apple-player-internals.md#drm-and-security-level).

In practice, MLS live matches are the only content that plays at a usable quality in Chrome for now. On-demand video at 480p or lower is too blurry to watch.

Seen in Chrome on Windows up to 2026-10-17:

| Content | Highest quality |
| --- | --- |
| MLS live matches | 1080p60 at 8.1 Mbps, every time so far |
| MLS matches after they end | 480p |
| MLS highlights | 480p |
| Apple TV+ series episode | 432p (864×432) at 1.7 Mbps, 24 fps |

- Most on-demand content checked, MLS or not, stopped at 480p or lower. Not every title was checked, so it is not known whether all on-demand content is capped.
- Some MLS matches stayed at 1080p for a short time after they ended, and were at 480p within hours. The exact time was not measured.
- In the capped videos, "Highest available" pins the best remaining variant, and the quality menu lists nothing higher.
- HDCP is not the cause: every variant the player kept is `HDCP-LEVEL=NONE`.
- For the MLS live match, whether the variants were encrypted, or allowed `WIDEVINE_SOFTWARE` at every quality, was not checked.

MusicKit picks Widevine in every browser that supports it, so the same cap should apply to Chrome, Edge and Firefox on Windows and to Chrome on Mac. Only Chrome on Windows was tested.

The extension does not raise this ceiling, because that would mean working around Apple's DRM. In browsers without Widevine, such as Safari, MusicKit uses FairPlay and sets no software cap; this was not tested.

## Dropped frames at 60 fps

**Symptom:** the video stutters and the dropped-frame count keeps rising during 1080p60 playback.

**Common cause:** Chrome decodes the video in software. `chrome://gpu` then reports `Video Decode: Software only. Hardware acceleration disabled`, for example when `chrome://flags/#disable-accelerated-video-decode` is set to Disabled, which adds `--disable-accelerated-video-decode` to Chrome's command line. Decoding 1080p60 then runs on the CPU instead of the GPU.

### Measure dropped frames

Turn on "Show playback info" in the extension's menu and read the `dropped` count and the measured fps, or run this in the DevTools console during playback:

```js
(({ droppedVideoFrames: d, totalVideoFrames: t }) => `${d}/${t} = ${(100 * d / t).toFixed(2)}%`)(document.querySelector("video").getVideoPlaybackQuality())
```

### Workaround with software decoding

Pin `1080p30 · 5.1 Mbps` under "Fixed resolution". It halves the frames the CPU has to decode, at the cost of 30 fps motion.

### Turn hardware decoding back on

1. Measure dropped frames for a few minutes with software decoding.
2. Set `chrome://flags/#disable-accelerated-video-decode` to **Default** and relaunch Chrome.
3. Confirm that `chrome://gpu` shows `Video Decode: Hardware accelerated`, and that `chrome://media-internals` shows a hardware decoder for the playing video, such as `D3D11VideoDecoder` on Windows.
4. Watch live sports or a movie, entering and leaving fullscreen, plus a 1080p60 or 4K YouTube video. Look for green or pink frames, blocky artifacts, black video with audio, flicker or freezes when entering fullscreen, and tab or GPU process crashes.
5. Measure dropped frames again and compare.

If problems appear, set the flag to Disabled again. To narrow down the cause:

- On Windows, Event Viewer → Windows Logs → System: display driver reset errors, such as `nvlddmkm` for NVIDIA, point to the driver or the GPU.
- Play a local 1080p60 H.264 file with hardware decoding in another player. Artifacts there too point to the GPU or driver; artifacts only in Chrome point to Chrome.
- For driver problems, a clean reinstall of the graphics driver is the usual next step.
