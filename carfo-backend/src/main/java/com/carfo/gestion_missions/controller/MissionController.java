package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.MissionRequest;
import com.carfo.gestion_missions.dto.MissionViewDTO;
import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.enums.StatutMission;
import com.carfo.gestion_missions.service.FicheMissionService;
import com.carfo.gestion_missions.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;
    private final FicheMissionService ficheMissionService;

    // GET /api/missions — toutes les missions
    @GetMapping
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<MissionViewDTO.MissionSummaryView>> getAllMissions(
            @RequestParam(required = false) StatutMission statut,
            @RequestParam(required = false) Long idDirection,
            @RequestParam(required = false) LocalDate dateDebut,
            @RequestParam(required = false) LocalDate dateFin) {
        return ResponseEntity.ok(missionService.getMissionsFiltrees(statut, idDirection, dateDebut, dateFin));
    }

    // GET /api/missions/{id}
    @GetMapping("/{id}")
    public ResponseEntity<MissionViewDTO.MissionDetailView> getMission(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getMissionDetail(id));
    }

    // GET /api/missions/a-venir
    @GetMapping("/a-venir")
    public ResponseEntity<List<Mission>> getMissionsAVenir() {
        return ResponseEntity.ok(missionService.getMissionsAVenir());
    }

    // GET /api/missions/statut/{statut}
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Mission>> getMissionsByStatut(@PathVariable StatutMission statut) {
        return ResponseEntity.ok(missionService.getMissionsByStatut(statut));
    }

    // GET /api/missions/direction/{idDirection}
    @GetMapping("/direction/{idDirection}")
    public ResponseEntity<List<Mission>> getMissionsByDirection(@PathVariable Long idDirection) {
        return ResponseEntity.ok(missionService.getMissionsByDirection(idDirection));
    }

    // POST /api/missions/soumettre — soumettre une nouvelle mission
    @PostMapping("/soumettre")
    @PreAuthorize("hasAnyRole('DIRECTEUR_DIRECTION', 'DIRECTEUR', 'CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Mission> soumettreMission(@RequestBody Map<String, Object> body) {
        LocalDate dateDebut = LocalDate.parse((String) body.get("dateDebut"));
        LocalDate dateFin   = LocalDate.parse((String) body.get("dateFin"));
        String lieu         = (String) body.get("lieu");
        String objet        = (String) body.get("objetMission");
        Long idDirection    = Long.valueOf(body.get("idDirection").toString());

        @SuppressWarnings("unchecked")
        List<Long> idAgents = (List<Long>) body.get("idAgents");
        @SuppressWarnings("unchecked")
        List<String> roles  = (List<String>) body.get("rolesMission");

        Mission mission = missionService.soumettreMission(
                dateDebut, dateFin, lieu, objet, idDirection, idAgents, roles);

        return ResponseEntity.status(HttpStatus.CREATED).body(mission);
    }

    // PATCH /api/missions/{id}/valider
    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'ADMINISTRATEUR')")
    public ResponseEntity<MissionViewDTO.MissionDetailView> validerMission(@PathVariable Long id) {
        missionService.validerMission(id);
        return ResponseEntity.ok(missionService.getMissionDetail(id));
    }

    // PATCH /api/missions/{id}/annuler
    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'DIRECTEUR_DIRECTION', 'ADMINISTRATEUR')")
    public ResponseEntity<Mission> annulerMission(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(missionService.annulerMission(id, body.get("motif")));
    }

    // PATCH /api/missions/{id}/cloturer
    @PatchMapping("/{id}/cloturer")
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Mission> cloturerMission(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.cloturerMission(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECTEUR_DIRECTION', 'DIRECTEUR', 'CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Mission> updateMission(@PathVariable Long id,
                                                  @RequestBody MissionRequest request) {
        return ResponseEntity.ok(missionService.updateMission(id, request));
    }

    // GET /api/missions/{id}/participants
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<MissionViewDTO.ParticipantView>> getParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(missionService.getParticipants(id));
    }

    // POST /api/missions/{id}/participants
    @PostMapping("/{id}/participants")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<MissionViewDTO.ParticipantView>> addParticipants(@PathVariable Long id,
                                                                                @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> idAgents = (List<Long>) body.get("idAgents");
        @SuppressWarnings("unchecked")
        List<String> roles  = (List<String>) body.get("rolesMission");
        return ResponseEntity.ok(missionService.addParticipants(id, idAgents, roles));
    }

    // DELETE /api/missions/{id}/participants/{idAgent}
    @DeleteMapping("/{id}/participants/{idAgent}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Void> removeParticipant(@PathVariable Long id, @PathVariable Long idAgent) {
        missionService.removeParticipant(id, idAgent);
        return ResponseEntity.noContent().build();
    }

    // GET /api/missions/{id}/fiche
    @GetMapping(value = "/{id}/fiche", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('SECRETAIRE_GENERALE', 'DIRECTEUR', 'CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<byte[]> telechargerFiche(@PathVariable Long id) {
        byte[] pdf = ficheMissionService.genererFiche(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=fiche-mission-" + id + ".pdf")
                .body(pdf);
    }

    // POST /api/missions/{id}/affecter — affecter chauffeur + véhicule
    @PostMapping("/{id}/affecter")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Affectation> affecter(@PathVariable Long id,
                                                 @RequestBody Map<String, Object> body) {
        Long idChauffeur = Long.valueOf(body.get("idChauffeur").toString());
        Long idVehicule  = Long.valueOf(body.get("idVehicule").toString());
        return ResponseEntity.ok(missionService.affecterRessources(id, idChauffeur, idVehicule));
    }

    // DELETE /api/missions/{id}/affectation
    @DeleteMapping("/{id}/affectation")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Void> removeAffectation(@PathVariable Long id) {
        missionService.removeAffectation(id);
        return ResponseEntity.noContent().build();
    }
}
