package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.StatutMission;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// DTO de création d'une mission
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
class MissionRequest {

    @NotNull(message = "La date de début est obligatoire")
    @Future(message = "La date de début doit être dans le futur")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    @NotBlank(message = "Le lieu est obligatoire")
    private String lieu;

    @NotBlank(message = "L'objet de la mission est obligatoire")
    private String objetMission;

    @NotNull(message = "La direction est obligatoire")
    private Long idDirection;

    // IDs des agents participants
    private List<Long> idAgents;

    // Rôles correspondants aux agents
    private List<String> rolesMission;
}

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
