package com.carfo.gestion_missions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MissionRequest {

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    @NotBlank(message = "Le lieu est obligatoire")
    private String lieu;

    @NotBlank(message = "L'objet de la mission est obligatoire")
    private String objetMission;

    @NotNull(message = "La direction est obligatoire")
    private Long idDirection;

    private List<Long> idAgents;
    private List<String> rolesMission;
}
