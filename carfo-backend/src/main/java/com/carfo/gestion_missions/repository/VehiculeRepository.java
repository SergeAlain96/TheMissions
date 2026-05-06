package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.StatutVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    List<Vehicule> findByStatutAndActifTrue(StatutVehicule statut);
    Optional<Vehicule> findByImmatriculation(String immatriculation);
    boolean existsByImmatriculation(String immatriculation);
    long countByStatutAndActifTrue(StatutVehicule statut);

    // Véhicule le plus utilisé dans les affectations
    @Query("""
        SELECT v.immatriculation, COUNT(a)
        FROM Affectation a JOIN a.vehicule v
        GROUP BY v.immatriculation
        ORDER BY COUNT(a) DESC
        LIMIT 1
    """)
    List<Object> findMostUsedVehicle();
}
