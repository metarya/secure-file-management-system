package com.project.filemanagement.exception;

/** Thrown when an authenticated caller lacks permission. Maps to HTTP 403. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
