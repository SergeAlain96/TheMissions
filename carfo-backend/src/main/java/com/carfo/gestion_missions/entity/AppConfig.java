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
}
