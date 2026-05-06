package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.StatutMission;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class MissionViewDTO {

    private MissionViewDTO() {}

    public record ParticipantView(
            Long idAgent,
            String nom,
            String prenom,
            String matricule,
            String roleMission
    ) {}

    public record AffectationView(
            Long idAffectation,
            Long idChauffeur,
            String nomChauffeur,
            String prenomChauffeur,
            Long idVehicule,
            String immatriculationVehicule,
            String marqueVehicule,
            String modeleVehicule
    ) {}

    public record MissionSummaryView(
            Long idMission,
            LocalDate dateDebut,
            LocalDate dateFin,
            String lieu,
            String objetMission,
            StatutMission statut,
            LocalDateTime dateSoumission,
            Long idDirection,
            String nomDirection
    ) {}

    public record MissionDetailView(
            Long idMission,
            LocalDate dateDebut,
            LocalDate dateFin,
            String lieu,
            String objetMission,
            StatutMission statut,
            LocalDateTime dateSoumission,
            String motifAnnulation,
            Long idDirection,
            String nomDirection,
            List<ParticipantView> participants,
            AffectationView affectation
    ) {}
}
