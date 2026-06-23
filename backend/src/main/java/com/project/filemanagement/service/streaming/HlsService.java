package com.project.filemanagement.service.streaming;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;

public interface HlsService {

    Path generateHls(File inputVideo, Long fileId)
            throws IOException;

}