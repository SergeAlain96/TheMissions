package com.carfo.gestion_missions.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors (MethodArgumentNotValid)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Erreur de validation",
            "Les données soumises ne respectent pas les contraintes requises"
        );

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.put(error.getField(), error.getDefaultMessage())
        );
        response.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle mission not found
     */
    @ExceptionHandler(MissionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleMissionNotFoundException(MissionNotFoundException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.NOT_FOUND,
            "Mission non trouvée",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle insufficient deadline
     */
    @ExceptionHandler(DelaiInsuffisantException.class)
    public ResponseEntity<Map<String, Object>> handleDelaiInsuffisantException(DelaiInsuffisantException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Délai insuffisant",
            ex.getMessage()
        );
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle vehicle unavailable
     */
    @ExceptionHandler(VehiculeIndisponibleException.class)
    public ResponseEntity<Map<String, Object>> handleVehiculeIndisponibleException(VehiculeIndisponibleException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.CONFLICT,
            "Véhicule indisponible",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle chauffeur unavailable
     */
    @ExceptionHandler(ChauffeurIndisponibleException.class)
    public ResponseEntity<Map<String, Object>> handleChauffeurIndisponibleException(ChauffeurIndisponibleException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.CONFLICT,
            "Chauffeur indisponible",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle resource not found
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.NOT_FOUND,
            "Ressource introuvable",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle duplicate resource
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateResourceException(DuplicateResourceException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.CONFLICT,
            "Conflit de données",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle business rule violations
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRuleException(BusinessRuleException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Règle métier non respectée",
            ex.getMessage()
        );
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle access denied
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.FORBIDDEN,
            "Accès refusé",
            "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle authentication failures
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleAuthFailures(RuntimeException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.UNAUTHORIZED,
            "Authentification échouée",
            "Identifiants invalides"
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /**
     * Handle HTTP message not readable
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Requête invalide",
            "La requête est invalide ou incomplète"
        );
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle illegal argument
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Argument invalide",
            ex.getMessage()
        );
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle generic runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.BAD_REQUEST,
            "Erreur métier",
            ex.getMessage() != null ? ex.getMessage() : "Une erreur est survenue lors du traitement"
        );
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle generic exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        Map<String, Object> response = buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Erreur serveur",
            "Une erreur inattendue est survenue"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Build standardized error response
     */
    private Map<String, Object> buildErrorResponse(HttpStatus status, String title, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", status.getReasonPhrase());
        response.put("title", title);
        response.put("message", message);

        return response;
    }
}
