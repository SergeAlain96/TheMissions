package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.MissionViewDTO;
import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/affectations")
@RequiredArgsConstructor
public class AffectationController {

    /** Profils autorisés à consulter les affectations (lecture seule). */
    private static final String READ_ROLES =
            "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

    private final MissionService missionService;

    @GetMapping
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAllAffectations() {
        return ResponseEntity.ok(missionService.getAllAffectations());
    }

    @GetMapping("/chauffeur/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAffectationsByChauffeur(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getAffectationsByChauffeur(id));
    }

    /** Liste des affectations d'une mission (incluant ANNULEE pour l'historique). */
    @GetMapping("/mission/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAffectationsByMission(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getMissionDetail(id).affectations());
    }

    /**
     * Crée une nouvelle affectation. Une mission peut désormais avoir plusieurs affectations
     * ACTIVE simultanément (gros convoi).
     */
    @PostMapping
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<List<MissionViewDTO.AffectationView>> createAffectation(@RequestBody Map<String, Object> body) {
        Long idMission   = Long.valueOf(body.get("idMission").toString());
        Long idChauffeur = Long.valueOf(body.get("idChauffeur").toString());
        Long idVehicule  = Long.valueOf(body.get("idVehicule").toString());
        missionService.affecterRessources(idMission, idChauffeur, idVehicule);
        return ResponseEntity.ok(missionService.getMissionDetail(idMission).affectations());
    }

    /**
     * Soft-delete d'une affectation : la met en statut ANNULEE et libère le véhicule
     * si celui-ci n'a pas d'autre affectation ACTIVE sur la période.
     */
    @DeleteMapping("/{idAffectation}")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Void> deleteAffectation(@PathVariable Long idAffectation) {
        missionService.removeAffectation(idAffectation);
        return ResponseEntity.noContent().build();
    }
}
