package com.carfo.gestion_missions.exception;

public class VehiculeIndisponibleException extends RuntimeException {
    public VehiculeIndisponibleException(String message) {
        super(message);
    }

    public VehiculeIndisponibleException(String message, Throwable cause) {
        super(message, cause);
    }
}
