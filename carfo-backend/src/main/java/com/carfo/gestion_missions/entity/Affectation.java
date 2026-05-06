package com.carfo.gestion_missions.entity;

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

    // Une affectation concerne une seule mission (OneToOne unique)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_mission", nullable = false, unique = true)
    private Mission mission;

    // Le chauffeur affecté (Agent avec estChauffeur = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_chauffeur", nullable = false)
    private Agent chauffeur;

    // Le véhicule affecté
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_vehicule", nullable = false)
    private Vehicule vehicule;

    // Date de l'affectation
    @Column(name = "date_affectation", nullable = false)
    private LocalDate dateAffectation;
}
