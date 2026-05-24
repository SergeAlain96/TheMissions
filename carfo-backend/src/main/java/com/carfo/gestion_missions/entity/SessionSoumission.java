package com.carfo.gestion_missions.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Session de soumission de missions. Le Chargé d'étude planifie des fenêtres
 * (typiquement tous les 2 mois) pendant lesquelles les directions soumettent
 * leurs missions. Le système est en mode SOUPLE : une mission peut être soumise
 * hors session, mais un bandeau d'avertissement s'affiche.
 */
@Entity
@Table(name = "session_soumission")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionSoumission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_session")
    private Long idSession;

    @Column(name = "titre", nullable = false, length = 150)
    private String titre;

    @Column(name = "date_ouverture", nullable = false)
    private LocalDate dateOuverture;

    @Column(name = "date_fermeture", nullable = false)
    private LocalDate dateFermeture;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "session", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Mission> missions;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
