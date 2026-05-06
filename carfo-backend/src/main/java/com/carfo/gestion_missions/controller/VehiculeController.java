package com.carfo.gestion_missions.controller;

import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.service.VehiculeService;
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
    public ResponseEntity<List<Vehicule>> getVehiculesDisponibles() {
        return ResponseEntity.ok(vehiculeService.getVehiculesDisponibles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> getVehiculeById(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculeService.getVehiculeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> createVehicule(@RequestBody Map<String, Object> body) {
        String immatriculation = (String) body.get("immatriculation");
        String marque = (String) body.get("marque");
        String modele = (String) body.get("modele");
        String typeVehicule = (String) body.get("typeVehicule");
        Integer capacite = body.get("capacite") != null ? Integer.valueOf(body.get("capacite").toString()) : null;
        LocalDate dateAcquisition = body.get("dateAcquisition") != null
                ? LocalDate.parse(body.get("dateAcquisition").toString())
                : null;

        Vehicule vehicule = vehiculeService.createVehicule(
                immatriculation, marque, modele, capacite, dateAcquisition, typeVehicule);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHARGE_ETUDE', 'ADMINISTRATEUR')")
    public ResponseEntity<Vehicule> updateVehicule(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String immatriculation = (String) body.get("immatriculation");
        String marque = (String) body.get("marque");
        String modele = (String) body.get("modele");
        String typeVehicule = (String) body.get("typeVehicule");
        Integer capacite = body.get("capacite") != null ? Integer.valueOf(body.get("capacite").toString()) : null;
        LocalDate dateAcquisition = body.get("dateAcquisition") != null
                ? LocalDate.parse(body.get("dateAcquisition").toString())
                : null;

        return ResponseEntity.ok(vehiculeService.updateVehicule(
                id, immatriculation, marque, modele, capacite, dateAcquisition, typeVehicule));
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
