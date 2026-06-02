package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Affectation;
import com.carfo.gestion_missions.enums.StatutAffectation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffectationRepository extends JpaRepository<Affectation, Long> {

    /** Toutes les affectations d'une mission (actives ET annulées) — utile pour l'historique. */
    List<Affectation> findByMissionIdMission(Long idMission);

    /** Affectations d'une mission filtrées par statut (typiquement ACTIVE). */
    List<Affectation> findByMissionIdMissionAndStatut(Long idMission, StatutAffectation statut);

    List<Affectation> findByChauffeurIdAgent(Long idChauffeur);

    /**
     * Chauffeurs en chevauchement avec la période — seules les affectations ACTIVE comptent.
     * Une affectation ANNULEE libère bien le chauffeur.
     */
    @Query("""
        SELECT a FROM Affectation a
        WHERE a.chauffeur.idAgent = :idChauffeur
        AND a.statut = 'ACTIVE'
        AND a.mission.statut NOT IN ('ANNULEE', 'CLOTUREE')
        AND NOT (a.mission.dateFin < :dateDebut OR a.mission.dateDebut > :dateFin)
    """)
    List<Affectation> findAffectationsChauffeurEnChevauchement(
            @Param("idChauffeur") Long idChauffeur,
            @Param("dateDebut") java.time.LocalDate dateDebut,
            @Param("dateFin") java.time.LocalDate dateFin
    );

    /** Idem pour les véhicules — utilisé pour vérifier qu'un véhicule n'est pas déjà pris. */
    @Query("""
        SELECT a FROM Affectation a
        WHERE a.vehicule.idVehicule = :idVehicule
        AND a.statut = 'ACTIVE'
        AND a.mission.statut NOT IN ('ANNULEE', 'CLOTUREE')
        AND NOT (a.mission.dateFin < :dateDebut OR a.mission.dateDebut > :dateFin)
    """)
    List<Affectation> findAffectationsVehiculeEnChevauchement(
            @Param("idVehicule") Long idVehicule,
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

    // Nombre d'affectations par chauffeur pour une année donnée
    // Renvoie [idChauffeur, count] uniquement pour ceux ayant au moins 1 mission
    @Query("""
        SELECT a.chauffeur.idAgent, COUNT(a)
        FROM Affectation a
        WHERE YEAR(a.mission.dateDebut) = :annee
        GROUP BY a.chauffeur.idAgent
    """)
    List<Object[]> countAffectationsByChauffeurForYear(@Param("annee") int annee);

    /** Nombre d'affectations par véhicule pour une année donnée — [idVehicule, count]. */
    @Query("""
        SELECT a.vehicule.idVehicule, COUNT(a)
        FROM Affectation a
        WHERE YEAR(a.mission.dateDebut) = :annee
        GROUP BY a.vehicule.idVehicule
    """)
    List<Object[]> countAffectationsByVehiculeForYear(@Param("annee") int annee);

    // ───────── Variantes plage de dates ─────────
    @Query("""
        SELECT a.chauffeur.idAgent, COUNT(a)
        FROM Affectation a
        WHERE a.mission.dateDebut BETWEEN :from AND :to
        GROUP BY a.chauffeur.idAgent
    """)
    List<Object[]> countAffectationsByChauffeurInRange(@Param("from") java.time.LocalDate from,
                                                       @Param("to") java.time.LocalDate to);

    @Query("""
        SELECT a.vehicule.idVehicule, COUNT(a)
        FROM Affectation a
        WHERE a.mission.dateDebut BETWEEN :from AND :to
        GROUP BY a.vehicule.idVehicule
    """)
    List<Object[]> countAffectationsByVehiculeInRange(@Param("from") java.time.LocalDate from,
                                                      @Param("to") java.time.LocalDate to);

    // Affectations actives à la date donnée (mission couvrant la date, statut INITIEE,
    // affectation statut ACTIVE). Sert au calcul de statut "EN_MISSION" des chauffeurs.
    @Query("""
        SELECT a FROM Affectation a
        WHERE a.mission.statut = 'INITIEE'
        AND a.statut = 'ACTIVE'
        AND a.mission.dateDebut <= :date AND a.mission.dateFin >= :date
    """)
    List<Affectation> findActivesAtDate(@Param("date") java.time.LocalDate date);
}
