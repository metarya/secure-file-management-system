package com.project.filemanagement.service.ffmpeg;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.github.kokorin.jaffree.ffmpeg.FFmpeg;

/**
 * Resolves how the FFmpeg binary is located, in one place, so every component
 * (compressors and the HLS executor) is consistent and portable.
 *
 * <p>Resolution: if an explicit directory is configured via the
 * {@code ffmpeg.path} property — which defaults from the {@code FFMPEG_PATH}
 * environment variable — that directory is used; otherwise the executable is
 * resolved from the system {@code PATH}. No path is hardcoded, so the same
 * build runs on Windows, Linux and inside containers.
 */
@Component
public class FFmpegLocator {

    private final String ffmpegPath;

    public FFmpegLocator(@Value("${ffmpeg.path:}") String ffmpegPath) {
        this.ffmpegPath = ffmpegPath;
    }

    /** A fresh {@link FFmpeg} invocation pointed at the resolved binary. */
    public FFmpeg newFFmpeg() {
        if (ffmpegPath != null && !ffmpegPath.isBlank()) {
            return FFmpeg.atPath(Paths.get(ffmpegPath.trim()));
        }
        return FFmpeg.atPath();
    }
}
