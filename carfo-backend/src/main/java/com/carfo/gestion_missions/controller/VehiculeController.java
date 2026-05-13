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

    private final VehiculeService vehiculeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<Vehicule>> getAllVehicules() {
        return ResponseEntity.ok(vehiculeService.getAllVehicules());
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<List<Vehicule>> getVehiculesDisponibles(
            @RequestParam(required = false) LocalDate dateDebut,
            @RequestParam(required = false) LocalDate dateFin) {
        if (dateDebut != null && dateFin != null) {
            return ResponseEntity.ok(vehiculeService.getVehiculesDisponiblesSurPeriode(dateDebut, dateFin));
        }
        return ResponseEntity.ok(vehiculeService.getVehiculesDisponibles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> getVehiculeById(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getVehiculeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> createVehicule(@Valid @RequestBody VehiculeRequest request) {
        Vehicule vehicule = vehiculeService.createVehicule(
                request.getImmatriculation(), request.getMarque(), request.getModele(),
                request.getCapacite(), request.getDateAcquisition(), request.getTypeVehicule());
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> updateVehicule(@PathVariable Long id,
                                                    @Valid @RequestBody VehiculeRequest request) {
        return ResponseEntity.ok(vehiculeService.updateVehicule(
                id, request.getImmatriculation(), request.getMarque(), request.getModele(),
                request.getCapacite(), request.getDateAcquisition(), request.getTypeVehicule()));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(vehiculeService.updateStatut(id, StatutVehicule.valueOf(body.get("statut"))));
    }

    @PatchMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> mettreEnMaintenance(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.updateStatut(id, StatutVehicule.EN_MAINTENANCE));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Void> deleteVehicule(@PathVariable Long id) {
        vehiculeService.deleteVehicule(id);
        return ResponseEntity.noContent().build();
    }
}
