# Troubleshooting

## Highest available quality

Observed on 2026-10-10 in Chrome on Windows, MLS live match:

- Apple serves at most **1080p60 at 8.1 Mbps, H.264 (`avc1.640032`), SDR** to the web player. There is no 4K, HDR or HEVC variant.
- The master playlist lists 9 qualities, each repeated on 3 CDN pathways (`ap-p`, `ap-b`, `ak-p`); the player uses one pathway.
- Every variant is `HDCP-LEVEL=NONE`, so HDCP does not cap the quality.

If playback already shows 1080p60 at 8.1 Mbps, there is nothing higher to force. Low quality at startup or after a network dip is what the extension's startup overrides and quality pinning address.

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
