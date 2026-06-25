package com.project.filemanagement.exception;

/** Thrown when the request is malformed or invalid. Maps to HTTP 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
