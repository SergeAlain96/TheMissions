package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.MissionViewDTO;
import com.carfo.gestion_missions.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/affectations")
@RequiredArgsConstructor
public class AffectationController {

    private final MissionService missionService;

    // GET /api/affectations/chauffeur/{id}
    @GetMapping("/chauffeur/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<MissionViewDTO.AffectationView>> getAffectationsByChauffeur(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getAffectationsByChauffeur(id));
    }
}