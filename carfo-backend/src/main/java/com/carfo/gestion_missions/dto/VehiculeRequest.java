package com.carfo.gestion_missions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VehiculeRequest {

    @NotBlank(message = "L'immatriculation est obligatoire")
    private String immatriculation;

    @NotBlank(message = "La marque est obligatoire")
    private String marque;

    @NotBlank(message = "Le modèle est obligatoire")
    private String modele;

    private Integer capacite;
    private LocalDate dateAcquisition;
    private String typeVehicule;
}
