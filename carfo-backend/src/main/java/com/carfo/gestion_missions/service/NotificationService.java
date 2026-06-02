package com.carfo.gestion_missions.service;

import com.carfo.gestion_missions.dto.NotificationView;
import com.carfo.gestion_missions.entity.Agent;
import com.carfo.gestion_missions.entity.Notification;
import com.carfo.gestion_missions.enums.NotificationType;
import com.carfo.gestion_missions.exception.ResourceNotFoundException;
import com.carfo.gestion_missions.repository.NotificationRepository;
import com.carfo.gestion_missions.security.SecurityChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SecurityChecker securityChecker;
    private final NotificationTemplateService templateService;
    private final com.carfo.gestion_missions.repository.AgentRepository agentRepository;

    // ------------------------------------------------------------------
    // PRODUCTION : appelée par les services métier sur événements
    // ------------------------------------------------------------------

    @Transactional
    public void notifier(Agent destinataire, NotificationType type, String titre, String message, Long idMission) {
        if (destinataire == null) return;
        try {
            Notification notif = Notification.builder()
                    .destinataire(destinataire)
                    .type(type)
                    .titre(titre)
                    .message(message)
                    .idMission(idMission)
                    .lue(false)
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ex) {
            // On n'interrompt JAMAIS le flow métier à cause d'une notif qui plante.
            log.warn("Echec création notification pour {} : {}", destinataire.getEmail(), ex.getMessage());
        }
    }

    @Transactional
    public void notifierTous(Collection<Agent> destinataires, NotificationType type,
                              String titre, String message, Long idMission) {
        if (destinataires == null) return;
        destinataires.forEach(a -> notifier(a, type, titre, message, idMission));
    }

    /**
     * Notifie en utilisant le template configuré pour le type (Paramètres → Notifications).
     * Si aucun template actif n'existe, retombe sur les valeurs `fallbackTitre` / `fallbackMessage`.
     * Les `vars` sont interpolées dans le titre et le message du template via {key}.
     */
    @Transactional
    public void notifierTousTemplate(Collection<Agent> destinataires, NotificationType type,
                                      java.util.Map<String, String> vars,
                                      String fallbackTitre, String fallbackMessage,
                                      Long idMission) {
        String[] resolved = resolveTemplate(type, vars, fallbackTitre, fallbackMessage);
        java.util.Set<Long> alreadyNotified = new java.util.HashSet<>();
        if (destinataires != null) {
            for (Agent a : destinataires) {
                if (a != null && a.getIdAgent() != null && alreadyNotified.add(a.getIdAgent())) {
                    notifier(a, type, resolved[0], resolved[1], idMission);
                }
            }
        }
        // Broadcast aux admins (en copie de toutes les notifications métier)
        broadcastAdmins(type, resolved[0], resolved[1], idMission, alreadyNotified);
    }

    /** Version destinataire unique de {@link #notifierTousTemplate}. */
    @Transactional
    public void notifierTemplate(Agent destinataire, NotificationType type,
                                  java.util.Map<String, String> vars,
                                  String fallbackTitre, String fallbackMessage,
                                  Long idMission) {
        String[] resolved = resolveTemplate(type, vars, fallbackTitre, fallbackMessage);
        java.util.Set<Long> alreadyNotified = new java.util.HashSet<>();
        if (destinataire != null && destinataire.getIdAgent() != null) {
            notifier(destinataire, type, resolved[0], resolved[1], idMission);
            alreadyNotified.add(destinataire.getIdAgent());
        }
        broadcastAdmins(type, resolved[0], resolved[1], idMission, alreadyNotified);
    }

    /**
     * Notifie tous les administrateurs actifs en plus des destinataires métier.
     * Ainsi l'admin a une vue complète des événements de l'application sans avoir à requêter
     * l'audit log à chaque fois. Les agents déjà notifiés (cas où un admin est aussi destinataire
     * légitime) sont skippés via le Set `alreadyNotified`.
     */
    private void broadcastAdmins(NotificationType type, String titre, String message,
                                  Long idMission, java.util.Set<Long> alreadyNotified) {
        try {
            var admins = agentRepository.findByRoleAndActifTrue(
                    com.carfo.gestion_missions.enums.RoleAgent.ADMINISTRATEUR);
            for (Agent admin : admins) {
                if (admin.getIdAgent() != null && alreadyNotified.add(admin.getIdAgent())) {
                    notifier(admin, type, titre, message, idMission);
                }
            }
        } catch (Exception ex) {
            log.warn("Broadcast admin notif échoué ({}) : {}", type, ex.getMessage());
        }
    }

    /** Retourne [titre, message] depuis le template actif ou les fallbacks. */
    private String[] resolveTemplate(NotificationType type, java.util.Map<String, String> vars,
                                     String fallbackTitre, String fallbackMessage) {
        var template = templateService.findActive(type).orElse(null);
        if (template == null) {
            return new String[]{ fallbackTitre, fallbackMessage };
        }
        return new String[]{
                templateService.interpolate(template.getTitre(), vars),
                templateService.interpolate(template.getCorps(), vars)
        };
    }

    // ------------------------------------------------------------------
    // CONSOMMATION : utilisée par le controller pour l'utilisateur connecté
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<NotificationView> getMyNotifications(int limit) {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository
                        .findByDestinataireIdAgentOrderByDateCreationDesc(
                                agent.getIdAgent(), PageRequest.of(0, Math.max(1, Math.min(limit, 100)))
                        )
                        .stream()
                        .map(this::toView)
                        .toList())
                .orElseGet(List::of);
    }

    @Transactional(readOnly = true)
    public long countUnreadForCurrentUser() {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository.countByDestinataireIdAgentAndLueFalse(agent.getIdAgent()))
                .orElse(0L);
    }

    @Transactional
    public void markAsRead(Long idNotification) {
        Notification n = notificationRepository.findById(idNotification)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable : " + idNotification));

        // Sécurité : seul le destinataire peut marquer comme lue
        Long currentAgentId = securityChecker.getCurrentAgent()
                .map(Agent::getIdAgent)
                .orElse(null);
        if (currentAgentId == null || !currentAgentId.equals(n.getDestinataire().getIdAgent())) {
            return;
        }

        if (!n.isLue()) {
            n.setLue(true);
            n.setDateLue(java.time.LocalDateTime.now());
            notificationRepository.save(n);
        }
    }

    @Transactional
    public int markAllAsReadForCurrentUser() {
        return securityChecker.getCurrentAgent()
                .map(agent -> notificationRepository.markAllAsReadForAgent(agent.getIdAgent()))
                .orElse(0);
    }

    private NotificationView toView(Notification n) {
        return new NotificationView(
                n.getIdNotification(),
                n.getType(),
                n.getTitre(),
                n.getMessage(),
                n.getIdMission(),
                n.isLue(),
                n.getDateCreation()
        );
    }
}
