package com.carfo.gestion_missions.exception;

public class ChauffeurIndisponibleException extends RuntimeException {
    public ChauffeurIndisponibleException(String message) {
        super(message);
    }

    public ChauffeurIndisponibleException(String message, Throwable cause) {
        super(message, cause);
    }
}
