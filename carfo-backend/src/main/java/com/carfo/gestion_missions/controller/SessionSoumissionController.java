package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.SessionSoumission;
import com.carfo.gestion_missions.service.SessionSoumissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionSoumissionController {

    /** Lecture : tous les profils décisionnels (le bandeau d'info doit être visible partout). */
    private static final String READ_ROLES =
            "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

    /** Mutations : CE + Admin uniquement. */
    private static final String WRITE_ROLES = "hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')";

    private final SessionSoumissionService service;

    @GetMapping
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<SessionSoumission>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    /** Session ouverte aujourd'hui (ou 204 si aucune). */
    @GetMapping("/active")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<SessionSoumission> getActive() {
        return service.findActive()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<SessionSoumission> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<SessionSoumission> create(@RequestBody SessionSoumission session) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(session));
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<SessionSoumission> update(@PathVariable Long id, @RequestBody SessionSoumission session) {
        return ResponseEntity.ok(service.update(id, session));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
