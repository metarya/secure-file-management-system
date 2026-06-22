package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;

import org.springframework.stereotype.Service;

import com.project.filemanagement.service.compression.CompressionResult;
import com.project.filemanagement.service.compression.CompressorFactory;
import com.project.filemanagement.service.compression.FileCompressor;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileCompressionService {

    private final CompressorFactory compressorFactory;

    public CompressionResult compress(
            File inputFile,
            String extension
    ) throws IOException {

        FileCompressor compressor =
                compressorFactory.getCompressor(extension);

        return compressor.compress(inputFile);
    }

    public File decompress(
            File inputFile,
            String extension
    ) throws IOException {

        FileCompressor compressor =
                compressorFactory.getCompressor(extension);

        return compressor.decompress(inputFile);
    }
}