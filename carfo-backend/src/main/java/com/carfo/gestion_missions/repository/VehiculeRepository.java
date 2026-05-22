package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Vehicule;
import com.carfo.gestion_missions.enums.StatutVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {
    List<Vehicule> findByStatutAndActifTrue(StatutVehicule statut);
    Optional<Vehicule> findByImmatriculation(String immatriculation);
    boolean existsByImmatriculation(String immatriculation);
    long countByStatutAndActifTrue(StatutVehicule statut);

    // Véhicules disponibles sur une période : actifs, non affectés à une mission en chevauchement
    @Query("""
        SELECT v FROM Vehicule v
        WHERE v.actif = true
        AND v.statut = 'DISPONIBLE'
        AND v.idVehicule NOT IN (
            SELECT a.vehicule.idVehicule FROM Affectation a
            WHERE a.mission.statut NOT IN ('ANNULEE', 'CLOTUREE')
            AND NOT (a.mission.dateFin < :dateDebut OR a.mission.dateDebut > :dateFin)
        )
    """)
    List<Vehicule> findVehiculesDisponiblesSurPeriode(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // Véhicule le plus utilisé dans les affectations
    @Query("""
        SELECT v.immatriculation, COUNT(a)
        FROM Affectation a JOIN a.vehicule v
        GROUP BY v.immatriculation
        ORDER BY COUNT(a) DESC
        LIMIT 1
    """)
    List<Object[]> findMostUsedVehicle();
}
