package com.project.filemanagement.service.ffmpeg;

import java.nio.file.Path;

import org.springframework.stereotype.Component;

import com.github.kokorin.jaffree.ffmpeg.FFmpeg;
import com.github.kokorin.jaffree.ffmpeg.UrlInput;
import com.github.kokorin.jaffree.ffmpeg.UrlOutput;

@Component
public class FFmpegExecutor {

    public void generateHls(Path inputFile, Path outputFolder) {

        Path playlistPath = outputFolder.resolve("master.m3u8");

        FFmpeg.atPath()
                .addInput(UrlInput.fromPath(inputFile))
                .addArguments("-c:v", "copy")
                .addArguments("-c:a", "copy")
                .addArguments("-start_number", "0")
                .addArguments("-hls_time", "10")
                .addArguments("-hls_list_size", "0")
                .addArguments("-f", "hls")
                .addOutput(UrlOutput.toPath(playlistPath))
                .execute();
    }
}