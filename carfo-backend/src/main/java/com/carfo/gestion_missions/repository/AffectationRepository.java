package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationRepository extends JpaRepository<Affectation, Long> {

    Optional<Affectation> findByMissionIdMission(Long idMission);

    List<Affectation> findByChauffeurIdAgent(Long idChauffeur);

    @Query("""
        SELECT a FROM Affectation a
        WHERE a.chauffeur.idAgent = :idChauffeur
        AND a.mission.statut NOT IN ('ANNULEE', 'CLOTUREE')
        AND NOT (a.mission.dateFin < :dateDebut OR a.mission.dateDebut > :dateFin)
    """)
    List<Affectation> findAffectationsChauffeurEnChevauchement(
            @Param("idChauffeur") Long idChauffeur,
            @Param("dateDebut") java.time.LocalDate dateDebut,
            @Param("dateFin") java.time.LocalDate dateFin
    );

    // Chauffeur le plus sollicité (stats)
    @Query("""
        SELECT a.chauffeur.nom, a.chauffeur.prenom, COUNT(a)
        FROM Affectation a
        WHERE YEAR(a.mission.dateDebut) = :annee
        GROUP BY a.chauffeur.idAgent, a.chauffeur.nom, a.chauffeur.prenom
        ORDER BY COUNT(a) DESC
    """)
    List<Object[]> findChauffeursPlusSOllicites(@Param("annee") int annee);

    // Véhicule le plus utilisé
    @Query("""
        SELECT a.vehicule.immatriculation, a.vehicule.marque, a.vehicule.modele, COUNT(a)
        FROM Affectation a
        WHERE YEAR(a.mission.dateDebut) = :annee
        GROUP BY a.vehicule.idVehicule, a.vehicule.immatriculation, a.vehicule.marque, a.vehicule.modele
        ORDER BY COUNT(a) DESC
    """)
    List<Object[]> findVehiculesLesPlusUtilises(@Param("annee") int annee);

    // Le chauffeur le plus sollicité tous les temps
    @Query("""
        SELECT a.chauffeur.nom, COUNT(a)
        FROM Affectation a
        GROUP BY a.chauffeur.idAgent, a.chauffeur.nom
        ORDER BY COUNT(a) DESC
        LIMIT 1
    """)
    List<Object[]> findMostUsedChauffeur();
}
