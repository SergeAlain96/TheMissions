package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.StatutAbsence;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "absence")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_absence")
    private Long idAbsence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent", nullable = false)
    private Agent agent;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "type_absence", nullable = false, length = 100)
    private String typeAbsence;

    @Column(name = "motif", length = 500)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    @Builder.Default
    private StatutAbsence statut = StatutAbsence.EN_ATTENTE;
}
