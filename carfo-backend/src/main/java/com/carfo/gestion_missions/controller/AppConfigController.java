package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.AppConfig;
import com.carfo.gestion_missions.service.AppConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Configuration globale (identité institutionnelle).
 *  - GET ouvert à tous les profils décisionnels (affichage dans l'UI/PDF)
 *  - PUT réservé strictement à l'Administrateur (cf. onglet Paramètres)
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class AppConfigController {

    private final AppConfigService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE', 'AGENT')")
    public ResponseEntity<AppConfig> get() {
        return ResponseEntity.ok(service.get());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<AppConfig> update(@RequestBody AppConfig payload) {
        return ResponseEntity.ok(service.update(payload));
    }
}
