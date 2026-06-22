package com.project.filemanagement.service.compression;


import java.util.Set;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CompressorFactory {

    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "txt",
            "md",
            "json",
            "xml",
            "csv",
            "log"
    );

    private static final Set<String> PDF_EXTENSIONS = Set.of(
            "pdf"
    );

    private static final Set<String> AUDIO_EXTENSIONS = Set.of(
            "mp3",
            "wav",
            "aac",
            "flac",
            "ogg",
            "m4a"
    );

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4",
            "mkv",
            "avi",
            "mov",
            "wmv",
            "webm",
            "flv",
            "mpeg",
            "3gp",
            "m4v"
    );

    private final TextCompressor textCompressor;
    private final NoCompressionCompressor noCompressionCompressor;

    
    private final PdfCompressor pdfCompressor;
    private final AudioCompressor audioCompressor;
    private final VideoCompressor videoCompressor;

    public FileCompressor getCompressor(String extension) {

        extension = extension.toLowerCase();

        if (TEXT_EXTENSIONS.contains(extension)) {
            return textCompressor;
        }
        
        if (PDF_EXTENSIONS.contains(extension)) {
            return pdfCompressor;
        }

        if (AUDIO_EXTENSIONS.contains(extension)) {
            return audioCompressor;
        }

        if (VIDEO_EXTENSIONS.contains(extension)) {
            return videoCompressor;
        }

        return noCompressionCompressor;
    }
}