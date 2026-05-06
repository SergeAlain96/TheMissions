package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.StatutMission;
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

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "lieu", nullable = false, length = 200)
    private String lieu;

    @Column(name = "objet_mission", nullable = false, length = 500)
    private String objetMission;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    @Builder.Default
    private StatutMission statut = StatutMission.PREVUE;

    @Column(name = "date_soumission", nullable = false)
    private LocalDateTime dateSoumission;

    @Column(name = "motif_annulation", length = 500)
    private String motifAnnulation;

    // La direction qui soumet la mission
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direction", nullable = false)
    private Direction direction;

    // Liste des participants (table Participe)
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Participe> participants;

    // Affectation chauffeur + véhicule
    @OneToOne(mappedBy = "mission", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Affectation affectation;

    // Calcul automatique : la mission doit être soumise 10 jours avant
    @PrePersist
    public void prePersist() {
        if (dateSoumission == null) {
            dateSoumission = LocalDateTime.now();
        }
    }
}
