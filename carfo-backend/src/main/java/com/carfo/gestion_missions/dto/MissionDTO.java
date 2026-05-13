package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.StatutMission;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// DTO de réponse pour une mission
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class MissionResponse {

    private Long idMission;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String lieu;
    private String objetMission;
    private StatutMission statut;
    private LocalDateTime dateSoumission;
    private String nomDirection;
    private Long idDirection;
    private List<ParticipantDTO> participants;
    private AffectationDTO affectation;
}

// DTO participant (simplifié)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class ParticipantDTO {
    private Long idAgent;
    private String nom;
    private String prenom;
    private String matricule;
    private String roleMission;
}

// DTO affectation (simplifié)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class AffectationDTO {
    private Long idAffectation;
    private String nomChauffeur;
    private String prenomChauffeur;
    private String immatriculationVehicule;
    private String marqueVehicule;
    private String modeleVehicule;
}
