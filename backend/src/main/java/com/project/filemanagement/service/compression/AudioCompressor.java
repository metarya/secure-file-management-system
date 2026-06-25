package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.IOException;

import org.springframework.stereotype.Component;

import com.github.kokorin.jaffree.ffmpeg.UrlInput;
import com.github.kokorin.jaffree.ffmpeg.UrlOutput;
import com.project.filemanagement.service.ffmpeg.FFmpegLocator;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class AudioCompressor implements FileCompressor {

    private final FFmpegLocator ffmpegLocator;

    public AudioCompressor(FFmpegLocator ffmpegLocator) {
        this.ffmpegLocator = ffmpegLocator;
    }

    @Override
    public CompressionResult compress(File inputFile) throws IOException {

        log.info("================================================");
        log.info("Compressing audio file {}", inputFile.getName());
        log.info("Input path : {}", inputFile.getAbsolutePath());
        log.info("Input size : {} bytes", inputFile.length());

        File outputFile = File.createTempFile(
                "compressed_",
                ".m4a"
        );

        log.info("Output path : {}", outputFile.getAbsolutePath());

        try {

            ffmpegLocator.newFFmpeg()
                    .addInput(
                            UrlInput.fromPath(inputFile.toPath())
                    )
                    .addOutput(
                            UrlOutput.toPath(outputFile.toPath())
                                    .addArguments("-c:a", "aac")
                                    .addArguments("-b:a", "128k")
                    )
                    .setOverwriteOutput(true)
                    .execute();

            log.info("Output exists : {}", outputFile.exists());
            log.info("Output size   : {} bytes", outputFile.length());

            if (outputFile.exists()
                    && outputFile.length() > 0
                    && outputFile.length() < inputFile.length()) {

                log.info(
                        "Compression successful: {} -> {} bytes",
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

            log.warn(
                    "Compressed file rejected. Original={} bytes, Output={} bytes",
                    inputFile.length(),
                    outputFile.length()
            );

            return new CompressionResult(
                    inputFile,
                    getAlgorithm(),
                    false,
                    inputFile.length(),
                    inputFile.length()
            );

        } catch (Exception e) {

            log.error("========================================");
            log.error("AUDIO COMPRESSION FAILED");
            log.error("Input file : {}", inputFile.getAbsolutePath());
            log.error("Message : {}", e.getMessage(), e);
            log.error("========================================");

            throw new IOException(
                    "Audio compression failed for "
                            + inputFile.getName(),
                    e
            );
        }
    }

    @Override
    public String getAlgorithm() {
        return "FFMPEG_AUDIO";
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