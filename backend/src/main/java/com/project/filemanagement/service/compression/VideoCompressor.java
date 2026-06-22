package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import com.github.kokorin.jaffree.ffmpeg.FFmpeg;
import com.github.kokorin.jaffree.ffmpeg.UrlInput;
import com.github.kokorin.jaffree.ffmpeg.UrlOutput;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class VideoCompressor implements FileCompressor {

    @Override
    public CompressionResult compress(File inputFile) throws IOException {

        log.info("================================================");
        log.info("Compressing video file {}", inputFile.getName());
        log.info("Input path : {}", inputFile.getAbsolutePath());
        log.info("Input size : {} bytes", inputFile.length());

        File outputFile = File.createTempFile("compressed_", ".mp4");

        log.info("Output path : {}", outputFile.getAbsolutePath());

        try {

            FFmpeg.atPath(
                    Paths.get(
                            "C:\\ffmpeg\\ffmpeg-8.1.1-essentials_build\\bin"
                    )
            )
                    .addInput(
                            UrlInput.fromPath(inputFile.toPath())
                    )
                    .addOutput(
                            UrlOutput.toPath(outputFile.toPath())
                                    .addArguments("-c:v", "libx264")
                                    .addArguments("-preset", "slow")
                                    .addArguments("-crf", "30")
                                    .addArguments("-movflags", "+faststart")
                                    .addArguments("-c:a", "aac")
                                    .addArguments("-b:a", "96k")
                    )
                    .setOverwriteOutput(true)
                    .execute();

            log.info("Output exists : {}", outputFile.exists());
            log.info("Output size   : {}", outputFile.length());

            // TEMPORARY FOR DEBUGGING
            if (outputFile.exists() && outputFile.length() > 0) {

                log.info(
                        "Video compression complete: {} -> {} bytes",
                        inputFile.length(),
                        outputFile.length()
                );

                return new CompressionResult(
                        outputFile,
                        getAlgorithm(),
                        requiresDecompression(),
                        inputFile.length(),
                        outputFile.length()
                );
            }

            return new CompressionResult(
                    inputFile,
                    getAlgorithm(),
                    false,
                    inputFile.length(),
                    inputFile.length()
            );

        } catch (Exception e) {

            log.error("========================================", e);
            log.error("VIDEO COMPRESSION FAILED");
            log.error("Input file : {}", inputFile.getAbsolutePath());
            log.error("========================================");

            throw new IOException(
                    "Video compression failed for "
                            + inputFile.getName(),
                    e
            );
        }
    }

    @Override
    public String getAlgorithm() {
        return "FFMPEG_VIDEO";
    }

    @Override
    public boolean requiresDecompression() {
        return false;
    }

    @Override
    public File decompress(File inputFile) throws IOException {
        return inputFile;
    }
}