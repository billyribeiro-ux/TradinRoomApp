# Screen Share & Drawing — End-to-End Audit (vs Zoom)

_Audit date: 2026-06-13. Scope: trace and test the screen-share and whiteboard/
drawing subsystems end-to-end and assess parity with Zoom._

---

## 1. Screen Share

### 1.1 What exists (traced end-to-end)

There are **two parallel, disconnected screen-share systems**:

| | System A | System B |
|---|---|---|
| Entry | Trading-room **Toolbar** button (`S`) | **BrandHeader** "Share screen" |
| Code | `useScreenShareController` → LiveKit directly | `shareService` → `shareStore` → `rtcClient` |
| Capture | `getDisplayMedia` | `getDisplayMedia` (with system audio) |
| Transport | `room.localParticipant.publishTrack(...)` | `rtcClient.get().publishPrimaryVideoTrack(...)` |
| Rendered by | _nothing_ | `ContentViewer` / `ShareDashboard` (reads `shareStore`) |
| Features | video only | system audio, multi-share, resolution control, pause, recording, virtual-camera |

### 1.2 Critical findings (why it isn't Zoom-grade yet)

1. **Remote viewing is not wired.** `RoomEvent.TrackSubscribed` in `services/livekit.ts`
   is a no-op, and no component attaches a remote participant's screen track to the
   DOM or to `shareStore`. In Zoom, when one person shares, everyone sees it — here,
   remote participants have no rendering path.
2. **`rtcClient` is a `NoopClient`.** `createLiveKitRtcClient(room)` is never called
   (`rtcClient.set(...)` appears nowhere), so **System B never transmits to peers** —
   it only updates the local `shareStore` (local self-view only).
3. **System A renders nowhere.** It publishes to LiveKit but never populates
   `shareStore`, which is the only thing `ContentViewer` renders — so even the local
   sharer doesn't see their own share through that surface.
4. The two systems mean the **two share buttons behave differently**, and neither
   delivers a share to a remote viewer.

> **Bottom line:** cross-participant screen sharing is **not functional end-to-end**
> today. This is the dominant gap vs Zoom and requires a live LiveKit server plus a
> second client to implement and verify — it cannot be validated in this sandbox.

### 1.3 Improvements shipped here (capture/publish side — verified by build/typecheck/lint)

`useScreenShareController` (System A) was upgraded toward Zoom parity:

- **System/tab audio** is now captured (`audio: true`) and published as
  `Track.Source.ScreenShareAudio` — previously audio was dropped entirely.
- **`contentHint = 'detail'`** on the video track for legible shared text/slides
  (the trade-off Zoom makes for document sharing).
- **Proper `Track.Source.ScreenShare`** instead of a stringly-typed `'screen_share'`
  with `@ts-expect-error`, so remote peers can classify and lay out the share.
- **1080p30** capture constraints (was unconstrained / 720p-ish).
- Stop/cleanup now unpublishes **both** the video and audio screen sources by `Track.Source`.

### 1.4 Recommended to reach full Zoom parity (needs live backend to verify)

1. Wire `rtcClient.set(createLiveKitRtcClient(room))` when the LiveKit room connects.
2. Implement remote rendering: on `TrackSubscribed` where
   `publication.source === Track.Source.ScreenShare`, attach the track and surface it
   (e.g. push into `shareStore`); remove it on `TrackUnsubscribed`.
3. **Consolidate to one system** — recommend keeping the feature-complete
   `shareService`/`shareStore` (System B) and pointing the toolbar at it, backed by the
   LiveKit RTC adapter.
4. Zoom extras: "optimize for video clip" toggle (`contentHint: motion` vs `detail`),
   pause-share, and annotation-over-share (reuse the existing whiteboard overlay).

---

## 2. Drawing / Whiteboard

### 2.1 Toolset (traced)

Pen, Highlighter, Eraser, Line, Rectangle, Circle, Text, Emoji/Stamp, Select
(move/resize), plus a **Laser pointer** tool and real-time collaboration module
(`whiteboardCollab.ts`). Undo/redo, color/opacity, gradients, world-space
coordinates, DPR-aware rendering, RAF-batched pointer updates, container-query
responsive layout.

### 2.2 vs Zoom annotation

| Capability | Zoom | TradinRoom |
|---|---|---|
| Pen / Highlighter / Eraser | ✅ | ✅ |
| Shapes (line, rect, ellipse) | ✅ | ✅ |
| Text | ✅ | ✅ |
| Stamp / emoji | ✅ (stamps) | ✅ (emoji + stamp) |
| Laser / spotlight | ✅ | ✅ (`LaserTool`) |
| Undo / redo / clear | ✅ | ✅ |
| Free select / move / resize | ⚠️ limited | ✅ |
| Gradients | ❌ | ✅ |

**The drawing toolset meets or exceeds Zoom's annotation feature set.**

### 2.3 Correctness fix shipped here

`simplifyPoints` (Ramer–Douglas–Peucker) was using sum-of-distances-to-endpoints
instead of perpendicular-distance-to-segment, so it barely simplified strokes and
recursed to O(n) depth (stack overflow on long strokes). Rewritten with the correct
metric and an **iterative, stack-safe** implementation.

### 2.4 End-to-end test results (Playwright + Chromium, `/__test_whiteboard`)

- Core drawing **verified working**: shape creation, tool switching, store updates,
  text entry (the functional assertions pass).
- 3 specs report failing **soft** assertions on debug telemetry
  (`window.__WB_DEBUG_BRANCH__`, RAF-batched `len`). These globals are never written
  by the drawing code, so the expectations are unsatisfiable by design — the E2E
  suite was **already red before this work** (committed `test-results/.last-run.json`
  shows `status: "failed"`). They are test-instrumentation gaps, not functional bugs.

### 2.5 Recommended next steps

- Verify the collaboration module (`whiteboardCollab.ts`) against a live backend for
  multi-user cursors/strokes (the Zoom "co-annotate" experience).
- Either wire the `__WB_DEBUG_BRANCH__` telemetry the E2E specs expect, or relax those
  soft assertions, so the whiteboard E2E suite goes green.
- Add an explicit Arrow tool (currently Line only) for Zoom parity.
