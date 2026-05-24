package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.StatutAffectation;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "affectation")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Affectation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_affectation")
    private Long idAffectation;

    // Une mission peut avoir plusieurs affectations (multi-chauffeurs/véhicules) ;
    // l'historique des anciennes affectations est conservé via le statut ANNULEE.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_mission", nullable = false)
    @JsonIgnore
    private Mission mission;

    // Le chauffeur affecté (Agent avec estChauffeur = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_chauffeur", nullable = false)
    private Agent chauffeur;

    // Le véhicule affecté
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    // Date de l'affectation — initialisée automatiquement à la création
    @Column(name = "date_affectation", nullable = false)
    private LocalDate dateAffectation;

    /**
     * Statut de l'affectation. ACTIVE par défaut ; ANNULEE pour soft-delete
     * (l'affectation reste visible dans l'historique de la mission).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private StatutAffectation statut = StatutAffectation.ACTIVE;

    @PrePersist
    public void prePersist() {
        if (dateAffectation == null) {
            dateAffectation = LocalDate.now();
        }
        if (statut == null) {
            statut = StatutAffectation.ACTIVE;
        }
    }
}
