package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;

/**
 * Template configurable d'une notification (un par NotificationType).
 * L'admin peut éditer le titre et le corps via Paramètres → Notifications.
 * Les services métier appellent NotificationService.notifyWithTemplate(type, vars, …)
 * qui interpole les variables {nom} dans titre et corps.
 *
 * Variables disponibles selon le type — documenté dans l'UI :
 *  - {objet}, {reference}, {dateDebut}, {dateFin}, {direction}, {motif}, {chauffeur}, {vehicule}
 */
@Entity
@Table(name = "notification_template")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTemplate {

    /** Clé primaire = nom de l'enum NotificationType (unique). */
    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", length = 40)
    private NotificationType notificationType;

    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    @Column(name = "corps", nullable = false, length = 1000)
    private String corps;

    /** Si false, le template est ignoré et NotificationService utilise le fallback hardcodé. */
    @Column(name = "actif", nullable = false)
    @Builder.Default
    private boolean actif = true;
}
