package com.project.filemanagement.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.DiffLine;

/**
 * Pure, dependency-free text diff engine.
 *
 * <p>Produces a line-by-line diff (added / removed / context) using a classic
 * Longest-Common-Subsequence dynamic program — adequate for source/text files
 * and free of any third-party library. The backend owns diff generation; the
 * frontend only renders the {@link DiffLine}s this returns.
 */
@Service
public class FileDiffService {

    /** Extensions we render as text diffs. Everything else is treated as binary. */
    private static final Set<String> TEXT_EXTENSIONS = Set.of(
            "md", "markdown", "txt", "html", "htm", "json", "xml",
            "yaml", "yml", "csv", "java", "js", "ts", "css", "sql"
    );

    /** True when the file should be diffed as text (by extension, then MIME). */
    public boolean isTextFile(String fileName, String mimeType) {
        String ext = extensionOf(fileName);
        if (ext != null && TEXT_EXTENSIONS.contains(ext)) {
            return true;
        }
        return mimeType != null && mimeType.toLowerCase().startsWith("text/");
    }

    private static String extensionOf(String fileName) {
        if (fileName == null) {
            return null;
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dot + 1).toLowerCase();
    }

    /** Result of a text diff: the rendered lines plus addition/deletion totals. */
    public record TextDiff(List<DiffLine> lines, int additions, int deletions) {
    }

    /**
     * Computes a line-by-line diff between {@code oldText} and {@code newText}.
     * A modified line surfaces as a removed line followed by an added line.
     */
    public TextDiff diff(String oldText, String newText) {
        String[] oldLines = splitLines(oldText);
        String[] newLines = splitLines(newText);

        int n = oldLines.length;
        int m = newLines.length;

        // LCS length table: lcs[i][j] = LCS of oldLines[i..] and newLines[j..].
        int[][] lcs = new int[n + 1][m + 1];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = m - 1; j >= 0; j--) {
                if (oldLines[i].equals(newLines[j])) {
                    lcs[i][j] = lcs[i + 1][j + 1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
                }
            }
        }

        List<DiffLine> out = new ArrayList<>();
        int additions = 0;
        int deletions = 0;
        int i = 0;
        int j = 0;

        while (i < n && j < m) {
            if (oldLines[i].equals(newLines[j])) {
                out.add(new DiffLine("context", i + 1, j + 1, oldLines[i]));
                i++;
                j++;
            } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
                out.add(new DiffLine("removed", i + 1, null, oldLines[i]));
                deletions++;
                i++;
            } else {
                out.add(new DiffLine("added", null, j + 1, newLines[j]));
                additions++;
                j++;
            }
        }
        while (i < n) {
            out.add(new DiffLine("removed", i + 1, null, oldLines[i]));
            deletions++;
            i++;
        }
        while (j < m) {
            out.add(new DiffLine("added", null, j + 1, newLines[j]));
            additions++;
            j++;
        }

        return new TextDiff(out, additions, deletions);
    }

    /** Splits on \n / \r\n / \r without dropping a trailing empty line silently. */
    private static String[] splitLines(String text) {
        if (text == null || text.isEmpty()) {
            return new String[0];
        }
        String[] parts = text.split("\r\n|\r|\n", -1);
        // A trailing newline yields a final empty element; drop it so it doesn't
        // show as a spurious blank line in the diff.
        if (parts.length > 0 && parts[parts.length - 1].isEmpty()) {
            return Arrays.copyOf(parts, parts.length - 1);
        }
        return parts;
    }
}
