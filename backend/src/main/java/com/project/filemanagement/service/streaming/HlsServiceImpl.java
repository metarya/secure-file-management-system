package com.project.filemanagement.service.streaming;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.project.filemanagement.service.ffmpeg.FFmpegExecutor;

@Service
public class HlsServiceImpl implements HlsService {

    private static final String HLS_ROOT = "uploads/hls";

    private final FFmpegExecutor ffmpegExecutor;

    @Autowired
    public HlsServiceImpl(FFmpegExecutor ffmpegExecutor) {
        this.ffmpegExecutor = ffmpegExecutor;
    }

    @Override
    public Path generateHls(File inputVideo, Long fileId) throws IOException {

        Path outputFolder = Paths.get(HLS_ROOT, fileId.toString());

        if (!Files.exists(outputFolder)) {
            Files.createDirectories(outputFolder);
        }

        ffmpegExecutor.generateHls(
                inputVideo.toPath(),
                outputFolder
        );

        return outputFolder;
    }
}