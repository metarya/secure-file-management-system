import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function HlsVideoPlayer({
  fileId,
  token,
}) {
  const videoRef = useRef(null);

  useEffect(() => {

    const video = videoRef.current;

    console.log("=================================");
    console.log("fileId =", fileId);
    console.log("token =", token);
    console.log("=================================");

    if (!video || !fileId || !token) {
      console.warn("Missing video, fileId, or token");
      return;
    }

    const src =
      `http://localhost:8080/api/files/${fileId}/master.m3u8`;

    console.log("HLS URL =", src);

    if (Hls.isSupported()) {

      const hls = new Hls({

        debug: true,

        xhrSetup(xhr) {

          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${token}`
          );

        },
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("MEDIA_ATTACHED");
      });

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log("MANIFEST_LOADING");
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log("MANIFEST_PARSED", data);
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        console.log("LEVEL_LOADED", data);
      });

      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        console.log("FRAGMENT_LOADED", data.frag.url);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS ERROR", data);
      });

      hls.loadSource(src);

      hls.attachMedia(video);

      return () => {
        hls.destroy();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {

      console.log("Native HLS supported");

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