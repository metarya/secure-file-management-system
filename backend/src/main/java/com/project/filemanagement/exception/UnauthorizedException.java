package com.project.filemanagement.exception;

/** Thrown when the caller is not authenticated. Maps to HTTP 401. */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
