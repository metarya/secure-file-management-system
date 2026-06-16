package com.project.filemanagement.service;

import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileValidationService {

    public String cleanDescription(String description) {

        if (description == null) {
            return null;
        }

        String cleaned = description.trim();

        if (cleaned.isEmpty()) {
            return null;
        }

        if (cleaned.length() > 1000) {
            return cleaned.substring(0, 1000);
        }

        return cleaned;
    }

    public String getFileExtension(String fileName) {

        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File extension is required"
            );
        }

        return fileName.substring(dotIndex + 1).toLowerCase();
    }

    public boolean isAllowedFileType(String fileType) {

        return switch (fileType.toLowerCase()) {
            case "txt",
                 "md",
                 "pdf",
                 "mp3",
                 "mp4",
                 "wav",
                 "m4a",
                 "webm",
                 "mov",
                 "avi",
                 "mkv" -> true;

            default -> false;
        };
    }

    public boolean isAllowedDetectedMimeType(String detectedMimeType) {

        if (detectedMimeType == null || detectedMimeType.isBlank()) {
            return false;
        }

        String mime = detectedMimeType.toLowerCase();

        return mime.startsWith("video/")
                || mime.startsWith("audio/")
                || mime.startsWith("text/")
                || mime.equals("application/pdf");
    }

    public boolean containsSuspiciousContent(String textContent) {

        if (textContent == null || textContent.isBlank()) {
            return false;
        }

        Pattern[] suspiciousPatterns = {
                Pattern.compile("<script\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("</script\\s*>", Pattern.CASE_INSENSITIVE),
                Pattern.compile("javascript\\s*:", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bcmd\\.exe\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bpowershell\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\brm\\s+-rf\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bchmod\\s+\\+?x\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b(curl|wget)\\s+https?://", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b(eval|exec)\\s*\\(", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bbase64\\s+(-d|--decode)\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\.(exe|bat|cmd|sh|ps1)\\b", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern pattern : suspiciousPatterns) {
            if (pattern.matcher(textContent).find()) {
                return true;
            }
        }

        return false;
    }
}