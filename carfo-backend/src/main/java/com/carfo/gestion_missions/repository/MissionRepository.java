package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Mission;
import com.carfo.gestion_missions.enums.StatutMission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {

    // Missions par statut
    List<Mission> findByStatut(StatutMission statut);

    // Missions d'une direction
    List<Mission> findByDirectionIdDirection(Long idDirection);

    // Missions d'une direction par statut
    List<Mission> findByDirectionIdDirectionAndStatut(Long idDirection, StatutMission statut);

    // Détecter les chevauchements de dates
    @Query("""
        SELECT m FROM Mission m
        WHERE m.statut NOT IN ('ANNULEE', 'CLOTUREE')
        AND NOT (m.dateFin < :dateDebut OR m.dateDebut > :dateFin)
    """)
    List<Mission> findMissionsEnChevauchement(
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // Statistiques : nombre de missions par direction
    @Query("""
        SELECT d.nomDirection, COUNT(m)
        FROM Mission m JOIN m.direction d
        WHERE YEAR(m.dateDebut) = :annee
        GROUP BY d.nomDirection
    """)
    List<Object[]> countMissionsParDirection(@Param("annee") int annee);

    // Nombre total de missions dans l'année
    @Query("SELECT COUNT(m) FROM Mission m WHERE YEAR(m.dateDebut) = :annee")
    Long countMissionsParAnnee(@Param("annee") int annee);

    // Missions à venir (non annulées)
    @Query("""
        SELECT m FROM Mission m
        WHERE m.dateDebut >= :today
        AND m.statut NOT IN ('ANNULEE', 'CLOTUREE')
        ORDER BY m.dateDebut ASC
    """)
    List<Mission> findMissionsAVenir(@Param("today") LocalDate today);

    // Compter par statut
    long countByStatut(StatutMission statut);

    // Compter par statut sur une année donnée (date de début dans l'année)
    @Query("""
        SELECT COUNT(m) FROM Mission m
        WHERE m.statut = :statut AND YEAR(m.dateDebut) = :annee
    """)
    long countByStatutAndYear(@Param("statut") StatutMission statut, @Param("annee") int annee);

    // Missions par mois pour une année donnée — renvoie [mois (1-12), count]
    @Query("""
        SELECT MONTH(m.dateDebut) as mois, COUNT(m) as count
        FROM Mission m
        WHERE YEAR(m.dateDebut) = :annee
        GROUP BY MONTH(m.dateDebut)
        ORDER BY mois ASC
    """)
    List<Object[]> countMissionsByMonthForYear(@Param("annee") int annee);

    // Missions par direction pour une année donnée — renvoie [nomDirection, count]
    @Query("""
        SELECT d.nomDirection, COUNT(m)
        FROM Mission m JOIN m.direction d
        WHERE YEAR(m.dateDebut) = :annee
        GROUP BY d.nomDirection
        ORDER BY COUNT(m) DESC
    """)
    List<Object[]> countMissionsByDirectionForYear(@Param("annee") int annee);

    // Top 5 directions par nombre de missions
    @Query("""
        SELECT d.nomDirection as direction, COUNT(m) as count
        FROM Mission m JOIN m.direction d
        GROUP BY d.nomDirection
        ORDER BY count DESC
        LIMIT 5
    """)
    List<Object[]> countMissionsByDirectionTop5();

    // Missions dans une plage de dates
    @Query("""
        SELECT m FROM Mission m
        WHERE m.dateDebut >= :dateDebut AND m.dateDebut <= :dateFin
        AND m.statut NOT IN ('ANNULEE')
        ORDER BY m.dateDebut ASC
    """)
    List<Mission> findMissionsInDateRange(
        @Param("dateDebut") LocalDate dateDebut,
        @Param("dateFin") LocalDate dateFin
    );

    // Compter missions dans une plage de dates
    @Query("""
        SELECT COUNT(m) FROM Mission m
        WHERE m.dateDebut >= :dateDebut AND m.dateDebut <= :dateFin
        AND m.statut NOT IN ('ANNULEE')
    """)
    long countMissionsInDateRange(
        @Param("dateDebut") LocalDate dateDebut,
        @Param("dateFin") LocalDate dateFin
    );
}
