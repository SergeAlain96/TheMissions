package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.dto.VehiculeRequest;
import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.service.VehiculeService;
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
@RequestMapping("/api/vehicules")
@RequiredArgsConstructor
public class VehiculeController {

    /** Profils autorisés à consulter le parc auto (lecture seule). */
    private static final String READ_ROLES =
            "hasAnyRole('ADMINISTRATEUR', 'SECRETAIRE_GENERALE', 'DIRECTEUR', 'DIRECTEUR_DIRECTION', 'CHARGE_ETUDE')";

    /** Mutations sur le parc auto : réservées au DMG (Directeur des Moyens Généraux) ou Admin. */
    private static final String WRITE_DMG = "@securityChecker.isDmgOrAdmin()";

    private final VehiculeService vehiculeService;

    @GetMapping
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<Vehicule>> getAllVehicules() {
        return ResponseEntity.ok(vehiculeService.getAllVehicules());
    }

    @GetMapping("/disponibles")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<List<Vehicule>> getVehiculesDisponibles(
            @RequestParam(required = false) LocalDate dateDebut,
            @RequestParam(required = false) LocalDate dateFin) {
        if (dateDebut != null && dateFin != null) {
            return ResponseEntity.ok(vehiculeService.getVehiculesDisponiblesSurPeriode(dateDebut, dateFin));
        }
        return ResponseEntity.ok(vehiculeService.getVehiculesDisponibles());
    }

    @GetMapping("/{id}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<Vehicule> getVehiculeById(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getVehiculeById(id));
    }

    @PostMapping
    @PreAuthorize(WRITE_DMG)
    public ResponseEntity<Vehicule> createVehicule(@Valid @RequestBody VehiculeRequest request) {
        Vehicule vehicule = vehiculeService.createVehicule(
                request.getImmatriculation(), request.getMarque(), request.getModele(),
                request.getCapacite(), request.getDateAcquisition(), request.getTypeVehicule());
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicule);
    }

    @PutMapping("/{id}")
    @PreAuthorize(WRITE_DMG)
    public ResponseEntity<Vehicule> updateVehicule(@PathVariable Long id,
                                                    @Valid @RequestBody VehiculeRequest request) {
        return ResponseEntity.ok(vehiculeService.updateVehicule(
                id, request.getImmatriculation(), request.getMarque(), request.getModele(),
                request.getCapacite(), request.getDateAcquisition(), request.getTypeVehicule()));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize(WRITE_DMG)
    public ResponseEntity<Vehicule> updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(vehiculeService.updateStatut(id, StatutVehicule.valueOf(body.get("statut"))));
    }

    @PatchMapping("/{id}/maintenance")
    @PreAuthorize(WRITE_DMG)
    public ResponseEntity<Vehicule> mettreEnMaintenance(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.updateStatut(id, StatutVehicule.EN_MAINTENANCE));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(WRITE_DMG)
    public ResponseEntity<Void> deleteVehicule(@PathVariable Long id) {
        vehiculeService.deleteVehicule(id);
        return ResponseEntity.noContent().build();
    }
}
