package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.RoleAgent;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AgentDTO {

    private AgentDTO() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Le nom est obligatoire")
        private String nom;

        @NotBlank(message = "Le prénom est obligatoire")
        private String prenom;

        @NotBlank(message = "Le matricule est obligatoire")
        private String matricule;

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format email invalide")
        private String email;

        private String fonction;
        private String telephone;
        private boolean estChauffeur;

        @NotNull(message = "Le rôle est obligatoire")
        private RoleAgent role;

        @NotNull(message = "La direction est obligatoire")
        private Long idDirection;

        private boolean actif;
    }
}
