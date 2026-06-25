import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { API_BASE_URL } from "../../config";

export default function HlsVideoPlayer({
  fileId,
  token,
}) {
  const videoRef = useRef(null);

  useEffect(() => {

    const video = videoRef.current;

    if (!video || !fileId || !token) {
      return;
    }

    const src = `${API_BASE_URL}/files/${fileId}/master.m3u8`;

    if (Hls.isSupported()) {

      const hls = new Hls({
        xhrSetup(xhr) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS playback error", data);
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    // Safari / native HLS fallback: the browser issues the requests itself.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

  }, [fileId, token]);

  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload"
      style={{
        width: "100%",
        maxHeight: "500px",
      }}
    />
  );
}