package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.IOException;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class NoCompressionCompressor implements FileCompressor {

    @Override
    public CompressionResult compress(File inputFile) throws IOException {

        log.debug(
                "Skipping compression for {}",
                inputFile.getName()
        );

        return new CompressionResult(
                inputFile,
                getAlgorithm(),
                requiresDecompression(),
                inputFile.length(),
                inputFile.length()
        );
    }

    @Override
    public String getAlgorithm() {
        return "NONE";
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