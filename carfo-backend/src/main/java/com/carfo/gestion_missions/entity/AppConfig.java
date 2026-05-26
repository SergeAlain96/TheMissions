package com.carfo.gestion_missions.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Configuration globale de l'application (singleton — une seule ligne en base, id=1).
 * Contient l'identité institutionnelle affichée dans les en-têtes de PDF et l'UI.
 * Modifiable uniquement par un administrateur.
 */
@Entity
@Table(name = "app_config")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppConfig {

    /** Toujours 1 (singleton). */
    @Id
    @Column(name = "id_config")
    private Long idConfig;

    @Column(name = "institution_nom", length = 200, nullable = false)
    @Builder.Default
    private String institutionNom = "Caisse Autonome de Retraite des Fonctionnaires";

    @Column(name = "institution_sigle", length = 20, nullable = false)
    @Builder.Default
    private String institutionSigle = "CARFO";

    @Column(name = "institution_pays", length = 80, nullable = false)
    @Builder.Default
    private String institutionPays = "BURKINA FASO";

    @Column(name = "institution_devise", length = 200, nullable = false)
    @Builder.Default
    private String institutionDevise = "La patrie ou la mort, nous vaincrons";

    @Column(name = "institution_adresse", length = 200, nullable = false)
    @Builder.Default
    private String institutionAdresse = "Direction Générale — Ouagadougou";

    @Column(name = "institution_email", length = 150)
    private String institutionEmail;

    @Column(name = "institution_telephone", length = 40)
    private String institutionTelephone;

    // ──────────────────────────────────────────────────────────────
    // Règles métier configurables (lot #2 des paramètres)
    // ──────────────────────────────────────────────────────────────

    /** Nombre minimum de jours ouvrables entre aujourd'hui et la date de début. */
    @Column(name = "delai_min_jours_ouvrables", nullable = false)
    @Builder.Default
    private Integer delaiMinJoursOuvrables = 10;

    /** Préfixe de la référence mission (par défaut "MIS"). Format final : {prefix}-{YYYY}-{NNN}. */
    @Column(name = "reference_prefix", length = 10, nullable = false)
    @Builder.Default
    private String referencePrefix = "MIS";

    /** Nombre de chiffres du compteur dans la référence (3 → 001, 002, …). */
    @Column(name = "reference_number_padding", nullable = false)
    @Builder.Default
    private Integer referenceNumberPadding = 3;

    /** Active/désactive le job de clôture automatique nocturne des missions échues. */
    @Column(name = "auto_closure_enabled", nullable = false)
    @Builder.Default
    private Boolean autoClosureEnabled = true;

    /** Exclut les week-ends du calcul des jours ouvrables. */
    @Column(name = "exclude_weekends", nullable = false)
    @Builder.Default
    private Boolean excludeWeekends = true;

    /**
     * Mode strict des sessions de soumission :
     *  - false (souple) : la création de mission est toujours possible (bandeau d'avertissement)
     *  - true (strict)  : la création est BLOQUÉE si aucune session n'est ouverte
     */
    @Column(name = "session_strict_mode", nullable = false)
    @Builder.Default
    private Boolean sessionStrictMode = false;

    // ──────────────────────────────────────────────────────────────
    // Comptes & sécurité (lot #4 des paramètres)
    // ──────────────────────────────────────────────────────────────

    /** Longueur minimale du mot de passe (default 8, bornes 4-32). */
    @Column(name = "password_min_length", nullable = false)
    @Builder.Default
    private Integer passwordMinLength = 8;

    /** Le mot de passe doit contenir au moins une majuscule. */
    @Column(name = "password_require_uppercase", nullable = false)
    @Builder.Default
    private Boolean passwordRequireUppercase = false;

    /** Le mot de passe doit contenir au moins un chiffre. */
    @Column(name = "password_require_digit", nullable = false)
    @Builder.Default
    private Boolean passwordRequireDigit = true;

    /** Le mot de passe doit contenir au moins un caractère spécial. */
    @Column(name = "password_require_special", nullable = false)
    @Builder.Default
    private Boolean passwordRequireSpecial = false;

    /** Durée de vie d'un JWT en heures (default 24, bornes 1-168 = 1 semaine max). */
    @Column(name = "jwt_expiration_hours", nullable = false)
    @Builder.Default
    private Integer jwtExpirationHours = 24;
}
