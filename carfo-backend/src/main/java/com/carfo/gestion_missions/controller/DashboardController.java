package com.carfo.gestion_missions.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.carfo.gestion_missions.service.DashboardService;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Récupère les statistiques de l'année courante
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<Map<String, Object>> getAnnualStats() {
        Map<String, Object> stats = dashboardService.getAnnualStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère les statistiques filtrées par année
     */
    @GetMapping("/stats/year")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<Map<String, Object>> getStatsByYear(@RequestParam(required = false) Integer annee) {
        Map<String, Object> stats = dashboardService.getStatsByYear(annee);
        return ResponseEntity.ok(stats);
    }

    /**
     * Récupère les missions à venir (7 prochains jours)
     */
    @GetMapping("/missions-en-cours")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<Map<String, Object>> getUpcomingMissions() {
        Map<String, Object> missions = dashboardService.getUpcomingMissions();
        return ResponseEntity.ok(missions);
    }
}
