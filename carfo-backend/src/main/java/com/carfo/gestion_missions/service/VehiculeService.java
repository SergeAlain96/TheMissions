package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.StatutVehicule;
import com.carfo.gestion_missions.exception.DuplicateResourceException;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.VehiculeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VehiculeService {

    private final VehiculeRepository vehiculeRepository;

    @Transactional(readOnly = true)
    public List<Vehicule> getAllVehicules() {
        log.debug("Fetching all vehicles");
        return vehiculeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Vehicule getVehiculeById(Long idVehicule) {
        log.debug("Fetching vehicle with id: {}", idVehicule);
        return vehiculeRepository.findById(idVehicule)
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule introuvable : " + idVehicule));
    }

    @Transactional(readOnly = true)
    public List<Vehicule> getVehiculesDisponibles() {
        return vehiculeRepository.findByStatutAndActifTrue(StatutVehicule.DISPONIBLE);
    }

    @Transactional(readOnly = true)
    public List<Vehicule> getVehiculesDisponiblesSurPeriode(LocalDate dateDebut, LocalDate dateFin) {
        return vehiculeRepository.findVehiculesDisponiblesSurPeriode(dateDebut, dateFin);
    }

    public Vehicule createVehicule(String immatriculation,
                                   String marque,
                                   String modele,
                                   Integer capacite,
                                   LocalDate dateAcquisition,
                                   String typeVehicule) {
        if (vehiculeRepository.existsByImmatriculation(immatriculation)) {
            throw new DuplicateResourceException("Un véhicule avec l'immatriculation " + immatriculation + " existe déjà.");
        }

        Vehicule vehicule = Vehicule.builder()
                .immatriculation(immatriculation)
                .marque(marque)
                .modele(modele)
                .capacite(capacite)
                .dateAcquisition(dateAcquisition)
                .typeVehicule(typeVehicule)
                .statut(StatutVehicule.DISPONIBLE)
                .actif(true)
                .build();

        return vehiculeRepository.save(vehicule);
    }

    public Vehicule updateVehicule(Long idVehicule,
                                   String immatriculation,
                                   String marque,
                                   String modele,
                                   Integer capacite,
                                   LocalDate dateAcquisition,
                                   String typeVehicule) {
        Vehicule vehicule = getVehiculeById(idVehicule);

        if (!vehicule.getImmatriculation().equalsIgnoreCase(immatriculation)
                && vehiculeRepository.existsByImmatriculation(immatriculation)) {
            throw new DuplicateResourceException("Un véhicule avec l'immatriculation " + immatriculation + " existe déjà.");
        }

        vehicule.setImmatriculation(immatriculation);
        vehicule.setMarque(marque);
        vehicule.setModele(modele);
        vehicule.setCapacite(capacite);
        vehicule.setDateAcquisition(dateAcquisition);
        vehicule.setTypeVehicule(typeVehicule);

        return vehiculeRepository.save(vehicule);
    }

    public Vehicule updateStatut(Long idVehicule, StatutVehicule statut) {
        Vehicule vehicule = getVehiculeById(idVehicule);
        vehicule.setStatut(statut);
        return vehiculeRepository.save(vehicule);
    }

    public void deleteVehicule(Long idVehicule) {
        Vehicule vehicule = getVehiculeById(idVehicule);
        vehicule.setActif(false);
        vehiculeRepository.save(vehicule);
    }
}
