package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.AgentDTO.UpdateRequest;
import com.carfo.gestion_missions.dto.ChauffeurStatusView;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.enums.StatutChauffeur;
import com.carfo.gestion_missions.service.AgentService;
import com.carfo.gestion_missions.service.ChauffeurStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    /** Profils autorisés à consulter l'annuaire des agents. */
    private static final String READ_ROLES =
            "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

    private final AgentService agentService;
    private final ChauffeurStatusService chauffeurStatusService;

    @GetMapping
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<Agent>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<Agent> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getAgentById(id));
    }

    @GetMapping("/chauffeurs")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<Agent>> getAllChauffeurs() {
        return ResponseEntity.ok(agentService.getAllChauffeurs());
    }

    /**
     * Liste des chauffeurs avec leur statut effectif (DISPONIBLE / INDISPONIBLE / EN_MISSION / ABSENT).
     * Calculé à la lecture en croisant statut manuel, absences en cours et affectations actives.
     */
    @GetMapping("/chauffeurs/statuts")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<ChauffeurStatusView>> getChauffeursStatuts() {
        return ResponseEntity.ok(chauffeurStatusService.listChauffeurStatuses());
    }

    /**
     * Met à jour le statut manuel d'un chauffeur (DMG only).
     * Body : { "statut": "DISPONIBLE" | "INDISPONIBLE", "dateDisponibilite": "YYYY-MM-DD"? }
     */
    @PatchMapping("/chauffeurs/{id}/statut")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<ChauffeurStatusView> updateStatutChauffeur(@PathVariable Long id,
                                                                     @RequestBody Map<String, Object> body) {
        StatutChauffeur statut = StatutChauffeur.valueOf(String.valueOf(body.get("statut")).toUpperCase());
        LocalDate dateDisponibilite = body.get("dateDisponibilite") != null
                ? LocalDate.parse(String.valueOf(body.get("dateDisponibilite")))
                : null;
        return ResponseEntity.ok(chauffeurStatusService.updateStatutManuel(id, statut, dateDisponibilite));
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'CHARGE_ETUDE', 'DIRECTEUR_DIRECTION')")
    public ResponseEntity<List<Agent>> getAgentsDisponibles(@RequestParam LocalDate dateDebut,
                                                            @RequestParam LocalDate dateFin) {
        return ResponseEntity.ok(agentService.getAgentsDisponibles(dateDebut, dateFin));
    }

    @GetMapping("/direction/{idDirection:\\d+}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<Agent>> getAgentsByDirection(@PathVariable Long idDirection) {
        return ResponseEntity.ok(agentService.getAgentsByDirection(idDirection));
    }

    // ---- Mutations : DMG (gère le personnel terrain dont les chauffeurs) + Admin (DSI) ----

    @PutMapping("/{id}")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Agent> updateAgent(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return ResponseEntity.ok(agentService.updateAgent(id, request));
    }

    /** Création d'un agent SANS compte d'accès (identité seule) — DMG ou Admin. */
    @PostMapping("/identity")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Agent> createAgentIdentity(
            @Valid @RequestBody com.carfo.gestion_missions.dto.AgentDTO.CreateAgentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.createAgentIdentity(request));
    }

    /** Liste des agents SANS compte (pour le sélecteur de création de compte) — Admin. */
    @GetMapping("/sans-compte")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<Agent>> getAgentsSansCompte() {
        return ResponseEntity.ok(agentService.getAllAgents().stream()
                .filter(a -> !a.hasAccount())
                .toList());
    }

    /** Création d'un compte d'accès pour un agent existant — Admin. */
    @PostMapping("/account")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Agent> createAccount(
            @Valid @RequestBody com.carfo.gestion_missions.dto.AgentDTO.CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(agentService.createAccount(request));
    }

    @PatchMapping("/{id}/desactiver")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Void> deactivateAgent(@PathVariable Long id) {
        agentService.deactivateAgent(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /** Réactive un agent désactivé (admin seul — workflow paramètres). */
    @PatchMapping("/{id}/reactiver")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> reactivateAgent(@PathVariable Long id) {
        agentService.reactivateAgent(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /** Vue admin des comptes (avec lastLoginAt + statut). */
    @GetMapping("/comptes")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<List<com.carfo.gestion_missions.dto.AgentAccountView>> getComptes() {
        return ResponseEntity.ok(agentService.listComptes());
    }
}
