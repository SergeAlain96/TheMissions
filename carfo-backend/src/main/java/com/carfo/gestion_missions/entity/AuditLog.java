package com.carfo.gestion_missions.entity;

import com.carfo.gestion_missions.enums.AuditCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Trace immuable d'une action sensible effectuée par un utilisateur.
 * Les champs `agentEmail` / `agentNom` capturent l'identité au moment de l'action :
 * si l'agent est supprimé ou désactivé plus tard, la trace reste lisible.
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_category",  columnList = "category"),
        @Index(name = "idx_audit_agent",     columnList = "agent_email")
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_audit")
    private Long idAudit;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "agent_email", length = 150)
    private String agentEmail;

    @Column(name = "agent_nom", length = 200)
    private String agentNom;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 20, nullable = false)
    private AuditCategory category;

    /** Libellé court d'action (ex: "LOGIN", "MISSION_VALIDER", "AFFECTATION_CREER"). */
    @Column(name = "action", length = 60, nullable = false)
    private String action;

    /** Type d'entité concernée (ex: "Mission", "Affectation"). Null si non-applicable. */
    @Column(name = "entity_type", length = 60)
    private String entityType;

    /** ID de l'entité concernée. Null si non-applicable. */
    @Column(name = "entity_id")
    private Long entityId;

    /** Description courte lisible (ex: "Validation de la mission MIS-2026-007"). */
    @Column(name = "summary", length = 500)
    private String summary;

    /** Adresse IP du client (utile pour les events AUTH). */
    @Column(name = "ip_address", length = 60)
    private String ipAddress;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
