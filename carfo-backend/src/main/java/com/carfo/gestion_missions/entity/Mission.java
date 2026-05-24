package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.StatutMission;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "mission")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mission")
    private Long idMission;

    /**
     * Référence métier officielle au format MIS-YYYY-NNN (ex : MIS-2026-001).
     * Générée à la soumission. Nullable pour les missions historiques antérieures
     * à l'introduction du champ.
     */
    @Column(name = "reference", length = 20, unique = true)
    private String reference;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "lieu", nullable = false, length = 200)
    private String lieu;

    @Column(name = "objet_mission", nullable = false, length = 500)
    private String objetMission;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 30)
    @Builder.Default
    private StatutMission statut = StatutMission.PREVUE;

    @Column(name = "date_soumission", nullable = false)
    private LocalDateTime dateSoumission;

    @Column(name = "motif_annulation", length = 500)
    private String motifAnnulation;

    @Column(name = "motif_avis_sg", length = 500)
    private String motifAvisSg;

    // La direction qui soumet la mission
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direction", nullable = false)
    private Direction direction;

    /**
     * Session de soumission au sein de laquelle la mission a été créée.
     * Nullable : possible de créer une mission hors session (mode souple).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_session")
    private SessionSoumission session;

    /**
     * Chef de mission : un Agent choisi parmi les participants. Optionnel à la création
     * (peut être désigné après coup). La cohérence "chef ∈ participants" est validée
     * dans le service.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_chef_mission")
    private Agent chefMission;

    // Liste des participants (table Participe)
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Participe> participants;

    // Affectations chauffeur+véhicule (multi-affectations supportées, statut ACTIVE/ANNULEE)
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Affectation> affectations;

    // Calcul automatique : la mission doit être soumise 10 jours avant
    @PrePersist
    public void prePersist() {
        if (dateSoumission == null) {
            dateSoumission = LocalDateTime.now();
        }
    }
}
