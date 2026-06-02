package com.visiteTn.core.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown for client-side reservation validation failures (e.g. end date
 * before start date). Mapped to HTTP 400 by Spring's default
 * {@code ResponseStatusExceptionResolver}.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidReservationException extends RuntimeException {
    public InvalidReservationException(String message) {
        super(message);
    }
}
