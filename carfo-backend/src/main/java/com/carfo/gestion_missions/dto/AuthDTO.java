package com.carfo.gestion_missions.dto;

import com.carfo.gestion_missions.enums.RoleAgent;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

public class AuthDTO {

    private AuthDTO() {}

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format email invalide")
        private String email;

        @NotBlank(message = "Le mot de passe est obligatoire")
        private String motDePasse;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JwtResponse {
        private String token;
        @Builder.Default
        private String type = "Bearer";
        private Long idAgent;
        private String nom;
        private String prenom;
        private String email;
        private RoleAgent role;
        private String nomDirection;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        @NotBlank
        private String nom;
        @NotBlank
        private String prenom;
        @NotBlank
        private String matricule;
        @NotBlank @Email
        private String email;
        @NotBlank
        private String motDePasse;
        private String fonction;
        private String telephone;
        private boolean estChauffeur;
        @NotNull
        private RoleAgent role;
        @NotNull
        private Long idDirection;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterResponse {
        private Long idAgent;
        private String nom;
        private String prenom;
        private String email;
        private RoleAgent role;
        private String nomDirection;
        private String username;
    }
}
