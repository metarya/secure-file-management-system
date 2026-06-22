package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class PdfCompressor implements FileCompressor {

    @Override
    public CompressionResult compress(File inputFile) throws IOException {

        File optimizedFile =
                File.createTempFile(
                        "sfms-pdf-optimized-",
                        ".pdf"
                );

        try (
                PDDocument document =
                        Loader.loadPDF(
                                Files.readAllBytes(
                                        inputFile.toPath()
                                )
                        )
        ) {

            document.setAllSecurityToBeRemoved(true);

            document.save(optimizedFile);
        }

        log.info(
                "Optimized PDF {} from {} bytes to {} bytes",
                inputFile.getName(),
                inputFile.length(),
                optimizedFile.length()
        );

        return new CompressionResult(
                optimizedFile,
                getAlgorithm(),
                requiresDecompression(),
                inputFile.length(),
                optimizedFile.length()
        );
    }

    @Override
    public File decompress(File inputFile) {

        return inputFile;
    }

    @Override
    public String getAlgorithm() {

        return "PDFBOX";
    }

    @Override
    public boolean requiresDecompression() {

        return false;
    }
}