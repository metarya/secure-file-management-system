package com.project.filemanagement.exception;

/** Thrown when the request conflicts with current state. Maps to HTTP 409. */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
