package com.carfo.gestion_missions.repository;

import com.carfo.gestion_missions.entity.Absence;
import com.carfo.gestion_missions.enums.StatutAbsence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Long> {

    List<Absence> findByAgentIdAgent(Long idAgent);

    List<Absence> findByStatut(StatutAbsence statut);

    // Vérifier si un agent est absent sur une période donnée
    @Query("""
        SELECT a FROM Absence a
        WHERE a.agent.idAgent = :idAgent
        AND a.statut = 'APPROUVE'
        AND NOT (a.dateFin < :dateDebut OR a.dateDebut > :dateFin)
    """)
    List<Absence> findAbsencesEnChevauchement(
            @Param("idAgent") Long idAgent,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    // Toutes les absences approuvées couvrant la date donnée (bulk pour calcul de statut)
    @Query("""
        SELECT a FROM Absence a
        WHERE a.statut = 'APPROUVE'
        AND a.dateDebut <= :date AND a.dateFin >= :date
    """)
    List<Absence> findApprouveesContenantDate(@Param("date") LocalDate date);
}
