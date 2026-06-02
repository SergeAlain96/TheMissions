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
    private final com.carfo.gestion_missions.service.StatistiquesExportService exportService;

    public DashboardController(DashboardService dashboardService,
                                com.carfo.gestion_missions.service.StatistiquesExportService exportService) {
        this.dashboardService = dashboardService;
        this.exportService = exportService;
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

    /**
     * Module Statistiques — payload filtré strictement par année.
     * Renvoie : year, totalMissions, missionsValidated, missionsCancelled, missionsClosed,
     * missionsPending, missionsByStatus, missionsByDirection (List<{direction,count}>),
     * missionsByMonth (long[12]).
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        // Si from/to fournis → filtre par plage ; sinon par année (ou année courante)
        if (from != null || to != null) {
            return ResponseEntity.ok(dashboardService.getStatistics(from, to));
        }
        return ResponseEntity.ok(dashboardService.getStatistics(year));
    }

    /** Export PDF du rapport statistique annuel. */
    @GetMapping(value = "/statistics/pdf", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<byte[]> exportStatisticsPdf(@RequestParam(required = false) Integer year) {
        int annee = year != null ? year : java.time.LocalDate.now().getYear();
        byte[] pdf = exportService.exporterPdf(annee);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header("Content-Disposition",
                        "attachment; filename=rapport-statistiques-" + annee + ".pdf")
                .body(pdf);
    }

    /** Export CSV des données statistiques (pour Excel — séparateur ; + BOM UTF-8). */
    @GetMapping(value = "/statistics/csv", produces = "text/csv; charset=UTF-8")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')")
    public ResponseEntity<byte[]> exportStatisticsCsv(@RequestParam(required = false) Integer year) {
        int annee = year != null ? year : java.time.LocalDate.now().getYear();
        byte[] csv = exportService.exporterCsv(annee);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header("Content-Disposition",
                        "attachment; filename=statistiques-" + annee + ".csv")
                .body(csv);
    }
}
