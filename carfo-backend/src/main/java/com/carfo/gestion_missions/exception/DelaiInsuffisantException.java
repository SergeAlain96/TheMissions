package com.carfo.gestion_missions.exception;

public class DelaiInsuffisantException extends RuntimeException {
    public DelaiInsuffisantException(String message) {
        super(message);
    }

    public DelaiInsuffisantException(String message, Throwable cause) {
        super(message, cause);
    }
}
