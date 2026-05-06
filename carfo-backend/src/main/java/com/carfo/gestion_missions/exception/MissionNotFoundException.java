package com.carfo.gestion_missions.exception;

public class MissionNotFoundException extends RuntimeException {
    public MissionNotFoundException(String message) {
        super(message);
    }

    public MissionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
