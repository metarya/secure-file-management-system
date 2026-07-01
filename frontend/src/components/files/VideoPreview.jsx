import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { API_BASE_URL } from "../../config";

/**
 * Smart, self-detecting video preview.
 *
 * Playback method is chosen automatically:
 *
 *  1. HLS (Hls.js) — used when the browser supports Media Source Extensions
 *     and the backend generated an HLS ladder for this file. This is the only
 *     way to get authenticated *segmented* streaming: a native `<video src>`
 *     cannot attach the JWT to each playlist / .ts request, but Hls.js can via
 *     `xhrSetup`. The `ngrok-skip-browser-warning` header keeps ngrok from
 *     returning its HTML interstitial in place of the playlist/segments.
 *
 *  2. Native HTML5 `<video>` — the fallback (and the path for Safari, which has
 *     no MSE here). Every uploaded video is transcoded to H.264/AAC MP4 server
 *     side, so the already-authenticated preview blob (`src`) is always
 *     natively playable. We fall back to this whenever HLS is unavailable
 *     (no ladder → 404/403) or fails fatally.
 *
 * Native controls (play/pause, seek, volume, fullscreen) are preserved in both
 * modes. Loading and error states are surfaced to the user.
 */
export default function VideoPreview({ fileId, token, src }) {
  const videoRef = useRef(null);

  // loading | hls | native | error
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls = null;
    let cancelled = false;

    // Switch to native HTML5 playback of the authenticated MP4 blob.
    const useNative = () => {
      if (cancelled) return;
      if (!src) {
        setStatus("error");
        return;
      }
      video.src = src;
      setStatus("native");
    };

    // Prefer HLS when MSE is supported and we can authenticate the requests.
    if (fileId && token && Hls.isSupported()) {
      const hlsUrl = `${API_BASE_URL}/files/${fileId}/master.m3u8`;

      hls = new Hls({
        xhrSetup(xhr) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.setRequestHeader("ngrok-skip-browser-warning", "true");
        },
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!cancelled) setStatus("hls");
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        // A fatal error usually means this file has no HLS ladder (the playlist
        // request 404s/403s) or the stream broke. Tear HLS down and fall back
        // to native MP4 playback so the video still plays.
        if (data?.fatal) {
          try {
            hls?.destroy();
          } catch {
            /* already gone */
          }
          hls = null;
          useNative();
        }
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else {
      // No MSE (e.g. Safari) or no token — go straight to native blob playback.
      useNative();
    }

    // Native decode errors: only meaningful once HLS is no longer driving the
    // element (hls === null). If HLS is active it reports its own errors above.
    const onNativeError = () => {
      if (!cancelled && !hls) setStatus("error");
    };
    video.addEventListener("error", onNativeError);

    return () => {
      cancelled = true;
      video.removeEventListener("error", onNativeError);
      if (hls) {
        try {
          hls.destroy();
        } catch {
          /* already gone */
        }
      }
    };
  }, [fileId, token, src]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <video
        ref={videoRef}
        controls
        controlsList="nodownload"
        playsInline
        style={{
          width: "100%",
          maxHeight: "500px",
          background: "#000",
          borderRadius: "8px",
          display: status === "error" ? "none" : "block",
        }}
      />

      {status === "loading" && (
        <p style={{ textAlign: "center", opacity: 0.7, fontSize: "0.9rem" }}>
          Loading video…
        </p>
      )}

      {status === "error" && (
        <p style={{ textAlign: "center", opacity: 0.8, fontSize: "0.9rem", padding: "24px 0" }}>
          This video can&apos;t be previewed in your browser. Use Download to view it.
        </p>
      )}
    </div>
  );
}
