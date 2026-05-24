package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.StatutChauffeur;

import java.time.LocalDate;

/**
 * Vue d'un chauffeur côté DMG. Le statut effectif est calculé par le service
 * (cf. ChauffeurStatusService) en croisant le statut manuel, les absences en cours
 * et l'affectation active à la date du jour.
 */
public record ChauffeurStatusView(
        Long idAgent,
        String nom,
        String prenom,
        String matricule,
        String telephone,
        StatutChauffeur statutManuel,
        StatutChauffeur statutEffectif,
        LocalDate dateDisponibilite,
        /** Référence de la mission en cours aujourd'hui, ou null. */
        String missionEnCoursRef,
        /** Date de fin de l'absence en cours, ou null. */
        LocalDate absenceFin
) {}
