package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notif_destinataire_date", columnList = "id_destinataire,date_creation"),
        @Index(name = "idx_notif_destinataire_lue",  columnList = "id_destinataire,lue")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_notification")
    private Long idNotification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_destinataire", nullable = false)
    @JsonIgnore
    private Agent destinataire;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    private NotificationType type;

    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    /** Cible optionnelle pour le CTA (lien vers /missions/{id} typiquement). */
    @Column(name = "id_mission")
    private Long idMission;

    @Column(name = "lue", nullable = false)
    @Builder.Default
    private boolean lue = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_lue")
    private LocalDateTime dateLue;

    @PrePersist
    public void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
