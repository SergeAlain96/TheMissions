package com.carfo.gestion_missions.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carfo.gestion_missions.entity.Absence;
import com.carfo.gestion_missions.service.AbsenceService;

@RestController
@RequestMapping("/api/absences")
public class AbsenceController {

    /** Lecture des absences : tous les profils décisionnels. */
    private static final String READ_ROLES =
            "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

    /** Mutations sur les absences : Chargé d'étude + Administrateur. */
    private static final String WRITE_ROLES = "hasAnyRole('CHARGE_ETUDE','ADMINISTRATEUR')";

    private final AbsenceService absenceService;

    public AbsenceController(AbsenceService absenceService) {
        this.absenceService = absenceService;
    }

    @GetMapping
    @PreAuthorize(READ_ROLES)
    public List<Absence> getAll() {
        return absenceService.findAll();
    }

    @GetMapping("/agent/{agentId}")
    @PreAuthorize(READ_ROLES)
    public List<Absence> getByAgent(@PathVariable Long agentId) {
        return absenceService.findByAgentId(agentId);
    }

    @PostMapping
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Absence> create(@RequestBody Absence absence) {
        Absence saved = absenceService.save(absence);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Absence> update(@PathVariable Long id, @RequestBody Absence absence) {
        Absence updated = absenceService.update(id, absence);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/approuver")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Absence> approve(@PathVariable Long id) {
        Absence a = absenceService.approve(id);
        return ResponseEntity.ok(a);
    }

    @PatchMapping("/{id}/rejeter")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Absence> reject(@PathVariable Long id) {
        Absence a = absenceService.reject(id);
        return ResponseEntity.ok(a);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE_ROLES)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        absenceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
