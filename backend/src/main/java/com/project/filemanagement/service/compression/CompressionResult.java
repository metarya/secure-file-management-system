package com.project.filemanagement.service.compression;

import java.io.File;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CompressionResult {

    private final File compressedFile;

    private final String algorithm;

    private final boolean requiresDecompression;

    private final long originalSize;

    private final long compressedSize;

    public double getCompressionRatio() {

        if (originalSize == 0) {
            return 0;
        }

        return ((double) (originalSize - compressedSize) / originalSize) * 100;
    }
}