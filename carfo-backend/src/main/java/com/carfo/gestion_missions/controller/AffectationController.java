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

    private final MissionService missionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR')")
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAllAffectations() {
        return ResponseEntity.ok(missionService.getAllAffectations());
    }

    @GetMapping("/chauffeur/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAffectationsByChauffeur(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getAffectationsByChauffeur(id));
    }

    @GetMapping("/mission/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR')")
    public ResponseEntity<MissionViewDTO.AffectationView> getAffectationByMission(@PathVariable Long id) {
        MissionViewDTO.MissionDetailView detail = missionService.getMissionDetail(id);
        if (detail.affectation() == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(detail.affectation());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Affectation> createAffectation(@RequestBody Map<String, Object> body) {
        Long idMission   = Long.valueOf(body.get("idMission").toString());
        Long idChauffeur = Long.valueOf(body.get("idChauffeur").toString());
        Long idVehicule  = Long.valueOf(body.get("idVehicule").toString());
        return ResponseEntity.ok(missionService.affecterRessources(idMission, idChauffeur, idVehicule));
    }

    @DeleteMapping("/mission/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Void> deleteAffectation(@PathVariable Long id) {
        missionService.removeAffectation(id);
        return ResponseEntity.noContent().build();
    }
}
