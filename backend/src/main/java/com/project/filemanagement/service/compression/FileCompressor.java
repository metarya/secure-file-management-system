package com.project.filemanagement.service.compression;

import java.io.File;
import java.io.IOException;

public interface FileCompressor {

    CompressionResult compress(File inputFile) throws IOException;

    File decompress(File inputFile) throws IOException;

    String getAlgorithm();

    boolean requiresDecompression();

}