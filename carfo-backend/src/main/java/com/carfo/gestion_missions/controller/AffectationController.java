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

    @GetMapping("/chauffeur/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAffectationsByChauffeur(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getAffectationsByChauffeur(id));
    }

    @GetMapping("/mission/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<MissionViewDTO.AffectationView> getAffectationByMission(@PathVariable Long id) {
        MissionViewDTO.MissionDetailView detail = missionService.getMissionDetail(id);
        if (detail.affectation() == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(detail.affectation());
    }

    @PostMapping
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Affectation> createAffectation(@RequestBody Map<String, Object> body) {
        Long idMission   = Long.valueOf(body.get("idMission").toString());
        Long idChauffeur = Long.valueOf(body.get("idChauffeur").toString());
        Long idVehicule  = Long.valueOf(body.get("idVehicule").toString());
        return ResponseEntity.ok(missionService.affecterRessources(idMission, idChauffeur, idVehicule));
    }

    @DeleteMapping("/mission/{id}")
    @PreAuthorize("@securityChecker.isDmgOrAdmin()")
    public ResponseEntity<Void> deleteAffectation(@PathVariable Long id) {
        missionService.removeAffectation(id);
        return ResponseEntity.noContent().build();
    }
}
