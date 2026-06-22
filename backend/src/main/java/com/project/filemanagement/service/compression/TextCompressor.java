package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class TextCompressor implements FileCompressor {

    @Override
    public CompressionResult compress(File inputFile) throws IOException {

        File compressedFile = new File(
                inputFile.getParent(),
                inputFile.getName() + ".gz"
        );

        try (
                FileInputStream fis = new FileInputStream(inputFile);
                FileOutputStream fos = new FileOutputStream(compressedFile);
                GZIPOutputStream gos = new GZIPOutputStream(fos)
        ) {

            byte[] buffer = new byte[8192];
            int length;

            while ((length = fis.read(buffer)) != -1) {
                gos.write(buffer, 0, length);
            }
        }

        log.info(
                "Compressed {} from {} bytes to {} bytes",
                inputFile.getName(),
                inputFile.length(),
                compressedFile.length()
        );

        return new CompressionResult(
                compressedFile,
                getAlgorithm(),
                requiresDecompression(),
                inputFile.length(),
                compressedFile.length()
        );
    }

    @Override
    public File decompress(File inputFile) throws IOException {

        String outputName = inputFile.getName();

        if (outputName.endsWith(".gz")) {
            outputName = outputName.substring(0, outputName.length() - 3);
        } else {
            outputName = outputName + ".decompressed";
        }

        File outputFile = new File(
                inputFile.getParent(),
                outputName
        );

        try (
                FileInputStream fis = new FileInputStream(inputFile);
                GZIPInputStream gis = new GZIPInputStream(fis);
                FileOutputStream fos = new FileOutputStream(outputFile)
        ) {

            byte[] buffer = new byte[8192];
            int length;

            while ((length = gis.read(buffer)) != -1) {
                fos.write(buffer, 0, length);
            }
        }

        log.info(
                "Decompressed {} to {}",
                inputFile.getName(),
                outputFile.getName()
        );

        return outputFile;
    }

    @Override
    public String getAlgorithm() {
        return "GZIP";
    }

    @Override
    public boolean requiresDecompression() {
        return true;
    }
}